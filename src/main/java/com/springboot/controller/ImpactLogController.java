package com.springboot.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.service.*;
import com.springboot.repository.*;
import com.springboot.util.JwtUtil;

import java.util.*;
import com.springboot.dto.*;
import com.springboot.model.*;

@RestController
@RequestMapping("/impact-logs")
public class ImpactLogController {

    private final UserService userService;
    private final ImpactLogService impactLogService;

    public ImpactLogController(UserService userService, ImpactLogService impactLogService) {
        this.userService = userService;
        this.impactLogService = impactLogService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ImpactLogDto>>> getListImpactLog(
            @RequestHeader("Authorization") String authHeader) {

        User user = userService.authenticate(authHeader);
        List<ImpactLogDto> listImpactLog = impactLogService.getListImpactLog(user.getUserId());

        if (listImpactLog == null || listImpactLog.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("ไม่พบข้อมูลผลกระทบ"));
        }

        return ResponseEntity.ok(ApiResponse.success("ดึงลิสต์ประวัติผลกระทบสำเร็จ", listImpactLog));
    }

}
