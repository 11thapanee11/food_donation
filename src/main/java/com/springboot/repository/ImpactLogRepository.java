package com.springboot.repository;

import org.springframework.stereotype.Repository;
import com.springboot.model.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

@Repository
public interface ImpactLogRepository extends JpaRepository<ImpactLog, Integer>{

    List<ImpactLog> findByBooking_Food_Donor_UserId(Integer donorId);
}
