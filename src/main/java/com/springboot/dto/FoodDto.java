package com.springboot.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

public class FoodDto {
    private Integer id;
    private String foodName;
    private String description;

    // เพิ่ม Pattern เพื่อให้ Java อ่าน String จาก JS ได้ถูกต้อง
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime expiryDate;

    private Double quantity;
    private String unit;
    private Integer remainingQuantity;
    private String locationName;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate pickupDateStart;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate pickupDateEnd;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime pickupStartTime;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime pickupEndTime;

    private Integer limitPerPerson;
    private Double latitude;
    private Double longitude;
    private String foodStatus;

    private String foodImage;

    // สำคัญ: ต้องรับเป็น ID (Integer) ให้ตรงกับที่ Java ต้องการ
    private Integer foodCateId;
    private String foodCateName;
    private Integer donorId;
    private String donorName;
    private String donorPhoneNum;

    public String getFoodName() {
        return foodName;
    }

    public void setFoodName(String foodName) {
        this.foodName = foodName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDateTime expiryDate) {
        this.expiryDate = expiryDate;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Integer getRemainingQuantity() {
        return remainingQuantity;
    }

    public void setRemainingQuantity(Integer remainingQuantity) {
        this.remainingQuantity = remainingQuantity;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public LocalDate getPickupDateStart() {
        return pickupDateStart;
    }

    public void setPickupDateStart(LocalDate pickupDateStart) {
        this.pickupDateStart = pickupDateStart;
    }

    public LocalDate getPickupDateEnd() {
        return pickupDateEnd;
    }

    public void setPickupDateEnd(LocalDate pickupDateEnd) {
        this.pickupDateEnd = pickupDateEnd;
    }

    public LocalTime getPickupStartTime() {
        return pickupStartTime;
    }

    public void setPickupStartTime(LocalTime pickupStartTime) {
        this.pickupStartTime = pickupStartTime;
    }

    public LocalTime getPickupEndTime() {
        return pickupEndTime;
    }

    public void setPickupEndTime(LocalTime pickupEndTime) {
        this.pickupEndTime = pickupEndTime;
    }

    public Integer getLimitPerPerson() {
        return limitPerPerson;
    }

    public void setLimitPerPerson(Integer limitPerPerson) {
        this.limitPerPerson = limitPerPerson;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getFoodStatus() {
        return foodStatus;
    }

    public void setFoodStatus(String foodStatus) {
        this.foodStatus = foodStatus;
    }

    public String getFoodImage() {
        return foodImage;
    }

    public void setFoodImage(String foodImage) {
        this.foodImage = foodImage;
    }

    public Integer getDonorId() {
        return donorId;
    }

    public void setDonorId(Integer donorId) {
        this.donorId = donorId;
    }

    public String getDonorName() {
        return donorName;
    }

    public void setDonorName(String donorName) {
        this.donorName = donorName;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getFoodCateId() {
        return foodCateId;
    }

    public void setFoodCateId(Integer foodCateId) {
        this.foodCateId = foodCateId;
    }

    public String getFoodCateName() {
        return foodCateName;
    }

    public void setFoodCateName(String foodCateName) {
        this.foodCateName = foodCateName;
    }

    public String getDonorPhoneNum() {
        return donorPhoneNum;
    }

    public void setDonorPhoneNum(String donorPhoneNum) {
        this.donorPhoneNum = donorPhoneNum;
    }
}