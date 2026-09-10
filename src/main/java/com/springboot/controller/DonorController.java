package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.dto.*;
import com.springboot.exception.ApplicationException;
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
        List<DonorDto> donors = donorService.getAllDonors();
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสำเร็จ", donors));
    }

    @GetMapping("/impact-summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getImpactSummary(
            @RequestHeader("Authorization") String authHeader) {

        User user = userService.authenticate(authHeader);
        Map<String, Object> summaryData = donorService.getImpactSummary(user.getUserId());

        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสถิติมวลรวมสำเร็จ", summaryData));
    }

    @GetMapping("/ranking")
    public ResponseEntity<ApiResponse<List<DonorDto>>> getListTotalImpact() {
        List<DonorDto> listTotalImpact = donorService.getListTotalImpact();
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสำเร็จ", listTotalImpact));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateDonorStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {

        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isEmpty()) {
            throw new ApplicationException("โปรดระบุสถานะที่ต้องการเปลี่ยน", HttpStatus.BAD_REQUEST);
        }

        donorService.updateDonorStatus(id, newStatus);
        return ResponseEntity.ok(ApiResponse.success("อัปเดตสถานะสำเร็จ"));
    }

    @GetMapping("/check-status")
    public ResponseEntity<ApiResponse<String>> checkDonorStatus(@RequestHeader("Authorization") String authHeader) {
        User user = userService.authenticate(authHeader);
        Donor donor = donorService.getDonorByUserId(user.getUserId());

        if (donor != null && "deactivate".equalsIgnoreCase(donor.getDonorStatus())) {
            throw new ApplicationException("สิทธิ์การบริจาคของคุณถูกระงับ ไม่สามารถเพิ่มรายการอาหารได้",
                    HttpStatus.FORBIDDEN);
        }

        return ResponseEntity.ok(ApiResponse.success("บัญชีใช้งานได้ปกติ"));
    }
}
