package com.springboot.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "report")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Integer reportId;

    @Column(name = "report_reason", nullable = false, length = 50)
    private String reportReason;

    @Column(name = "report_description", nullable = false, length = 100)
    private String reportDescription;

    @Column(name = "report_image", length = 255)
    private String reportImage;

    @Column(name = "report_date", nullable = false)
    private LocalDateTime reportDate = LocalDateTime.now();

    @Column(name = "report_status", nullable = false)
    private String reportStatus = "pending";

    @OneToOne
    @JoinColumn(name = "booking_booking_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Booking booking;

    @ManyToOne
    @JoinColumn(name = "recipient_user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Recipient recipient;

    public Report() {
        super();
    }

    public Integer getReportId() {
        return reportId;
    }

    public void setReportId(Integer reportId) {
        this.reportId = reportId;
    }

    public String getReportReason() {
        return reportReason;
    }

    public void setReportReason(String reportReason) {
        this.reportReason = reportReason;
    }

    public String getReportDescription() {
        return reportDescription;
    }

    public void setReportDescription(String reportDescription) {
        this.reportDescription = reportDescription;
    }

    public String getReportImage() {
        return reportImage;
    }

    public void setReportImage(String reportImage) {
        this.reportImage = reportImage;
    }

    public LocalDateTime getReportDate() {
        return reportDate;
    }

    public void setReportDate(LocalDateTime reportDate) {
        this.reportDate = reportDate;
    }

    public String getReportStatus() {
        return reportStatus;
    }

    public void setReportStatus(String reportStatus) {
        this.reportStatus = reportStatus;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public Recipient getRecipient() {
        return recipient;
    }

    public void setRecipient(Recipient recipient) {
        this.recipient = recipient;
    }

    
}
