package com.springboot.dto;

public class MonthlyStatDto {
    private String month;
    private long total;
    private long completed;

    // Constructors
    public MonthlyStatDto() {
    }

    public MonthlyStatDto(String month, long total, long completed) {
        this.month = month;
        this.total = total;
        this.completed = completed;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getCompleted() {
        return completed;
    }

    public void setCompleted(long completed) {
        this.completed = completed;
    }
}
