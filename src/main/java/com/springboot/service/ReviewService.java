package com.springboot.service;

import com.springboot.dto.ReviewDto;
import com.springboot.exception.ApplicationException;
import com.springboot.model.*;
import com.springboot.repository.*;

import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.util.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final RecipientRepository recipientRepository;

    public ReviewService(ReviewRepository reviewRepository, BookingRepository bookingRepository,
            RecipientRepository recipientRepository) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.recipientRepository = recipientRepository;
    }

    public Review saveReview(ReviewDto dto, Recipient recipient) {
        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new ApplicationException("ไม่พบข้อมูลการจอง", HttpStatus.NOT_FOUND));

        Review review = new Review();
        review.setRatingScore(dto.getRatingScore());
        review.setReviewComment(dto.getReviewComment());
        review.setReviewDate(LocalDateTime.now());
        review.setBooking(booking);
        review.setRecipient(recipient);

        try {
            return reviewRepository.save(review);
        } catch (Exception e) {
            throw new ApplicationException("ไม่สามารถบันทึกรีวิวได้", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public Review getReviewByBookingId(Integer bookingId) {
        return reviewRepository.findByBooking_BookingId(bookingId);
    }

    public List<ReviewDto> getReviewsByFoodId(Integer foodId) {
        return reviewRepository.findByBooking_Food_FoodId(foodId).stream()
                .map(r -> {
                    ReviewDto dto = new ReviewDto();
                    String fullName = r.getBooking().getRecipient().getUser().getFirstName() + " " +
                            r.getBooking().getRecipient().getUser().getLastName();
                    dto.setReviewerName(fullName);
                    dto.setReviewDate(r.getReviewDate().toString());
                    dto.setRatingScore(r.getRatingScore());
                    dto.setReviewComment(r.getReviewComment());
                    return dto;
                }).toList();
    }
}
