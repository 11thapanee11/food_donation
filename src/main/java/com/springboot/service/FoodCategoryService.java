package com.springboot.service;

import java.util.stream.Collectors;

import com.springboot.dto.FoodCategoryDto;
import com.springboot.model.FoodCategory;
import com.springboot.repository.FoodCategoryRepository;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class FoodCategoryService {
    private final FoodCategoryRepository foodCategoryRepository;

    public FoodCategoryService(FoodCategoryRepository foodCategoryRepository) {
        this.foodCategoryRepository = foodCategoryRepository;
    }

    public List<FoodCategoryDto> getAllCategories() {
        return foodCategoryRepository.findAll()
                .stream()
                .map(cat -> new FoodCategoryDto(
                        cat.getFoodCateId(),
                        cat.getFoodCateName(),
                        cat.getEmissionFactor()
                ))
                .toList();
    }

    public FoodCategoryDto getCategoryById(Integer id) {
        FoodCategory cat = foodCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบหมวดหมู่"));
        return new FoodCategoryDto(cat.getFoodCateId(), cat.getFoodCateName(), cat.getEmissionFactor());
    }
}
