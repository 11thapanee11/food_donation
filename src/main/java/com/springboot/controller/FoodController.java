package com.springboot.controller;

import com.springboot.model.*;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.dto.*;
import com.springboot.exception.ApplicationException;
import com.springboot.service.*;

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
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลอาหารทั้งหมดสำเร็จ", foods));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FoodDto>> getFoodById(@PathVariable Integer id) {
        FoodDto foodDto = foodService.getFoodById(id);
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

        if (!directory.exists()) {
            directory.mkdirs();
        }

        String fileName = UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
        File dest = new File(directory, fileName);
        image.transferTo(dest);

        return "/images/food/" + fileName;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Food>> addFood(
            @RequestHeader("Authorization") String authHeader,
            @ModelAttribute FoodDto foodDto,
            @RequestParam(value = "fileImage", required = false) MultipartFile image) throws IOException {
        String imagePath = (image != null && !image.isEmpty()) ? saveFoodImage(image) : null;
        User user = userService.authenticate(authHeader);
        Donor donor = donorService.getOrCreateDonor(user);

        Food savedFood = foodService.addFood(donor, foodDto, imagePath);
        return ResponseEntity.ok(ApiResponse.success("เพิ่มข้อมูลอาหารสำเร็จ", savedFood));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> editFood(
            @PathVariable Integer id,
            @ModelAttribute FoodDto foodDto,
            @RequestParam(value = "fileImage", required = false) MultipartFile image) throws IOException {

        String imagePath = (image != null && !image.isEmpty()) ? saveFoodImage(image) : null;
        foodService.updateFood(id, foodDto, imagePath);
        return ResponseEntity.ok(ApiResponse.success("แก้ไขข้อมูลอาหารสำเร็จ"));

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFood(@PathVariable Integer id) {
        foodService.deleteFood(id);
        return ResponseEntity.ok(ApiResponse.success("ลบข้อมูลอาหารสำเร็จ"));
    }

    @GetMapping("/my-donations")
    public ResponseEntity<ApiResponse<List<Food>>> getListFoodByDonorId(
            @RequestHeader("Authorization") String authHeader) {
        User user = userService.authenticate(authHeader);
        List<Food> foods = foodService.findFoodsByDonorId(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลรายการอาหารบริจาคของฉันสำเร็จ", foods));
    }

    @PutMapping("/{foodId}/deliver")
    public ResponseEntity<ApiResponse<Booking>> verifyConfirmCode(
            @PathVariable Integer foodId,
            @RequestBody Map<String, String> body) {
        String verificationCode = body.get("code");
        if (verificationCode == null || verificationCode.trim().isEmpty()) {
            throw new ApplicationException("กรุณาระบุรหัสยืนยันการส่งมอบ", HttpStatus.BAD_REQUEST);
        }

        Booking updatedBooking = bookingService.verifyConfirmCodeByFoodId(foodId, verificationCode);
        return ResponseEntity.ok(ApiResponse.success("ส่งมอบอาหารและตรวจสอบรหัสเรียบร้อยแล้ว", updatedBooking));
    }

    @PutMapping("/{foodId}/status")
    public ResponseEntity<ApiResponse<String>> updateStatus(
            @PathVariable Integer foodId,
            @RequestBody Map<String, String> request) {

        String newStatus = request.get("status");
        if (newStatus == null || newStatus.isEmpty()) {
            throw new ApplicationException("โปรดระบุสถานะที่ต้องการเปลี่ยน", HttpStatus.BAD_REQUEST);
        }

        foodService.updateFoodStatus(foodId, newStatus);
        return ResponseEntity.ok(ApiResponse.success("อัปเดตสถานะเป็น " + newStatus + " สำเร็จ"));
    }

}
