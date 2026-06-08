package com.springboot.dto;

import java.time.LocalDate;

public class ImpactLogDto {
    private Integer id;
    private LocalDate date;
    private String name;
    private Double weight;
    private Double carbon;

    public ImpactLogDto(Integer id, LocalDate date, String name, Double weight, Double carbon) {
        this.id = id;
        this.date = date;
        this.name = name;
        this.weight = weight;
        this.carbon = carbon;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Double getCarbon() {
        return carbon;
    }

    public void setCarbon(Double carbon) {
        this.carbon = carbon;
    }
}
