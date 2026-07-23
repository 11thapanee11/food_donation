package com.springboot.scheduler;

import com.springboot.model.Food;
import com.springboot.repository.FoodRepository;
import com.springboot.service.NotificationService;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class FoodExpirationScheduler {

    private FoodRepository foodRepository;
    private NotificationService notificationService;

    public FoodExpirationScheduler(FoodRepository foodRepository, NotificationService notificationService) {
        this.foodRepository = foodRepository;
        this.notificationService = notificationService;
    }

    // @Scheduled(cron = "0 0 * * * *")
    @Scheduled(cron = "0 */30 * * * *")
    public void checkExpiration() {
        System.out.println("รอบการทำงาน Scheduler อัตโนมัติ (รายชั่วโมง): " + LocalDateTime.now());
        runExpiryCheck();
    }

    // รันทันทีที่สตาร์ทแอปพลิเคชันเสร็จ เผื่อกรณีข้ามรอบเที่ยงคืนมาตอนปิดเครื่อง
    @EventListener(ApplicationReadyEvent.class)
    public void checkExpiredFoodOnStartup() {
        System.out.println("ระบบสตาร์ทเครื่อง: ตรวจสอบสถานะอาหารย้อนหลัง...");
        runExpiryCheck(); // สั่งให้ไปทำงานที่ฟังก์ชันหลักเช่นกัน
    }

    // ฟังก์ชันหลักที่รวบรวม Logic ทั้งหมดไว้ที่เดียว
    private void runExpiryCheck() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusHours(24);
        LocalDateTime cutoffTime = now.plusHours(2);

        // จัดการอาหารที่หมดอายุแล้ว
        List<Food> expiredFoods = foodRepository.findByExpiryDateBeforeAndFoodStatus(cutoffTime, "available");
        System.out.println("ตรวจพบอาหารหมดอายุจำนวน: " + expiredFoods.size() + " รายการ");

        for (Food food : expiredFoods) {
            food.setFoodStatus("expired");
            foodRepository.save(food);

            notificationService.createExpirationNotification(
                    food,
                    "รายการอาหาร: " + food.getFoodName() + " หมดอายุ รายการนี้ถูกระงับการแสดงผลแล้ว",
                    "warning");
        }

        // จัดการอาหารที่ใกล้หมดอายุ ภายใน 24 ชม.
        List<Food> nearExpiryFoods = foodRepository.findByExpiryDateBetweenAndFoodStatus(cutoffTime, tomorrow, "available");
        System.out.println("ตรวจพบอาหารใกล้หมดอายุจำนวน: " + nearExpiryFoods.size() + " รายการ");

        for (Food food : nearExpiryFoods) {
            notificationService.createExpirationNotification(
                    food,
                    "รายการอาหาร: " + food.getFoodName() + " ใกล้จะหมดอายุในอีก 24 ชั่วโมง",
                    "info");
        }

        System.out.println("เสร็จสิ้นกระบวนการตรวจสอบอาหาร: " + LocalDateTime.now());
    }

}