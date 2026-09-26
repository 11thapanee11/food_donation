package com.springboot.scheduler;

import java.time.LocalDateTime;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.springboot.model.*;
import com.springboot.repository.BookingRepository;
import com.springboot.repository.FoodRepository;
import java.util.List;

@Component
public class BookingScheduler {

    private static final Logger log = LoggerFactory.getLogger(BookingScheduler.class);

    private FoodRepository foodRepository;
    private BookingRepository bookingRepository;

    public BookingScheduler(FoodRepository foodRepository, BookingRepository bookingRepository) {
        this.foodRepository = foodRepository;
        this.bookingRepository = bookingRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void checkExpiredFoodBookingOnStartup() {
        log.info("ระบบสตาร์ทเครื่อง: ตรวจสอบสถานะการจองอาหารย้อนหลัง...");
        clearExpiredFoodBookings(); // สั่งให้ไปทำงานที่ฟังก์ชันหลักเช่นกัน
    }

    @Scheduled(cron = "0 */5 * * * *")
    public void clearExpiredFoodBookings() {
        LocalDateTime now = LocalDateTime.now();

        List<Booking> stuckBookings = bookingRepository.findByBookingStatusAndFood_ExpiryDateBefore("pending", now);

        if (!stuckBookings.isEmpty()) {
            for (Booking booking : stuckBookings) {
                booking.setBookingStatus("cancelled");
                bookingRepository.save(booking);

                Food food = booking.getFood();
                if (food != null) {
                    food.setRemainingQuantity(food.getRemainingQuantity() + booking.getBookingUnit());
                    foodRepository.save(food);
                }
            }
            log.info("เคลียร์รายการจองที่อาหารหมดอายุไปแล้วจำนวน: {} รายการ", stuckBookings.size());
        }
    }
}
