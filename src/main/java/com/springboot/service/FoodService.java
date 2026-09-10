package com.springboot.service;

import com.springboot.dto.FoodDto;
import com.springboot.exception.ApplicationException;
import com.springboot.model.*;
import com.springboot.repository.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FoodService {

    private final FoodRepository foodRepository;
    private final UserRepository userRepository;
    private final FoodCategoryRepository foodCategoryRepository;
    private final NotificationService notificationService;

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
        dto.setUnitWeightKg(food.getUnitWeightKg());
        dto.setTotalUnit(food.getTotalUnit());
        dto.setRemainingUnit(food.getRemainingUnit());
        dto.setPeopleCountPerMeal(food.getPeopleCountPerMeal());
        dto.setAddress(food.getAddress());
        dto.setPickupDateStart(food.getPickupDateStart());
        dto.setPickupDateEnd(food.getPickupDateEnd());
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
        if (foods == null || foods.isEmpty()) {
            throw new ApplicationException("ไม่พบข้อมูลอาหารในหมวดหมู่", HttpStatus.NOT_FOUND);
        }
        return foods.stream().map(this::mapToDto).toList();
    }

    public Food addFood(Donor donor, FoodDto foodDto, String imagePath) {
        FoodCategory category = foodCategoryRepository.findById(foodDto.getFoodCateId())
                .orElseThrow(() -> new ApplicationException("ไม่พบหมวดหมู่", HttpStatus.NOT_FOUND));

        // สร้าง Food entity จาก DTO
        Food food = new Food();
        food.setFoodName(foodDto.getFoodName());
        food.setExpiryDate(foodDto.getExpiryDate());

        food.setUnitWeightKg(foodDto.getUnitWeightKg());
        food.setTotalUnit(foodDto.getTotalUnit());
        food.setRemainingUnit(foodDto.getTotalUnit());
        food.setDescription(foodDto.getDescription());
        food.setPeopleCountPerMeal(foodDto.getPeopleCountPerMeal());
        food.setAddress(foodDto.getAddress());

        food.setPickupDateStart(foodDto.getPickupDateStart());
        food.setPickupDateEnd(foodDto.getPickupDateEnd());
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
        // จำค่าจำนวนเต็มเดิม (Old Total) และคำนวณหาจำนวนที่ถูกจองไปแล้ว (Reserved)
        int oldTotal = food.getTotalUnit() != null ? food.getTotalUnit() : 0;
        int currentRemaining = food.getRemainingUnit() != null ? food.getRemainingUnit() : 0;
        int reservedUnit = oldTotal - currentRemaining;
        int newTotal = foodDto.getTotalUnit() != null ? foodDto.getTotalUnit() : 0;

        if (newTotal < reservedUnit) {
            throw new ApplicationException("ไม่สามารถปรับลดจำนวนทั้งหมดเป็น " + newTotal +
                    " เนื่องจากมีผู้จองอาหารไปแล้ว " + reservedUnit, HttpStatus.BAD_REQUEST);
        }

        // คำนวณส่วนต่าง (Diff) ของจำนวนทั้งหมด
        int totalDifference = newTotal - oldTotal;

        // อัปเดตสต็อกคงเหลือ (Remaining) อัตโนมัติด้วยส่วนต่าง
        // - ปรับเพิ่ม Total (diff เป็นบวก) -> ยอดของเหลือจะเพิ่มขึ้น
        // - ปรับลด Total (diff เป็นลบ) -> ยอดของเหลือจะลดลง
        int newRemaining = currentRemaining + totalDifference;

        // บันทึกจำนวนลง Entity
        food.setFoodName(foodDto.getFoodName());
        food.setExpiryDate(foodDto.getExpiryDate());
        food.setUnitWeightKg(foodDto.getUnitWeightKg());
        food.setDescription(foodDto.getDescription());
        food.setPeopleCountPerMeal(foodDto.getPeopleCountPerMeal());
        food.setAddress(foodDto.getAddress());
        food.setTotalUnit(newTotal);
        food.setRemainingUnit(newRemaining);
        food.setPickupDateStart(foodDto.getPickupDateStart());
        food.setPickupDateEnd(foodDto.getPickupDateEnd());
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
    public void deleteFood(Integer id) {
        if (!foodRepository.existsById(id)) {
            throw new ApplicationException("ไม่พบข้อมูลอาหาร", HttpStatus.NOT_FOUND);
        }
        foodRepository.deleteById(id);
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

    // ดึงรายการอาหารที่หมดอายุแล้ว (cutoffTime คือ ผ่านเวลา expiry มาเกินกำหนด)
    public List<Food> getExpiredFoods(LocalDateTime cutoffTime) {
        return foodRepository.findByExpiryDateBeforeAndFoodStatus(cutoffTime, "available");
    }

    // ดึงรายการอาหารที่ใกล้หมดอายุ (ระหว่าง cutoffTime ถึง 24 ชม. ข้างหน้า)
    public List<Food> getNearExpiryFoods(LocalDateTime cutoffTime, LocalDateTime tomorrow) {
        return foodRepository.findByExpiryDateBetweenAndFoodStatus(cutoffTime, tomorrow, "available");
    }

}
