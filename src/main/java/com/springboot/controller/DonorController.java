package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.dto.*;
import com.springboot.service.*;

import jakarta.servlet.http.HttpServletRequest;

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

    @GetMapping
    public ResponseEntity<ApiResponse<List<DonorDto>>> getAllDonors() {
        try {
            List<DonorDto> donors = donorService.getAllDonors();

            // ส่งคืนโดยใช้ ApiResponse
            return ResponseEntity.ok(
                    new ApiResponse<>(true, "ดึงข้อมูลสำเร็จ", donors));
        } catch (Exception e) {
            // ในกรณี Error ก็ส่ง ApiResponse กลับไปเช่นกัน
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาด: " + e.getMessage(), null));
        }
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

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {

        String newStatus = body.get("status");
        donorService.updateDonorStatus(id, newStatus);

        return ResponseEntity.ok(new ApiResponse<>(true, "อัปเดตสถานะสำเร็จ", null));
    }

    @GetMapping("/check-status")
    public ResponseEntity<ApiResponse<String>> checkDonorStatus(@RequestHeader("Authorization") String authHeader) {
        try {
            User user = userService.authenticate(authHeader);

            // 2. ไปดึงข้อมูลจากตารางลูก (Donor) มาตรวจเช็ค
            Donor donor = donorService.getDonorByUserId(user.getUserId());

            if (donor != null && "deactivate".equalsIgnoreCase(donor.getDonorStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse<>(false,
                                "สิทธิ์การบริจาคของคุณถูกระงับ ไม่สามารถเพิ่มรายการอาหารได้", null));
            }

            return ResponseEntity.ok(new ApiResponse<>(true, "บัญชีใช้งานได้ปกติ", null));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาด: " + e.getMessage(), null));
        }
    }

}
