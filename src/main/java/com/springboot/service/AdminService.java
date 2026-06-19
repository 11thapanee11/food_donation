package com.springboot.service;

import java.util.*;

import org.springframework.stereotype.Service;

import com.springboot.repository.AdminRepository;
import com.springboot.repository.RecipientRepository;

@Service
public class AdminService {
    private final AdminRepository adminRepository;

    public AdminService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    public boolean isAdmin(Integer userId) {
        return adminRepository.existsByUserId(userId);
    }

}
