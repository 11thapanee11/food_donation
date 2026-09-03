package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.service.FoodService;
import com.springboot.service.NotificationService;
import com.springboot.service.UserService;

import java.util.*;
import com.springboot.model.*;
import com.springboot.dto.*;
import java.util.stream.Stream;

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

        User user = userService.authenticate(authHeader);
        Integer userId = user.getUserId();

        List<NotificationDto> foodList = notificationService.getNearbyFoodNotifications(lat, lng, radius, userId);
        List<NotificationDto> bookingList = notificationService.getBookingNotifications(userId);
        List<NotificationDto> expirationList = notificationService.getExpirationNotifications(userId);

        List<NotificationDto> listNotification = Stream.of(foodList, bookingList, expirationList)
                .flatMap(Collection::stream)
                .sorted(Comparator.comparing(NotificationDto::getDate).reversed())
                .toList();

        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสำเร็จ", listNotification));
    }

    // API 1 ดึงลิสต์ไอดีที่ฉันเคยอ่านแล้ว
    @GetMapping("/my-read-list")
    public ResponseEntity<ApiResponse<List<Integer>>> getMyReadList(@RequestHeader("Authorization") String authHeader) {
        User user = userService.authenticate(authHeader);
        List<Integer> myReadIds = notificationService.getReadIdsForUser(String.valueOf(user.getUserId()));
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสำเร็จ", myReadIds));
    }

    // API 2 ยิงมาบันทึกว่าอ่านแล้ว
    @PostMapping("/read/{id}")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable int id,
            @RequestHeader("Authorization") String authHeader) {
        User user = userService.authenticate(authHeader);
        notificationService.markAsRead(String.valueOf(user.getUserId()), id);
        return ResponseEntity.ok(ApiResponse.success("บันทึกสถานะอ่านแล้วสำเร็จ"));
    }

}
