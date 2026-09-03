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

    @GetMapping
    public ResponseEntity<ApiResponse<List<FoodCategoryDto>>> getListFoodCategory() {
        List<FoodCategoryDto> categories = foodCategoryService.getAllCategories();

        if (categories == null || categories.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(ApiResponse.error("ไม่พบหมวดหมู่อาหาร"));
        }

        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลหมวดหมู่อาหารทั้งหมดสำเร็จ", categories));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FoodCategoryDto>> getCategoryById(@PathVariable Integer id) {
        FoodCategoryDto category = foodCategoryService.getCategoryById(id);

        if (category == null) {
            return ResponseEntity.status(404)
                    .body(ApiResponse.error("ไม่พบข้อมูลหมวดหมู่อาหาร"));
        }

        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลหมวดหมู่อาหารสำเร็จ", category));
    }

}
