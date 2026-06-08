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

    public Donor getOrCreateDonor(User user) {
        // 1. ลองหาดูก่อน
        // return donorRepository.findById(user.getUserId()).orElseGet(() -> {
        // // 2. ถ้าไม่มีจริงๆ ให้สร้างใหม่ (ด้วย JPA)
        // Donor newDonor = new Donor();
        // newDonor.setUserId(user.getUserId());
        // newDonor.setDonorStatus("ACTIVE");
        // newDonor.setTotalImpactAmount(0.0);

        // // 3. บันทึกและคืนค่ากลับไป
        // return donorRepository.save(newDonor);
        // });

        return donorRepository.findById(user.getUserId()).orElseGet(() -> {
            Donor newDonor = new Donor();
            newDonor.setUser(user); // ใช้ MapsId ให้ Hibernate จัดการ PK
            newDonor.setDonorStatus("active");
            newDonor.setTotalImpactAmount(0.0);
            return donorRepository.save(newDonor);
        });
    }

    // @Transactional(propagation = Propagation.REQUIRES_NEW)
    // public void updateTotalImpactAmount(Integer userId, double carbonReduction) {

    // Donor donor = donorRepository.findById(userId).orElse(null);

    // if (donor == null) {
    // System.out.println("====== DONOR ROW NOT FOUND, CREATING NEW ROW FOR ID: " +
    // userId + " ======");

    // // donor = new Donor();
    // // donor.setUserId(user.getUserId());
    // // donor.setDonorStatus("ACTIVE");
    // // donor.setTotalImpactAmount(0.0);
    // User user = userRepository.findById(userId).orElse(null);

    // donor = new Donor(user, "ACTIVE", 0.0);
    // }

    // // 3. คำนวณสะสมยอดคาร์บอน (ไม่ว่าจะเป็นแถวเก่าหรือเพิ่งสร้างใหม่)
    // double currentImpact = donor.getTotalImpactAmount() != null ?
    // donor.getTotalImpactAmount() : 0.0;
    // donor.setTotalImpactAmount(currentImpact + carbonReduction);

    // // 4. บันทึกข้อมูลกลับลงตาราง donor
    // donorRepository.saveAndFlush(donor); // ใช้ saveAndFlush เพื่อบังคับ
    // insert/update ทันที

    // System.out
    // .println("====== SUCCESS: SAVED DONOR IMPACT TOTAL AS -> " +
    // donor.getTotalImpactAmount() + " ======");
    // }

    public void updateTotalImpactAmount(Integer donorId, double carbonReduction) {

        // 1. ค้นหา Donor ที่ถูกสร้างรอไว้แล้วตั้งแต่ตอน addFood จากฐานข้อมูล
        Donor donor = donorRepository.findById(donorId)
                .orElseThrow(() -> new RuntimeException(
                        "ไม่พบข้อมูลผู้บริจาคไอดี: " + donorId + " (กรุณาตรวจสอบว่ามีแถวในตาราง donor หรือยัง)"));

        // 2. ดึงยอดเก่ามาคำนวณสะสม (ป้องกันกรณี totalImpactAmount ในเบสเป็น NULL)
        double currentImpact = donor.getTotalImpactAmount() != null ? donor.getTotalImpactAmount() : 0.0;

        // 3. เซ็ตค่าผลรวมใหม่เข้าไปที่ Object Properties
        donor.setTotalImpactAmount(currentImpact + carbonReduction);

        // 4. บันทึกการเปลี่ยนแปลงกลับลงตาราง donor
        donorRepository.save(donor);

        System.out.println("====== SUCCESS: UPDATE EXISTING DONOR IMPACT COMPLETED FOR ID: " + donorId + " -> TOTAL: "
                + donor.getTotalImpactAmount() + " ======");
    }

    // public Double getImpactSummary(Integer userId) {
    // Donor donor = donorRepository.findById(userId)
    // .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลผู้บริจาคไอดี: " +
    // userId));
    // return donor.getTotalImpactAmount() != null ? donor.getTotalImpactAmount() :
    // 0.0;
    // }

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
        return donorRepository.findAllByOrderByTotalImpactAmountDesc()
                .stream()
                .map(d -> new DonorDto(
                        d.getUser().getFirstName(),
                        d.getUser().getLastName(),
                        d.getTotalImpactAmount()))
                .toList();
    }

}
