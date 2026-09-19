package com.springboot.dto;

public class ReportStatsDto {
    private Long totalReports;
    private Long pendingReport;
    private Long checkedReport;

    public ReportStatsDto(Long totalReports, Long pendingReport, Long checkedReport) {
        this.totalReports = totalReports != null ? totalReports : 0L;
        this.pendingReport = pendingReport != null ? pendingReport : 0L;
        this.checkedReport = checkedReport != null ? checkedReport : 0L;
    }

    public Long getTotalReports() { return totalReports; }
    public Long getPendingReport() { return pendingReport; }
    public Long getCheckedReport() { return checkedReport; }
}