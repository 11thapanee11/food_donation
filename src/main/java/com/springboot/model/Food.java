package com.springboot.model;

import jakarta.persistence.*;
import java.time.LocalDate;
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

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    @Column(name = "unit_weight_kg", nullable = false)
    private Double unitWeightKg;

    @Column(name = "total_unit", nullable = false)
    private Integer totalUnit;

    @Column(name = "remaining_unit", nullable = false)
    private Integer remainingUnit = 0;

    @Column(name = "people_count_per_meal")
    private Integer peopleCountPerMeal;

    @Column(name = "address", length = 225, nullable = false)
    private String address;

    @Column(name = "pickup_date_start", nullable = false)
    private LocalDate pickupDateStart;

    @Column(name = "pickup_date_end", nullable = false)
    private LocalDate pickupDateEnd;

    @Column(name = "pickup_start_time", nullable = false)
    private LocalTime pickupStartTime;

    @Column(name = "pickup_end_time", nullable = false)
    private LocalTime pickupEndTime;

    @Column(name = "limit_per_person", nullable = false)
    private Integer limitPerPerson;

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

    // public Food(Integer foodId, String foodImage, String foodName, String description, LocalDateTime expiryDate,
    //         Double unitWeightKg, Integer totalUnit, Integer remainingUnit, Integer peopleCountPerMeal, String address,
    //         LocalDate pickupDateStart, LocalDate pickupDateEnd, LocalTime pickupStartTime, LocalTime pickupEndTime,
    //         Integer limitPerPerson, Double latitude, Double longitude, String foodStatus, FoodCategory foodCategory,
    //         User donor) {
    //     this.foodId = foodId;
    //     this.foodImage = foodImage;
    //     this.foodName = foodName;
    //     this.description = description;
    //     this.expiryDate = expiryDate;
    //     this.unitWeightKg = unitWeightKg;
    //     this.totalUnit = totalUnit;
    //     this.remainingUnit = remainingUnit;
    //     this.peopleCountPerMeal = peopleCountPerMeal;
    //     this.address = address;
    //     this.pickupDateStart = pickupDateStart;
    //     this.pickupDateEnd = pickupDateEnd;
    //     this.pickupStartTime = pickupStartTime;
    //     this.pickupEndTime = pickupEndTime;
    //     this.limitPerPerson = limitPerPerson;
    //     this.latitude = latitude;
    //     this.longitude = longitude;
    //     this.foodStatus = foodStatus;
    //     this.foodCategory = foodCategory;
    //     this.donor = donor;
    // }



    // --- Getter & Setter ---
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

    // public User getDonor() {
    //     return donor;
    // }

    // public void setDonor(User donor) {
    //     this.donor = donor;
    // }

    
}
