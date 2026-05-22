package com.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.springboot.model.*;

public interface BookingRepository extends JpaRepository<Booking, Integer> {

}
