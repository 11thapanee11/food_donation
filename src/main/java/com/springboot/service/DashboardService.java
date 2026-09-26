package com.springboot.service;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;

import com.springboot.dto.BookingStatsDto;
import com.springboot.dto.DashboardStatsDto;
import com.springboot.dto.FoodStatsDto;
import com.springboot.dto.ReportStatsDto;

@Service
public class DashboardService {

    private final UserService userService;
    private final FoodService foodService;
    private final BookingService bookingService;
    private final ReportService reportService;
    private final FoodCategoryService foodCategoryService;

    public DashboardService(UserService userService, 
                            FoodService foodService,
                            BookingService bookingService, 
                            ReportService reportService,
                            FoodCategoryService foodCategoryService) {
        this.userService = userService;
        this.foodService = foodService;
        this.bookingService = bookingService;
        this.reportService = reportService;
        this.foodCategoryService = foodCategoryService;
    }

    public DashboardStatsDto getDashboardStats() {
        DashboardStatsDto dto = new DashboardStatsDto();

        // สถิติผู้ใช้งาน
        dto.setTotalUsers(userService.getUserStats());

        // สถิติอาหาร (รวบเรียกจาก FoodService)
        FoodStatsDto foodStats = foodService.getFoodStats();
        if (foodStats != null) {
            dto.setTotalFoods(foodStats.getTotalFoods());
            dto.setExpired(foodStats.getExpired());
        } else {
            dto.setTotalFoods(0L);
            dto.setExpired(0L);
        }

        // สถิติการจอง
        BookingStatsDto bookingStats = bookingService.getBookingStats();
        if (bookingStats != null) {
            dto.setTotalFoodWeight(bookingStats.getCompletedWeight());
            dto.setCompleted(bookingStats.getCompleted());
            dto.setPending(bookingStats.getPending());
            dto.setCancelled(bookingStats.getCancelled());
            dto.setTotalBookings(bookingStats.getTotalBookings());
        }

        // ข้อมูลการรายงานปัญหา
        ReportStatsDto reportStats = reportService.getReportStats();
        if (reportStats != null) {
            dto.setTotalReports(reportStats.getTotalReports());
            dto.setPendingReport(reportStats.getPendingReport());
            dto.setCheckedReport(reportStats.getCheckedReport());
        }

        // หมวดหมู่อาหาร Top 4
        List<DashboardStatsDto.CategoryStatDto> categoryStats = foodCategoryService.getFoodCategoryStats();
        dto.setCategories(categoryStats);

        return dto;
    }
}