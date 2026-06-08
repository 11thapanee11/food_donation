package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.dto.*;
import com.springboot.service.*;
import java.util.*;

@RestController
public class RegisterController {
    // @Autowired
    // private UserService userService;

    private final UserService userService;

    public RegisterController(UserService userService) {
        this.userService = userService;
    }

    private String messageKey = "message";

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> registerUser(@RequestBody RegisterDto registerDto) {
        // 1. ตรวจสอบรหัสผ่านว่าตรงกันหรือไม่
        if (!registerDto.getPassword().equals(registerDto.getConfirmPassword())) {
            return ResponseEntity
                    .badRequest()
                    .body(new ApiResponse<>(false, "รหัสผ่านและรหัสผ่านยืนยันไม่ตรงกัน", null));
        }

        try {
            // 2. ส่งข้อมูลไปประมวลผลและบันทึกที่ฝั่ง Service
            userService.registerUser(registerDto);
            return ResponseEntity.ok(
                    new ApiResponse<>(true, "สมัครสมาชิกสำเร็จเรียบร้อยแล้ว", null)
            );

        } catch (IllegalArgumentException e) {
            // 3. ดักจับ Error กรณีข้อมูลขัดต่อเงื่อนไขธุรกิจ (เช่น อีเมลซ้ำในระบบ)
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            // 4. ดักจับ Error อื่น ๆ ที่ไม่คาดคิดในระบบ
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาดภายในระบบ ไม่สามารถสมัครสมาชิกได้", null));
        }
    }
    // public ResponseEntity<Map<String, String>> registerUser(@RequestBody RegisterDto registerDto) {
    //     // 1. ตรวจสอบรหัสผ่านเบื้องต้น
    //     if (!registerDto.getPassword().equals(registerDto.getConfirmPassword())) {
    //         return ResponseEntity
    //                 .badRequest()
    //                 .body(Map.of(messageKey, "รหัสผ่านไม่ตรงกัน"));
    //     }

    //     try {
    //         // 2. พยายามบันทึกข้อมูล
    //         userService.registerUser(registerDto);
    //         return ResponseEntity.ok(Map.of(messageKey, "สมัครสมาชิกสำเร็จ"));

    //     } catch (IllegalArgumentException e) {
    //         // 3. ดักจับ Error กรณีข้อมูลซ้ำ (Unique Constraint)
    //         return ResponseEntity.status(HttpStatus.CONFLICT)
    //                 .body(Map.of(messageKey, e.getMessage()));
    //     } catch (Exception e) {
    //         // 4. ดักจับ Error อื่นๆ (กรณีฉุกเฉิน)
    //         e.printStackTrace();
    //         return ResponseEntity
    //                 .status(HttpStatus.INTERNAL_SERVER_ERROR)
    //                 .body(Map.of(messageKey, "เกิดข้อผิดพลาดในระบบ"));
    //     }
    // }

}
