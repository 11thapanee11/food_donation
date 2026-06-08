package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.dto.*;
import com.springboot.model.*;
import com.springboot.service.*;
import java.util.*;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final UserService userService;
    private final RecipientService recipientService;

    public ReviewController(ReviewService reviewService, UserService userService, RecipientService recipientService) {
        this.reviewService = reviewService;
        this.userService = userService;
        this.recipientService = recipientService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<String>> addReview(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ReviewDto dto) {
        try {
            // 1. ดึง User จาก Token
            User user = userService.authenticate(authHeader);
            Recipient recipient = recipientService.getOrCreateRecipient(user);

            // 2. ส่ง user เพื่อให้ Service ดึงค่า recipient ภายใน
            reviewService.saveReview(dto, recipient);

            return ResponseEntity.ok(new ApiResponse<>(true, "บันทึกรีวิวเรียบร้อยแล้ว", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาด: " + e.getMessage(), null));
        }
    }

    @GetMapping("/check/{bookingId}")
    public ResponseEntity<ApiResponse<Review>> checkReview(@PathVariable Integer bookingId) {
        Review review = reviewService.getReviewByBookingId(bookingId);
        if (review != null) {
            return ResponseEntity.ok(new ApiResponse<>(true, "พบรีวิวแล้ว", review));
        }
        return ResponseEntity.ok(new ApiResponse<>(false, "ยังไม่มีรีวิว", null));
    }

    @GetMapping("/food/{foodId}")
    // @GetMapping("/api/v1/reviews/food/{foodId}")
    public ResponseEntity<ApiResponse<List<ReviewDto>>> getReviewsByFood(@PathVariable Integer foodId) {
        List<ReviewDto> reviews = reviewService.getReviewsByFoodId(foodId);
        return ResponseEntity.ok(new ApiResponse<>(true, "ดึงข้อมูลรีวิวสำเร็จ", reviews));
    }

}
