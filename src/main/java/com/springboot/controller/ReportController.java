package com.springboot.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import com.springboot.dto.*;
import com.springboot.model.*;
import com.springboot.service.*;

import java.io.File;

@RestController
@RequestMapping("/report")
public class ReportController {

    private final ReportService reportService;
    private final UserService userService;
    private final RecipientService recipientService;

    public ReportController(ReportService reportService, UserService userService, RecipientService recipientService) {
        this.reportService = reportService;
        this.userService = userService;
        this.recipientService = recipientService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<String>> addReport(
            @RequestHeader("Authorization") String authHeader,
            @ModelAttribute ReportDto dto,
            @RequestParam(value = "report_image", required = false) MultipartFile image) {

        if (dto.getBookingId() == null) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "ผิดพลาด: ไม่พบ Booking ID", null));
        }
        // if (dto.getRecipientId() == null) {
        // return ResponseEntity.badRequest().body(new ApiResponse<>(false, "ผิดพลาด:
        // ไม่พบ User ID", null));
        // }

        User user = userService.authenticate(authHeader);
        Recipient recipient = recipientService.getOrCreateRecipient(user);

        String imagePath = null;
        // if (image != null && !image.isEmpty()) {
        // try {
        // String fileName = UUID.randomUUID().toString() + "_" +
        // image.getOriginalFilename();
        // image.transferTo(new File("uploads/report/" + fileName));
        // imagePath = "images/report/" + fileName;
        // } catch (Exception e) {
        // return ResponseEntity.internalServerError().body(new ApiResponse<>(false,
        // "อัปโหลดไฟล์ล้มเหลว", null));
        // }
        // }
        if (image != null && !image.isEmpty()) {
            try {
                // 1. กำหนด Path หลัก
                String uploadDir = "D:/Project/food_donation/uploads/report/";
                File directory = new File(uploadDir);

                // 2. ถ้าโฟลเดอร์ไม่มี ให้สร้างขึ้นมา
                // if (!directory.exists()) {
                // directory.mkdirs();
                // }

                String fileName = UUID.randomUUID().toString() + "_" + image.getOriginalFilename();

                // 3. บันทึกไฟล์
                File dest = new File(directory, fileName);
                image.transferTo(dest);

                imagePath = "/images/report/" + fileName;
            } catch (Exception e) {
                // พิมพ์ Error ลงใน Console ของ Java เพื่อดูว่าติดตรงไหน
                e.printStackTrace();
                return ResponseEntity.internalServerError()
                        .body(new ApiResponse<>(false, "อัปโหลดไฟล์ล้มเหลว: " + e.getMessage(), null));
            }
        }

        reportService.saveReport(dto, imagePath, recipient);
        return ResponseEntity.ok(new ApiResponse<>(true, "รายงานปัญหาเรียบร้อยแล้ว", null));
    }

    @GetMapping("/check/{bookingId}")
    public ResponseEntity<ApiResponse<Boolean>> checkReportStatus(@PathVariable Integer bookingId) {
        boolean exists = reportService.checkReport(bookingId);
        return ResponseEntity.ok(new ApiResponse<>(true, "ตรวจสอบสถานะสำเร็จ", exists));
    }
}
