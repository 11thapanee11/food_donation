package com.springboot.repository;

import com.springboot.model.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Integer> {

    // ดึงอาหารตามหมวดหมู่
    List<Food> findByFoodCategory_FoodCateId(Integer foodCateId);

    // ดึงอาหารตามสถานะ
    List<Food> findByFoodStatus(String foodStatus);

    // ดึงอาหารตามผู้ใช้
    List<Food> findByDonorEmail(String email);
}
