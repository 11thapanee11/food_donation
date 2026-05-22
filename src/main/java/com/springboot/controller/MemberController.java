package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.context.SecurityContextHolder;

import com.springboot.dto.*;
import com.springboot.service.*;
import com.springboot.util.JwtUtil;

import java.util.*;

@RestController
public class MemberController {
    private final UserService userService;

    private final JwtUtil jwtUtil;

    public MemberController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    // @GetMapping("/profile")
    // public ResponseEntity<MemberDto> getProfile(Authentication authentication) {
    // String email = authentication.getName(); // ดึงจาก JWT token
    // MemberDto memberDto = userService.getMemberProfile(email);
    // return ResponseEntity.ok(memberDto);
    // }

    // @GetMapping("/profile")
    // public ResponseEntity<MemberDto> getProfile() {
    // // 1. ดึง Authentication Object จาก SecurityContextHolder
    // Authentication authentication =
    // SecurityContextHolder.getContext().getAuthentication();

    // // 2. เช็คเบื้องต้นว่ามีการล็อกอินมาจริงไหม (เผื่อกรณีลืมดักใน
    // SecurityConfig)
    // if (authentication == null || !authentication.isAuthenticated()) {
    // return ResponseEntity.status(401).build();
    // }

    // // 3. ดึงชื่อผู้ใช้ (ในที่นี้คือ Email ที่เราใส่ไว้ใน Token)
    // String currentUserEmail = authentication.getName();

    // // 4. เอา Email ไปดึงข้อมูลฉบับเต็มจาก Database ผ่าน Service
    // MemberDto memberDto = userService.getMemberProfile(currentUserEmail);

    // // 5. ส่งข้อมูลกลับไปให้ React
    // return ResponseEntity.ok(memberDto);
    // }

    @GetMapping("/profile")
    public ResponseEntity<MemberDto> getProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            // 1. ตัดคำว่า "Bearer " ออก
            String token = authHeader.replace("Bearer ", "");

            // 2. ตรวจสอบ token ว่าหมดอายุหรือไม่
            if (!jwtUtil.validateToken(token, jwtUtil.extractEmail(token))) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(null);
            }

            // 3. ดึง email จาก token
            String email = jwtUtil.extractEmail(token);

            // 4. ใช้ email ไปดึงข้อมูลจาก DB ผ่าน service
            MemberDto memberDto = userService.getMemberProfile(email);

            // 5. ส่งข้อมูลกลับไปให้ React
            return ResponseEntity.ok(memberDto);

        } catch (Exception e) {
            // ถ้า token ไม่ถูกต้อง หรือ parsing error
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, String>> editProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody MemberDto updatedProfile) {
        try {
            // 1. ตัดคำว่า Bearer ออก
            String token = authHeader.replace("Bearer ", "");

            // 2. ตรวจสอบ token
            String email = jwtUtil.extractEmail(token);
            if (!jwtUtil.validateToken(token, email)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Token ไม่ถูกต้องหรือหมดอายุ"));
            }

            // 3. อัปเดตข้อมูลใน DB ผ่าน Service
            boolean result = userService.updateMemberProfile(email, updatedProfile);

            if (result) {
                return ResponseEntity.ok(Map.of("message", "แก้ไขข้อมูลสำเร็จ"));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "ไม่สามารถแก้ไขข้อมูลได้"));
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "เกิดข้อผิดพลาดในการตรวจสอบ token"));
        }
    }

}
