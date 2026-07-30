package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.model.*;
import com.springboot.dto.*;
import com.springboot.service.BookingService;
import com.springboot.service.FoodService;
import com.springboot.service.RecipientService;
import com.springboot.service.UserService;
import com.springboot.util.JwtUtil;

import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/bookings")
public class BookingController {
    private final BookingService bookingService;

    private final UserService userService;
    private final RecipientService recipientService;

    public BookingController(BookingService bookingService, UserService userService,
            RecipientService recipientService) {
        this.bookingService = bookingService;
        this.userService = userService;
        this.recipientService = recipientService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Booking>> addBooking(
            @RequestBody BookingDto request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "กรุณาล็อกอินก่อนทำรายการจองอาหาร", null));
        }

        User user = userService.authenticate(authHeader);

        Recipient recipient = recipientService.getOrCreateRecipient(user);

        try {
            Booking booking = bookingService.addBooking(request, recipient);

            // ส่งข้อมูลวัตถุการจองกลับไปทั้งหมด เผื่อหน้าบ้านต้องการใช้ประโยชน์จาก ID หรือ
            // Confirmation Code
            return ResponseEntity.ok(new ApiResponse<>(true, "บันทึกการจองสำเร็จเรียบร้อยแล้ว!", booking));

        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage(), null));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาดภายในระบบหลังบ้าน กรุณาลองใหม่อีกครั้ง", null));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingDto>>> getListBooking(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        User user = userService.authenticate(authHeader);

        List<BookingDto> myBookings = bookingService.getListBooking(user.getUserId());

        if (myBookings == null || myBookings.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, "ไม่พบข้อมูลการจอง", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "ดึงข้อมูลประวัติการจองสำเร็จ", myBookings));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<BookingDto>> getBookingDetail(@PathVariable Integer bookingId) {
        try {
            BookingDto booking = bookingService.getBookingDetail(bookingId);
            return ResponseEntity.ok(new ApiResponse<>(true, "ดึงข้อมูลรายละเอียดการจองสำเร็จ", booking));
        } catch (RuntimeException err) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, "ไม่พบข้อมูลการจองเลขที่ " + bookingId, null));
        }
    }
    // public ResponseEntity<Booking> getBookingDetail(@PathVariable Integer
    // bookingId) {
    // try {
    // Booking booking = bookingService.getBookingDetail(bookingId);
    // return ResponseEntity.ok(booking);
    // } catch (RuntimeException err) {
    // return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    // }
    // }

    // @DeleteMapping("/{bookingId}")
    // public ResponseEntity<Void> cancelBooking(@PathVariable Long bookingId) {
    // try {
    // bookingService.cancelBooking(bookingId); // ทำงานสำเร็จ (Void)
    // return ResponseEntity.ok().build(); // ส่งคืน 200 OK แบบบอดี้ว่างเปล่า
    // } catch (Exception e) {
    // return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    // }
    // }

    @PutMapping("/{bookingId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(@PathVariable Integer bookingId) {
        try {
            bookingService.cancelBooking(bookingId);
            return ResponseEntity.ok(new ApiResponse<>(true, "ยกเลิกรายการจองอาหารเรียบร้อยแล้ว", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, "ไม่สามารถยกเลิกรายการจองได้", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาดภายในระบบ ไม่สามารถยกเลิกรายการจองได้", null));
        }
    }
    // public ResponseEntity<Void> cancelBooking(@PathVariable Integer bookingId) {
    // try {
    // bookingService.cancelBooking(bookingId);
    // return ResponseEntity.ok().build(); // ส่งคืน void (200 OK บอดี้ว่าง)
    // } catch (Exception e) {
    // e.printStackTrace();
    // return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    // }
    // }

    @GetMapping("/foods/{foodId}/check-booking")
    public ResponseEntity<ApiResponse<Boolean>> checkUserBooking(@PathVariable Integer foodId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        User user = userService.authenticate(authHeader);
        Recipient recipient = recipientService.getOrCreateRecipient(user);

        List<String> activeStatuses = List.of("pending", "completed");
        boolean isAlreadyBooked = bookingService.checkUserBooking(recipient, foodId, activeStatuses);

        return ResponseEntity.ok(new ApiResponse<>(true, "ตรวจสอบเสร็จสิ้น", isAlreadyBooked));
    }

}
