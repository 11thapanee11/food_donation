package com.springboot.repository;

import org.springframework.stereotype.Repository;
import com.springboot.model.*;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Repository
public interface DonorRepository extends JpaRepository<Donor, Integer> {

    // - ถ้าตาราง donor ยังไม่มี id นี้ -> มันจะ INSERT สร้างแถวใหม่ให้สถานะเป็น ACTIVE และใส่ยอดคาร์บอนเริ่มต้นให้
    // - ถ้าตาราง donor มี id นี้อยู่แล้ว -> มันจะวิ่งไป UPDATE บวกยอดคาร์บอนสะสมเพิ่มเข้าไปให้ทันที!
    // @Modifying
    // @Transactional
    // @Query(value = "INSERT INTO donor (user_id, donor_status, total_impact_amount) " +
    //         "VALUES (:userId, 'ACTIVE', :carbonReduction) " +
    //         "ON DUPLICATE KEY UPDATE total_impact_amount = COALESCE(total_impact_amount, 0.0) + :carbonReduction", nativeQuery = true)
    // void saveOrUpdateDonorImpact(@Param("userId") Integer userId, @Param("carbonReduction") double carbonReduction);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO donor (user_id, donor_status, total_impact_amount) VALUES (:userId, 'ACTIVE', 0.0) ON DUPLICATE KEY UPDATE user_id = user_id", nativeQuery = true)
    void insertDonorIfNotExist(@Param("userId") Integer userId);

    // ดึง Donor เรียงตามค่าพลังงานที่ลดได้ (มากไปน้อย)
    List<Donor> findAllByOrderByTotalImpactAmountDesc();

    @Query("SELECT d FROM Donor d JOIN User u ON d.userId = u.userId")
    List<Donor> findAllDonors();

}
