package com.springboot.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.annotation.JsonFormat;

public class FoodDto {
    private String foodName;
    private String description;

    // เพิ่ม Pattern เพื่อให้ Java อ่าน String จาก JS ได้ถูกต้อง
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime expiryDate;

    private Double unitWeightKg;
    private Integer totalUnit;
    private Integer remainingUnit;
    private Integer peopleCountPerMeal;
    private String address;

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

    // private MultipartFile foodImage;
    private String foodImage;

    // สำคัญ: ต้องรับเป็น ID (Integer) ให้ตรงกับที่ Java ต้องการ
    private Integer foodCategory;
    // private Integer donor;
    private String donorFirstName;
    private String donorLastName;

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

    public Double getUnitWeightKg() {
        return unitWeightKg;
    }

    public void setUnitWeightKg(Double unitWeightKg) {
        this.unitWeightKg = unitWeightKg;
    }

    public Integer getTotalUnit() {
        return totalUnit;
    }

    public void setTotalUnit(Integer totalUnit) {
        this.totalUnit = totalUnit;
    }

    public Integer getRemainingUnit() {
        return remainingUnit;
    }

    public void setRemainingUnit(Integer remainingUnit) {
        this.remainingUnit = remainingUnit;
    }

    public Integer getPeopleCountPerMeal() {
        return peopleCountPerMeal;
    }

    public void setPeopleCountPerMeal(Integer peopleCountPerMeal) {
        this.peopleCountPerMeal = peopleCountPerMeal;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
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

    public Integer getFoodCategory() {
        return foodCategory;
    }

    public void setFoodCategory(Integer foodCategory) {
        this.foodCategory = foodCategory;
    }

    // public Integer getDonor() {
    // return donor;
    // }

    // public void setDonor(Integer donor) {
    // this.donor = donor;
    // }

    // public MultipartFile getFoodImage() {
    // return foodImage;
    // }

    // public void setFoodImage(MultipartFile foodImage) {
    // this.foodImage = foodImage;
    // }

    public String getFoodImage() {
        return foodImage;
    }

    public void setFoodImage(String foodImage) {
        this.foodImage = foodImage;
    }

    public String getDonorFirstName() {
        return donorFirstName;
    }

    public void setDonorFirstName(String donorFirstName) {
        this.donorFirstName = donorFirstName;
    }

    public String getDonorLastName() {
        return donorLastName;
    }

    public void setDonorLastName(String donorLastName) {
        this.donorLastName = donorLastName;
    }

}
