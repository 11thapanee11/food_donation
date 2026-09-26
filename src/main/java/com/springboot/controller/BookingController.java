package com.springboot.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.model.*;
import com.springboot.dto.*;
import com.springboot.service.*;

import java.util.*;

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

    // @PostMapping
    // public ResponseEntity<ApiResponse<Booking>> addBooking(
    //         @RequestBody BookingDto request,
    //         @RequestHeader(value = "Authorization", required = false) String authHeader) {
    //     if (authHeader == null || !authHeader.startsWith("Bearer ")) {
    //         throw new com.springboot.exception.UnauthorizedException("กรุณาล็อกอินก่อนทำรายการจองอาหาร");
    //     }

    //     User user = userService.authenticate(authHeader);
    //     Recipient recipient = recipientService.getOrCreateRecipient(user);

    //     Booking booking = bookingService.addBooking(request, recipient);
    //     return ResponseEntity.ok(ApiResponse.success("บันทึกการจองสำเร็จ", booking));
    // }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingDto>>> getListBooking(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        User user = userService.authenticate(authHeader);
        List<BookingDto> myBookings = bookingService.getListBooking(user.getUserId());

        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลประวัติการจองสำเร็จ", myBookings));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<BookingDto>> getBookingDetail(@PathVariable Integer bookingId) {
        BookingDto booking = bookingService.getBookingDetail(bookingId);
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลรายละเอียดการจองสำเร็จ", booking));
    }

    @PutMapping("/{bookingId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(@PathVariable Integer bookingId) {
        bookingService.cancelBooking(bookingId);
        return ResponseEntity.ok(ApiResponse.success("ยกเลิกรายการจองอาหารเรียบร้อยแล้ว"));
    }

    @GetMapping("/foods/{foodId}/check-booking")
    public ResponseEntity<ApiResponse<Boolean>> checkUserBooking(
            @PathVariable Integer foodId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = userService.authenticate(authHeader);
        Recipient recipient = recipientService.getOrCreateRecipient(user);

        List<String> activeStatuses = List.of("pending", "completed");
        boolean isAlreadyBooked = bookingService.checkUserBooking(recipient, foodId, activeStatuses);

        return ResponseEntity.ok(ApiResponse.success("ตรวจสอบเสร็จสิ้น", isAlreadyBooked));
    }

}
