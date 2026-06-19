package com.springboot.dto;

public class DashboardStatsDto {
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

}
