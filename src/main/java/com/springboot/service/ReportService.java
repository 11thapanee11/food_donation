package com.springboot.service;

import com.springboot.dto.ReportDto;
import com.springboot.exception.ApplicationException;
import com.springboot.model.*;
import com.springboot.repository.*;
import java.util.*;

import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
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
            throw new ApplicationException("คุณได้ทำการรายงานปัญหานี้ไปแล้ว", HttpStatus.BAD_REQUEST);
        }

        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new ApplicationException("ไม่พบข้อมูลการจอง", HttpStatus.NOT_FOUND));

        Report report = new Report();

        report.setReportReason(dto.getReason());
        report.setReportDescription(dto.getDescription());
        report.setBooking(booking);
        report.setRecipient(recipient);
        report.setReportImage(imagePath);

        try {
            reportRepository.save(report);
        } catch (Exception e) {
            throw new ApplicationException("ไม่สามารถบันทึกการแจ้งปัญหาได้", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public boolean checkReport(Integer bookingId) {
        return reportRepository.existsByBooking_BookingId(bookingId);
    }

    public List<ReportDto> getAllReports() {
        return reportRepository.findAll().stream()
        // รียงลำดับจากใหม่ล่าสุด
        .sorted(Comparator.comparing(Report::getReportDate).reversed())
        .map(r -> {
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
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ApplicationException("ไม่พบรายงานปัญหา ID: " + id, HttpStatus.NOT_FOUND));

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
                .orElseThrow(() -> new ApplicationException("ไม่พบข้อมูลรายงาน", HttpStatus.NOT_FOUND));

        report.setReportStatus(newStatus);
        reportRepository.save(report);
    }
}
