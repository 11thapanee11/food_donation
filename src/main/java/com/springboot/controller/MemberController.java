package com.springboot.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.dto.*;
import com.springboot.exception.UnauthorizedException;
import com.springboot.model.User;
import com.springboot.service.*;

@RestController
public class MemberController {
    private final UserService userService;

    public MemberController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<MemberDto>> getProfile(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("กรุณาแนบ Token สำหรับการเข้าถึงโปรไฟล์");
        }

        User user = userService.authenticate(authHeader);
        MemberDto memberDto = userService.getMemberProfile(user.getUserId());

        // ถ้าไม่พบข้อมูล → Service จะโยน ApplicationException เอง
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลโปรไฟล์สำเร็จ", memberDto));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Void>> editProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody MemberDto updatedProfile) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("กรุณาแนบ Token สำหรับการแก้ไขโปรไฟล์");
        }

        User user = userService.authenticate(authHeader);
        userService.updateMemberProfile(user.getEmail(), updatedProfile);

        return ResponseEntity.ok(ApiResponse.success("แก้ไขข้อมูลโปรไฟล์สำเร็จ"));
    }

}
