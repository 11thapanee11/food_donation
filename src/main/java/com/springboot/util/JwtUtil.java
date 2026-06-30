package com.springboot.util;

import java.util.Date;
import java.security.Key;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.Claims;

@Component
public class JwtUtil {

    // ดึงค่าจาก application.properties
    @Value("${jwt.secret}")
    private String secret;

    private Key secretKey;

    // สร้าง Key หลังจาก Spring โหลดค่าจากไฟล์ properties เสร็จแล้ว
    @PostConstruct
    public void init() {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
    }

    // public String generateToken(String email, long expirationMillis) {
    //     return Jwts.builder()
    //             .setSubject(email)
    //             .setIssuedAt(new Date())
    //             .setExpiration(new Date(System.currentTimeMillis() + expirationMillis))
    //             .signWith(secretKey, SignatureAlgorithm.HS256)
    //             .compact();
    // }
    // ใช้ userId เป็น subject
    public String generateToken(String userId, boolean isAdmin, long expirationMillis) {
        return Jwts.builder()
                .setSubject(userId)
                .claim("isAdmin", isAdmin) // ฝังสถานะแอดมินลงใน Payload ของ Token
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMillis))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUserId(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
    
    public boolean extractIsAdmin(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
        
        // ดึงคีย์ "isAdmin" ออกมา ถ้าเป็น null ให้ default เป็น false
        Boolean isAdmin = claims.get("isAdmin", Boolean.class);
        return isAdmin != null ? isAdmin : false;
    }

    // public boolean validateToken(String token, String email) {
    //     return email.equals(extractEmail(token)) && !isTokenExpired(token);
    // }
    public boolean validateToken(String token, String userId) {
        return userId.equals(extractUserId(token)) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        Date expiration = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
        return expiration.before(new Date());
    }
}