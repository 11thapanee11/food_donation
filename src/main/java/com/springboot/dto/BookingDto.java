package com.springboot.dto;

import java.time.LocalDateTime;

public class BookingDto {
    private Integer foodId;
    private int quantity;

    private Integer bookingId;
    private Integer bookingUnit;
    private Double bookingWeightKg;
    private LocalDateTime bookingDate;
    private Integer confirmationCode;
    private String bookingStatus;

    public Integer getFoodId() {
        return foodId;
    }

    public void setFoodId(Integer foodId) {
        this.foodId = foodId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

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

    
    

    
}
