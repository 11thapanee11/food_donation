package com.springboot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "recipient")
public class Recipient extends User {

    public Recipient() {
    }

    public Recipient(User user) {
        super(user.getUserId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getPhoneNumber(), user.getPassword());
    }

}
