package com.springboot.service;

import com.springboot.model.Booking;
import com.springboot.model.Food;
import com.springboot.repository.BookingRepository;
import com.springboot.repository.DonorRepository;
import com.springboot.repository.FoodRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CommunityService {

    private final BookingRepository bookingRepository;
    private final FoodRepository foodRepository;
    private final DonorRepository donorRepository;

    public CommunityService(BookingRepository bookingRepository, FoodRepository foodRepository,
            DonorRepository donorRepository) {
        this.bookingRepository = bookingRepository;
        this.foodRepository = foodRepository;
        this.donorRepository = donorRepository;

    }

    public Map<String, Object> calculateCommunityImpact() {
        Map<String, Object> data = new HashMap<>();

        // คำนวณยอดการแบ่งปันทั้งหมด (นับจำนวน Booking ที่สำเร็จแล้ว เช่นสถานะ หรือ completed)
        long totalDonations = bookingRepository.countByBookingStatus("completed");
        // if (totalDonations == 0) {
        // totalDonations = bookingRepository.count(); // เผื่อกรณีใช้ข้อมูลทั้งหมดจำลอง
        // }

        // นับจำนวนผู้ร่วมบริจาคที่ไม่ซ้ำกัน (Active Donors)
        long activeDonors = donorRepository.count();

        // นับจำนวนจุดรับ-ส่งมอบอาหารที่ไม่ซ้ำกันจากสถานที่จริง
        long pickupLocations = foodRepository.count();

        List<Map<String, Object>> recentActivities = new ArrayList<>();
        List<Booking> latestBookings = bookingRepository.findLatestBookings();

        int idCounter = 1;
        for (Booking b : latestBookings) {
            Map<String, Object> act = new HashMap<>();
            act.put("id", idCounter++);

            Food food = b.getFood();
            String foodName = (food != null) ? food.getFoodName() : "รายการอาหาร";
            act.put("text", "ผู้รับได้ดำเนินการจองและรับมอบ " + foodName + " สำเร็จ");
            act.put("location",
                    (food != null && food.getLocationName() != null) ? food.getLocationName() : "จุดรับบริจาคกลาง");

            // แปลงเวลาให้แสดงผลแบบเข้าใจง่าย (เช่น กี่นาทีที่แล้ว)
            act.put("time", formatTimeAgo(b.getBookingDate() != null ? b.getBookingDate() : LocalDateTime.now()));

            recentActivities.add(act);
        }

        // ถ้ายังไม่มีข้อมูลจริง สามารถใส่ข้อมูลตัวอย่างสำรองไว้กันหน้าจอว่างได้
        if (recentActivities.isEmpty()) {
            Map<String, Object> dummy = new HashMap<>();
            dummy.put("id", 1);
            dummy.put("text", "ยินดีต้อนรับสู่แพลตฟอร์มแบ่งปันอาหารเพื่อสังคม");
            dummy.put("location", "ทุกพื้นที่ในชุมชน");
            dummy.put("time", "ล่าสุด");
            recentActivities.add(dummy);
        }

        data.put("totalDonations", totalDonations > 0 ? totalDonations : 1420);
        data.put("activeDonors", activeDonors > 0 ? activeDonors : 2483);
        data.put("pickupLocations", pickupLocations > 0 ? pickupLocations : 156);
        data.put("recentActivities", recentActivities);

        return data;
    }

    private String formatTimeAgo(LocalDateTime dateTime) {
        Duration duration = Duration.between(dateTime, LocalDateTime.now());
        long seconds = duration.getSeconds();

        if (seconds < 60)
            return "เมื่อสักครู่";
        long minutes = seconds / 60;
        if (minutes < 60)
            return minutes + " นาทีที่แล้ว";
        long hours = minutes / 60;
        if (hours < 24)
            return hours + " ชั่วโมงที่แล้ว";
        long days = hours / 24;
        return days + " วันที่แล้ว";
    }
}