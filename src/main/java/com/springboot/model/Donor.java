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

    public Donor() {
        super();
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
