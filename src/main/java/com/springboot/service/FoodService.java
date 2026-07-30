package com.springboot.service;

import com.springboot.dto.FoodDto;
import com.springboot.model.*;
import com.springboot.repository.*;

import org.slf4j.LoggerFactory;
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

import org.springframework.transaction.annotation.Transactional;

@Service
public class FoodService {

    private final FoodRepository foodRepository;
    private final UserRepository userRepository;
    // private final DonorService donorService;
    private final FoodCategoryRepository foodCategoryRepository;
    private final NotificationService notificationService;

    public FoodService(FoodRepository foodRepository, UserRepository userRepository,
            FoodCategoryRepository foodCategoryRepository, NotificationService notificationService) {
        this.foodRepository = foodRepository;
        this.userRepository = userRepository;
        // this.donorService = donorService;
        this.foodCategoryRepository = foodCategoryRepository;
        this.notificationService = notificationService;
    }

    // private static final Logger log = LoggerFactory.getLogger(FoodService.class);

    // ดึงทั้งหมด
    // public List<Food> getAllFoods() {
    // return foodRepository.findAll();
    // }
    public List<FoodDto> getAllFoods() {
        List<Food> foods = foodRepository.findAll();
        return foods.stream().map(food -> {
            FoodDto dto = new FoodDto();
            dto.setId(food.getFoodId());
            dto.setFoodName(food.getFoodName());
            dto.setExpiryDate(food.getExpiryDate());
            dto.setTotalUnit(food.getTotalUnit());
            dto.setRemainingUnit(food.getRemainingUnit());
            dto.setLimitPerPerson(food.getLimitPerPerson());
            dto.setLatitude(food.getLatitude());
            dto.setLongitude(food.getLongitude());
            dto.setFoodStatus(food.getFoodStatus());
            dto.setFoodImage(food.getFoodImage());

            if (food.getFoodCategory() != null) {
                dto.setFoodCateId(food.getFoodCategory().getFoodCateId());
            }

            // ดึงข้อมูลจากความสัมพันธ์ (Relationship)
            // if (food.getDonor() != null) {
            // dto.setDonorId(food.getDonor().getUserId());
            // dto.setDonorName(food.getDonor().getUser().getFirstName() +
            // food.getDonor().getUser().getLastName());
            // }
            return dto;
        }).toList();
    }

    // public List<Food> getFoodsExceptMe(Integer id) {
    // // return foodRepository.findByDonor_EmailNot(email);
    // return foodRepository.findByDonor_UserIdNot(id);
    // }

    // ดึงตาม id
    // public Food getFoodById(Integer id) {
    // return foodRepository.findById(id)
    // .orElseThrow(() -> new RuntimeException("ไม่พบรายการอาหาร id=" + id));
    // }
    public FoodDto getFoodById(Integer id) {
        // 1. ดึง Food entity จาก repository
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบรายการอาหาร id=" + id));

        // 2. แปลงเป็น FoodDto
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

        // ดึง Category ID
        if (food.getFoodCategory() != null) {
            dto.setFoodCateId(food.getFoodCategory().getFoodCateId());
            dto.setFoodCateName(food.getFoodCategory().getFoodCateName());
        }

        dto.setDonorId(food.getDonor().getUserId());

        // ดึงชื่อ-นามสกุลจาก User (ผ่าน Donor)
        if (food.getDonor() != null && food.getDonor().getUser() != null) {
            dto.setDonorName(food.getDonor().getUser().getFirstName() + " " + food.getDonor().getUser().getLastName());
        }

        return dto;
    }

    // ดึงตามหมวดหมู่
    // public List<Food> getFoodsByCategory(Integer foodCateId) {
    // return foodRepository.findByFoodCategory_FoodCateId(foodCateId);
    // }
    public List<FoodDto> getFoodsByCategory(Integer foodCateId) {
        List<Food> foods = foodRepository.findByFoodCategory_FoodCateId(foodCateId);

        return foods.stream().map(food -> {
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

            // ดึง Category ID
            if (food.getFoodCategory() != null) {
                dto.setFoodCateId(food.getFoodCategory().getFoodCateId());
            }

            dto.setDonorId(food.getDonor().getUserId());

            // ดึงชื่อ-นามสกุลจาก User (ผ่าน Donor)
            if (food.getDonor() != null && food.getDonor().getUser() != null) {
                dto.setDonorName(
                        food.getDonor().getUser().getFirstName() + " " + food.getDonor().getUser().getLastName());
            }
            return dto;
        }).toList();

    }

    // public List<Food> getFoodsByCategoryExceptMe(Integer categoryId, Integer id)
    // {
    // // return
    // foodRepository.findByFoodCategory_FoodCateIdAndDonor_EmailNot(categoryId,
    // email);
    // return
    // foodRepository.findByFoodCategory_FoodCateIdAndDonor_UserIdNot(categoryId,
    // id);
    // }

    // เพิ่มอาหารใหม่
    // public Food addFood(Food food) {
    // return foodRepository.save(food);
    // }

    // public Food addFood(String email, FoodDto foodDto) throws IOException {
    // public Food addFood(Donor donor, FoodDto foodDto) throws IOException {
    public Food addFood(Donor donor, FoodDto foodDto, String imagePath) {

        // หา User (Donor) จาก email
        // User donorUser = userRepository.findByEmail(email)
        // .orElseThrow(() -> new RuntimeException("ไม่พบผู้ใช้"));

        // donorRepository.insertDonorIfNotExist(donorUser.getUserId());
        // Donor donor = donorService.getOrCreateDonor(donorUser.getUserId());

        // หา Category
        FoodCategory category = foodCategoryRepository.findById(foodDto.getFoodCateId())
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
        if (foodDto.getFoodStatus() != null && !foodDto.getFoodStatus().trim().isEmpty()) {
            food.setFoodStatus(foodDto.getFoodStatus());
        } else {
            food.setFoodStatus("available");
        }

        // จัดการรูปภาพ: บันทึกไฟล์ลง disk แล้วเก็บ path ลง DB
        // if (foodDto.getFoodImage() != null && !foodDto.getFoodImage().isEmpty()) {
        // String uploadDir = "uploads/food/";
        // String fileName = UUID.randomUUID() + "_" +
        // foodDto.getFoodImage().getOriginalFilename();
        // Path filePath = Paths.get(uploadDir, fileName);

        // Files.createDirectories(filePath.getParent());
        // Files.write(filePath, foodDto.getFoodImage().getBytes());

        // // เก็บ path ลง DB
        // food.setFoodImage("images/food/" + fileName);
        // }
        if (imagePath != null && !imagePath.isEmpty()) {
            food.setFoodImage(imagePath);
        }

        // set FK
        food.setFoodCategory(category);
        // food.setDonor(donor);
        // Donor donor = donorRepository.findById(donorUser.getUserId())
        // .orElseThrow(() -> new RuntimeException("เกิดข้อผิดพลาด: ไม่สามารถยืนยันตัวตน
        // Donor ได้"));
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
        System.out.println("Donor: " + donor.getUserId());
        System.out.println("===================");

        // บันทึกลง DB
        // foodRepository.save(food);
        Food savedFood = foodRepository.save(food);
        // Food savedFood = foodRepository.saveAndFlush(food);

        // สร้างการแจ้งเตือน
        // notificationService.createFoodNotification(savedFood);
        try {
            notificationService.createFoodNotification(savedFood);
        } catch (Exception e) {
            System.err.println("ไม่สามารถบันทึกการแจ้งเตือนได้: " + e.getMessage());
        }


        return savedFood;
    }

    // อัพเดทอาหาร
    // public Food updateFood(Food food) {
    // if (!foodRepository.existsById(food.getFoodId())) {
    // throw new RuntimeException("ไม่พบรายการอาหาร id=" + food.getFoodId());
    // }
    // return foodRepository.save(food);
    // }
    public Food updateFood(Integer id, FoodDto foodDto, String imagePath) {

        // ดึงข้อมูลอาหารจานเดิมขึ้นมาจากฐานข้อมูล
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ไม่พบรายการอาหารรหัส: " + id));

        // ค้นหาหมวดหมู่
        if (foodDto.getFoodCateId() != null) {
            Integer cateId = foodDto.getFoodCateId();
            FoodCategory category = foodCategoryRepository.findById(cateId)
                    .orElseThrow(() -> new IllegalArgumentException("ไม่พบหมวดหมู่รหัส: " + cateId));
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
        // food.setTotalUnit(foodDto.getTotalUnit());
        // food.setRemainingUnit(food.getRemainingUnit()); // ล็อกค่าเดิม
        // 1. จำค่าจำนวนเต็มเดิม (Old Total) และคำนวณหาจำนวนที่ถูกจองไปแล้ว (Reserved)
        int oldTotal = food.getTotalUnit() != null ? food.getTotalUnit() : 0;
        int currentRemaining = food.getRemainingUnit() != null ? food.getRemainingUnit() : 0;
        int reservedUnit = oldTotal - currentRemaining; // ยอดรวมที่มีคนจองไปแล้วทั้งหมด

        // 2. รับยอดจำนวนเต็มใหม่จาก DTO
        int newTotal = foodDto.getTotalUnit() != null ? foodDto.getTotalUnit() : 0;

        // 3. ตรวจสอบ Edge Case: ถ้าคนบริจาคปรับจำนวนรวมใหม่ น้อยกว่า
        // จำนวนที่มีคนจองไปแล้ว
        if (newTotal < reservedUnit) {
            throw new IllegalArgumentException("ไม่สามารถปรับลดจำนวนทั้งหมดเป็น " + newTotal + " ได้ " +
                    "เนื่องจากมีผู้จองอาหารรายการนี้ไปแล้ว " + reservedUnit);
        }

        // 4. คำนวณส่วนต่าง (Diff) ของจำนวนทั้งหมด
        int totalDifference = newTotal - oldTotal;

        // 5. อัปเดตสต็อกคงเหลือ (Remaining) อัตโนมัติด้วยส่วนต่าง
        // - ปรับเพิ่ม Total (diff เป็นบวก) -> ยอดของเหลือจะเพิ่มขึ้น
        // - ปรับลด Total (diff เป็นลบ) -> ยอดของเหลือจะลดลง
        int newRemaining = currentRemaining + totalDifference;

        // 6. บันทึกจำนวนลง Entity
        food.setTotalUnit(newTotal);
        food.setRemainingUnit(newRemaining);

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

        // จัดการรูปภาพ
        if (imagePath != null && !imagePath.isEmpty()) {
            // บันทึก Path รูปใบใหม่ทับใบเดิม
            food.setFoodImage(imagePath);
        }

        // บันทึกความเปลี่ยนแปลง
        System.out.println("=== Updating Food Entity ID: " + id);
        return foodRepository.save(food);
    }

    // ลบอาหาร
    public void deleteFood(Integer id) {
        if (!foodRepository.existsById(id)) {
            throw new IllegalArgumentException("ไม่พบรายการอาหาร id=" + id);
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

    // public List<Food> findFoodsByDonorEmail(String email) {
    // // ดึงข้อมูลจาก DB
    // return foodRepository.findByDonorEmail(email);
    // }
    public List<Food> findFoodsByDonorId(Integer id) {
        // ดึงข้อมูลจาก DB
        return foodRepository.findByDonorUserId(id);
    }

    public void updateFoodStatus(Integer foodId, String status) {
        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new RuntimeException("ไม่พบรายการอาหาร"));
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
