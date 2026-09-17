package com.springboot.service;

import com.springboot.dto.FoodCategoryDto;
import com.springboot.exception.ApplicationException;
import com.springboot.model.FoodCategory;
import com.springboot.repository.FoodCategoryRepository;
import java.util.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class FoodCategoryService {
    private final FoodCategoryRepository foodCategoryRepository;

    public FoodCategoryService(FoodCategoryRepository foodCategoryRepository) {
        this.foodCategoryRepository = foodCategoryRepository;
    }

    public List<FoodCategoryDto> getAllCategories() {
        List<FoodCategory> categories = foodCategoryRepository.findAll();
        if (categories.isEmpty()) {
            throw new ApplicationException("ไม่พบหมวดหมู่อาหาร", HttpStatus.NOT_FOUND);
        }

        return categories.stream()
                .map(cat -> new FoodCategoryDto(
                        cat.getFoodCateId(),
                        cat.getFoodCateName(),
                        cat.getEmissionFactor()))
                .toList();
    }

    public FoodCategoryDto getCategoryById(Integer id) {
        FoodCategory cat = foodCategoryRepository.findById(id)
                .orElseThrow(() -> new ApplicationException("ไม่พบหมวดหมู่รหัส: " + id, HttpStatus.NOT_FOUND));
        return new FoodCategoryDto(cat.getFoodCateId(), cat.getFoodCateName(), cat.getEmissionFactor());
    }
}
