package com.springboot.dto;

public class DonorDto {
    private String name;
    private Double totalCo2;

    public DonorDto(String firstName, String lastName, Double totalCo2) {
        this.name = firstName + " " + lastName;
        this.totalCo2 = totalCo2 != null ? totalCo2 : 0.0;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getTotalCo2() {
        return totalCo2;
    }

    public void setTotalCo2(Double totalCo2) {
        this.totalCo2 = totalCo2;
    }

    
}
