package com.springboot.repository;

import org.springframework.stereotype.Repository;
import com.springboot.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    // ดึงเฉพาะแจ้งเตือนตามประเภท และเรียงจากใหม่ไปเก่า
    List<Notification> findByNotificationTypeOrderByNotificationDateDesc(String notificationType);

    // ดึงเฉพาะแจ้งเตือนตามประเภท
    List<Notification> findByNotificationType(String notificationType);

    // ดึงเฉพาะแจ้งเตือนการจอง (สำหรับผู้บริจาค) เรียงจากใหม่ไปเก่า
    @Query("""
            SELECT n FROM Notification n
            JOIN n.food f
            WHERE f.donor.userId = :userId
            AND n.notificationType IN :types
            ORDER BY n.notificationDate DESC
            """)
    List<Notification> findBookingsByDonorIdAndTypes(
            @Param("userId") Integer userId,
            @Param("types") List<String> types);

    boolean existsByFoodAndNotificationType(Food food, String type);
}
