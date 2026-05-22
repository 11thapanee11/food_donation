package com.springboot.repository;

import com.springboot.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);   // ใช้ email ในการ login
    boolean existsByEmail(String email);        // ตรวจสอบ email ซ้ำ
    Optional<User> findByEmailAndPassword(String email, String password);
}
