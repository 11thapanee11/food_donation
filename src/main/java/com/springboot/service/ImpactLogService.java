package com.springboot.service;

import com.springboot.service.*;
import com.springboot.dto.ImpactLogDto;
import com.springboot.model.*;
import com.springboot.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ImpactLogService {

    private static final Logger log = LoggerFactory.getLogger(ImpactLogService.class);

    private final ImpactLogRepository impactLogRepository;
    private final DonorService donorService;

    public ImpactLogService(ImpactLogRepository impactLogRepository, DonorService donorService) {
        this.impactLogRepository = impactLogRepository;
        this.donorService = donorService;
    }

    public double calculateCarbonSaved(Booking booking) {
        double bookedWeightKg = booking.getBookingWeightKg();
        double emissionFactor = booking.getFood().getFoodCategory().getEmissionFactor();

        return bookedWeightKg * emissionFactor;
    }

    @Transactional
    public void saveImpactLog(Booking booking, double carbonReduction) {
        ImpactLog impactLog = new ImpactLog();
        impactLog.setCarbonReductionAmount(carbonReduction);
        impactLog.setCreateAt(LocalDate.now());
        impactLog.setBooking(booking);
        impactLogRepository.save(impactLog);

        updateDonorImpact(booking, carbonReduction);
    }

    private void updateDonorImpact(Booking booking, double carbonReduction) {
        Donor donor = booking.getFood().getDonor();
        if (donor == null) {
            log.warn("Donor not found for booking ID: {}", booking.getBookingId());
            return;
        }

        Integer donorUserId = donor.getUser().getUserId();
        log.debug("Updating total impact for donor user ID: {}", donorUserId);

        donorService.updateTotalImpactAmount(donorUserId, carbonReduction);
    }

    public List<ImpactLogDto> getListImpactLog(Integer donorId) {
        List<ImpactLog> logs = impactLogRepository.findByBooking_Food_Donor_UserId(donorId);
        List<ImpactLogDto> impactLogDtos = new ArrayList<>();

        logs.forEach(impactLog -> {
            Booking booking = impactLog.getBooking();
            if (booking != null) {
                Food food = booking.getFood();
                String foodName = (food != null) ? food.getFoodName() : "ไม่ระบุชื่ออาหาร";

                impactLogDtos.add(new ImpactLogDto(
                        impactLog.getImpactLogId(),
                        impactLog.getCreateAt(),
                        foodName,
                        booking.getBookingWeightKg(),
                        impactLog.getCarbonReductionAmount()));
            }
        });

        // เรียงลำดับจากวันที่ล่าสุด
        impactLogDtos.sort((a, b) -> b.getDate().compareTo(a.getDate()));
        return impactLogDtos;
    }
}
