package com.springboot.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;

import com.springboot.dto.BookingStatsDto;
import com.springboot.dto.DashboardStatsDto;
import com.springboot.dto.FoodStatsDto;
import com.springboot.dto.MonthlyStatDto;
import com.springboot.dto.ReportStatsDto;
import com.springboot.repository.BookingRepository;

@Service
public class DashboardService {

    private final UserService userService;
    private final FoodService foodService;
    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final ReportService reportService;
    private final FoodCategoryService foodCategoryService;

    public DashboardService(UserService userService,
            FoodService foodService,
            BookingService bookingService,
            BookingRepository bookingRepository,
            ReportService reportService,
            FoodCategoryService foodCategoryService) {
        this.userService = userService;
        this.foodService = foodService;
        this.bookingService = bookingService;
        this.bookingRepository = bookingRepository;
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

        // ดึงและเซ็ตสถิติรายเดือนสำหรับกราฟ
        List<MonthlyStatDto> monthlyStats = getMonthlyStats();
        dto.setMonthlyStats(monthlyStats);

        return dto;
    }

    public List<MonthlyStatDto> getMonthlyStats() {
        List<MonthlyStatDto> stats = new ArrayList<>();

        List<Object[]> rawStats = bookingRepository.getMonthlyBookingStatsRaw();

        for (Object[] row : rawStats) {
            String monthYear = (String) row[0]; // รูปแบบเช่น "2026-05"
            long total = ((Number) row[1]).longValue();
            long completed = ((Number) row[2]).longValue();

            // แปลงเป็นชื่อเดือนไทย (เช่น "พ.ค.")
            String thaiMonthName = formatMonthToThai(monthYear);

            stats.add(new MonthlyStatDto(thaiMonthName, total, completed));
        }

        return stats;
    }

    // ฟังก์ชันช่วยแปลงปี-เดือน (2026-05) เป็นชื่อเดือนไทย
    private String formatMonthToThai(String yearMonth) {
        if (yearMonth == null || !yearMonth.contains("-"))
            return yearMonth;
        String monthPart = yearMonth.split("-")[1];
        switch (monthPart) {
            case "01":
                return "ม.ค.";
            case "02":
                return "ก.พ.";
            case "03":
                return "มี.ค.";
            case "04":
                return "เม.ย.";
            case "05":
                return "พ.ค.";
            case "06":
                return "มิ.ย.";
            case "07":
                return "ก.ค.";
            case "08":
                return "ส.ค.";
            case "09":
                return "ก.ย.";
            case "10":
                return "ต.ค.";
            case "11":
                return "พ.ย.";
            case "12":
                return "ธ.ค.";
            default:
                return monthPart;
        }
    }
}