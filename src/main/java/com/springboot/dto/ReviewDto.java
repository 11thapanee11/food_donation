package com.springboot.dto;

public class ReviewDto {
    private Integer ratingScore;
    private String reviewComment;
    private Integer bookingId;
    private String reviewerName;
    private String reviewDate;

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
    public Integer getBookingId() {
        return bookingId;
    }
    public void setBookingBookingId(Integer bookingId) {
        this.bookingId = bookingId;
    }

    public String getReviewerName() {
        return reviewerName;
    }
    public void setReviewerName(String reviewerName) {
        this.reviewerName = reviewerName;
    }
    public String getReviewDate() {
        return reviewDate;
    }
    public void setReviewDate(String reviewDate) {
        this.reviewDate = reviewDate;
    }

    

}
