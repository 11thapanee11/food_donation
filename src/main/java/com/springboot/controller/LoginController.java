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

import com.springboot.service.UserService;
import com.springboot.util.JwtUtil;
import com.springboot.util.PasswordUtil;

import ch.qos.logback.core.model.Model;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.springboot.dto.*;
import com.springboot.service.*;
import java.util.*;

@RestController
public class LoginController {

    private String messageKey = "message";

    private final UserService userService;

    private final JwtUtil jwtUtil;

    public LoginController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
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
    public ResponseEntity<Map<String, String>> loginMember(@RequestBody LoginDto loginDto) {
        boolean result = userService.login(loginDto);

        if (result) {
            // สร้าง Access Token
            String accessToken = jwtUtil.generateToken(loginDto.getEmail(), 24 * 60 * 60 * 1000);

            // // สร้าง Refresh Token (อายุนาน เช่น 7 วัน)
            // String refreshToken = jwtUtil.generateToken(loginDto.getEmail(), 7 * 24 * 60 * 60 * 1000);

            return ResponseEntity.ok(Map.of(
                    "message", "เข้าสู่ระบบสำเร็จ",
                    "accessToken", accessToken));
                    // "refreshToken", refreshToken));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "ไม่พบข้อมูลผู้ใช้"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of(messageKey, "ออกจากระบบสำเร็จ"));
    }
}
