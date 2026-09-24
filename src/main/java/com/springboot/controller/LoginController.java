package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.util.JwtUtil;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.springboot.dto.*;
import com.springboot.exception.ApplicationException;
import com.springboot.model.*;
import com.springboot.service.*;
import java.util.*;

@RestController
public class LoginController {

    private String messageKey = "message";

    private final UserService userService;
    private final AdminService adminService;

    private final JwtUtil jwtUtil;

    public LoginController(UserService userService, AdminService adminService,
            JwtUtil jwtUtil) {
        this.userService = userService;
        this.adminService = adminService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody LoginDto loginDto) {
        boolean result = userService.login(loginDto);

        if (!result) {
            throw new ApplicationException("อีเมลหรือรหัสผ่านไม่ถูกต้อง", HttpStatus.UNAUTHORIZED);
        }

        User user = userService.getUserByEmail(loginDto.getEmail());
        boolean isAdmin = adminService.isAdmin(user.getUserId());
        String username = user.getFirstName() + " " + user.getLastName();
        String displayName = user.getFirstName() + " " + user.getLastName();
        String accessToken = jwtUtil.generateToken(
                String.valueOf(user.getUserId()),
                username,
                isAdmin,
                24 * 60 * 60 * 1000 // อายุ 24 ชั่วโมง
        );

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("accessToken", accessToken);
        responseData.put("userId", user.getUserId());
        responseData.put("username", displayName);
        responseData.put("isAdmin", isAdmin);

        return ResponseEntity.ok(ApiResponse.success("เข้าสู่ระบบสำเร็จ", responseData));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("ออกจากระบบสำเร็จ"));
    }

}
