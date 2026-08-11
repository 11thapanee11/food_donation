package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.dto.*;
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
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("รหัสผ่านและรหัสผ่านยืนยันไม่ตรงกัน"));
        }

        try {
            // ส่งข้อมูลไปประมวลผลและบันทึกที่ฝั่ง Service
            userService.registerUser(registerDto);
            return ResponseEntity.ok(ApiResponse.success("สมัครสมาชิกสำเร็จเรียบร้อยแล้ว"));

        } catch (IllegalArgumentException e) {
            // ดักจับ Error กรณีข้อมูลขัดต่อเงื่อนไขธุรกิจ (เช่น อีเมลซ้ำในระบบ)
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            // ดักจับ Error อื่น ๆ ที่ไม่คาดคิดในระบบ
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("เกิดข้อผิดพลาดภายในระบบ ไม่สามารถสมัครสมาชิกได้"));
        }
    }

}
