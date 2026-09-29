package com.springboot.service;

import com.springboot.model.*;
import com.springboot.dto.*;
import com.springboot.exception.ApplicationException;
import com.springboot.service.*;

import java.util.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class DonationService {

    private final FoodService foodService;
    private final BookingService bookingService;

    public DonationService(FoodService foodService, BookingService bookingService) {
        this.foodService = foodService;
        this.bookingService = bookingService;
    }

    public List<Map<String, Object>> getDonorDonationHistory(Integer userId) {
        // 1. ดึงรายการอาหารทั้งหมดของ Donor คนนี้
        List<Food> foods = foodService.findFoodsByDonorId(userId);
        List<Integer> foodIds = foods.stream().map(Food::getFoodId).toList();

        if (foodIds.isEmpty()) {
            return new ArrayList<>();
        }

        // 2. ดึงข้อมูล Booking ตามรายชื่อ foodId ของ Donor
        List<Booking> allBookings = bookingService.getBookingsByFoodIds(foodIds);
        List<Map<String, Object>> historyList = new ArrayList<>();
        
        for (Booking booking : allBookings) {
            if (booking.getFood() != null) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", booking.getBookingId());
                item.put("name", booking.getFood().getFoodName());
                item.put("amountText", booking.getBookingQuantity() + " " + booking.getFood().getUnit());
                item.put("date", booking.getBookingDate());

                // แปลงสถานะให้ตรงกับ Frontend (pending, completed, cancelled)
                String rawStatus = booking.getBookingStatus() != null ? booking.getBookingStatus().toLowerCase() : "pending";
                String status = "pending";
                String statusText = "รอดำเนินการ";

                if (rawStatus.contains("complete") || rawStatus.contains("สำเร็จ")) {
                    status = "completed";
                    statusText = "เสร็จสิ้น";
                } else if (rawStatus.contains("cancel") || rawStatus.contains("ยกเลิก")) {
                    status = "cancelled";
                    statusText = "ยกเลิกแล้ว";
                }

                item.put("status", status);
                item.put("statusText", statusText);

                historyList.add(item);
            }
        }
        
        return historyList;
    }
}
