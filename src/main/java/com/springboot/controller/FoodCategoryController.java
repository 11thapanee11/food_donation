package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.dto.*;
import com.springboot.service.*;
import java.util.*;

@RestController
@RequestMapping("/food-categories")
public class FoodCategoryController {
    private final FoodCategoryService foodCategoryService;

    public FoodCategoryController(FoodCategoryService foodCategoryService) {
        this.foodCategoryService = foodCategoryService;
    }

    // ดึงทั้งหมด
    @GetMapping
    public ResponseEntity<ApiResponse<List<FoodCategoryDto>>> getListFoodCategory() {
        try {
            List<FoodCategoryDto> categories = foodCategoryService.getAllCategories();
            return ResponseEntity.ok(
                    new ApiResponse<>(true, "ดึงข้อมูลหมวดหมู่อาหารทั้งหมดสำเร็จ", categories)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่: " + e.getMessage(), null));
        }
    }
    // public ResponseEntity<List<FoodCategoryDto>> getListFoodCategory() {
    //     List<FoodCategoryDto> categories = foodCategoryService.getAllCategories();
    //     return ResponseEntity.ok(categories);
    // }

    // ดึงตาม id
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FoodCategoryDto>> getCategoryById(@PathVariable Integer id) {
        try {
            FoodCategoryDto category = foodCategoryService.getCategoryById(id);
            
            if (category == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse<>(false, "ไม่พบข้อมูลหมวดหมู่อาหารที่ระบุ", null));
            }
            
            return ResponseEntity.ok(
                    new ApiResponse<>(true, "ดึงข้อมูลหมวดหมู่อาหารสำเร็จ", category)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "เกิดข้อผิดพลาดในระบบ: " + e.getMessage(), null));
        }
    }
    // public ResponseEntity<FoodCategoryDto> getCategoryById(@PathVariable Integer id) {
    //     FoodCategoryDto category = foodCategoryService.getCategoryById(id);
    //     return ResponseEntity.ok(category);
    // }
}
