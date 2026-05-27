package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.model.*;
import com.springboot.dto.*;
import com.springboot.service.BookingService;
import com.springboot.service.FoodService;
import com.springboot.util.JwtUtil;

import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/bookings")
public class BookingController {
    private final BookingService bookingService;

    private final JwtUtil jwtUtil;

    public BookingController(BookingService bookingService, JwtUtil jwtUtil) {
        this.bookingService = bookingService;
        this.jwtUtil = jwtUtil;
    }

    private static final Logger log = LoggerFactory.getLogger(BookingController.class);

    @PostMapping
    public ResponseEntity<Map<String, Object>> addBooking(
            @RequestBody BookingDto request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // 1. ตรวจสอบพาสปอร์ต Token และตรวจสอบสิทธิ์ผู้ใช้ก่อนทำรายการ
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("มีความพยายามเข้าถึงระบบจองโดยไม่ได้แนบ Token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "กรุณาล็อกอินก่อนทำรายการจองอาหารครับ"));
        }

        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractEmail(token); // แกะหา Email ของ Recipient คนกดจอง

        if (!jwtUtil.validateToken(token, email)) {
            log.warn("เซสชันของ Token สำหรับผู้ใช้ {} หมดอายุหรือใช้งานไม่ได้", email);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "เซสชันหมดอายุ กรุณาล็อกอินใหม่อีกครั้งครับ"));
        }

        try {
            log.info("ได้รับคำขอจองอาหารจากผู้ใช้: {} สำหรับอาหารไอดี: {}", email, request.getFoodId());
            
            // 2. เรียกใช้ Service ดำเนินการเช็คยอด หักคลัง สุ่มรหัส และบันทึกข้อมูลลงฐานข้อมูล
            Booking booking = bookingService.addBooking(request, email);
            
            log.info("บันทึกการจองสำเร็จ! รหัสรับของคือ: {}", booking.getConfirmationCode());

            // 3. ส่งข้อมูลกลับไปให้หน้าบ้าน React เพื่อแสดงผลป๊อปอัพ SweetAlert2
            return ResponseEntity.ok(Map.of(
                "message", "บันทึกการจองสำเร็จเรียบร้อยแล้ว!",
                "bookingId", booking.getFood().getFoodId(), // หรือเป็น ID หลักของการจอง
                "confirmationCode", booking.getConfirmationCode() // ส่งรหัสตัวเลขกลับไปแสดงผล
            ));

        } catch (IllegalArgumentException e) {
            // ดักจับข้อยกเว้นที่เราเปลี่ยนแทน RuntimeException (เช่น อาหารหมด หรือกรอกเกินจำกัดคน)
            log.warn("การจองไม่สำเร็จเนื่องจากเงื่อนไขผิดพลาด: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
            
        } catch (Exception e) {
            // ดักจับข้อผิดพลาดทั่วไปอื่น ๆ ของระบบ
            log.error("เกิดข้อผิดพลาดร้ายแรงในระบบหลังบ้าน: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "เกิดข้อผิดพลาดภายในระบบหลังบ้าน กรุณาลองใหม่อีกครั้ง"));
        }
    }

    @GetMapping
    public ResponseEntity<List<Booking>> getListBooking(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        //     return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        //             .body(Map.of("error", "กรุณายืนยันตัวตนก่อนเข้าถึงข้อมูลประวัติครับ"));
        // }

        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractEmail(token);

        if (!jwtUtil.validateToken(token, email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Booking> myBookings = bookingService.getListBooking(email);
        return ResponseEntity.ok(myBookings); // ส่งอาเรย์ประวัติการจองทั้งหมดกลับไปลูปที่หน้าบ้านทันที
    }

}
