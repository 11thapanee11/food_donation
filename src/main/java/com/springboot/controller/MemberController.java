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

    private final JwtUtil jwtUtil;

    public MemberController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<MemberDto>> getProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<>(false, "กรุณาแนบ Token สำหรับการเข้าถึงโปรไฟล์", null));
            }

            User user = userService.authenticate(authHeader);

            MemberDto memberDto = userService.getMemberProfile(user.getUserId());
            if (memberDto != null) {
                return ResponseEntity.ok(new ApiResponse<>(true, "ดึงข้อมูลโปรไฟล์สำเร็จ", memberDto));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse<>(false, "ไม่พบข้อมูลรายละเอียดสมาชิก", null));
            }
            // return ResponseEntity.ok(new ApiResponse<>(true, "ดึงข้อมูลโปรไฟล์สำเร็จ",
            // memberDto));
        } catch (JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false,
                            "เซสชันหมดอายุหรือเกิดข้อผิดพลาดในการตรวจสอบสิทธิ์: " + e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false,
                            "ไม่สามารถแก้ไขข้อมูลได้ กรุณาลองใหม่อีกครั้ง", null));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Void>> editProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody MemberDto updatedProfile) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<>(false, "กรุณาแนบ Token สำหรับการแก้ไขโปรไฟล์", null));
            }

            User user = userService.authenticate(authHeader);

            boolean result = userService.updateMemberProfile(user.getEmail(), updatedProfile);

            if (result) {
                return ResponseEntity.ok(new ApiResponse<>(true, "แก้ไขข้อมูลโปรไฟล์สำเร็จ", null));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse<>(false, "ไม่สามารถแก้ไขข้อมูลโปรไฟล์ได้ กรุณาลองใหมู่อีกครั้ง", null));
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาดในระบบ: " + e.getMessage(), null));
        }
    }

}
