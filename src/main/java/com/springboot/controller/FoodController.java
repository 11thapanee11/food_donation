package com.springboot.controller;

import com.springboot.dto.FoodDto;
import com.springboot.model.Food;
import com.springboot.model.FoodCategory;
import com.springboot.service.FoodService;

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

@RestController
@RequestMapping("/foods")
public class FoodController {

    private final FoodService foodService;

    private final JwtUtil jwtUtil;

    public FoodController(FoodService foodService, JwtUtil jwtUtil) {
        this.foodService = foodService;
        this.jwtUtil = jwtUtil;
    }

    // ดึงทั้งหมด
    // @GetMapping
    // public ResponseEntity<List<Food>> getAllFoods() {
    //     return ResponseEntity.ok(foodService.getAllFoods());
    // }
    @GetMapping
    public ResponseEntity<List<Food>> getAllFoods(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // ถ้าผู้ใช้ไม่ได้ Login หรือไม่มี Token ให้ส่งอาหารทั้งหมดกลับไปปกติ
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.ok(foodService.getAllFoods());
        }

        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractEmail(token);

        if (!jwtUtil.validateToken(token, email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // ดึงอาหารทั้งหมด ยกเว้นของเราเอง
        return ResponseEntity.ok(foodService.getFoodsExceptMe(email));
    }

    // ดึงตาม id
    @GetMapping("/{id}")
    public ResponseEntity<Food> getFoodById(@PathVariable Integer id) {
        Food food = foodService.getFoodById(id);
        if (food == null) {
            return ResponseEntity.notFound().build(); // ส่ง Status 404 กลับไป
        }
        return ResponseEntity.ok(food);
    }

    // ดึงตามหมวดหมู่
    // @GetMapping("/category/{cateId}")
    // public ResponseEntity<List<Food>> getFoodsByCategory(@PathVariable Integer cateId) {
    //     return ResponseEntity.ok(foodService.getFoodsByCategory(cateId));
    // }

    @GetMapping("/category/{id}")
    public ResponseEntity<List<Food>> getFoodsByCategory(
            @PathVariable("id") Integer categoryId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
            
        // ถ้าไม่มี Token ให้ส่งอาหารตามหมวดหมู่ของทุกคนกลับไปปกติ
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.ok(foodService.getFoodsByCategory(categoryId));
        }

        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractEmail(token);

        if (!jwtUtil.validateToken(token, email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // ดึงอาหารในหมวดหมู่นี้ ยกเว้นของเราเอง
        return ResponseEntity.ok(foodService.getFoodsByCategoryExceptMe(categoryId, email));
    }


    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> addFood(
            @RequestHeader("Authorization") String authHeader,
            @ModelAttribute FoodDto foodDto) throws IOException {
        try {
            // 1. ตัดคำว่า Bearer ออก
            String token = authHeader.replace("Bearer ", "");

            // 2. ตรวจสอบ token
            String email = jwtUtil.extractEmail(token);
            if (!jwtUtil.validateToken(token, email)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Token ไม่ถูกต้องหรือหมดอายุ"));
            }

            // foodService.addFood(email, foodDto);
            Food savedFood = foodService.addFood(email, foodDto);

            return ResponseEntity.ok(Map.of("message", "เพิ่มอาหารสำเร็จ"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "fail: " + e.getMessage()));
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
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> updateFood(
            @PathVariable Integer id, // 1. รับ ID อาหารจาก URL
            @ModelAttribute FoodDto foodDto // 2. รับข้อมูลฟอร์มพร้อมรูปภาพ (Multipart)
    ) throws IOException {
        try {
            // เรียก Service เพื่ออัปเดตโดยตรง โดยส่งแค่ id และข้อมูลใหม่เข้าไป
            foodService.updateFood(id, foodDto);

            return ResponseEntity.ok(Map.of("message", "อัปเดตข้อมูลอาหารสำเร็จ"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "fail: " + e.getMessage()));
        }
    }

    // ลบอาหาร
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFood(@PathVariable Integer id) {
        foodService.deleteFood(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-donations")
    public ResponseEntity<List<Food>> getFoodByDonor(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!jwtUtil.validateToken(token, jwtUtil.extractEmail(token))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = jwtUtil.extractEmail(token);
        List<Food> foods = foodService.findFoodsByDonorEmail(email);

        return ResponseEntity.ok(foods);
    }
}
