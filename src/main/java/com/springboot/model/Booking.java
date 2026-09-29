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

    @Column(name = "booking_quantity", nullable = false)
    private Integer bookingQuantity;

    @Column(name = "booking_unit", nullable = false, length = 45)
    private String bookingUnit;

    @Column(name = "booking_date", nullable = false)
    private LocalDateTime bookingDate;

    @Column(name = "pickup_deadline", nullable = false)
    private LocalDateTime pickupDeadline;

    @Column(name = "confirmation_code", nullable = false, length = 6)
    private Integer confirmationCode;

    @Column(name = "booking_completed")
    private LocalDateTime bookingCompleted;

    @Column(name = "booking_status", nullable = false, length = 45)
    private String bookingStatus = "pending";

    // FK ไปยัง Food
    @ManyToOne
    @JoinColumn(name = "food_food_id", nullable = false)
    private Food food;

    // FK ไปยัง Recipient (User)
    @ManyToOne
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private Recipient recipient;

    public Integer getBookingId() {
        return bookingId;
    }

    public void setBookingId(Integer bookingId) {
        this.bookingId = bookingId;
    }

    public Integer getBookingQuantity() {
        return bookingQuantity;
    }

    public void setBookingQuantity(Integer bookingQuantity) {
        this.bookingQuantity = bookingQuantity;
    }

    public String getBookingUnit() {
        return bookingUnit;
    }

    public void setBookingUnit(String bookingUnit) {
        this.bookingUnit = bookingUnit;
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

    public LocalDateTime getPickupDeadline() {
        return pickupDeadline;
    }

    public void setPickupDeadline(LocalDateTime pickupDeadline) {
        this.pickupDeadline = pickupDeadline;
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

    public Recipient getRecipient() {
        return recipient;
    }

    public void setRecipient(Recipient recipient) {
        this.recipient = recipient;
    }

    public LocalDateTime getBookingCompleted() {
        return bookingCompleted;
    }

    public void setBookingCompleted(LocalDateTime bookingCompleted) {
        this.bookingCompleted = bookingCompleted;
    }

}
