package com.springboot.dto;

public class DonorDto {
    private Integer id;
    private String name;
    private String email;
    private String status;
    private Double totalCo2;

    public DonorDto() {
        
    }

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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }
    
}
