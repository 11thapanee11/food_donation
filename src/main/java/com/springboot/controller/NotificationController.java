package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.service.FoodService;
import com.springboot.service.NotificationService;
import com.springboot.service.UserService;
import com.springboot.util.JwtUtil;

import java.util.*;
import com.springboot.model.*;
import com.springboot.dto.*;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private NotificationService notificationService;
    private UserService userService;

    public NotificationController(NotificationService notificationService, UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    // ดึงแจ้งเตือนทั้งหมด
    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getAllNotifications() {
        try {
            List<Notification> notifications = notificationService.getAllNotifications();
            return ResponseEntity.ok(
                    new ApiResponse<>(true, "ดึงข้อมูลการแจ้งเตือนทั้งหมดสำเร็จ", notifications));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน: " + e.getMessage(),
                            null));
        }
    }
    // public List<Notification> getAllNotifications() {
    // return notificationService.getAllNotifications();
    // }

    // ดึงแจ้งเตือนที่ยังไม่ได้อ่าน
    // @GetMapping("/unread")
    // public List<Notification> getUnreadNotifications() {
    // return notificationService.getUnreadNotifications();
    // }

    // สร้างแจ้งเตือนใหม่
    // @PostMapping
    // public ResponseEntity<Notification> createNotification(@RequestBody
    // NotificationDto request) {
    // Notification notification = notificationService.createNotification(request);
    // return ResponseEntity.ok(notification);
    // }

    // อัปเดตสถานะการอ่าน
    // @PutMapping("/{id}/read")
    // public ResponseEntity<Notification> markAsRead(@PathVariable Integer id) {
    // Notification notification = notificationService.markAsRead(id);
    // return ResponseEntity.ok(notification);
    // }

    // หน้าสำหรับผู้รับอาหาร
    // @GetMapping("/food")
    // public ResponseEntity<List<Notification>> getFoodNotifications() {
    // return ResponseEntity.ok(notificationService.getFoodNotifications());
    // }

    // @GetMapping("/food")
    // public ResponseEntity<List<Notification>> getListNotification(
    // @RequestParam double lat,
    // @RequestParam double lng,
    // @RequestParam(defaultValue = "5.0") double radius, // รัศมีเริ่มต้น 5 กม.
    // @RequestHeader("Authorization") String authHeader) {

    // User user = userService.authenticate(authHeader);
    // Integer userId = user.getUserId();

    // List<Notification> foodList =
    // notificationService.getNearbyFoodNotifications(lat, lng, radius, userId);
    // List<Notification> bookingList =
    // notificationService.getBookingNotifications(userId);

    // List<Notification> listNotification = new ArrayList<>();
    // listNotification.addAll(foodList);
    // listNotification.addAll(bookingList);

    // // เรียงลำดับตามเวลา (ล่าสุดก่อน)
    // listNotification.sort(Comparator.comparing(Notification::getNotificationDate).reversed());

    // return ResponseEntity.ok(listNotification);
    // }
    @GetMapping("/food")
    public ResponseEntity<ApiResponse<List<Notification>>> getListNotification(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5.0") double radius,
            @RequestHeader("Authorization") String authHeader) {

        try {
            User user = userService.authenticate(authHeader);
            Integer userId = user.getUserId();

            List<Notification> foodList = notificationService.getNearbyFoodNotifications(lat, lng, radius, userId);
            List<Notification> bookingList = notificationService.getBookingNotifications(userId);

            List<Notification> listNotification = new ArrayList<>();
            listNotification.addAll(foodList);
            listNotification.addAll(bookingList);
            listNotification.sort(Comparator.comparing(Notification::getNotificationDate).reversed());

            return ResponseEntity.ok(new ApiResponse<>(true, "ดึงข้อมูลสำเร็จ", listNotification));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "ไม่สามารถดึงข้อมูลได้: " + e.getMessage(), null));
        }
    }

    @PutMapping("/read/{id}")
    public ResponseEntity<ApiResponse<String>> markAsRead(@PathVariable Integer id) {
        try {
            notificationService.markAsRead(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "อัปเดตสถานะการอ่านสำเร็จ", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาดในการอัปเดต", null));
        }
    }

    // @PutMapping("/read/{id}")
    // public ResponseEntity<?> markAsRead(@PathVariable Long id) {
    // notificationService.markAsRead(id); // ใน Service ให้หา id นี้แล้ว set isRead
    // = true
    // return ResponseEntity.ok().build();
    // }

    // หน้าสำหรับผู้บริจาค
    // @GetMapping("/donor")
    // public ResponseEntity<List<Notification>> getDonorNotifications() {
    // return ResponseEntity.ok(notificationService.getDonorNotifications());
    // }

}
