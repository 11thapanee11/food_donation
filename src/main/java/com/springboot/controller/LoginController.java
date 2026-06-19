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

    public LoginController(UserService userService, AdminService adminService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.adminService = adminService;
        this.jwtUtil = jwtUtil;
    }

    // @GetMapping("/login")
    // public String loginPage(Model model) {
    // return "login";
    // }

    // @GetMapping("/login")
    // public ModelAndView showLoginForm() {
    // return new ModelAndView("login");
    // }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody LoginDto loginDto) {
        try {
            boolean result = userService.login(loginDto);

            User user = userService.getUserByEmail(loginDto.getEmail());

            if (result) {
                // สร้าง Access Token อายุ 24 ชั่วโมง
                // String accessToken = jwtUtil.generateToken(loginDto.getEmail(), 24 * 60 * 60
                // * 1000);
                String accessToken = jwtUtil.generateToken(
                        String.valueOf(user.getUserId()),
                        24 * 60 * 60 * 1000 // อายุ 24 ชั่วโมง
                );

                boolean isAdmin = adminService.isAdmin(user.getUserId());

                // บรรจุ Token ลงใน Map เพื่อส่งไปกับ ApiResponse
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("accessToken", accessToken);
                responseData.put("userId", user.getUserId());
                responseData.put("isAdmin", isAdmin);

                return ResponseEntity.ok(
                        new ApiResponse<>(true, "เข้าสู่ระบบสำเร็จ", responseData));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiResponse<>(false, "อีเมลหรือรหัสผ่านไม่ถูกต้อง", null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาดในระบบ: " + e.getMessage(), null));
        }
    }
    // public ResponseEntity<Map<String, String>> loginMember(@RequestBody LoginDto
    // loginDto) {
    // boolean result = userService.login(loginDto);

    // if (result) {
    // // สร้าง Access Token
    // String accessToken = jwtUtil.generateToken(loginDto.getEmail(), 24 * 60 * 60
    // * 1000);

    // // // สร้าง Refresh Token (อายุนาน เช่น 7 วัน)
    // // String refreshToken = jwtUtil.generateToken(loginDto.getEmail(), 7 * 24 *
    // 60 * 60 * 1000);

    // return ResponseEntity.ok(Map.of(
    // "message", "เข้าสู่ระบบสำเร็จ",
    // "accessToken", accessToken));
    // // "refreshToken", refreshToken));
    // } else {
    // return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
    // .body(Map.of("message", "ไม่พบข้อมูลผู้ใช้"));
    // }
    // }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(
                new ApiResponse<>(true, "ออกจากระบบสำเร็จ", null));
    }
    // public ResponseEntity<Map<String, String>> logout() {
    // return ResponseEntity.ok(Map.of(messageKey, "ออกจากระบบสำเร็จ"));
    // }
}
