package com.springboot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FoodDonationApplication {

	public static void main(String[] args) {
		SpringApplication.run(FoodDonationApplication.class, args);
	}

}
