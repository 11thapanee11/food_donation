package com.springboot.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "review")
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Integer reviewId;

    @Column(name = "rating_score", nullable = false)
    private Integer ratingScore;

    @Column(name = "review_comment", nullable = false, length = 100)
    private String reviewComment;

    @Column(name = "review_date", nullable = false)
    private LocalDateTime reviewDate;

    @OneToOne
    @JoinColumn(name = "booking_booking_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Booking booking;

    @ManyToOne
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private Recipient recipient;

    public Review() {
        super();
    }

    public Integer getReviewId() {
        return reviewId;
    }

    public void setReviewId(Integer reviewId) {
        this.reviewId = reviewId;
    }

    public Integer getRatingScore() {
        return ratingScore;
    }

    public void setRatingScore(Integer ratingScore) {
        this.ratingScore = ratingScore;
    }

    public String getReviewComment() {
        return reviewComment;
    }

    public void setReviewComment(String reviewComment) {
        this.reviewComment = reviewComment;
    }

    public LocalDateTime getReviewDate() {
        return reviewDate;
    }

    public void setReviewDate(LocalDateTime reviewDate) {
        this.reviewDate = reviewDate;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public Recipient getRecipient() {
        return recipient;
    }

    public void setRecipient(Recipient recipient) {
        this.recipient = recipient;
    }

}
