package com.springboot.repository;

import com.springboot.model.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Integer> {

    // ค้นหาอาหารทั้งหมด ยกเว้นของ Email นี้
    // List<Food> findByDonor_EmailNot(String email);
    // List<Food> findByDonor_UserIdNot(Integer id);

    // ดึงอาหารตามหมวดหมู่
    List<Food> findByFoodCategory_FoodCateId(Integer foodCateId);

    // ค้นหาอาหารตามหมวดหมู่ ยกเว้นของ Email นี้
    // List<Food> findByFoodCategory_FoodCateIdAndDonor_EmailNot(Integer categoryId,
    // String email);
    // List<Food> findByFoodCategory_FoodCateIdAndDonor_UserIdNot(Integer
    // categoryId, Integer id);

    // ดึงอาหารตามสถานะ
    List<Food> findByFoodStatus(String foodStatus);

    // ดึงอาหารตามผู้ใช้
    // List<Food> findByDonorEmail(String email);
    List<Food> findByDonorUserId(Integer id);

    // ดึงอาหารที่อยู่ใกล้
    @Query(value = "SELECT *, (6371 * acos(cos(radians(:lat)) * cos(radians(food_lat)) * cos(radians(food_lng) - radians(:lng)) + sin(radians(:lat)) * sin(radians(food_lat)))) AS distance "
            +
            "FROM food HAVING distance <= :radius ORDER BY distance", nativeQuery = true)
    List<Food> findNearbyFoods(@Param("lat") double lat, @Param("lng") double lng, @Param("radius") double radius);
}
