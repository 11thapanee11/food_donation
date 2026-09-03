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

    private final NotificationService notificationService;
    private final UserService userService;

    public NotificationController(NotificationService notificationService, UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getListNotification(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5.0") double radius,
            @RequestHeader("Authorization") String authHeader) {

        try {
            User user = userService.authenticate(authHeader);
            Integer userId = user.getUserId();

            List<NotificationDto> foodList = notificationService.getNearbyFoodNotifications(lat, lng, radius, userId);
            List<NotificationDto> bookingList = notificationService.getBookingNotifications(userId);
            List<NotificationDto> expirationList = notificationService.getExpirationNotifications(userId);

            List<NotificationDto> listNotification = new ArrayList<>();
            listNotification.addAll(foodList);
            listNotification.addAll(bookingList);
            listNotification.addAll(expirationList);
            listNotification.sort(Comparator.comparing(NotificationDto::getDate).reversed());

            return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสำเร็จ", listNotification));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("ไม่สามารถดึงข้อมูลได้: " + e.getMessage()));
        }
    }

    // API 1 ดึงลิสต์ไอดีที่ฉันเคยอ่านแล้ว
    @GetMapping("/my-read-list")
    public ResponseEntity<ApiResponse<List<Integer>>> getMyReadList(@RequestHeader("Authorization") String authHeader) {
        try {
            User user = userService.authenticate(authHeader);
            Integer userId = user.getUserId();
            String userIdStr = String.valueOf(userId);

            List<Integer> myReadIds = notificationService.getReadIdsForUser(userIdStr);
            return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสำเร็จ", myReadIds));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("เกิดข้อผิดพลาด: " + e.getMessage()));
        }
    }

    // API 2 ยิงมาบันทึกว่าอ่านแล้ว
    @PostMapping("/read/{id}")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable int id,
            @RequestHeader("Authorization") String authHeader) {
        try {
            User user = userService.authenticate(authHeader);
            Integer userId = user.getUserId();
            String userIdStr = String.valueOf(userId);

            notificationService.markAsRead(userIdStr, id);
            return ResponseEntity.ok(ApiResponse.success("บันทึกสถานะอ่านแล้วสำเร็จ"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("ไม่สามารถบันทึกสถานะได้: " + e.getMessage()));
        }
    }

}
