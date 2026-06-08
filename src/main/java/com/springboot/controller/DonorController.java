package com.springboot.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.dto.*;
import com.springboot.service.*;
import com.springboot.model.*;
import java.util.*;

@RestController
@RequestMapping("/donor")
public class DonorController {

    private final UserService userService;
    private final DonorService donorService;

    public DonorController(UserService userService, DonorService donorService) {
        this.userService = userService;
        this.donorService = donorService;
    }

    @GetMapping("/impact-summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getImpactSummary(
            @RequestHeader("Authorization") String authHeader) {

        User user = userService.authenticate(authHeader);

        // ดึงก้อนข้อมูล Map ที่มี 3 ค่าสถิติกลับมา
        Map<String, Object> summaryData = donorService.getImpactSummary(user.getUserId());

        return ResponseEntity.ok(new ApiResponse<>(true, "ดึงข้อมูลสถิติมวลรวมสำเร็จ", summaryData));
    }

    @GetMapping("/ranking")
    public ResponseEntity<ApiResponse<List<DonorDto>>> getListTotalImpact() {
        List<DonorDto> listTotalImpact = donorService.getListTotalImpact(); // แปลงเป็น DTO ก่อนส่ง
        return ResponseEntity.ok(new ApiResponse<>(true, "ดึงข้อมูลสำเร็จ", listTotalImpact));
    }
}
