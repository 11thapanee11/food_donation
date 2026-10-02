package com.springboot.scheduler;

import com.springboot.model.Food;
import com.springboot.service.*;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class FoodExpirationScheduler {
    private static final Logger log = LoggerFactory.getLogger(FoodExpirationScheduler.class);

    private FoodService foodService;
    private NotificationService notificationService;

    public FoodExpirationScheduler(FoodService foodService, NotificationService notificationService) {
        this.foodService = foodService;
        this.notificationService = notificationService;
    }

    // @Scheduled(cron = "0 0 * * * *")
    @Scheduled(cron = "0 */30 * * * *")
    public void checkExpiration() {
        log.info("รอบการทำงาน Scheduler อัตโนมัติ (ทุก 30 นาที): {}", LocalDateTime.now());
        runExpiryCheck();
    }

    // รันทันทีที่สตาร์ทแอปพลิเคชันเสร็จ เผื่อกรณีข้ามรอบเที่ยงคืนมาตอนปิดเครื่อง
    @EventListener(ApplicationReadyEvent.class)
    public void checkExpiredFoodOnStartup() {
        log.info("ระบบสตาร์ทเครื่อง: ตรวจสอบสถานะอาหารย้อนหลัง...");
        runExpiryCheck(); // สั่งให้ไปทำงานที่ฟังก์ชันหลักเช่นกัน
    }

    // ฟังก์ชันหลักที่รวบรวม Logic ทั้งหมดไว้ที่เดียว
    private void runExpiryCheck() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusHours(24);
        LocalDateTime cutoffTime = now.plusHours(2);

        // จัดการอาหารที่หมดอายุแล้ว
        List<Food> expiredFoods = foodService.getExpiredFoods(cutoffTime);
        log.info("ตรวจพบอาหารหมดอายุจำนวน: {} รายการ", expiredFoods.size());

        for (Food food : expiredFoods) {
            foodService.updateFoodStatus(food.getFoodId(), "expired");

            notificationService.createExpirationNotification(
                    food,
                    "รายการอาหาร: " + food.getFoodName() + " หมดอายุ รายการนี้ถูกระงับการแสดงผลแล้ว",
                    "warning");
        }

        // จัดการอาหารที่ใกล้หมดอายุ ภายใน 24 ชม.
        List<Food> nearExpiryFoods = foodService.getNearExpiryFoods(cutoffTime, tomorrow);
        log.info("ตรวจพบอาหารใกล้หมดอายุจำนวน: {} รายการ", nearExpiryFoods.size());

        for (Food food : nearExpiryFoods) {
            notificationService.createExpirationNotification(
                    food,
                    "รายการอาหาร: " + food.getFoodName() + " ใกล้จะหมดอายุในอีก 24 ชั่วโมง",
                    "info");
        }

        log.info("เสร็จสิ้นกระบวนการตรวจสอบอาหาร: {}", LocalDateTime.now());
    }

}