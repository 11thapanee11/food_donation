package com.springboot.service;

import com.springboot.model.*;
import com.springboot.dto.*;
import com.springboot.repository.*;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

@Service
public class DonorService {

    private final DonorRepository donorRepository;
    private final BookingRepository bookingRepository;

    public DonorService(DonorRepository donorRepository, BookingRepository bookingRepository) {
        this.donorRepository = donorRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<DonorDto> getAllDonors() {
        // ดึง List ของ Donor ที่มีข้อมูล User อยู่ด้วย
        List<Donor> donors = donorRepository.findAllDonors();

        return donors.stream().map(d -> {
            DonorDto dto = new DonorDto();
            dto.setId(d.getUser().getUserId());
            dto.setName(d.getUser().getFirstName() + " " + d.getUser().getLastName());
            dto.setEmail(d.getUser().getEmail());
            dto.setStatus(d.getDonorStatus());
            dto.setTotalCo2(d.getTotalImpactAmount());
            return dto;
        }).toList();
    }

    public Donor getOrCreateDonor(User user) {
        return donorRepository.findById(user.getUserId()).orElseGet(() -> {
            Donor newDonor = new Donor();
            newDonor.setUser(user); // ใช้ MapsId ให้ Hibernate จัดการ PK
            newDonor.setDonorStatus("active");
            newDonor.setTotalImpactAmount(0.0);
            return donorRepository.save(newDonor);
        });
    }

    public void updateTotalImpactAmount(Integer donorId, double carbonReduction) {
        Donor donor = donorRepository.findById(donorId)
                .orElseThrow(() -> new RuntimeException(
                        "ไม่พบข้อมูลผู้บริจาคไอดี: " + donorId + " (กรุณาตรวจสอบว่ามีแถวในตาราง donor หรือยัง)"));

        // ดึงยอดเก่ามาคำนวณสะสม (ป้องกันกรณี totalImpactAmount ในเบสเป็น NULL)
        double currentImpact = donor.getTotalImpactAmount() != null ? donor.getTotalImpactAmount() : 0.0;

        // เซ็ตค่าผลรวมใหม่เข้าไปที่ Object Properties
        donor.setTotalImpactAmount(currentImpact + carbonReduction);

        // บันทึกการเปลี่ยนแปลงกลับลงตาราง donor
        donorRepository.save(donor);

        System.out.println("====== SUCCESS: UPDATE EXISTING DONOR IMPACT COMPLETED FOR ID: " + donorId + " -> TOTAL: "
                + donor.getTotalImpactAmount() + " ======");
    }

    public Map<String, Object> getImpactSummary(Integer userId) {

        System.out.println("DEBUG: กำลังค้นหา Donor ด้วย ID: " + userId);

        // ค้นหาผู้บริจาคเพื่อเอาค่าคาร์บอนรวมสะสม
        Donor donor = donorRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลผู้บริจาคไอดี: " + userId));

        Map<String, Object> summaryMap = new HashMap<>();

        // คาร์บอนรวม (ดึงสะสมจากฟิลด์ตรงๆ ของ Donor)
        double totalCarbon = donor.getTotalImpactAmount() != null ? donor.getTotalImpactAmount() : 0.0;
        summaryMap.put("totalCarbon", totalCarbon);

        // หาน้ำหนักรวมจากตาราง Booking (ฟิกซ์เฉพาะสถานะ COMPLETE จากคิวรีภายใน)
        Double totalWeight = bookingRepository.sumWeightByDonorIdAndComplete(userId);
        summaryMap.put("totalWeight", totalWeight != null ? totalWeight : 0.0);

        // นับจำนวนครั้งการบริจาคสำเร็จจากตาราง Booking (ฟิกซ์เฉพาะสถานะ COMPLETE
        // จากคิวรีภายใน)
        int totalDonationCount = bookingRepository.countCompleteBookingsByDonorId(userId);
        summaryMap.put("totalDonations", totalDonationCount);

        return summaryMap;
    }

    public List<DonorDto> getListTotalImpact() {
        return donorRepository.findTopDonorsByImpact()
                .stream()
                .map(d -> new DonorDto(
                        d.getUser().getFirstName(),
                        d.getUser().getLastName(),
                        d.getTotalImpactAmount()))
                .toList();
    }

    public void updateDonorStatus(Integer userId, String newStatus) {
        Donor donor = donorRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลผู้บริจาค"));

        donor.setDonorStatus(newStatus);
        donorRepository.save(donor);
    }

    public Donor getDonorByUserId(Integer userId) {
        return donorRepository.findByUserUserId(userId);
    }

}
