package com.springboot.dto;

public class FoodCategoryDto {
    private Integer id;
    private String name;
    private Double emissionFactor;

    public FoodCategoryDto() {
    }

    public FoodCategoryDto(Integer id, String name, Double emissionFactor) {
        this.id = id;
        this.name = name;
        this.emissionFactor = emissionFactor;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getEmissionFactor() {
        return emissionFactor;
    }

    public void setEmissionFactor(Double emissionFactor) {
        this.emissionFactor = emissionFactor;
    }

    
}
