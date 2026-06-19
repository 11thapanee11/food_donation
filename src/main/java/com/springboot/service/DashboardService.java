package com.springboot.service;

import org.springframework.stereotype.Service;

import com.springboot.dto.DashboardStatsDto;
import com.springboot.repository.BookingRepository;
import com.springboot.repository.FoodCategoryRepository;
import com.springboot.repository.FoodRepository;
import com.springboot.repository.ImpactLogRepository;
import com.springboot.repository.ReportRepository;
import com.springboot.repository.UserRepository;
import com.springboot.service.*;

@Service
public class DashboardService {
    private final FoodRepository foodRepository;
    private BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final ImpactLogRepository impactLogRepository;

    public DashboardService(FoodRepository foodRepository, UserRepository userRepository,
            BookingRepository bookingRepository, ReportRepository reportRepository, ImpactLogRepository impactLogRepository) {
        this.foodRepository = foodRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.reportRepository = reportRepository;
        this.impactLogRepository = impactLogRepository;
    }

    public DashboardStatsDto getDashboardStats() {
        DashboardStatsDto dto = new DashboardStatsDto();

        dto.setTotalUsers(userRepository.countNonAdminUsers());
        dto.setTotalFoods(foodRepository.count());
        dto.setTotalCarbon(impactLogRepository.calculateTotalCarbon());

        dto.setCompleted(bookingRepository.countByBookingStatus("completed"));
        dto.setPending(bookingRepository.countByBookingStatus("pending"));
        dto.setCancelled(bookingRepository.countByBookingStatus("cancelled"));

        dto.setExpired(foodRepository.countByFoodStatus("expired"));

        dto.setTotalReports(reportRepository.count());
        dto.setPendingReport(reportRepository.countByReportStatus("pending"));
        dto.setCheckedReport(reportRepository.countByReportStatus("checked"));

        return dto;
    }
}
