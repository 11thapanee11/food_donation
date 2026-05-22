package com.springboot.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Integer bookingId;

    @Column(name = "booking_unit", nullable = false)
    private Integer bookingUnit;

    @Column(name = "booking_weight_kg", nullable = false)
    private Double bookingWeightKg;

    @Column(name = "booking_date", nullable = false)
    private LocalDateTime bookingDate;

    @Column(name = "confirmation_code", nullable = false, length = 6)
    private Integer confirmationCode;

    @Column(name = "booking_status", nullable = false, length = 45)
    private String bookingStatus;

    // FK ไปยัง Food
    @ManyToOne
    @JoinColumn(name = "food_food_id", nullable = false)
    private Food food;

    // FK ไปยัง Recipient (User)
    @ManyToOne
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private User recipient;

    public Integer getBookingId() {
        return bookingId;
    }

    public void setBookingId(Integer bookingId) {
        this.bookingId = bookingId;
    }

    public Integer getBookingUnit() {
        return bookingUnit;
    }

    public void setBookingUnit(Integer bookingUnit) {
        this.bookingUnit = bookingUnit;
    }

    public Double getBookingWeightKg() {
        return bookingWeightKg;
    }

    public void setBookingWeightKg(Double bookingWeightKg) {
        this.bookingWeightKg = bookingWeightKg;
    }

    public LocalDateTime getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(LocalDateTime bookingDate) {
        this.bookingDate = bookingDate;
    }

    public Integer getConfirmationCode() {
        return confirmationCode;
    }

    public void setConfirmationCode(Integer confirmationCode) {
        this.confirmationCode = confirmationCode;
    }

    public String getBookingStatus() {
        return bookingStatus;
    }

    public void setBookingStatus(String bookingStatus) {
        this.bookingStatus = bookingStatus;
    }

    public Food getFood() {
        return food;
    }

    public void setFood(Food food) {
        this.food = food;
    }

    public User getRecipient() {
        return recipient;
    }

    public void setRecipient(User recipient) {
        this.recipient = recipient;
    }
}

