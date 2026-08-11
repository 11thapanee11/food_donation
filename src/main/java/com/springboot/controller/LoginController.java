package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;

import com.springboot.util.JwtUtil;
import com.springboot.util.PasswordUtil;

import ch.qos.logback.core.model.Model;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.springboot.dto.*;
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
        try {
            boolean result = userService.login(loginDto);

            if (result) {
                User user = userService.getUserByEmail(loginDto.getEmail());
                boolean isAdmin = adminService.isAdmin(user.getUserId());

                String accessToken = jwtUtil.generateToken(
                        String.valueOf(user.getUserId()),
                        isAdmin,
                        24 * 60 * 60 * 1000 // อายุ 24 ชั่วโมง
                );

                Map<String, Object> responseData = new HashMap<>();
                responseData.put("accessToken", accessToken);
                responseData.put("userId", user.getUserId());
                responseData.put("isAdmin", isAdmin);

                return ResponseEntity.ok(ApiResponse.success("เข้าสู่ระบบสำเร็จ", responseData));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("เกิดข้อผิดพลาดในระบบ: " + e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("ออกจากระบบสำเร็จ"));
    }

}
