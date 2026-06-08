package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.service.FoodService;
import com.springboot.service.NotificationService;
import com.springboot.util.JwtUtil;

import java.util.*;
import com.springboot.model.*;
import com.springboot.dto.*;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // ดึงแจ้งเตือนทั้งหมด
    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getAllNotifications() {
        try {
            List<Notification> notifications = notificationService.getAllNotifications();
            return ResponseEntity.ok(
                    new ApiResponse<>(true, "ดึงข้อมูลการแจ้งเตือนทั้งหมดสำเร็จ", notifications)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน: " + e.getMessage(), null));
        }
    }
    // public List<Notification> getAllNotifications() {
    //     return notificationService.getAllNotifications();
    // }

    // ดึงแจ้งเตือนที่ยังไม่ได้อ่าน
    // @GetMapping("/unread")
    // public List<Notification> getUnreadNotifications() {
    // return notificationService.getUnreadNotifications();
    // }

    // สร้างแจ้งเตือนใหม่
    // @PostMapping
    // public ResponseEntity<Notification> createNotification(@RequestBody NotificationDto request) {
    //     Notification notification = notificationService.createNotification(request);
    //     return ResponseEntity.ok(notification);
    // }

    // อัปเดตสถานะการอ่าน
    // @PutMapping("/{id}/read")
    // public ResponseEntity<Notification> markAsRead(@PathVariable Integer id) {
    // Notification notification = notificationService.markAsRead(id);
    // return ResponseEntity.ok(notification);
    // }

}
