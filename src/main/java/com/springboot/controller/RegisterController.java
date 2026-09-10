package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.dto.*;
import com.springboot.exception.ApplicationException;
import com.springboot.service.*;
import java.util.*;

@RestController
public class RegisterController {

    private final UserService userService;

    public RegisterController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> registerUser(@RequestBody RegisterDto registerDto) {
        // ตรวจสอบรหัสผ่านว่าตรงกันหรือไม่
        if (!registerDto.getPassword().equals(registerDto.getConfirmPassword())) {
            throw new ApplicationException("รหัสผ่านและรหัสผ่านยืนยันไม่ตรงกัน", HttpStatus.BAD_REQUEST);
        }

        userService.registerUser(registerDto);

        return ResponseEntity.ok(ApiResponse.success("สมัครสมาชิกสำเร็จเรียบร้อยแล้ว"));
    }

}
