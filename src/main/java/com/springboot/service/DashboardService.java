package com.springboot.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.springboot.dto.DashboardStatsDto;
import com.springboot.exception.ApplicationException;
import com.springboot.repository.*;

@Service
public class DashboardService {
    private final FoodRepository foodRepository;
    private final BookingRepository bookingRepository;
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

        if (dto.getTotalUsers() == 0 && dto.getTotalFoods() == 0 && dto.getTotalReports() == 0) {
            throw new ApplicationException("ไม่พบข้อมูล", HttpStatus.NOT_FOUND);
        }

        return dto;
    }
}
