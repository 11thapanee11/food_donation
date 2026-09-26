package com.springboot.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "food")
public class Food {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "food_id")
    private Integer foodId;

    @Column(name = "food_image", length = 255, nullable = false)
    private String foodImage;

    @Column(name = "food_name", length = 50, nullable = false)
    private String foodName;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "quantity", nullable = false)
    private Double quantity;

    @Column(name = "unit", length = 50, nullable = false)
    private String unit;

    @Column(name = "remaining_quantity", nullable = false)
    private Integer remainingQuantity = 0;

    @Column(name = "limit_per_person", nullable = false)
    private Integer limitPerPerson;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    @Column(name = "pickup_start_time", nullable = false)
    private LocalTime pickupStartTime;

    @Column(name = "pickup_end_time", nullable = false)
    private LocalTime pickupEndTime;

    @Column(name = "location_name", length = 225, nullable = false)
    private String locationName;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "food_status", length = 20, nullable = false)
    private String foodStatus = "available";

    // FK ไปยัง FoodCategory
    @ManyToOne
    @JoinColumn(name = "food_cate_id", nullable = false)
    private FoodCategory foodCategory;

    // FK ไปยัง Donor (User)
    @ManyToOne
    @JoinColumn(name = "donor_user_id", nullable = false)
    private Donor donor;

    public Food() {
        super();
    }

    public Integer getFoodId() {
        return foodId;
    }

    public void setFoodId(Integer foodId) {
        this.foodId = foodId;
    }

    public String getFoodImage() {
        return foodImage;
    }

    public void setFoodImage(String foodImage) {
        this.foodImage = foodImage;
    }

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

    public Integer getLimitPerPerson() {
        return limitPerPerson;
    }

    public void setLimitPerPerson(Integer limitPerPerson) {
        this.limitPerPerson = limitPerPerson;
    }

    public LocalDateTime getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDateTime expiryDate) {
        this.expiryDate = expiryDate;
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

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
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

    public FoodCategory getFoodCategory() {
        return foodCategory;
    }

    public void setFoodCategory(FoodCategory foodCategory) {
        this.foodCategory = foodCategory;
    }

    public Donor getDonor() {
        return donor;
    }

    public void setDonor(Donor donor) {
        this.donor = donor;
    }
}