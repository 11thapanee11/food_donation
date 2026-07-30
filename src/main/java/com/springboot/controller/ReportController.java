package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import com.springboot.dto.*;
import com.springboot.model.*;
import com.springboot.service.*;
import java.util.*;

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
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "ไม่สามารถบันทึกข้อมูลได้", null));
        }

        User user = userService.authenticate(authHeader);
        Recipient recipient = recipientService.getOrCreateRecipient(user);

        String imagePath = null;
        if (image != null && !image.isEmpty()) {
            try {
                String uploadDir = "D:/Project/food_donation/uploads/report/";
                File directory = new File(uploadDir);

                // ถ้าโฟลเดอร์ไม่มี ให้สร้างขึ้นมา
                // if (!directory.exists()) {
                // directory.mkdirs();
                // }

                String fileName = UUID.randomUUID().toString() + "_" + image.getOriginalFilename();

                File dest = new File(directory, fileName);
                image.transferTo(dest);

                imagePath = "/images/report/" + fileName;
            } catch (Exception e) {
                // e.printStackTrace();
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

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReportDto>>> getListReport() {
        try {
            List<ReportDto> reports = reportService.getAllReports();

            return ResponseEntity.ok(new ApiResponse<>(true, "ดึงข้อมูลรายงานสำเร็จ", reports));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาดในการดึงข้อมูล: " + e.getMessage(), null));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReportDto>> getReportDetail(@PathVariable Integer id) {
        ReportDto reportDto = reportService.getReportById(id);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "ดึงข้อมูลรายงานสำเร็จ", reportDto));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) { // รับเป็น JSON Body

        String newStatus = body.get("status"); 
        reportService.updateReportStatus(id, newStatus);

        return ResponseEntity.ok(new ApiResponse<>(true, "อัปเดตสถานะสำเร็จ", null));
    }
    // @PutMapping("/{id}/status")
    // public ResponseEntity<ApiResponse<Report>> updateStatus(
    //         @PathVariable Integer id,
    //         @RequestBody Map<String, String> body) { // รับเป็น JSON Body

    //     String newStatus = body.get("status");
    //     Report updatedReport = reportService.updateReportStatus(id, newStatus);

    //     return ResponseEntity.ok(new ApiResponse<>(true, "อัปเดตสถานะสำเร็จ", updatedReport));
    // }
}
