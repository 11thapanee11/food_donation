package com.springboot.dto;

import java.util.List;

public class DashboardStatsDto {
    // --- ฟิลด์เดิมที่มีอยู่แล้ว ---
    private Long totalUsers;
    private Long totalFoods;
    private Double totalCarbon;
    private Long completed;
    private Long pending;
    private Long cancelled;
    private Long expired;
    private Long totalReports;
    private Long pendingReport;
    private Long checkedReport;

    // --- ฟิลด์ใหม่ที่เพิ่มเพื่อให้ตรงกับ React UI ---
    private Double treesEquivalent;
    private Double totalFoodWeight;
    private Long totalBookings;
    private List<CategoryStatDto> categories;

    // Default Constructor
    public DashboardStatsDto() {
    }

    // Inner Class สำหรับข้อมูลหมวดหมู่อาหาร ( Progress Bar บน React )
    public static class CategoryStatDto {
        private String name;
        private Long count;
        private Long max;

        public CategoryStatDto() {
        }

        public CategoryStatDto(String name, Long count, Long max) {
            this.name = name;
            this.count = count;
            this.max = max;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Long getCount() {
            return count;
        }

        public void setCount(Long count) {
            this.count = count;
        }

        public Long getMax() {
            return max;
        }

        public void setMax(Long max) {
            this.max = max;
        }
    }

    // --- Getters & Setters เดิม ---
    public Long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(Long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public Long getTotalFoods() {
        return totalFoods;
    }

    public void setTotalFoods(Long totalFoods) {
        this.totalFoods = totalFoods;
    }

    public Double getTotalCarbon() {
        return totalCarbon;
    }

    public void setTotalCarbon(Double totalCarbon) {
        this.totalCarbon = totalCarbon;
    }

    public Long getCompleted() {
        return completed;
    }

    public void setCompleted(Long completed) {
        this.completed = completed;
    }

    public Long getPending() {
        return pending;
    }

    public void setPending(Long pending) {
        this.pending = pending;
    }

    public Long getCancelled() {
        return cancelled;
    }

    public void setCancelled(Long cancelled) {
        this.cancelled = cancelled;
    }

    public Long getExpired() {
        return expired;
    }

    public void setExpired(Long expired) {
        this.expired = expired;
    }

    public Long getTotalReports() {
        return totalReports;
    }

    public void setTotalReports(Long totalReports) {
        this.totalReports = totalReports;
    }

    public Long getPendingReport() {
        return pendingReport;
    }

    public void setPendingReport(Long pendingReport) {
        this.pendingReport = pendingReport;
    }

    public Long getCheckedReport() {
        return checkedReport;
    }

    public void setCheckedReport(Long checkedReport) {
        this.checkedReport = checkedReport;
    }

    // --- Getters & Setters ใหม่ ---
    public Double getTreesEquivalent() {
        return treesEquivalent;
    }

    public void setTreesEquivalent(Double treesEquivalent) {
        this.treesEquivalent = treesEquivalent;
    }

    public Double getTotalFoodWeight() {
        return totalFoodWeight;
    }

    public void setTotalFoodWeight(Double totalFoodWeight) {
        this.totalFoodWeight = totalFoodWeight;
    }

    public Long getTotalBookings() {
        return totalBookings;
    }

    public void setTotalBookings(Long totalBookings) {
        this.totalBookings = totalBookings;
    }

    public List<CategoryStatDto> getCategories() {
        return categories;
    }

    public void setCategories(List<CategoryStatDto> categories) {
        this.categories = categories;
    }
}