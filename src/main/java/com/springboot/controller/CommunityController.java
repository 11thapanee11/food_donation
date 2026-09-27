package com.springboot.controller;

import com.springboot.service.*;
import com.springboot.util.JwtUtil;
import com.springboot.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/community")
public class CommunityController {

    private final CommunityService communityService;

    public CommunityController(CommunityService communityService) {
        this.communityService = communityService;
    }

    @GetMapping("/impact")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCommunityImpact() {
        Map<String, Object> impactData = communityService.calculateCommunityImpact();
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสำเร็จ", impactData));
    }
}
