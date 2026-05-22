package com.springboot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

@Configuration
public class WebConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@NonNull CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }

            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                // เมื่อ React เรียกขอรูปด้วย URL /uploads/**
                registry.addResourceHandler("/uploads/**")
                        // ชี้เป้าตรงๆ ไปที่โฟลเดอร์ในไดรฟ์ D
                        // (ใช้เครื่องหมายสแลช / แทนสแลชกลับหลัง \ ของ Windows นะครับ)
                        .addResourceLocations("file:///D:/Project/food_donation/uploads/");
            }
        };
    }
}
