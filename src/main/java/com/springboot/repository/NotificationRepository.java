package com.springboot.repository;

import org.springframework.stereotype.Repository;
import com.springboot.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // List<Notification> findByRecipientIdAndIsReadFalse(Long userId);

    // 6371 = รัศมีโลก (กิโลเมตร)
    // ใช้ acos + cos + sin → Haversine formula
    // :latitude, :longitude = พิกัดของ Food
    // :radiusKm = ระยะทางที่ต้องการค้นหา (เช่น 5.0 กม.)
    // @Query(value = "SELECT u.* FROM user u " +
    //         "WHERE (6371 * acos(cos(radians(:latitude)) * cos(radians(u.latitude)) " +
    //         "* cos(radians(u.longitude) - radians(:longitude)) + sin(radians(:latitude)) " +
    //         "* sin(radians(u.latitude)))) <= :radiusKm", nativeQuery = true)
    // List<User> findUsersNearby(@Param("latitude") Double latitude,
    //         @Param("longitude") Double longitude,
    //         @Param("radiusKm") double radiusKm);

    List<Notification> findByIsReadFalse();
}
