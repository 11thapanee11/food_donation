package com.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.springboot.model.*;

import java.time.LocalDateTime;
import java.util.*;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {
        // ดึงรายการจองทั้งหมดของ User (Recipient) คนนั้น ๆ โดยเรียงตามวันที่จองล่าสุด
        // List<Booking> findByRecipient_UserIdOrderByBookingDateDesc(String email);
        List<Booking> findByRecipient_UserIdOrderByBookingDateDesc(Integer userId);

        List<Booking> findByFood_FoodId(Integer foodId);

        // ค้นหาใบจองล่าสุดของอาหารชิ้นนี้ ที่สถานะยังรอการส่งมอบอยู่ (เงื่อนไขตรงตาม
        // Entity เป๊ะๆ)
        Optional<Booking> findByFoodFoodIdAndBookingStatus(Integer foodId,
                        String bookingStatus);

        // หาน้ำหนักรวมจาก Booking เฉพาะรายการที่เป็นของ Donor คนนี้ และสถานะเป็น
        // 'COMPLETE' เท่านั้น
        @Query("SELECT SUM(b.bookingQuantity) FROM Booking b " +
                        "WHERE b.food.donor.userId = :donorId AND b.bookingStatus = 'COMPLETED'")
        Double sumQuantityByDonorIdAndComplete(@Param("donorId") Integer donorId);

        // นับจำนวนครั้งการบริจาคที่สำเร็จจริง (Count แถวข้อมูลที่สถานะเป็น
        // 'COMPLETE')
        @Query("SELECT COUNT(b) FROM Booking b " +
                        "WHERE b.food.donor.userId = :donorId AND b.bookingStatus = 'COMPLETED'")
        // @Query("SELECT COUNT(b) FROM Booking b " +
        // "JOIN b.food f " +
        // "JOIN f.donor d " +
        // "WHERE d.userId = :donorId AND b.bookingStatus = 'COMPLETED'")
        int countCompleteBookingsByDonorId(@Param("donorId") Integer donorId);

        long countByBookingStatus(String status);

        boolean existsByRecipientUserIdAndFoodFoodIdAndBookingStatusIn(Integer recipientId, Integer foodId,
                        List<String> statuses);

        // @Query("SELECT COUNT(b) > 0 FROM Booking b " +
        // "WHERE b.recipient.userId = :recipientId " +
        // "AND b.food.foodId = :foodId " +
        // "AND b.bookingStatus IN :statuses")
        // boolean checkExistingBooking(@Param("recip

        // ค้นหาการจองที่มีสาถนะ pending และวันหมดอายุ
        List<Booking> findByBookingStatusAndFood_ExpiryDateBefore(String status, LocalDateTime time);

        @Query("SELECT SUM(b.bookingUnit) FROM Booking b WHERE b.bookingStatus = 'completed'")
        Double sumCompletedBookingUnits();

        @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.food.foodId = :foodId AND b.recipient.user.userId = :userId AND LOWER(b.bookingStatus) = 'completed'")
        boolean existsCompletedBooking(@Param("foodId") Integer foodId, @Param("userId") Integer userId);

        boolean existsByFood_FoodIdAndRecipient_UserId(Integer foodId, Integer userId);

        List<Booking> findByBookingStatusAndPickupDeadlineBefore(String bookingStatus, LocalDateTime dateTime);

        // ดึงรายการจองล่าสุด 5 รายการแรกมาทำ Live Feed
        @Query("SELECT b FROM Booking b ORDER BY b.bookingId DESC")
        List<Booking> findLatestBookings();

        @Query(value = "SELECT DATE_FORMAT(b.booking_date, '%e') as dayKey, " +
                        "COUNT(b.booking_id) as total, " +
                        "SUM(CASE WHEN b.booking_status = 'completed' THEN 1 ELSE 0 END) as completed " +
                        "FROM booking b " +
                        "WHERE DATE_FORMAT(b.booking_date, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m') " +
                        "GROUP BY DATE_FORMAT(b.booking_date, '%e') " +
                        "ORDER BY CAST(DATE_FORMAT(b.booking_date, '%e') AS UNSIGNED) ASC", nativeQuery = true)
        List<Object[]> getCurrentMonthDailyStatsRaw();

        List<Booking> findByFood_FoodIdIn(List<Integer> foodIds);
}
