package com.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.springboot.model.Review;
import java.util.*;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {

    Review findByBooking_BookingId(Integer bookingId);

    // ดึงรีวิวทั้งหมดของอาหารชิ้นนั้นๆ
    List<Review> findByBooking_Food_FoodId(Integer foodId);
}
