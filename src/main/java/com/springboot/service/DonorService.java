package com.springboot.service;

import com.springboot.model.*;
import com.springboot.dto.*;
import com.springboot.exception.ApplicationException;
import com.springboot.repository.*;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class DonorService {

    private final DonorRepository donorRepository;
    private final BookingRepository bookingRepository;

    public DonorService(DonorRepository donorRepository, BookingRepository bookingRepository) {
        this.donorRepository = donorRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<DonorDto> getAllDonors() {
        List<Donor> donors = donorRepository.findAllDonors();

        if (donors == null || donors.isEmpty()) {
            throw new ApplicationException("ไม่พบข้อมูลผู้บริจาค", HttpStatus.NOT_FOUND);
        }

        return donors.stream().map(d -> {
            DonorDto dto = new DonorDto();
            dto.setId(d.getUser().getUserId());
            dto.setName(d.getUser().getFirstName() + " " + d.getUser().getLastName());
            dto.setEmail(d.getUser().getEmail());
            return dto;
        }).toList();
    }

    public Donor getOrCreateDonor(User user) {
        return donorRepository.findById(user.getUserId()).orElseGet(() -> {
            Donor newDonor = new Donor();
            newDonor.setUser(user);
            return donorRepository.save(newDonor);
        });
    }

    public Donor getDonorByUserId(Integer userId) {
        Donor donor = donorRepository.findByUserUserId(userId);
        if (donor == null) {
            throw new ApplicationException("ไม่พบข้อมูลผู้บริจาค", HttpStatus.NOT_FOUND);
        }
        return donor;
    }

}
