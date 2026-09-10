package com.springboot.service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.eclipse.jdt.internal.compiler.ast.Receiver;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.springboot.model.*;
import com.springboot.repository.*;
import com.springboot.dto.*;
import com.springboot.exception.ApplicationException;

import java.util.*;
import java.util.stream.Collectors;

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
        if (request.getFoodId() == null) {
            throw new ApplicationException("foodId เป็นค่าว่าง ไม่สามารถทำการจองได้", HttpStatus.BAD_REQUEST);
        }

        Food food = foodRepository.findById(request.getFoodId())
                .orElseThrow(() -> new ApplicationException("ไม่พบรายการอาหาร", HttpStatus.NOT_FOUND));

        if (food.getRemainingUnit() < request.getQuantity()) {
            throw new ApplicationException("จำนวนอาหารที่เหลือไม่เพียงพอสำหรับการจอง", HttpStatus.BAD_REQUEST);
        }

        food.setRemainingUnit(food.getRemainingUnit() - request.getQuantity());
        foodRepository.save(food);

        Integer generatedCode = generateConfirmationCode();
        Double totalWeight = food.getUnitWeightKg() * request.getQuantity();

        Booking booking = new Booking();
        booking.setBookingUnit(request.getQuantity());
        booking.setBookingWeightKg(totalWeight);
        booking.setBookingDate(LocalDateTime.now());
        booking.setConfirmationCode(generatedCode);
        booking.setBookingStatus("pending");
        booking.setFood(food);
        booking.setRecipient(recipient);

        Booking savedBooking = bookingRepository.save(booking);
        notificationService.createBookingNotification(savedBooking);

        return savedBooking;
    }

    private static final Random random = new Random();

    private Integer generateConfirmationCode() {
        // สุ่มตัวเลขตั้งแต่ 0 ถึง 899,999 แล้วบวก 100,000 เพื่อล็อกให้ได้เลข 6 หลัก
        // (100000 - 999999)เสมอ
        return random.nextInt(900000) + 100000;
    }

    public List<BookingDto> getListBooking(Integer id) {
        List<Booking> bookings = bookingRepository.findByRecipient_UserIdOrderByBookingDateDesc(id);
        if (bookings.isEmpty()) {
            throw new ApplicationException("ไม่พบข้อมูลการจอง", HttpStatus.NOT_FOUND);
        }

        return bookings.stream()
                .map(booking -> {
                    BookingDto dto = new BookingDto();
                    dto.setBookingId(booking.getBookingId());
                    dto.setBookingUnit(booking.getBookingUnit());
                    dto.setBookingWeightKg(booking.getBookingWeightKg());
                    dto.setBookingDate(booking.getBookingDate());
                    dto.setConfirmationCode(booking.getConfirmationCode());
                    dto.setBookingStatus(booking.getBookingStatus());
                    dto.setFoodId(booking.getFood().getFoodId());
                    return dto;
                })
                .toList();
    }

    public BookingDto getBookingDetail(Integer bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApplicationException("ไม่พบข้อมูลรายละเอียดการจองรหัส: " + bookingId,
                        HttpStatus.NOT_FOUND));

        BookingDto dto = new BookingDto();
        dto.setBookingId(booking.getBookingId());
        dto.setBookingUnit(booking.getBookingUnit());
        dto.setBookingWeightKg(booking.getBookingWeightKg());
        dto.setBookingDate(booking.getBookingDate());
        dto.setConfirmationCode(booking.getConfirmationCode());
        dto.setBookingStatus(booking.getBookingStatus());

        if (booking.getFood() != null) {
            dto.setFoodId(booking.getFood().getFoodId());
        }

        return dto;
    }

    public void cancelBooking(Integer bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(
                        () -> new ApplicationException("ไม่พบข้อมูลการจองรหัส: " + bookingId, HttpStatus.NOT_FOUND));

        booking.setBookingStatus("cancelled");
        Booking savedBooking = bookingRepository.save(booking);

        try {
            notificationService.createCancelBookingNotification(savedBooking);
        } catch (Exception e) {
            throw new ApplicationException("ไม่สามารถสร้างการแจ้งเตือนการยกเลิกได้", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        Food food = booking.getFood();
        food.setRemainingUnit(food.getRemainingUnit() + booking.getBookingUnit());
        foodRepository.save(food);
    }

    public Booking verifyConfirmCodeByFoodId(Integer foodId, String verificationCode) {
        Booking booking = bookingRepository
                .findByFoodFoodIdAndBookingStatus(foodId, "pending")
                .orElseThrow(() -> new ApplicationException("ไม่พบรายการจองที่อยู่ระหว่างรอดำเนินการสำหรับอาหารชิ้นนี้", HttpStatus.NOT_FOUND));

        Integer codeAsInt;
        try {
            codeAsInt = Integer.parseInt(verificationCode);
        } catch (NumberFormatException e) {
            throw new ApplicationException("รูปแบบรหัสยืนยันไม่ถูกต้อง ต้องเป็นตัวเลขเท่านั้น", HttpStatus.BAD_REQUEST);
        }

        if (!codeAsInt.equals(booking.getConfirmationCode())) {
            throw new ApplicationException("รหัสยืนยันไม่ถูกต้อง", HttpStatus.BAD_REQUEST);
        }

        booking.setBookingStatus("completed");

        double carbonSaved = impactLogService.calculateCarbonSaved(booking);
        impactLogService.saveImpactLog(booking, carbonSaved);

        return bookingRepository.save(booking);
    }

    public boolean checkUserBooking(Recipient recipient, Integer foodId, List<String> statuses) {
        return bookingRepository.existsByRecipientUserIdAndFoodFoodIdAndBookingStatusIn(
                recipient.getUserId(), foodId, statuses);
    }

}
