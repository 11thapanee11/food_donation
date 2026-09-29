package com.springboot.dto;

public class DailyStatDto {
    private String day; // เช่น "1", "2", ..., "31" หรือวันที่รูปแบบ "DD"
    private long total;
    private long completed;

    // Constructor, Getters, Setters
    public DailyStatDto(String day, long total, long completed) {
        this.day = day;
        this.total = total;
        this.completed = completed;
    }

    public String getDay() {
        return day;
    }

    public long getTotal() {
        return total;
    }

    public long getCompleted() {
        return completed;
    }
}
