package com.springboot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "donor")
// @PrimaryKeyJoinColumn(name = "user_id")
public class Donor {

    @Id
    @Column(name = "user_id")
    private Integer userId;

    @OneToOne
    @MapsId //ใช้ Primary Key (PK) ร่วมกัน
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "donor_status", length = 20)
    private String donorStatus = "active";

    @Column(name = "total_impact_amount")
    private Double totalImpactAmount;

    public Donor() {
        super();
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

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    
    

    // ตัวอย่าง method business logic
    // public String getListTotalImpact() {
    // return "Total Impact: " + (totalImpactAmount != null ? totalImpactAmount :
    // 0);
    // }
}
