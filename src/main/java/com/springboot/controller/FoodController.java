package com.springboot.controller;

import com.springboot.model.Booking;
import com.springboot.model.Donor;
import com.springboot.model.Food;
import com.springboot.model.FoodCategory;
import com.springboot.model.User;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.springboot.dto.*;
import com.springboot.service.*;
import com.springboot.util.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;

import java.util.*;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.File;

@RestController
@RequestMapping("/foods")
public class FoodController {

    private final FoodService foodService;
    private final UserService userService;
    private final BookingService bookingService;
    private final DonorService donorService;

    public FoodController(FoodService foodService, UserService userService, BookingService bookingService,
            DonorService donorService) {
        this.foodService = foodService;
        this.userService = userService;
        this.bookingService = bookingService;
        this.donorService = donorService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FoodDto>>> getAllFoods() {
        List<FoodDto> foods;

        foods = foodService.getAllFoods();
        return ResponseEntity.ok(new ApiResponse<>(true, "ดึงข้อมูลอาหารทั้งหมดสำเร็จ (ยกเว้นของผู้บริจาค)", foods));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FoodDto>> getFoodById(@PathVariable Integer id) {
        // เรียกใช้เมธอดใหม่ใน Service ที่คืนค่าเป็น DTO
        FoodDto foodDto = foodService.getFoodById(id);

        if (foodDto == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, "ไม่พบข้อมูลอาหารที่ระบุ", null));
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "ดึงข้อมูลอาหารสำเร็จ", foodDto));
    }

    @GetMapping("/category/{id}")
    public ResponseEntity<ApiResponse<List<FoodDto>>> getFoodsByCategory(@PathVariable("id") Integer categoryId) {

        List<FoodDto> foods;

        foods = foodService.getFoodsByCategory(categoryId);

        return ResponseEntity
                .ok(new ApiResponse<>(true, "ดึงข้อมูลอาหารตามหมวดหมู่สำเร็จ", foods));
    }

    private String saveFoodImage(MultipartFile image) throws IOException {
        String uploadDir = "D:/Project/food_donation/uploads/food/";
        File directory = new File(uploadDir);

        // if (!directory.exists()) {
        // directory.mkdirs();
        // }

        String fileName = UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
        File dest = new File(directory, fileName);
        image.transferTo(dest);

        return "/images/food/" + fileName;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Food>> addFood(
            @RequestHeader("Authorization") String authHeader,
            @ModelAttribute FoodDto foodDto,
            @RequestParam(value = "fileImage", required = false) MultipartFile image) {
        try {

            String imagePath = null;
            if (image != null && !image.isEmpty()) {
                imagePath = saveFoodImage(image);
            }

            User user = userService.authenticate(authHeader);

            Donor donor = donorService.getOrCreateDonor(user);

            Food savedFood = foodService.addFood(donor, foodDto, imagePath);

            // Food savedFood = foodService.addFood(user.getEmail(), foodDto);
            return ResponseEntity.ok(new ApiResponse<>(true, "เพิ่มข้อมูลอาหารสำเร็จ", savedFood));

        } catch (IOException e) {
            // จับเฉพาะข้อผิดพลาดเรื่องไฟล์
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "อัปโหลดไฟล์ล้มเหลว: " + e.getMessage(), null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, "ไม่สามารถเพิ่มข้อมูลอาหารได้: " + e.getMessage(), null));
        }
    }

    // อัพเดทอาหาร
    // @PutMapping("/{id}")
    // @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // public ResponseEntity<Food> updateFood(@PathVariable Integer id, @RequestBody
    // Food food) {
    // food.setFoodId(id);
    // Food updated = foodService.updateFood(food);
    // return ResponseEntity.ok(updated);
    // }
    @PutMapping(value = "/{id}")
    public ResponseEntity<ApiResponse<Void>> updateFood(
            @PathVariable Integer id,
            @ModelAttribute FoodDto foodDto,
            @RequestParam(value = "fileImage", required = false) MultipartFile image) {
        try {
            String imagePath = null;
            if (image != null && !image.isEmpty()) {
                imagePath = saveFoodImage(image);
            }
            foodService.updateFood(id, foodDto, imagePath);
            return ResponseEntity.ok(new ApiResponse<>(true, "อัปเดตข้อมูลอาหารสำเร็จ", null));

        } catch (IOException e) {
            // จับเฉพาะข้อผิดพลาดเรื่องไฟล์
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "อัปโหลดไฟล์ล้มเหลว: " + e.getMessage(), null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, "ไม่สามารถอัปเดตข้อมูลอาหารได้: " + e.getMessage(), null));
        }
    }
    // public ResponseEntity<Map<String, String>> updateFood(
    // @PathVariable Integer id, // 1. รับ ID อาหารจาก URL
    // @ModelAttribute FoodDto foodDto // 2. รับข้อมูลฟอร์มพร้อมรูปภาพ (Multipart)
    // ) throws IOException {
    // try {
    // // เรียก Service เพื่ออัปเดตโดยตรง โดยส่งแค่ id และข้อมูลใหม่เข้าไป
    // foodService.updateFood(id, foodDto);

    // return ResponseEntity.ok(Map.of("message", "อัปเดตข้อมูลอาหารสำเร็จ"));
    // } catch (RuntimeException e) {
    // return ResponseEntity.status(HttpStatus.BAD_REQUEST)
    // .body(Map.of("message", "fail: " + e.getMessage()));
    // }
    // }

    // ลบอาหาร
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFood(@PathVariable Integer id) {
        try {
            foodService.deleteFood(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "ลบข้อมูลอาหารสำเร็จ", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, "ไม่สามารถลบข้อมูลอาหารได้: " + e.getMessage(), null));
        }
    }
    // public ResponseEntity<Void> deleteFood(@PathVariable Integer id) {
    // foodService.deleteFood(id);
    // return ResponseEntity.noContent().build();
    // }

    @GetMapping("/my-donations")
    public ResponseEntity<ApiResponse<List<Food>>> getFoodByDonor(@RequestHeader("Authorization") String authHeader) {
        // String token = authHeader.replace("Bearer ", "");
        // String email = jwtUtil.extractEmail(token);

        // if (!jwtUtil.validateToken(token, email)) {
        // return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        // .body(new ApiResponse<>(false, "Token ไม่ถูกต้องหรือหมดอายุ", null));
        // }

        User user = userService.authenticate(authHeader);

        List<Food> foods = foodService.findFoodsByDonorId(user.getUserId());
        return ResponseEntity.ok(new ApiResponse<>(true, "ดึงข้อมูลรายการอาหารบริจาคของฉันสำเร็จ", foods));
    }
    // public ResponseEntity<List<Food>>
    // getFoodByDonor(@RequestHeader("Authorization") String authHeader) {
    // String token = authHeader.replace("Bearer ", "");
    // if (!jwtUtil.validateToken(token, jwtUtil.extractEmail(token))) {
    // return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    // }

    // String email = jwtUtil.extractEmail(token);
    // List<Food> foods = foodService.findFoodsByDonorEmail(email);

    // return ResponseEntity.ok(foods);
    // }

    @PutMapping("/{foodId}/deliver")
    public ResponseEntity<ApiResponse<Booking>> verifyConfirmCode(
            @PathVariable Integer foodId,
            @RequestBody Map<String, String> body) {
        try {
            // ดึงรหัสยืนยันตัวตนออกจาก Map ด้วยคีย์ "code"
            String verificationCode = body.get("code");

            if (verificationCode == null || verificationCode.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "กรุณาระบุรหัสยืนยันการส่งมอบ", null));
            }

            Booking updatedBooking = bookingService.verifyConfirmCodeByFoodId(foodId, verificationCode);

            return ResponseEntity.ok()
                    .body(new ApiResponse<>(true, "ส่งมอบอาหารและตรวจสอบรหัสเรียบร้อยแล้ว", updatedBooking));

        } catch (IllegalArgumentException e) {
            // ดักจับ Error ที่เราตั้งใจโยนออกมาจาก Service (เช่น รหัสไม่ตรง,
            // ไม่เจอใบจองที่เปิดอยู่)
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            // ดักจับกรณีระบบขัดข้องอื่น ๆ
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาดในระบบ: " + e.getMessage(), null));
        }
    }

    @PutMapping("/{foodId}/status")
    public ResponseEntity<ApiResponse<String>> updateStatus(
            @PathVariable Integer foodId,
            @RequestBody Map<String, String> request) {

        String newStatus = request.get("status");

        if (newStatus == null || newStatus.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "โปรดระบุสถานะที่ต้องการเปลี่ยน", null));
        }

        foodService.updateFoodStatus(foodId, newStatus);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "อัปเดตสถานะเป็น " + newStatus + " สำเร็จ", null));
    }

}
