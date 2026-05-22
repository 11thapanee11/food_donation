package com.springboot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "donor")
public class Donor extends User {

    @Column(name = "donor_status", length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'ACTIVE'")
    private String donorStatus;

    @Column(name = "total_impact_amount")
    private Double totalImpactAmount;

    public Donor() {
    }

    public Donor(User user, String donorStatus, Double totalImpactAmount) {
        super(user.getUserId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getPhoneNumber(), user.getPassword());
        this.donorStatus = donorStatus;
        this.totalImpactAmount = totalImpactAmount;
    }

    public String getDonorStatus() {
        return donorStatus;
    }

    public void setDonorStatus(String donorStatus) {
        this.donorStatus = donorStatus;
    }

    public Double getTotalImpactAmount() {
        return totalImpactAmount;
    }

    public void setTotalImpactAmount(Double totalImpactAmount) {
        this.totalImpactAmount = totalImpactAmount;
    }

    // ตัวอย่าง method business logic
    // public String getListTotalImpact() {
    // return "Total Impact: " + (totalImpactAmount != null ? totalImpactAmount :
    // 0);
    // }
}
