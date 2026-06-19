package com.springboot.service;

import com.springboot.dto.ReportDto;
import com.springboot.model.*;
import com.springboot.repository.*;
import java.util.*;

import java.util.stream.Collectors;

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

    public List<ReportDto> getAllReports() {
        return reportRepository.findAll().stream().map(r -> {
            ReportDto dto = new ReportDto();
            dto.setReportId(r.getReportId());
            dto.setReason(r.getReportReason());
            dto.setFoodName(r.getBooking().getFood().getFoodName());
            dto.setReporterName(r.getBooking().getRecipient().getUser().getFirstName() + " "
                    + r.getBooking().getRecipient().getUser().getLastName());
            dto.setReportDate(r.getReportDate());
            dto.setReportStatus(r.getReportStatus());
            return dto;
        }).toList();
    }

    public ReportDto getReportById(Integer id) {
        // ค้นหา Report หากไม่เจอให้โยน Exception
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบรายงานปัญหา ID: " + id));

        // แปลง Entity เป็น DTO
        ReportDto dto = new ReportDto();
        dto.setReportId(report.getReportId());
        dto.setReason(report.getReportReason());
        dto.setDescription(report.getReportDescription());
        dto.setReportDate(report.getReportDate());
        dto.setReportImage(report.getReportImage());
        dto.setReportStatus(report.getReportStatus());

        if (report.getBooking().getFood() != null) {
            dto.setBookingId(report.getBooking().getBookingId());
            dto.setFoodId(report.getBooking().getFood().getFoodId());
            dto.setFoodName(report.getBooking().getFood().getFoodName());
            dto.setReporterName(report.getBooking().getRecipient().getUser().getFirstName() + " " + report.getBooking().getRecipient().getUser().getLastName());
            dto.setDonorStatus(report.getBooking().getFood().getDonor().getDonorStatus());
        }

        return dto;
    }

    public void updateReportStatus(Integer id, String newStatus) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลรายงาน"));

        report.setReportStatus(newStatus);
        reportRepository.save(report);
    }
}
