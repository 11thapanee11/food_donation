package com.springboot.service;

import com.springboot.service.*;
import com.springboot.dto.ImpactLogDto;
import com.springboot.model.*;
import com.springboot.repository.*;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.*;

@Service
public class ImpactLogService {

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

    public void saveImpactLog(Booking booking, double carbonReduction) {
        // บันทึกข้อมูลลงตาราง ImpactLog
        ImpactLog impactLog = new ImpactLog();
        impactLog.setCarbonReductionAmount(carbonReduction);
        impactLog.setCreateAt(LocalDate.now());
        impactLog.setBooking(booking);
        impactLogRepository.save(impactLog);

        Donor donor = booking.getFood().getDonor();

        if (donor != null) {
            
            Integer donorUserId = donor.getUser().getUserId();

            System.out.println("====== DEBUG DONOR USER ID IS: " + donorUserId + " ======");

            donorService.updateTotalImpactAmount(donorUserId, carbonReduction);
        }

    }

    public List<ImpactLogDto> getListImpactLog(Integer donorId) {
        List<ImpactLogDto> impactLog = new ArrayList<>();

        // ดึงรายการล็อกทั้งหมดที่เกิดขึ้นจริงของผู้บริจาคคนนี้มาตั้งต้น
        List<ImpactLog> logs = impactLogRepository.findByBooking_Food_Donor_UserId(donorId);

        if (logs != null) {
            for (ImpactLog log : logs) {
                Booking booking = log.getBooking(); // ดึงก้อน Booking จากก้อน Log (เพราะ Log เก็บ Booking)

                if (booking != null) {
                    Food food = booking.getFood();
                    String foodName = (food != null) ? food.getFoodName() : "ไม่ระบุชื่ออาหาร";

                    // แปลงข้อมูลจับยัดใส่ DTO รายชิ้น
                    ImpactLogDto tableItem = new ImpactLogDto(
                            log.getImpactLogId(),
                            log.getCreateAt(),
                            foodName,
                            booking.getBookingWeightKg(),
                            log.getCarbonReductionAmount());
                    impactLog.add(tableItem);
                }
            }
        }

        // เรียงลำดับประวัติตารางจากวันที่ล่าสุด (DESC)
        impactLog.sort((a, b) -> b.getDate().compareTo(a.getDate()));

        return impactLog;
    }
}
