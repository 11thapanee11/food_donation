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
            User user = userService.authenticate(authHeader);
            Recipient recipient = recipientService.getOrCreateRecipient(user);

            reviewService.saveReview(dto, recipient);
            return ResponseEntity.ok(ApiResponse.success("บันทึกรีวิวเรียบร้อยแล้ว"));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("ไม่สามารถบันทึกข้อมูลได้: " + e.getMessage()));
        }
    }

    @GetMapping("/check/{bookingId}")
    public ResponseEntity<ApiResponse<Review>> checkReview(@PathVariable Integer bookingId) {
        Review review = reviewService.getReviewByBookingId(bookingId);

        if (review != null) {
            return ResponseEntity.ok(ApiResponse.success("พบรีวิวแล้ว", review));
        }
        return ResponseEntity.ok(ApiResponse.error("ยังไม่มีรีวิว"));
    }

    @GetMapping("/food/{foodId}")
    public ResponseEntity<ApiResponse<List<ReviewDto>>> getReviewsByFood(@PathVariable Integer foodId) {
        List<ReviewDto> reviews = reviewService.getReviewsByFoodId(foodId);

        if (reviews == null || reviews.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("ไม่พบข้อมูล"));
        }
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลรีวิวสำเร็จ", reviews));
    }

}
