package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.dto.*;
import com.springboot.exception.ApplicationException;
import com.springboot.service.*;

import com.springboot.model.*;
import java.util.*;

@RestController
@RequestMapping("/donor")
public class DonorController {

    private final UserService userService;
    private final DonorService donorService;

    public DonorController(UserService userService, DonorService donorService) {
        this.userService = userService;
        this.donorService = donorService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DonorDto>>> getAllDonors() {
        List<DonorDto> donors = donorService.getAllDonors();
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสำเร็จ", donors));
    }

}
