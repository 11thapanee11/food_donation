package com.springboot.service;

import com.springboot.dto.ReportDto;
import com.springboot.model.*;
import com.springboot.repository.*;
import org.springframework.stereotype.Service;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final BookingRepository bookingRepository;
    // private final RecipientRepository recipientRepository;

    public ReportService(ReportRepository reportRepository, BookingRepository bookingRepository) {
        this.reportRepository = reportRepository;
        this.bookingRepository = bookingRepository;
        // this.recipientRepository = recipientRepository;
    }

    public void saveReport(ReportDto dto, String imagePath, Recipient recipient) {

        boolean exists = reportRepository.existsByBooking_BookingId(dto.getBookingId());
        if (exists) {
            throw new IllegalArgumentException("คุณได้ทำการรายงานปัญหานี้ไปแล้ว");
        }

        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลการจอง"));

        // Recipient recipient = recipientRepository.findById(dto.getRecipientId())
        // .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลผู้รับบริจาค"));

        Report report = new Report();

        report.setReportReason(dto.getReason());
        report.setReportDescription(dto.getDescription());
        report.setBooking(booking);
        report.setRecipient(recipient);
        report.setReportImage(imagePath);

        System.out.println("--- DEBUG START ---");
        System.out.println("Reason: " + dto.getReason());
        System.out.println("Description: " + dto.getDescription());
        System.out.println("BookingID: " + dto.getBookingId());
        System.out.println("RecipientID: " + recipient.getUserId());
        System.out.println("ImagePath: " + imagePath);
        System.out.println("--- DEBUG END ---");

        // บันทึกลงตาราง report
        reportRepository.save(report);
    }

    public boolean checkReport(Integer bookingId) {
        return reportRepository.existsByBooking_BookingId(bookingId);
    }
}
