package com.springboot.repository;

import com.springboot.model.Recipient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface RecipientRepository extends JpaRepository<Recipient, Integer> {

    // @Modifying
    // @Transactional
    // @Query(value = "INSERT INTO recipient (user_id) VALUES (:userId) ON DUPLICATE KEY UPDATE user_id = user_id", nativeQuery = true)
    // void insertRecipientIfNotExist(@Param("userId") Integer userId);

}
