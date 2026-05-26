package com.springboot.service;

import com.springboot.dto.FoodDto;
import com.springboot.model.*;
import com.springboot.repository.*;

import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.nio.file.Path;
import java.io.IOException;

import com.springboot.service.*;

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

    // ดึงทั้งหมด
    public List<Food> getAllFoods() {
        return foodRepository.findAll();
    }

    public List<Food> getFoodsExceptMe(String email) {
        return foodRepository.findByDonor_EmailNot(email);
    }

    // ดึงตาม id
    public Food getFoodById(Integer id) {
        return foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบรายการอาหาร id=" + id));
    }

    // ดึงตามหมวดหมู่
    public List<Food> getFoodsByCategory(Integer foodCateId) {
        return foodRepository.findByFoodCategory_FoodCateId(foodCateId);
    }

    public List<Food> getFoodsByCategoryExceptMe(Integer categoryId, String email) {
        return foodRepository.findByFoodCategory_FoodCateIdAndDonor_EmailNot(categoryId, email);
    }

    // เพิ่มอาหารใหม่
    // public Food addFood(Food food) {
    // return foodRepository.save(food);
    // }
    public Food addFood(String email, FoodDto foodDto) throws IOException {

        // หา User (Donor) จาก email
        User donor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("ไม่พบผู้ใช้"));

        // หา Category
        FoodCategory category = foodCategoryRepository.findById(foodDto.getFoodCategory())
                .orElseThrow(() -> new RuntimeException("ไม่พบหมวดหมู่"));

        // สร้าง Food entity จาก DTO
        Food food = new Food();
        food.setFoodName(foodDto.getFoodName());
        // ไม่ต้อง parse ถ้า DTO เป็น LocalDateTime อยู่แล้ว
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
        if (foodDto.getFoodStatus() != null) {
            
            food.setFoodStatus(foodDto.getFoodStatus());
        } else {
            food.setFoodStatus("AVAILABLE");
        }
        

        // จัดการรูปภาพ: บันทึกไฟล์ลง disk แล้วเก็บ path ลง DB
        if (foodDto.getFoodImage() != null && !foodDto.getFoodImage().isEmpty()) {
            String uploadDir = "uploads/";
            String fileName = UUID.randomUUID() + "_" + foodDto.getFoodImage().getOriginalFilename();
            Path filePath = Paths.get(uploadDir, fileName);

            Files.createDirectories(filePath.getParent());
            Files.write(filePath, foodDto.getFoodImage().getBytes());

            // เก็บ path ลง DB
            food.setFoodImage("/uploads/" + fileName);
        }

        // set FK
        food.setFoodCategory(category);
        food.setDonor(donor);

        // print ค่าออก console
        System.out.println("=== Food Entity ===");
        System.out.println("Name: " + foodDto.getFoodName());
        System.out.println("Description: " + food.getDescription());
        System.out.println("ExpiryDate: " + food.getExpiryDate());
        System.out.println("UnitWeightKg: " + food.getUnitWeightKg());
        System.out.println("TotalUnit: " + food.getTotalUnit());
        System.out.println("RemainingUnit: " + food.getRemainingUnit());
        System.out.println("PeopleCountPerMeal: " + food.getPeopleCountPerMeal());
        System.out.println("Address: " + food.getAddress());
        System.out.println("PickupDateStart: " + food.getPickupDateStart());
        System.out.println("PickupDateEnd: " + food.getPickupDateEnd());
        System.out.println("PickupStartTime: " + food.getPickupStartTime());
        System.out.println("PickupEndTime: " + food.getPickupEndTime());
        System.out.println("LimitPerPerson: " + food.getLimitPerPerson());
        System.out.println("Latitude: " + food.getLatitude());
        System.out.println("Longitude: " + food.getLongitude());
        System.out.println("FoodStatus: " + food.getFoodStatus());
        System.out.println("FoodImage: " + food.getFoodImage());
        System.out.println("Category: " + category.getFoodCateName());
        System.out.println("Donor: " + donor.getEmail());
        System.out.println("===================");

        // บันทึกลง DB
        // foodRepository.save(food);
        Food savedFood = foodRepository.save(food);

        // สร้างการแจ้งเตือน
        // notificationService.createNotification(food);
        notificationService.createFoodNotification(savedFood);

        return savedFood;
    }

    // อัพเดทอาหาร
    // public Food updateFood(Food food) {
    // if (!foodRepository.existsById(food.getFoodId())) {
    // throw new RuntimeException("ไม่พบรายการอาหาร id=" + food.getFoodId());
    // }
    // return foodRepository.save(food);
    // }
    public Food updateFood(Integer id, FoodDto foodDto) throws IOException {

        // ดึงข้อมูลอาหารจานเดิมขึ้นมาจากฐานข้อมูล
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบรายการอาหารรหัส: " + id));

        // ค้นหาหมวดหมู่
        if (foodDto.getFoodCategory() != null) {
            Integer cateId = foodDto.getFoodCategory();
            FoodCategory category = foodCategoryRepository.findById(cateId)
                    .orElseThrow(() -> new RuntimeException("ไม่พบหมวดหมู่รหัส: " + cateId));
            food.setFoodCategory(category);
        }

        // อัปเดตข้อมูลตัวอักษรและรายละเอียดต่างๆ
        food.setFoodName(foodDto.getFoodName());
        food.setExpiryDate(foodDto.getExpiryDate());
        food.setUnitWeightKg(foodDto.getUnitWeightKg());
        food.setDescription(foodDto.getDescription());
        food.setPeopleCountPerMeal(foodDto.getPeopleCountPerMeal());
        food.setAddress(foodDto.getAddress());

        // การจัดการจำนวน
        food.setTotalUnit(foodDto.getTotalUnit());
        food.setRemainingUnit(food.getRemainingUnit()); // ล็อกค่าเดิม

        // พิกัดและการนัดรับ
        food.setPickupDateStart(foodDto.getPickupDateStart());
        food.setPickupDateEnd(foodDto.getPickupDateEnd());
        food.setPickupStartTime(foodDto.getPickupStartTime());
        food.setPickupEndTime(foodDto.getPickupEndTime());
        food.setLimitPerPerson(foodDto.getLimitPerPerson());
        food.setLatitude(foodDto.getLatitude());
        food.setLongitude(foodDto.getLongitude());

        System.out.println("Status received in DTO: " + foodDto.getFoodStatus());
        // อัปเดตสถานะ
        if (foodDto.getFoodStatus() != null) {
            
            food.setFoodStatus(foodDto.getFoodStatus());
        }

        //จัดการรูปภาพ
        if (foodDto.getFoodImage() != null && !foodDto.getFoodImage().isEmpty()) {
            String uploadDir = "uploads/";
            String fileName = UUID.randomUUID() + "_" + foodDto.getFoodImage().getOriginalFilename();
            Path filePath = Paths.get(uploadDir, fileName);

            Files.createDirectories(filePath.getParent());
            Files.write(filePath, foodDto.getFoodImage().getBytes());

            // บันทึก Path รูปใบใหม่ทับใบเดิม
            food.setFoodImage("/uploads/" + fileName);
        }

        // บันทึกความเปลี่ยนแปลง
        System.out.println("=== Updating Food Entity ID: " + id + " ===");
        return foodRepository.save(food);
    }

    // ลบอาหาร
    public void deleteFood(Integer id) {
        if (!foodRepository.existsById(id)) {
            throw new RuntimeException("ไม่พบรายการอาหาร id=" + id);
        }
        foodRepository.deleteById(id);
    }

    // list อาหารจากผู้ใช้
    // public List<FoodDto> findFoodsByDonorEmail(String email) {
    // // ดึงข้อมูลจาก DB
    // List<Food> foods = foodRepository.findByDonorEmail(email);

    // // แปลง Entity → DTO
    // return foods.stream()
    // .map(food -> {
    // FoodDto dto = new FoodDto();
    // dto.setFoodName(food.getFoodName());
    // dto.setDescription(food.getDescription());
    // dto.setExpiryDate(food.getExpiryDate());
    // dto.setUnitWeightKg(food.getUnitWeightKg());
    // dto.setTotalUnit(food.getTotalUnit());
    // dto.setRemainingUnit(food.getRemainingUnit());
    // dto.setPeopleCountPerMeal(food.getPeopleCountPerMeal());
    // dto.setAddress(food.getAddress());
    // dto.setPickupDateStart(food.getPickupDateStart());
    // dto.setPickupDateEnd(food.getPickupDateEnd());
    // dto.setPickupStartTime(food.getPickupStartTime());
    // dto.setPickupEndTime(food.getPickupEndTime());
    // dto.setLimitPerPerson(food.getLimitPerPerson());
    // dto.setLatitude(food.getLatitude());
    // dto.setLongitude(food.getLongitude());
    // dto.setFoodStatus(food.getFoodStatus());
    // dto.setFoodImagePath(food.getFoodImage());
    // dto.setFoodCategory(food.getFoodCategory().getFoodCateId());
    // dto.setDonor(food.getDonor().getUserId()); // FK ของ donor

    // return dto;
    // })
    // .toList();
    // }

    public List<Food> findFoodsByDonorEmail(String email) {
        // ดึงข้อมูลจาก DB
        return foodRepository.findByDonorEmail(email);

    }
}
