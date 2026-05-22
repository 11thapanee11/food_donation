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

    public NotificationService(NotificationRepository notificationRepository, FoodRepository foodRepository, BookingRepository bookingRepository) {
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

    // ดึงแจ้งเตือนทั้งหมด
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    // ดึงแจ้งเตือนที่ยังไม่ได้อ่าน
    public List<Notification> getUnreadNotifications() {
        return notificationRepository.findByIsReadFalse();
    }

    // อัปเดตสถานะการอ่าน
    public Notification markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }
}
