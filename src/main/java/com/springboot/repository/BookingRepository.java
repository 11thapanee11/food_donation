package com.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.springboot.model.*;
import java.util.*;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {
    // ดึงรายการจองทั้งหมดของ User (Recipient) คนนั้น ๆ โดยเรียงตามวันที่จองล่าสุด
    List<Booking> findByRecipient_EmailOrderByBookingDateDesc(String email);
}
