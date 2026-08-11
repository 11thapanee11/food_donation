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
        List<FoodDto> foods = foodService.getAllFoods();

        if (foods == null || foods.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("ไม่พบข้อมูลอาหาร"));
        }
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลอาหารทั้งหมดสำเร็จ", foods));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FoodDto>> getFoodById(@PathVariable Integer id) {
        FoodDto foodDto = foodService.getFoodById(id);

        if (foodDto == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("ไม่พบข้อมูลอาหาร"));
        }
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลอาหารสำเร็จ", foodDto));
    }

    @GetMapping("/category/{id}")
    public ResponseEntity<ApiResponse<List<FoodDto>>> getFoodsByCategory(@PathVariable("id") Integer categoryId) {
        List<FoodDto> foods = foodService.getFoodsByCategory(categoryId);
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลอาหารตามหมวดหมู่สำเร็จ", foods));
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
            String imagePath = (image != null && !image.isEmpty()) ? saveFoodImage(image) : null;
            User user = userService.authenticate(authHeader);
            Donor donor = donorService.getOrCreateDonor(user);

            Food savedFood = foodService.addFood(donor, foodDto, imagePath);
            return ResponseEntity.ok(ApiResponse.success("เพิ่มข้อมูลอาหารสำเร็จ", savedFood));

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("อัปโหลดไฟล์ล้มเหลว: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("ไม่สามารถบันทึกข้อมูลได้: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> editFood(
            @PathVariable Integer id,
            @ModelAttribute FoodDto foodDto,
            @RequestParam(value = "fileImage", required = false) MultipartFile image) {
        try {
            String imagePath = (image != null && !image.isEmpty()) ? saveFoodImage(image) : null;
            foodService.updateFood(id, foodDto, imagePath);
            return ResponseEntity.ok(ApiResponse.success("แก้ไขข้อมูลอาหารสำเร็จ"));

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("อัปโหลดไฟล์ล้มเหลว: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("ไม่สามารถแก้ไขข้อมูลอาหารได้: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFood(@PathVariable Integer id) {
        try {
            foodService.deleteFood(id);
            return ResponseEntity.ok(ApiResponse.success("ลบข้อมูลอาหารสำเร็จ"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("ไม่สามารถลบข้อมูลอาหารได้: " + e.getMessage()));
        }
    }

    @GetMapping("/my-donations")
    public ResponseEntity<ApiResponse<List<Food>>> getListFoodByDonorId(
            @RequestHeader("Authorization") String authHeader) {
        User user = userService.authenticate(authHeader);
        List<Food> foods = foodService.findFoodsByDonorId(user.getUserId());

        if (foods == null || foods.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("ไม่พบข้อมูลรายการอาหาร"));
        }
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลรายการอาหารบริจาคของฉันสำเร็จ", foods));
    }

    @PutMapping("/{foodId}/deliver")
    public ResponseEntity<ApiResponse<Booking>> verifyConfirmCode(
            @PathVariable Integer foodId,
            @RequestBody Map<String, String> body) {
        try {
            String verificationCode = body.get("code");
            if (verificationCode == null || verificationCode.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("กรุณาระบุรหัสยืนยันการส่งมอบ"));
            }

            Booking updatedBooking = bookingService.verifyConfirmCodeByFoodId(foodId, verificationCode);
            return ResponseEntity.ok(ApiResponse.success("ส่งมอบอาหารและตรวจสอบรหัสเรียบร้อยแล้ว", updatedBooking));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("เกิดข้อผิดพลาดในระบบ: " + e.getMessage()));
        }
    }

    @PutMapping("/{foodId}/status")
    public ResponseEntity<ApiResponse<String>> updateStatus(
            @PathVariable Integer foodId,
            @RequestBody Map<String, String> request) {

        String newStatus = request.get("status");
        if (newStatus == null || newStatus.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("โปรดระบุสถานะที่ต้องการเปลี่ยน"));
        }

        foodService.updateFoodStatus(foodId, newStatus);
        return ResponseEntity.ok(ApiResponse.success("อัปเดตสถานะเป็น " + newStatus + " สำเร็จ"));
    }

}
