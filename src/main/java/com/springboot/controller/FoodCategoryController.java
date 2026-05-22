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
    public ResponseEntity<List<FoodCategoryDto>> getListFoodCategory() {
        List<FoodCategoryDto> categories = foodCategoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    // ดึงตาม id
    @GetMapping("/{id}")
    public ResponseEntity<FoodCategoryDto> getCategoryById(@PathVariable Integer id) {
        FoodCategoryDto category = foodCategoryService.getCategoryById(id);
        return ResponseEntity.ok(category);
    }
}
