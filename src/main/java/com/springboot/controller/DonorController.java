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

            if (donors == null || donors.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("ไม่พบข้อมูลผู้บริจาค"));
            }

            return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสำเร็จ", donors));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("เกิดข้อผิดพลาด: " + e.getMessage()));
        }
    }

    @GetMapping("/impact-summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getImpactSummary(
            @RequestHeader("Authorization") String authHeader) {

        User user = userService.authenticate(authHeader);
        Map<String, Object> summaryData = donorService.getImpactSummary(user.getUserId());

        if (summaryData == null || summaryData.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("ไม่พบข้อมูล"));
        }

        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสถิติมวลรวมสำเร็จ", summaryData));
    }

    @GetMapping("/ranking")
    public ResponseEntity<ApiResponse<List<DonorDto>>> getListTotalImpact() {
        List<DonorDto> listTotalImpact = donorService.getListTotalImpact();

        if (listTotalImpact == null || listTotalImpact.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("ไม่พบข้อมูล"));
        }

        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสำเร็จ", listTotalImpact));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateDonorStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        try {
            String newStatus = body.get("status");
            donorService.updateDonorStatus(id, newStatus);

            return ResponseEntity.ok(ApiResponse.success("อัปเดตสถานะสำเร็จ"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("ไม่สามารถแก้ไขสถานะบัญชีผู้ใช้งานได้: " + e.getMessage()));
        }
    }

    @GetMapping("/check-status")
    public ResponseEntity<ApiResponse<String>> checkDonorStatus(@RequestHeader("Authorization") String authHeader) {
        try {
            User user = userService.authenticate(authHeader);
            Donor donor = donorService.getDonorByUserId(user.getUserId());

            if (donor != null && "deactivate".equalsIgnoreCase(donor.getDonorStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("สิทธิ์การบริจาคของคุณถูกระงับ ไม่สามารถเพิ่มรายการอาหารได้"));
            }

            return ResponseEntity.ok(ApiResponse.success("บัญชีใช้งานได้ปกติ"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("เกิดข้อผิดพลาด: " + e.getMessage()));
        }
    }

}
