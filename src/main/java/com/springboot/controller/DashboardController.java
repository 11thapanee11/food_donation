package com.springboot.controller;

import com.springboot.dto.DashboardStatsDto;
import com.springboot.service.BookingService;
import com.springboot.service.DashboardService;
import com.springboot.service.DonorService;
import com.springboot.service.FoodService;
import com.springboot.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getStats() {
        try {
            DashboardStatsDto stats = dashboardService.getDashboardStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            // กรณีเกิดข้อผิดพลาดในการดึงข้อมูล ให้ส่ง 500 หรือสถานะที่เหมาะสม
            return ResponseEntity.internalServerError().build();
        }
    }
}
