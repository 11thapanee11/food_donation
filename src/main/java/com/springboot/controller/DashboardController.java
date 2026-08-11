package com.springboot.controller;

import com.springboot.dto.ApiResponse;
import com.springboot.dto.DashboardStatsDto;
import com.springboot.service.BookingService;
import com.springboot.service.DashboardService;
import com.springboot.service.DonorService;
import com.springboot.service.FoodService;
import com.springboot.service.UserService;

import org.springframework.http.HttpStatus;
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
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getDashboardStats() {
        try {
            DashboardStatsDto stats = dashboardService.getDashboardStats();

            if (stats == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("ไม่พบข้อมูลสถิติแดชบอร์ด"));
            }

            return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลแดชบอร์ดสำเร็จ", stats));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด: " + e.getMessage()));
        }
    }

}
