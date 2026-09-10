package com.springboot.controller;

import com.springboot.dto.ApiResponse;
import com.springboot.dto.DashboardStatsDto;
import com.springboot.service.DashboardService;

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
        DashboardStatsDto stats = dashboardService.getDashboardStats();

        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลแดชบอร์ดสำเร็จ", stats));
    }

}
