package com.springboot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "admin")
public class Admin extends User {

    public Admin() {
    }

    public Admin(User user) {
        super(user.getUserId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getPhoneNumber(), user.getPassword());
    }

}
