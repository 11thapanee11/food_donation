package com.springboot.repository;

import com.springboot.model.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Integer> {

    // ค้นหาอาหารทั้งหมด ยกเว้นของ Email นี้
    List<Food> findByDonor_EmailNot(String email);

    // ดึงอาหารตามหมวดหมู่
    List<Food> findByFoodCategory_FoodCateId(Integer foodCateId);

    // ค้นหาอาหารตามหมวดหมู่ ยกเว้นของ Email นี้
    List<Food> findByFoodCategory_FoodCateIdAndDonor_EmailNot(Integer categoryId, String email);

    // ดึงอาหารตามสถานะ
    List<Food> findByFoodStatus(String foodStatus);

    // ดึงอาหารตามผู้ใช้
    List<Food> findByDonorEmail(String email);
}
