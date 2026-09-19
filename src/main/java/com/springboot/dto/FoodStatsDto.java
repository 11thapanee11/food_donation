package com.springboot.dto;

public class FoodStatsDto {
    private Long totalFoods;
    private Long expired;

    public FoodStatsDto(Long totalFoods, Long expired) {
        this.totalFoods = totalFoods != null ? totalFoods : 0L;
        this.expired = expired != null ? expired : 0L;
    }

    public Long getTotalFoods() { return totalFoods; }
    public Long getExpired() { return expired; }
}