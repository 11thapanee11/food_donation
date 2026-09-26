package com.springboot.repository;

import com.springboot.model.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Integer> {

    // ดึงอาหารตามหมวดหมู่
    List<Food> findByFoodCategory_FoodCateId(Integer foodCateId);

    // ดึงอาหารตามสถานะ
    List<Food> findByFoodStatus(String foodStatus);

    // ดึงอาหารตามผู้ใช้
    List<Food> findByDonorUserId(Integer id);

    // ดึงอาหารที่อยู่ใกล้
    @Query(value = "SELECT *, (6371 * acos(cos(radians(:lat)) * cos(radians(food_lat)) * cos(radians(food_lng) - radians(:lng)) + sin(radians(:lat)) * sin(radians(food_lat)))) AS distance "
            +
            "FROM food HAVING distance <= :radius ORDER BY distance", nativeQuery = true)
    List<Food> findNearbyFoods(@Param("lat") double lat, @Param("lng") double lng, @Param("radius") double radius);

    long countByFoodStatus(String status);

    // ดึงอาหารที่วันหมดอายุน้อยกว่าหรือเท่ากับวันนี้ (หมดอายุแล้ว)
    List<Food> findByExpiryDateBeforeAndFoodStatus(LocalDateTime now, String status);
    
    // ดึงอาหารที่ใกล้หมดอายุ (เช่น ภายใน 24 ชั่วโมง)
    List<Food> findByExpiryDateBetweenAndFoodStatus(LocalDateTime start, LocalDateTime end, String status);

    Long countByFoodCategory_FoodCateId(Integer foodCateId);

}
