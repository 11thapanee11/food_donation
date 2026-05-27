package com.springboot.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.springboot.model.*;
import com.springboot.repository.*;
import com.springboot.dto.*;

import java.util.*;

@Service
public class BookingService {
    private final FoodRepository foodRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public BookingService(FoodRepository foodRepository, BookingRepository bookingRepository,
            UserRepository userRepository, NotificationService notificationService) {
        this.foodRepository = foodRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public Booking addBooking(BookingDto request, String email) {
        // 1. หา User (Recipient) จาก email ของคนที่กำลังล็อกอินเข้ามาจอง
        User recipient = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("ไม่พบผู้ใช้"));

        // 2. หาอาหาร (Food) ที่ต้องการจองจากไอดีที่ส่งเข้ามา
        Food food = foodRepository.findById(request.getFoodId())
                .orElseThrow(() -> new RuntimeException("ไม่พบรายการอาหาร"));

        // 🛠️ ตรวจสอบเงื่อนไขว่าอาหารเหลือพอกับจำนวนที่กรอกไหม (อิงตามชื่อฟิลด์
        // remainingUnit จาก addFood)
        if (food.getRemainingUnit() < request.getQuantity()) {
            throw new IllegalArgumentException("ขออภัย จำนวนอาหารที่เหลือไม่เพียงพอสำหรับการจอง");
        }

        // 3. หักลบจำนวนอาหารคงเหลือในตาราง Food
        food.setRemainingUnit(food.getRemainingUnit() - request.getQuantity());
        foodRepository.save(food);

        // 🔑 สุ่มรหัสยืนยันการรับอาหาร 6 หลักที่เป็น "ตัวเลข (Integer)" ตามที่ประกาศใน
        // Entity
        Integer generatedCode = generateConfirmationCode();

        // 4. คำนวณน้ำหนักรวมของล็อตที่จอง (จำนวนชิ้นที่จอง x
        // น้ำหนักต่อหน่วยของอาหารนั้น)
        // สมมติชื่อฟิลด์น้ำหนักต่อหน่วยใน Food คือ unitWeightKg
        Double totalWeight = food.getUnitWeightKg() * request.getQuantity();

        // 5. สร้าง Booking entity และผูกค่าตามฟิลด์จริงของคุณเป๊ะๆ
        Booking booking = new Booking();
        booking.setBookingUnit(request.getQuantity()); // แมตช์กับ bookingUnit
        booking.setBookingWeightKg(totalWeight); // แมตช์กับ bookingWeightKg
        booking.setBookingDate(LocalDateTime.now()); // บันทึกเวลาที่กดจอง ณ ปัจจุบัน
        booking.setConfirmationCode(generatedCode); // แมตช์กับ confirmationCode

        // if (request.getBookingStatus() != null) {
        // booking.setBookingStatus(request.getBookingStatus());
        // } else {
        // booking.setBookingStatus("PENDING"); // สถานะเริ่มต้น: รอรับอาหาร
        // }
        booking.setBookingStatus("PENDING");

        // set FK เชื่อมความสัมพันธ์ตามที่คุณดีไซน์ไว้
        booking.setFood(food);
        booking.setRecipient(recipient); // ใช้ชื่อ recipient ตามแอนโนเทชัน @ManyToOne ของคุณ

        // print ค่าออก console เพื่อดูความถูกต้องสไตล์เดิมของคุณ
        // System.out.println("=== Booking Entity (Updated) ===");
        // System.out.println("Food Name: " + food.getFoodName());
        // System.out.println("Booking Unit: " + booking.getBookingUnit() + " ชิ้น");
        // System.out.println("Booking Weight: " + booking.getBookingWeightKg() + "
        // kg");
        // System.out.println("Booking Date: " + booking.getBookingDate());
        // System.out.println("Confirmation Code: " + booking.getConfirmationCode());
        // System.out.println("Booking Status: " + booking.getBookingStatus());
        // System.out.println("Recipient (User): " + recipient.getEmail());
        // System.out.println("================================");

        // 6. บันทึกลง DB
        Booking savedBooking = bookingRepository.save(booking);

        // 7. สร้างการแจ้งเตือน
        notificationService.createBookingNotification(savedBooking);

        return savedBooking;
    }

    private static final Random random = new Random();

    private Integer generateConfirmationCode() {
        // สุ่มตัวเลขตั้งแต่ 0 ถึง 899,999 แล้วบวก 100,000 เพื่อล็อกให้ได้เลข 6 หลัก
        // (100000 - 999999)เสมอ
        return random.nextInt(900000) + 100000;
    }

    public List<Booking> getListBooking(String email) {
        return bookingRepository.findByRecipient_EmailOrderByBookingDateDesc(email);
    }
}
