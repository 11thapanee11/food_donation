import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";

export default function ListReport() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State สำหรับการกรองและค้นหา
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(''); // เลือกเฉพาะเจาะจงวันเดียว
    const [dateRangeOption, setDateRangeOption] = useState('ALL'); // ช่วงวันที่ผ่านมา ('ALL', '7', '30', '90')

    // หมวดหมู่ปัญหา
    const PROBLEM_MAP = {
        "EXPIRED": "อาหารหมดอายุ",
        "SPOILED": "อาหารมีกลิ่นและสภาพผิดปกติ",
        "NOT_MATCH": "รายละเอียดอาหารไม่ตรงกับความเป็นจริง",
        "HYGIENE_ISSUE": "ปัญหาด้านความสะอาดหรือบรรจุภัณฑ์ชำรุดเสียหาย",
        "OTHER": "ปัญหาอื่นๆ ทั่วไป"
    };

    useEffect(() => {
        fetch('http://localhost:8082/report', {
            headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
        })
            .then(res => res.json())
            .then(resData => {
                if (resData.success) {
                    setReports(resData.data);
                }
                setLoading(false);
            })
            .catch(err => console.error("Error:", err));
    }, []);

    // ฟังก์ชันกรองข้อมูล
    const filteredReports = reports.filter(report => {
        const matchesStatus = 
            statusFilter === 'ALL' ? true :
            statusFilter === 'PENDING' ? report.reportStatus !== 'checked' :
            statusFilter === 'CHECKED' ? report.reportStatus === 'checked' : true;

        const matchesCategory = 
            categoryFilter === 'ALL' ? true : report.reason === categoryFilter;

        const matchesSearch = 
            (report.foodName && report.foodName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (report.reporterName && report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()));

        // เงื่อนไขการกรองตามวันที่
        let matchesDate = true;
        const reportDateObj = new Date(report.reportDate);
        reportDateObj.setHours(0, 0, 0, 0);

        // 1. กรองแบบเลือกวันเฉพาะเจาะจงวันเดียว
        if (selectedDate) {
            const targetDate = new Date(selectedDate);
            targetDate.setHours(0, 0, 0, 0);
            if (reportDateObj.getTime() !== targetDate.getTime()) {
                matchesDate = false;
            }
        } 
        // 2. กรองแบบช่วงวันที่ผ่านมา (ถ้าไม่ได้เลือกวันเจาะจง)
        else if (dateRangeOption !== 'ALL') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const pastDate = new Date();
            pastDate.setDate(today.getDate() - parseInt(dateRangeOption));
            pastDate.setHours(0, 0, 0, 0);

            if (reportDateObj < pastDate || reportDateObj > today) {
                matchesDate = false;
            }
        }

        return matchesStatus && matchesCategory && matchesSearch && matchesDate;
    });

    if (loading) return (
        <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>กำลังโหลดรายงานปัญหา...</p>
        </div>
    );

    return (
        <div style={styles.fullWidthBackground}>
            <div style={styles.contentContainer}>
                {/* ส่วนหัว */}
                <div style={styles.headerContainer}>
                    <div>
                        <div style={styles.topBadge}>
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>report_problem</span>
                            การจัดการระบบ
                        </div>
                        <h1 style={styles.mainTitle}>รายงานปัญหาและข้อร้องเรียน</h1>
                        <p style={styles.subHeaderDesc}>ตรวจสอบและจัดการรายการปัญหาหลังรับอาหารที่ผู้ใช้งานแจ้งเข้ามาในระบบ</p>
                    </div>
                </div>

                {/* แผงควบคุมการกรองและค้นหาหลัก */}
                <div style={styles.filterControlPanel}>
                    {/* ช่องค้นหา */}
                    <div style={styles.searchBox}>
                        <span className="material-symbols-outlined" style={{ color: '#94A3B8', fontSize: '20px' }}>search</span>
                        <input
                            type="text"
                            placeholder="ค้นหาตามชื่อรายการอาหาร หรือ ชื่อผู้รายงาน..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>

                    {/* กรองตามหมวดหมู่ปัญหา */}
                    <div style={styles.selectWrapper}>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={styles.selectDropdown}
                        >
                            <option value="ALL">ทุกหมวดหมู่ปัญหา</option>
                            <option value="EXPIRED">อาหารหมดอายุ</option>
                            <option value="SPOILED">อาหารมีกลิ่นและสภาพผิดปกติ</option>
                            <option value="NOT_MATCH">รายละเอียดอาหารไม่ตรงกับความเป็นจริง</option>
                            <option value="HYGIENE_ISSUE">ปัญหาด้านความสะอาดหรือบรรจุภัณฑ์ชำรุดเสียหาย</option>
                            <option value="OTHER">ปัญหาอื่นๆ ทั่วไป</option>
                        </select>
                    </div>
                </div>

                {/* แผงกรองตามวันที่ (เลือกวันเดียว หรือ เลือกช่วงวันที่ผ่านมา) */}
                <div style={styles.dateFilterPanel}>
                    <div style={styles.dateInputGroup}>
                        <span style={styles.dateLabel}>เลือกวันที่เฉพาะเจาะจง:</span>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                if (e.target.value) setDateRangeOption('ALL'); // รีเซ็ตตัวเลือกช่วงเวลาถ้าเลือกวันเฉพาะ
                            }}
                            style={styles.dateInput}
                        />
                    </div>

                    <div style={styles.dateInputGroup}>
                        <span style={styles.dateLabel}>หรือเลือกช่วงเวลา:</span>
                        <select
                            value={dateRangeOption}
                            onChange={(e) => {
                                setDateRangeOption(e.target.value);
                                if (e.target.value !== 'ALL') setSelectedDate(''); // รีเซ็ตวันเจาะจงถ้าเลือกช่วงเวลา
                            }}
                            style={styles.selectDropdownSmall}
                        >
                            <option value="ALL">ทุกช่วงเวลา</option>
                            <option value="7">7 วันที่ผ่านมา</option>
                            <option value="30">30 วันที่ผ่านมา</option>
                            <option value="90">90 วันที่ผ่านมา</option>
                        </select>
                    </div>

                    {(selectedDate || dateRangeOption !== 'ALL') && (
                        <button 
                            style={styles.clearDateBtn}
                            onClick={() => { setSelectedDate(''); setDateRangeOption('ALL'); }}
                        >
                            ล้างตัวกรองวันที่
                        </button>
                    )}
                </div>

                {/* แถบตัวกรองสถานะ (Filter Tabs) */}
                <div style={styles.filterTabContainer}>
                    <button
                        style={{
                            ...styles.filterTabBtn,
                            backgroundColor: statusFilter === 'ALL' ? '#C084FC' : '#FFFFFF',
                            color: statusFilter === 'ALL' ? '#FFFFFF' : '#64748B',
                            borderColor: statusFilter === 'ALL' ? '#C084FC' : '#F3E8FF'
                        }}
                        onClick={() => setStatusFilter('ALL')}
                    >
                        ทั้งหมด ({reports.length})
                    </button>
                    <button
                        style={{
                            ...styles.filterTabBtn,
                            backgroundColor: statusFilter === 'PENDING' ? '#C084FC' : '#FFFFFF',
                            color: statusFilter === 'PENDING' ? '#FFFFFF' : '#64748B',
                            borderColor: statusFilter === 'PENDING' ? '#C084FC' : '#F3E8FF'
                        }}
                        onClick={() => setStatusFilter('PENDING')}
                    >
                        รอดำเนินการ ({reports.filter(r => r.reportStatus !== 'checked').length})
                    </button>
                    <button
                        style={{
                            ...styles.filterTabBtn,
                            backgroundColor: statusFilter === 'CHECKED' ? '#C084FC' : '#FFFFFF',
                            color: statusFilter === 'CHECKED' ? '#FFFFFF' : '#64748B',
                            borderColor: statusFilter === 'CHECKED' ? '#C084FC' : '#F3E8FF'
                        }}
                        onClick={() => setStatusFilter('CHECKED')}
                    >
                        ตรวจสอบแล้ว ({reports.filter(r => r.reportStatus === 'checked').length})
                    </button>
                </div>

                {/* แสดงผลแบบการ์ดกริด (Card Grid) */}
                {filteredReports.length === 0 ? (
                    <div style={styles.emptyStateCard}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#CBD5E1', marginBottom: '10px' }}>inbox</span>
                        <p>ไม่พบรายการรายงานปัญหาที่ตรงกับเงื่อนไขการค้นหา</p>
                    </div>
                ) : (
                    <div style={styles.gridContainer}>
                        {filteredReports.map((report) => {
                            const isChecked = report.reportStatus === 'checked';

                            return (
                                <div
                                    key={report.reportId}
                                    style={{
                                        ...styles.reportCard,
                                        opacity: isChecked ? 0.75 : 1,
                                        borderLeft: `5px solid ${isChecked ? '#CBD5E1' : '#C084FC'}`
                                    }}
                                >
                                    <div style={styles.cardHeader}>
                                        <span style={styles.problemTitle}>
                                            {PROBLEM_MAP[report.reason] || report.reason}
                                        </span>
                                        <span style={{
                                            ...styles.statusBadge,
                                            backgroundColor: isChecked ? '#F1F5F9' : '#FEF3C7',
                                            color: isChecked ? '#64748B' : '#D97706'
                                        }}>
                                            {isChecked ? 'ตรวจสอบแล้ว' : 'รอดำเนินการ'}
                                        </span>
                                    </div>

                                    <div style={styles.cardBody}>
                                        <div style={styles.infoRow}>
                                            <span className="material-symbols-outlined" style={styles.infoIcon}>fastfood</span>
                                            <span style={styles.infoText}>รายการอาหาร: <strong>{report.foodName}</strong></span>
                                        </div>
                                        <div style={styles.infoRow}>
                                            <span className="material-symbols-outlined" style={styles.infoIcon}>person</span>
                                            <span style={styles.infoText}>ผู้รายงาน: {report.reporterName}</span>
                                        </div>
                                        <div style={styles.infoRow}>
                                            <span className="material-symbols-outlined" style={styles.infoIcon}>calendar_month</span>
                                            <span style={styles.infoText}>
                                                {new Date(report.reportDate).toLocaleDateString('th-TH', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={styles.cardFooter}>
                                        <button
                                            style={{
                                                ...styles.detailBtn,
                                                backgroundColor: isChecked ? '#F1F5F9' : '#C084FC',
                                                color: isChecked ? '#475569' : '#FFFFFF'
                                            }}
                                            onClick={() => navigate('/report-detail', { state: { id: report.reportId, fromPage: '/manage-report' } })}
                                        >
                                            ดูรายละเอียดเพิ่มเติม
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    fullWidthBackground: {
        width: "100%",
        backgroundColor: "#FAF5FF",
        minHeight: "100vh",
        padding: "30px 0",
        fontFamily: "'Prompt', sans-serif"
    },
    contentContainer: {
        maxWidth: "1080px",
        margin: "0 auto",
        padding: "0 20px",
        boxSizing: "border-box"
    },
    headerContainer: {
        marginBottom: "20px",
    },
    topBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: "#F3E8FF",
        color: "#9333EA",
        padding: "6px 16px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
        marginBottom: "10px",
    },
    mainTitle: {
        color: "#1E293B",
        fontSize: "26px",
        fontWeight: "bold",
        margin: 0
    },
    subHeaderDesc: {
        fontSize: "14px",
        color: "#64748B",
        margin: "4px 0 0 0"
    },
    filterControlPanel: {
        display: "flex",
        gap: "12px",
        marginBottom: "12px",
        flexWrap: "wrap"
    },
    searchBox: {
        flex: 1,
        minWidth: "260px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backgroundColor: "#FFFFFF",
        border: "1.5px solid #F3E8FF",
        borderRadius: "14px",
        padding: "0 14px",
        boxShadow: "0 2px 5px rgba(192, 132, 252, 0.02)"
    },
    searchInput: {
        width: "100%",
        border: "none",
        outline: "none",
        padding: "10px 0",
        fontSize: "13px",
        fontFamily: "'Prompt', sans-serif",
        color: "#1E293B"
    },
    selectWrapper: {
        minWidth: "260px"
    },
    selectDropdown: {
        width: "100%",
        padding: "11px 14px",
        borderRadius: "14px",
        border: "1.5px solid #F3E8FF",
        backgroundColor: "#FFFFFF",
        fontSize: "13px",
        fontFamily: "'Prompt', sans-serif",
        color: "#475569",
        outline: "none",
        cursor: "pointer",
        boxShadow: "0 2px 5px rgba(192, 132, 252, 0.02)"
    },
    selectDropdownSmall: {
        padding: "6px 10px",
        borderRadius: "10px",
        border: "1.5px solid #F3E8FF",
        backgroundColor: "#FFFFFF",
        fontSize: "13px",
        fontFamily: "'Prompt', sans-serif",
        color: "#334155",
        outline: "none",
        cursor: "pointer"
    },
    dateFilterPanel: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "16px",
        backgroundColor: "#FFFFFF",
        padding: "12px 16px",
        borderRadius: "14px",
        border: "1.5px solid #F3E8FF",
        flexWrap: "wrap",
        boxShadow: "0 2px 5px rgba(192, 132, 252, 0.02)"
    },
    dateInputGroup: {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    dateLabel: {
        fontSize: "13px",
        color: "#64748B",
        fontWeight: "500"
    },
    dateInput: {
        padding: "6px 10px",
        borderRadius: "10px",
        border: "1.5px solid #F3E8FF",
        fontSize: "13px",
        fontFamily: "'Prompt', sans-serif",
        color: "#334155",
        outline: "none"
    },
    clearDateBtn: {
        padding: "6px 12px",
        borderRadius: "10px",
        border: "none",
        backgroundColor: "#FEF2F2",
        color: "#EF4444",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer"
    },
    filterTabContainer: {
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
        flexWrap: "wrap"
    },
    filterTabBtn: {
        padding: "8px 18px",
        borderRadius: "14px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        border: "1.5px solid",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
    },
    gridContainer: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "20px"
    },
    reportCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: "18px",
        padding: "20px",
        border: "1.5px solid #F3E8FF",
        boxShadow: "0 4px 15px rgba(192, 132, 252, 0.05)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "transform 0.2s ease, boxShadow 0.2s ease"
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "14px",
        gap: "10px"
    },
    problemTitle: {
        fontSize: "15px",
        fontWeight: "bold",
        color: "#1E293B"
    },
    statusBadge: {
        fontSize: "11px",
        fontWeight: "600",
        padding: "4px 10px",
        borderRadius: "8px",
        whiteSpace: "nowrap"
    },
    cardBody: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "18px"
    },
    infoRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    infoIcon: {
        fontSize: "16px",
        color: "#94A3B8"
    },
    infoText: {
        fontSize: "13px",
        color: "#475569"
    },
    cardFooter: {
        borderTop: "1.5px solid #F8FAFC",
        paddingTop: "14px",
        display: "flex",
        justifyContent: "flex-end"
    },
    detailBtn: {
        padding: "8px 16px",
        borderRadius: "12px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600",
        border: "none",
        width: "100%",
        textAlign: "center",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
    },
    emptyStateCard: {
        backgroundColor: "#FFFFFF",
        border: "1.5px solid #F3E8FF",
        borderRadius: "18px",
        padding: "60px 20px",
        textAlign: "center",
        color: "#94A3B8",
        fontSize: "14px",
        boxShadow: "0 4px 15px rgba(192, 132, 252, 0.04)"
    },
    loadingContainer: {
        textAlign: "center",
        padding: "120px 20px",
        color: "#9333EA",
        fontSize: "15px",
        fontWeight: "600",
        fontFamily: "'Prompt', sans-serif"
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid #E2E8F0",
        borderTop: "4px solid #9333EA",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "0 auto 16px auto"
    }
};