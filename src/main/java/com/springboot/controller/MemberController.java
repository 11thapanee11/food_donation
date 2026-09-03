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
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new com.springboot.exception.UnauthorizedException("กรุณาแนบ Token สำหรับการเข้าถึงโปรไฟล์");
        }

        User user = userService.authenticate(authHeader);
        MemberDto memberDto = userService.getMemberProfile(user.getUserId());

        if (memberDto == null) {
            return ResponseEntity.status(404)
                    .body(ApiResponse.error("ไม่พบข้อมูลรายละเอียดสมาชิก"));
        }

        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลโปรไฟล์สำเร็จ", memberDto));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Void>> editProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody MemberDto updatedProfile) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new com.springboot.exception.UnauthorizedException("กรุณาแนบ Token สำหรับการแก้ไขโปรไฟล์");
        }

        User user = userService.authenticate(authHeader);
        boolean result = userService.updateMemberProfile(user.getEmail(), updatedProfile);

        if (!result) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("ไม่สามารถแก้ไขข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง"));
        }

        return ResponseEntity.ok(ApiResponse.success("แก้ไขข้อมูลโปรไฟล์สำเร็จ"));
    }

}
