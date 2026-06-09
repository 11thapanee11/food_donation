package com.springboot.service;

import java.time.LocalDateTime;

import com.springboot.dto.NotificationDto;
import com.springboot.model.*;
import com.springboot.repository.*;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private NotificationRepository notificationRepository;
    private FoodRepository foodRepository;
    private BookingRepository bookingRepository;

    public NotificationService(NotificationRepository notificationRepository, FoodRepository foodRepository,
            BookingRepository bookingRepository) {
        this.notificationRepository = notificationRepository;
        this.foodRepository = foodRepository;
        this.bookingRepository = bookingRepository;
    }

    public Notification createFoodNotification(Food food) {
        Notification notification = new Notification();
        notification.setNotificationMessage("มีอาหารใหม่ใกล้คุณ: " + food.getFoodName());
        notification.setNotificationDate(LocalDateTime.now());
        notification.setNotificationType("food");
        notification.setIsRead(false);
        notification.setFood(food);

        return notificationRepository.save(notification);
    }

    public Notification createBookingNotification(Booking booking) {
        Notification notification = new Notification();

        // ดึงชื่ออาหารและจำนวนที่จองมาสร้างข้อความพาสเทลน่ารักๆ แจ้งเตือนผู้ให้
        String message = "มีคนสนใจอาหารของคุณ! รายการ: " + booking.getFood().getFoodName()
                + " จำนวน " + booking.getBookingUnit();

        notification.setNotificationMessage(message);
        notification.setNotificationDate(LocalDateTime.now());
        notification.setNotificationType("booking"); // กำหนดประเภทแยกชัดเจนว่าเป็นฝั่ง booking
        notification.setIsRead(false);

        // เชื่อมความสัมพันธ์ของ Object ตามโครงสร้างตาราง
        notification.setFood(booking.getFood());
        notification.setBooking(booking); // (ถ้าใน Entity ตาราง Notification
        // ของคุณมีฟิลด์ผูกกับ Booking ให้เอาคอมเมนต์ออกได้ครับ)

        // บันทึกลงฐานข้อมูลและส่งวัตถุที่เซฟแล้วกลับออกไป
        return notificationRepository.save(notification);
    }

    public Notification createCancelBookingNotification(Booking booking) {
        Notification notification = new Notification();

        String message = "รายการจองถูกยกเลิก! รายการ: " + booking.getFood().getFoodName()
                + " จำนวน " + booking.getBookingUnit();

        notification.setNotificationMessage(message);
        notification.setNotificationDate(LocalDateTime.now());
        notification.setNotificationType("booking_cancel");
        notification.setIsRead(false);

        notification.setFood(booking.getFood());
        notification.setBooking(booking);

        return notificationRepository.save(notification);

    }

    // ดึงแจ้งเตือนทั้งหมด
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    // ดึงเฉพาะแจ้งเตือนอาหารใหม่ (สำหรับผู้รับอาหาร)
    // public List<Notification> getFoodNotifications() {
    // return
    // notificationRepository.findByNotificationTypeOrderByNotificationDateDesc("food");
    // }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // รัศมีโลกหน่วยเป็นกิโลเมตร
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public List<Notification> getNearbyFoodNotifications(double userLat, double userLng, double radius,
            Integer userId) {
        // 1. ดึง Notification ประเภท 'food' ทั้งหมดมาก่อน
        List<Notification> allFoodNotifications = notificationRepository.findByNotificationType("food");

        // 2. กรองเฉพาะรายการที่ระยะทางอยู่ในรัศมี (ใช้ Haversine Formula)
        return allFoodNotifications.stream()
                .filter(n -> {
                    Food food = n.getFood();
                    boolean isNotOwner = !food.getDonor().getUserId().equals(userId);
                    double dist = calculateDistance(userLat, userLng, food.getLatitude(), food.getLongitude());
                    return isNotOwner && dist <= radius;
                })
                .toList();
    }

    public List<Notification> getBookingNotifications(Integer userId) {
        List<String> types = List.of("booking", "booking_cancel");
        return notificationRepository.findBookingsByDonorIdAndTypes(userId, types);
    }

    // ดึงเฉพาะแจ้งเตือนการจองและการยกเลิก (สำหรับผู้บริจาค)
    // public List<Notification> getDonorNotifications() {
    // return
    // notificationRepository.findByNotificationTypeInOrderByNotificationDateDesc(
    // Arrays.asList("booking", "booking_cancel")
    // );
    // }

    // ดึงแจ้งเตือนที่ยังไม่ได้อ่าน
    public List<Notification> getUnreadNotifications() {
        return notificationRepository.findByIsReadFalse();
    }

    // อัปเดตสถานะการอ่าน
    public Notification markAsRead(Integer id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }
}
