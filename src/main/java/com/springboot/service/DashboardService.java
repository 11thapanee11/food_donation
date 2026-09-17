package com.springboot.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.springboot.dto.DashboardStatsDto;
import com.springboot.dto.FoodCategoryDto;
import com.springboot.exception.ApplicationException;
import com.springboot.repository.*;

@Service
public class DashboardService {
    private final FoodRepository foodRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final ImpactLogRepository impactLogRepository;
    private final FoodCategoryService foodCategoryService;

    public DashboardService(FoodRepository foodRepository, UserRepository userRepository,
            BookingRepository bookingRepository, ReportRepository reportRepository,
            ImpactLogRepository impactLogRepository, FoodCategoryService foodCategoryService) {
        this.foodRepository = foodRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.reportRepository = reportRepository;
        this.impactLogRepository = impactLogRepository;
        this.foodCategoryService = foodCategoryService;
    }

    public DashboardStatsDto getDashboardStats() {
        DashboardStatsDto dto = new DashboardStatsDto();

        // 1. สถิติทั่วไป
        Long totalUsers = userRepository.countNonAdminUsers();
        dto.setTotalUsers(totalUsers != null ? totalUsers : 0L);

        Long totalFoods = foodRepository.count();
        dto.setTotalFoods(totalFoods != null ? totalFoods : 0L);

        // 2. ข้อมูล Carbon และการคำนวณอัตโนมัติ
        Double totalCarbon = impactLogRepository.calculateTotalCarbon();
        totalCarbon = (totalCarbon != null) ? totalCarbon : 0.0;
        dto.setTotalCarbon(totalCarbon);

        // คำนวณเทียบเท่าการปลูกต้นไม้ (1 ต้น ดูดซับ ~23.7 kgCO2e/ปี)
        dto.setTreesEquivalent(totalCarbon / 23.7);

        Double completedWeight = bookingRepository.sumCompletedBookingUnits();
        dto.setTotalFoodWeight(completedWeight != null ? completedWeight : 0.0);

        // 3. ข้อมูลการจอง (Bookings)
        Long completed = bookingRepository.countByBookingStatus("completed");
        Long pending = bookingRepository.countByBookingStatus("pending");
        Long cancelled = bookingRepository.countByBookingStatus("cancelled");
        Long expired = foodRepository.countByFoodStatus("expired");

        completed = (completed != null) ? completed : 0L;
        pending = (pending != null) ? pending : 0L;
        cancelled = (cancelled != null) ? cancelled : 0L;
        expired = (expired != null) ? expired : 0L;

        dto.setCompleted(completed);
        dto.setPending(pending);
        dto.setCancelled(cancelled);
        dto.setExpired(expired);

        // ยอดรวมการจองทั้งหมด
        Long totalBookings = completed + pending + cancelled;
        dto.setTotalBookings(totalBookings);

        // 4. ข้อมูลการรายงาน (Reports)
        Long totalReports = reportRepository.count();
        Long pendingReport = reportRepository.countByReportStatus("pending");
        Long checkedReport = reportRepository.countByReportStatus("checked");

        dto.setTotalReports(totalReports != null ? totalReports : 0L);
        dto.setPendingReport(pendingReport != null ? pendingReport : 0L);
        dto.setCheckedReport(checkedReport != null ? checkedReport : 0L);

        // 5. ดึงหมวดหมู่อาหารผ่าน foodCategoryService.getAllCategories()
        List<FoodCategoryDto> allCategories = foodCategoryService.getAllCategories();
        List<DashboardStatsDto.CategoryStatDto> categoryStats = new ArrayList<>();
        Long maxCount = 0L;

        if (allCategories != null && !allCategories.isEmpty()) {
            for (FoodCategoryDto cat : allCategories) {
                // หาก getId() คืนค่าเป็น Integer/Long ให้ส่งผ่าน Repository ให้ถูกต้อง
                Long count = foodRepository.countByFoodCategory_FoodCateId(cat.getId());
                count = (count != null) ? count : 0L;

                if (count > maxCount) {
                    maxCount = count;
                }

                categoryStats.add(new DashboardStatsDto.CategoryStatDto(cat.getName(), count, 0L));
            }

            final Long finalMax = maxCount > 0 ? maxCount : 1L;
            categoryStats.forEach(c -> c.setMax(finalMax));

            // เรียงลำดับเอาเฉพาะ Top 4 หมวดหมู่
            List<DashboardStatsDto.CategoryStatDto> top4Categories = categoryStats.stream()
                    .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                    .limit(4)
                    .toList();

            dto.setCategories(top4Categories);
        } else {
            dto.setCategories(new ArrayList<>());
        }

        // if (dto.getTotalUsers() == 0 && dto.getTotalFoods() == 0 && dto.getTotalReports() == 0) {
        //     throw new ApplicationException("ไม่พบข้อมูล", HttpStatus.NOT_FOUND);
        // }

        return dto;
    }
}