package com.springboot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "food_category")
public class FoodCategory {

    @Id
    @Column(name = "food_cate_id")
    private Integer foodCateId;

    @Column(name = "food_cate_name", length = 50, nullable = false)
    private String foodCateName;

    @Column(name = "emission_factor", nullable = false)
    private Double emissionFactor;

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

    public Double getEmissionFactor() {
        return emissionFactor;
    }

    public void setEmissionFactor(Double emissionFactor) {
        this.emissionFactor = emissionFactor;
    }

}
