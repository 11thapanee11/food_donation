package com.springboot.service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.eclipse.jdt.internal.compiler.ast.Receiver;
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
    private final RecipientRepository recipientRepository;
    private final NotificationService notificationService;
    private final ImpactLogService impactLogService;

    public BookingService(FoodRepository foodRepository, BookingRepository bookingRepository,
            UserRepository userRepository, RecipientRepository recipientRepository,
            NotificationService notificationService, ImpactLogService impactLogService) {
        this.foodRepository = foodRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.recipientRepository = recipientRepository;
        this.notificationService = notificationService;
        this.impactLogService = impactLogService;
    }

    public Booking addBooking(BookingDto request, Recipient recipient) {
        // 1. หา User (Recipient) จาก email ของคนที่กำลังล็อกอินเข้ามาจอง
        // User recipientUser = userRepository.findByEmail(email)
        // .orElseThrow(() -> new RuntimeException("ไม่พบผู้ใช้"));

        // recipientRepository.insertRecipientIfNotExist(recipientUser.getUserId());

        System.out.println("DEBUG: ค่า foodId ที่ได้รับจาก DTO คือ: " + request.getFoodId());

        if (request.getFoodId() == null) {
            throw new RuntimeException("ERROR: foodId เป็น null จริงๆ ด้วย! เช็ค React ด่วน");
        }

        // 2. หาอาหาร (Food) ที่ต้องการจองจากไอดีที่ส่งเข้ามา
        Food food = foodRepository.findById(request.getFoodId())
                .orElseThrow(() -> new RuntimeException("ไม่พบรายการอาหาร"));

        // ตรวจสอบเงื่อนไขว่าอาหารเหลือพอกับจำนวนที่กรอกไหม (อิงตามชื่อฟิลด์
        // remainingUnit จาก addFood)
        if (food.getRemainingUnit() < request.getQuantity()) {
            throw new IllegalArgumentException("ขออภัย จำนวนอาหารที่เหลือไม่เพียงพอสำหรับการจอง");
        }

        // 3. หักลบจำนวนอาหารคงเหลือในตาราง Food
        food.setRemainingUnit(food.getRemainingUnit() - request.getQuantity());
        foodRepository.save(food);

        // สุ่มรหัสยืนยันการรับอาหาร 6 หลักที่เป็น "ตัวเลข (Integer)" ตามที่ประกาศใน
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
        booking.setBookingStatus("pending");

        // set FK เชื่อมความสัมพันธ์ตามที่คุณดีไซน์ไว้
        booking.setFood(food);

        // Recipient recipient =
        // recipientRepository.findById(recipientUser.getUserId()).orElse(null);
        booking.setRecipient(recipient);

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

    public List<Booking> getListBooking(Integer id) {
        return bookingRepository.findByRecipient_UserIdOrderByBookingDateDesc(id);
    }

    public Booking getBookingDetail(Integer bookingId) {
        System.out.println("กำลังค้นหาใบจอง ID: " + bookingId);

        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลรายละเอียดการจองรหัส: " + bookingId));
    }

    public void cancelBooking(Integer bookingId) {
        System.out.println("กำลังอัปเดตสถานะยกเลิกใบจอง ID: " + bookingId);

        // 1. ค้นหาใบจองเดิมก่อน
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลการจองรหัส: " + bookingId));

        // 2. อัปเดตสถานะเป็น CANCELLED
        booking.setBookingStatus("cancelled");

        // 3. เซฟการเปลี่ยนแปลงกลับลงฐานข้อมูล
        Booking savedBooking = bookingRepository.save(booking);

        notificationService.createCancelBookingNotification(savedBooking);

        // คืนจำนวนอาหารกลับเข้าคลัง
        Food food = booking.getFood();
        food.setRemainingUnit(food.getRemainingUnit() + booking.getBookingUnit());
        foodRepository.save(food);
    }

    public Booking verifyConfirmCodeByFoodId(Integer foodId, String verificationCode) {
        // ค้นหาใบจองล่าสุดของอาหารนี้ ที่สถานะเป็น "PENDING"
        // (หรือสถานะรอส่งมอบที่คุณกำหนดไว้ในระบบ)
        Booking booking = bookingRepository
                .findFirstByFoodFoodIdAndBookingStatusOrderByBookingDateDesc(foodId, "pending")
                .orElseThrow(() -> new IllegalArgumentException(
                        "ไม่พบรายการจองที่อยู่ระหว่างรอดำเนินการสำหรับอาหารชิ้นนี้"));

        // แปลงรหัสที่รับมาจากหน้าบ้าน (String) ให้เป็น Integer
        // เพื่อให้ตรงกับชนิดข้อมูลของ confirmationCode
        Integer codeAsInt;
        try {
            codeAsInt = Integer.parseInt(verificationCode);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("รูปแบบรหัสยืนยันไม่ถูกต้อง ต้องเป็นตัวเลขเท่านั้น");
        }

        // ตรวจสอบรหัสยืนยัน
        if (!codeAsInt.equals(booking.getConfirmationCode())) {
            throw new IllegalArgumentException("รหัสยืนยันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
        }

        // อัปเดตสถานะใบจองเป็นส่งมอบสำเร็จ
        booking.setBookingStatus("completed");

        double carbonSaved = impactLogService.calculateCarbonSaved(booking);
        impactLogService.saveImpactLog(booking, carbonSaved);

        // บันทึกการเปลี่ยนแปลงกลับลงฐานข้อมูล
        return bookingRepository.save(booking);
    }
}
