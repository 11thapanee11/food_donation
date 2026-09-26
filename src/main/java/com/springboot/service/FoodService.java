package com.springboot.service;

import com.springboot.dto.FoodDto;
import com.springboot.dto.FoodStatsDto;
import com.springboot.exception.ApplicationException;
import com.springboot.model.*;
import com.springboot.repository.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FoodService {

    private final FoodRepository foodRepository;
    private final UserRepository userRepository;
    private final FoodCategoryRepository foodCategoryRepository;
    private final NotificationService notificationService;

    private static final String UPLOAD_DIR = "D:/Project/food_donation/uploads/food/";

    public FoodService(FoodRepository foodRepository, UserRepository userRepository,
            FoodCategoryRepository foodCategoryRepository, NotificationService notificationService) {
        this.foodRepository = foodRepository;
        this.userRepository = userRepository;
        this.foodCategoryRepository = foodCategoryRepository;
        this.notificationService = notificationService;
    }

    private FoodDto mapToDto(Food food) {
        FoodDto dto = new FoodDto();
        dto.setId(food.getFoodId());
        dto.setFoodName(food.getFoodName());
        dto.setDescription(food.getDescription());
        dto.setExpiryDate(food.getExpiryDate());
        dto.setQuantity(food.getQuantity());
        dto.setUnit(food.getUnit());
        dto.setRemainingQuantity(food.getRemainingQuantity());
        dto.setLocationName(food.getLocationName());
        dto.setPickupStartTime(food.getPickupStartTime());
        dto.setPickupEndTime(food.getPickupEndTime());
        dto.setLimitPerPerson(food.getLimitPerPerson());
        dto.setLatitude(food.getLatitude());
        dto.setLongitude(food.getLongitude());
        dto.setFoodStatus(food.getFoodStatus());
        dto.setFoodImage(food.getFoodImage());

        if (food.getFoodCategory() != null) {
            dto.setFoodCateId(food.getFoodCategory().getFoodCateId());
            dto.setFoodCateName(food.getFoodCategory().getFoodCateName());
        }

        if (food.getDonor() != null) {
            dto.setDonorId(food.getDonor().getUserId());
            if (food.getDonor().getUser() != null) {
                dto.setDonorName(
                        food.getDonor().getUser().getFirstName() + " " + food.getDonor().getUser().getLastName());
                dto.setDonorPhoneNum(food.getDonor().getUser().getPhoneNumber());
            }
        }
        return dto;
    }

    public List<FoodDto> getAllFoods() {
        List<Food> foods = foodRepository.findAll();
        if (foods.isEmpty()) {
            throw new ApplicationException("ไม่พบข้อมูลอาหาร", HttpStatus.NOT_FOUND);
        }
        return foods.stream().map(this::mapToDto).toList();
    }

    public FoodDto getFoodById(Integer id) {
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new ApplicationException("ไม่พบรายการอาหาร id=" + id, HttpStatus.NOT_FOUND));
        return mapToDto(food);
    }

    public List<FoodDto> getFoodsByCategory(Integer foodCateId) {
        List<Food> foods = foodRepository.findByFoodCategory_FoodCateId(foodCateId);
        return foods.stream().map(this::mapToDto).toList();
    }

    public Food addFood(Donor donor, FoodDto foodDto, String imagePath) {
        FoodCategory category = foodCategoryRepository.findById(foodDto.getFoodCateId())
                .orElseThrow(() -> new ApplicationException("ไม่พบหมวดหมู่", HttpStatus.NOT_FOUND));

        // สร้าง Food entity จาก DTO
        Food food = new Food();
        food.setFoodName(foodDto.getFoodName());
        food.setExpiryDate(foodDto.getExpiryDate());

        food.setQuantity(foodDto.getQuantity());
        food.setUnit(foodDto.getUnit());

        // แปลง quantity (Double) เป็น remainingQuantity (Integer) สำหรับค่าเริ่มต้น
        int initialRemaining = foodDto.getQuantity() != null ? foodDto.getQuantity().intValue() : 0;
        food.setRemainingQuantity(initialRemaining);

        food.setDescription(foodDto.getDescription());
        food.setLocationName(foodDto.getLocationName());

        food.setPickupStartTime(foodDto.getPickupStartTime());
        food.setPickupEndTime(foodDto.getPickupEndTime());

        food.setLimitPerPerson(foodDto.getLimitPerPerson());
        food.setLatitude(foodDto.getLatitude());
        food.setLongitude(foodDto.getLongitude());
        if (foodDto.getFoodStatus() != null && !foodDto.getFoodStatus().trim().isEmpty()) {
            food.setFoodStatus(foodDto.getFoodStatus());
        } else {
            food.setFoodStatus("available");
        }

        if (imagePath != null && !imagePath.isEmpty()) {
            food.setFoodImage(imagePath);
        }

        // set FK
        food.setFoodCategory(category);
        food.setDonor(donor);

        Food savedFood = foodRepository.save(food);

        // สร้างการแจ้งเตือน
        try {
            notificationService.createFoodNotification(savedFood);
        } catch (Exception e) {
            throw new ApplicationException("ไม่สามารถสร้างการแจ้งเตือนได้: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return savedFood;
    }

    // อัพเดทอาหาร
    public Food updateFood(Integer id, FoodDto foodDto, String imagePath) {
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new ApplicationException("ไม่พบรายการอาหารรหัส: " + id, HttpStatus.NOT_FOUND));

        if (foodDto.getFoodCateId() != null) {
            FoodCategory category = foodCategoryRepository.findById(foodDto.getFoodCateId())
                    .orElseThrow(() -> new ApplicationException("ไม่พบหมวดหมู่รหัส: " + foodDto.getFoodCateId(),
                            HttpStatus.NOT_FOUND));
            food.setFoodCategory(category);
        }

        // การจัดการจำนวน
        int oldTotal = food.getQuantity() != null ? food.getQuantity().intValue() : 0;
        int currentRemaining = food.getRemainingQuantity() != null ? food.getRemainingQuantity() : 0;
        int reservedUnit = oldTotal - currentRemaining;
        int newTotal = foodDto.getQuantity() != null ? foodDto.getQuantity().intValue() : 0;

        if (newTotal < reservedUnit) {
            throw new ApplicationException("ไม่สามารถปรับลดจำนวนทั้งหมดเป็น " + newTotal +
                    " เนื่องจากมีผู้จองอาหารไปแล้ว " + reservedUnit, HttpStatus.BAD_REQUEST);
        }

        int totalDifference = newTotal - oldTotal;
        int newRemaining = currentRemaining + totalDifference;

        // บันทึกจำนวนลง Entity
        food.setFoodName(foodDto.getFoodName());
        food.setExpiryDate(foodDto.getExpiryDate());
        food.setQuantity(foodDto.getQuantity());
        food.setUnit(foodDto.getUnit());
        food.setDescription(foodDto.getDescription());
        food.setLocationName(foodDto.getLocationName());
        food.setRemainingQuantity(newRemaining);
        food.setPickupStartTime(foodDto.getPickupStartTime());
        food.setPickupEndTime(foodDto.getPickupEndTime());
        food.setLimitPerPerson(foodDto.getLimitPerPerson());
        food.setLatitude(foodDto.getLatitude());
        food.setLongitude(foodDto.getLongitude());
        if (foodDto.getFoodStatus() != null) {
            food.setFoodStatus(foodDto.getFoodStatus());
        }
        if (imagePath != null && !imagePath.isEmpty()) {
            food.setFoodImage(imagePath);
        }

        return foodRepository.save(food);
    }

    // ลบอาหาร
    @Transactional
    public void deleteFood(Integer id) {
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new ApplicationException("ไม่พบข้อมูลอาหารที่ต้องการลบ", HttpStatus.NOT_FOUND));

        String imagePath = food.getFoodImage();
        foodRepository.delete(food);

        if (imagePath != null && !imagePath.trim().isEmpty()) {
            deletePhysicalFile(imagePath);
        }
    }

    private void deletePhysicalFile(String imagePath) {
        try {
            String fileName = imagePath.substring(imagePath.lastIndexOf("/") + 1);
            Path path = Paths.get(UPLOAD_DIR + fileName);
            Files.deleteIfExists(path);
        } catch (Exception e) {
            System.err.println("ไม่สามารถลบไฟล์รูปภาพได้: " + e.getMessage());
        }
    }

    public List<Food> findFoodsByDonorId(Integer id) {
        List<Food> foods = foodRepository.findByDonorUserId(id);
        if (foods == null || foods.isEmpty()) {
            throw new ApplicationException("ไม่พบข้อมูลอาหารของผู้บริจาค", HttpStatus.NOT_FOUND);
        }
        return foods;
    }

    public void updateFoodStatus(Integer foodId, String status) {
        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new ApplicationException("ไม่พบรายการอาหาร", HttpStatus.NOT_FOUND));
        food.setFoodStatus(status);
        foodRepository.save(food);
    }

    public List<Food> getExpiredFoods(LocalDateTime cutoffTime) {
        return foodRepository.findByExpiryDateBeforeAndFoodStatus(cutoffTime, "available");
    }

    public List<Food> getNearExpiryFoods(LocalDateTime cutoffTime, LocalDateTime tomorrow) {
        return foodRepository.findByExpiryDateBetweenAndFoodStatus(cutoffTime, tomorrow, "available");
    }

    public FoodStatsDto getFoodStats() {
        Long totalFoods = foodRepository.count();
        Long expired = foodRepository.countByFoodStatus("expired");
        return new FoodStatsDto(totalFoods, expired);
    }
}