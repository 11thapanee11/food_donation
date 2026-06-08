package com.springboot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "recipient")
// @PrimaryKeyJoinColumn(name = "user_id")
public class Recipient {

    @Id
    @Column(name = "user_id")
    private Integer userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    public Recipient() {
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

    // public Recipient(User user) {
    //     super(user.getUserId(), user.getFirstName(), user.getLastName(),
    //             user.getEmail(), user.getPhoneNumber(), user.getPassword());
    // }

    

}
