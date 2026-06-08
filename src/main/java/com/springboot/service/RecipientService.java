package com.springboot.service;

import com.springboot.model.*;
import com.springboot.repository.*;

import java.util.*;

import org.springframework.stereotype.Service;

@Service
public class RecipientService {

    private final RecipientRepository recipientRepository;

    public RecipientService(RecipientRepository recipientRepository) {
        this.recipientRepository = recipientRepository;
    }

    public Recipient getOrCreateRecipient(User user) {

        return recipientRepository.findById(user.getUserId()).orElseGet(() -> {
            Recipient newRecipient = new Recipient();
            newRecipient.setUser(user);
            return recipientRepository.save(newRecipient);
        });
    }

}
