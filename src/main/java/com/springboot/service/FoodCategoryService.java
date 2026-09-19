package com.springboot.service;

import com.springboot.dto.DashboardStatsDto;
import com.springboot.dto.FoodCategoryDto;
import com.springboot.exception.ApplicationException;
import com.springboot.model.FoodCategory;
import com.springboot.repository.FoodCategoryRepository;
import com.springboot.repository.FoodRepository;

import java.util.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class FoodCategoryService {
    private final FoodCategoryRepository foodCategoryRepository;
    private final FoodRepository foodRepository;

    public FoodCategoryService(FoodCategoryRepository foodCategoryRepository, FoodRepository foodRepository) {
        this.foodCategoryRepository = foodCategoryRepository;
        this.foodRepository = foodRepository;
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

    public List<DashboardStatsDto.CategoryStatDto> getFoodCategoryStats() {
        List<FoodCategoryDto> allCategories = getAllCategories();
        if (allCategories == null || allCategories.isEmpty()) {
            return Collections.emptyList();
        }

        // แปลงข้อมูลและนับจำนวนอาหารตรงจาก FoodRepository
        List<DashboardStatsDto.CategoryStatDto> categoryStats = allCategories.stream()
                .map(cat -> new DashboardStatsDto.CategoryStatDto(
                        cat.getName(),
                        Optional.ofNullable(foodRepository.countByFoodCategory_FoodCateId(cat.getId())).orElse(0L),
                        0L))
                .toList();

        // หาค่า maxCount
        long maxCount = categoryStats.stream()
                .mapToLong(DashboardStatsDto.CategoryStatDto::getCount)
                .max()
                .orElse(0L);

        long finalMax = maxCount > 0 ? maxCount : 1L;
        categoryStats.forEach(stat -> stat.setMax(finalMax));

        // จัดเรียงและตัดเอาเฉพาะ Top 4
        return categoryStats.stream()
                .sorted(Comparator.comparingLong(DashboardStatsDto.CategoryStatDto::getCount).reversed())
                .limit(4)
                .toList();
    }
}
