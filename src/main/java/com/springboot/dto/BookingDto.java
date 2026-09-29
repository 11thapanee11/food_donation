package com.springboot.dto;

import java.time.LocalDateTime;

public class BookingDto {
    private Integer foodId;
    private Integer quantity;
    private String unit;

    private Integer bookingId;
    private Integer bookingQuantity;
    private String bookingUnit;

    private LocalDateTime bookingDate;
    private Integer confirmationCode;
    private LocalDateTime pickupDeadline;
    private LocalDateTime bookingCompleted;
    private String bookingStatus;
    private String recipientName;

    public Integer getFoodId() {
        return foodId;
    }

    public void setFoodId(Integer foodId) {
        this.foodId = foodId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

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

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public LocalDateTime getBookingCompleted() {
        return bookingCompleted;
    }

    public void setBookingCompleted(LocalDateTime bookingCompleted) {
        this.bookingCompleted = bookingCompleted;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    
}
