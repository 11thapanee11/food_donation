package com.springboot.service;

import com.springboot.exception.ApplicationException;
import com.springboot.model.*;
import com.springboot.repository.*;

import java.util.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class RecipientService {

    private final RecipientRepository recipientRepository;

    public RecipientService(RecipientRepository recipientRepository) {
        this.recipientRepository = recipientRepository;
    }

    public Recipient getOrCreateRecipient(User user) {
        if (user == null) {
            throw new ApplicationException("ไม่สามารถสร้าง Recipient ได้ เนื่องจาก User เป็น null", HttpStatus.BAD_REQUEST);
        }

        return recipientRepository.findById(user.getUserId()).orElseGet(() -> {
            Recipient newRecipient = new Recipient();
            newRecipient.setUser(user);
            return recipientRepository.save(newRecipient);
        });
    }

}
