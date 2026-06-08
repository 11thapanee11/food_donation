package com.springboot.service;

import java.time.LocalDateTime;

import com.springboot.dto.NotificationDto;
import com.springboot.model.*;
import com.springboot.repository.*;

import java.util.*;
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
