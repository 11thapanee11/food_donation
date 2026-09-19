package com.springboot.dto;

public class BookingStatsDto {
    private Double completedWeight;
    private Long completed;
    private Long pending;
    private Long cancelled;
    private Long totalBookings;

    public BookingStatsDto(Double completedWeight, Long completed, Long pending, Long cancelled) {
        this.completedWeight = completedWeight;
        this.completed = completed;
        this.pending = pending;
        this.cancelled = cancelled;
        this.totalBookings = this.completed + this.pending + this.cancelled;
    }

    // Getters
    public Double getCompletedWeight() {
        return completedWeight;
    }

    public Long getCompleted() {
        return completed;
    }

    public Long getPending() {
        return pending;
    }

    public Long getCancelled() {
        return cancelled;
    }

    public Long getTotalBookings() {
        return totalBookings;
    }
}