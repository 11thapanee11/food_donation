package com.springboot.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "impact_log")
public class ImpactLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "impact_log_id")
    private Integer impactLogId;

    @Column(name = "carbon_reduction_amount", nullable = false)
    private Double carbonReductionAmount;

    @Column(name = "create_at", nullable = false)
    private LocalDate createAt;

    @OneToOne
    @JoinColumn(name = "booking_booking_id", nullable = false, unique = true)
    private Booking booking;

    public ImpactLog() {
    }

    public ImpactLog(Double carbonReductionAmount, LocalDate createAt, Booking booking) {
        this.carbonReductionAmount = carbonReductionAmount;
        this.createAt = createAt;
        this.booking = booking;
    }

    public Integer getImpactLogId() {
        return impactLogId;
    }

    public void setImpactLogId(Integer impactLogId) {
        this.impactLogId = impactLogId;
    }

    public Double getCarbonReductionAmount() {
        return carbonReductionAmount;
    }

    public void setCarbonReductionAmount(Double carbonReductionAmount) {
        this.carbonReductionAmount = carbonReductionAmount;
    }

    public LocalDate getCreateAt() {
        return createAt;
    }

    public void setCreateAt(LocalDate createAt) {
        this.createAt = createAt;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }
}
