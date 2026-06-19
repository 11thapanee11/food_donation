package com.springboot.repository;

import com.springboot.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.*;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);   // ใช้ email ในการ login
    
    boolean existsByEmail(String email);        // ตรวจสอบ email ซ้ำ

    Optional<User> findByEmailAndPassword(String email, String password);

    @Query("SELECT COUNT(u) FROM User u LEFT JOIN Admin a ON u.id = a.user.id WHERE a.id IS NULL")
    long countNonAdminUsers();
}
