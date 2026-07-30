package com.springboot.service;

import java.time.LocalDateTime;

import com.springboot.dto.NotificationDto;
import com.springboot.model.*;
import com.springboot.repository.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
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

    private NotificationDto convertToDto(Notification n) {
        NotificationDto dto = new NotificationDto();
        dto.setId(n.getNotificationId());
        dto.setMessage(n.getNotificationMessage());
        dto.setDate(n.getNotificationDate());
        dto.setType(n.getNotificationType());
        if (n.getFood() != null)
            dto.setFoodId(n.getFood().getFoodId());
        if (n.getBooking() != null)
            dto.setBookingId(n.getBooking().getBookingId());
        return dto;
    }

    public Notification createFoodNotification(Food food) {
        Notification notification = new Notification();
        notification.setNotificationMessage("มีอาหารใหม่ใกล้คุณ: " + food.getFoodName());
        notification.setNotificationDate(LocalDateTime.now());
        notification.setNotificationType("food");
        notification.setFood(food);

        return notificationRepository.save(notification);
    }

    public void createExpirationNotification(Food food, String message, String type) {
        boolean isAlreadyNotified = notificationRepository.existsByFoodAndNotificationType(food, type);

        if (isAlreadyNotified) {
            return;
        }

        Notification notification = new Notification();
        notification.setNotificationMessage(message);
        notification.setNotificationDate(LocalDateTime.now());
        notification.setNotificationType(type);
        notification.setFood(food);

        notificationRepository.save(notification);
    }

    public Notification createBookingNotification(Booking booking) {
        Notification notification = new Notification();

        // ดึงชื่ออาหารและจำนวนที่จองมาสร้างข้อความพาสเทลน่ารักๆ แจ้งเตือนผู้ให้
        String message = "มีคนสนใจอาหารของคุณ! รายการ: " + booking.getFood().getFoodName()
                + " จำนวน " + booking.getBookingUnit();

        notification.setNotificationMessage(message);
        notification.setNotificationDate(LocalDateTime.now());
        notification.setNotificationType("booking"); // กำหนดประเภทแยกชัดเจนว่าเป็นฝั่ง booking

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

    // public List<Notification> getNearbyFoodNotifications(double userLat, double
    // userLng, double radius,
    // Integer userId) {
    // // ดึง Notification ประเภท 'food' ทั้งหมดมาก่อน
    // List<Notification> allFoodNotifications =
    // notificationRepository.findByNotificationType("food");

    // // กรองเฉพาะรายการที่ระยะทางอยู่ในรัศมี (ใช้ Haversine Formula)
    // return allFoodNotifications.stream()
    // .filter(n -> {
    // Food food = n.getFood();
    // boolean isNotOwner = !food.getDonor().getUserId().equals(userId);
    // double dist = calculateDistance(userLat, userLng, food.getLatitude(),
    // food.getLongitude());
    // return isNotOwner && dist <= radius;
    // })
    // .toList();
    // }
    public List<NotificationDto> getNearbyFoodNotifications(double userLat, double userLng, double radius,
            Integer userId) {
        List<Notification> allFoodNotifications = notificationRepository.findByNotificationType("food");

        return allFoodNotifications.stream()
                .filter(n -> {
                    Food food = n.getFood();
                    boolean isNotOwner = !food.getDonor().getUserId().equals(userId);
                    double dist = calculateDistance(userLat, userLng, food.getLatitude(), food.getLongitude());
                    return isNotOwner && dist <= radius;
                })
                .map(this::convertToDto) // <--- แปลงที่ตรงนี้
                .toList();
    }

    // public List<Notification> getBookingNotifications(Integer userId) {
    // List<String> types = List.of("booking", "booking_cancel");
    // return notificationRepository.findBookingsByDonorIdAndTypes(userId, types);
    // }
    public List<NotificationDto> getBookingNotifications(Integer userId) {
        List<String> types = List.of("booking", "booking_cancel");
        return notificationRepository.findBookingsByDonorIdAndTypes(userId, types)
                .stream()
                .map(this::convertToDto) // <--- แปลงที่ตรงนี้
                .toList();
    }

    public List<NotificationDto> getExpirationNotifications(Integer userId) {
        List<String> types = List.of("warning", "info");
        return notificationRepository.findBookingsByDonorIdAndTypes(userId, types)
                .stream()
                .map(this::convertToDto) // <--- แปลงที่ตรงนี้
                .toList();
    }

    private final Map<String, List<Integer>> readNotifications = new ConcurrentHashMap<>();

    // บันทึกเมื่อยูสเซอร์กดอ่าน
    public void markAsRead(String userId, int notificationId) {
        readNotifications.computeIfAbsent(userId, k -> new ArrayList<>());
        if (!readNotifications.get(userId).contains(notificationId)) {
            readNotifications.get(userId).add(notificationId);
        }
    }

    // ดึงเฉพาะลิสต์ไอดีที่ "ยูสเซอร์คนนี้" เคยกดอ่านแล้ว ส่งกลับไปให้หน้าบ้าน
    public List<Integer> getReadIdsForUser(String userId) {
        return readNotifications.getOrDefault(userId, new ArrayList<>());
    }
}
