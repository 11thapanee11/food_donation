package com.springboot.repository;

import com.springboot.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {

    // @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Report r WHERE r.booking.bookingId = :bookingId")
    boolean existsByBooking_BookingId(Integer bookingId);
}
