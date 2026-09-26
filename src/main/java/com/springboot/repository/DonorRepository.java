package com.springboot.repository;

import org.springframework.stereotype.Repository;
import com.springboot.model.*;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Repository
public interface DonorRepository extends JpaRepository<Donor, Integer> {


    @Query("SELECT d FROM Donor d JOIN User u ON d.userId = u.userId")
    List<Donor> findAllDonors();

    Donor findByUserUserId(Integer userId);

}
