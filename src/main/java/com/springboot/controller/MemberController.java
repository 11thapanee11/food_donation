package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.context.SecurityContextHolder;

import com.springboot.dto.*;
import com.springboot.model.User;
import com.springboot.service.*;
import com.springboot.util.JwtUtil;

import io.jsonwebtoken.JwtException;

import java.util.*;

@RestController
public class MemberController {
    private final UserService userService;

    public MemberController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<MemberDto>> getProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("กรุณาแนบ Token สำหรับการเข้าถึงโปรไฟล์"));
            }

            User user = userService.authenticate(authHeader);
            MemberDto memberDto = userService.getMemberProfile(user.getUserId());

            if (memberDto == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("ไม่พบข้อมูลรายละเอียดสมาชิก"));
            }

            return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลโปรไฟล์สำเร็จ", memberDto));

        } catch (JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("เซสชันหมดอายุหรือเกิดข้อผิดพลาดในการตรวจสอบสิทธิ์: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("ไม่สามารถแก้ไขข้อมูลได้ กรุณาลองใหม่อีกครั้ง"));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Void>> editProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody MemberDto updatedProfile) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("กรุณาแนบ Token สำหรับการแก้ไขโปรไฟล์"));
            }

            User user = userService.authenticate(authHeader);
            boolean result = userService.updateMemberProfile(user.getEmail(), updatedProfile);

            if (!result) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("ไม่สามารถแก้ไขข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง"));
            }

            return ResponseEntity.ok(ApiResponse.success("แก้ไขข้อมูลโปรไฟล์สำเร็จ"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("เกิดข้อผิดพลาดในระบบ: " + e.getMessage()));
        }
    }

}
