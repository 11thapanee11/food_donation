package com.springboot.service;

import java.util.*;

import org.springframework.stereotype.Service;

import com.springboot.dto.BookingStatsDto;
import com.springboot.dto.DashboardStatsDto;
import com.springboot.dto.FoodStatsDto;
import com.springboot.dto.DailyStatDto;
import com.springboot.dto.ReportStatsDto;
import com.springboot.repository.BookingRepository;
import com.springboot.service.DashboardService;

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
        List<DailyStatDto> dailylyStats = getCurrentMonthDailyStats();
        dto.setDailyStats(dailylyStats);

        return dto;
    }

    public List<DailyStatDto> getCurrentMonthDailyStats() {
        List<DailyStatDto> stats = new ArrayList<>();

        // สมมติเรียก Repository ที่ดึงข้อมูลแยกตามวันในเดือนปัจจุบัน (เช่น WHERE
        // MONTH(booking_date) = MONTH(CURRENT_DATE()))
        List<Object[]> rawStats = bookingRepository.getCurrentMonthDailyStatsRaw();

        // สร้าง Map เก็บข้อมูลที่มีการจองจริง
        Map<String, Object[]> statsMap = new HashMap<>();
        for (Object[] row : rawStats) {
            String dayStr = String.valueOf(row[0]); // เช่น "1", "2"
            statsMap.put(dayStr, row);
        }

        // สมมติให้แสดงผลครบ 31 วันในเดือน (หรือตามจำนวนวันจริงของเดือนนั้นๆ)
        for (int i = 1; i <= 31; i++) {
            String dayKey = String.valueOf(i);
            if (statsMap.containsKey(dayKey)) {
                Object[] row = statsMap.get(dayKey);
                long total = ((Number) row[1]).longValue();
                long completed = ((Number) row[2]).longValue();
                stats.add(new DailyStatDto(dayKey, total, completed));
            } else {
                stats.add(new DailyStatDto(dayKey, 0, 0));
            }
        }

        return stats;
    }
}