import React, { useState, useEffect, useMemo } from 'react';

export default function ActivityHistoryPage() {
    const [donationHistory, setDonationHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");

    // State สำหรับการแบ่งหน้า (Pagination)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // กำหนดแสดง 5 รายการต่อหน้า

    const BASE_URL = "http://localhost:8082";

    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        fetch(`${BASE_URL}/foods/my-activity-history`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(resData => {
                if (resData.success) {
                    setDonationHistory(resData.data);
                }
            })
            .catch(err => console.error("Error fetching activity history:", err))
            .finally(() => setLoading(false));
    }, []);

    // รีเซ็ตหน้ากลับไปหน้า 1 เมื่อมีการเปลี่ยนคำค้นหาหรือตัวกรอง
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, dateFilter]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed':
                return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
            case 'pending':
                return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
            case 'cancelled':
                return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
            default:
                return { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' };
        }
    };

    const filteredHistory = useMemo(() => {
        const now = new Date();

        return donationHistory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || item.status === statusFilter;

            const itemDate = new Date(item.date);
            let matchesDate = true;

            if (dateFilter === "7days") {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(now.getDate() - 7);
                matchesDate = itemDate >= sevenDaysAgo;
            } else if (dateFilter === "14days") {
                const fourteenDaysAgo = new Date();
                fourteenDaysAgo.setDate(now.getDate() - 14);
                matchesDate = itemDate >= fourteenDaysAgo;
            } else if (dateFilter === "30days") {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                matchesDate = itemDate >= thirtyDaysAgo;
            } else if (dateFilter === "thisyear") {
                matchesDate = itemDate.getFullYear() === now.getFullYear();
            }

            return matchesSearch && matchesStatus && matchesDate;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [donationHistory, searchQuery, statusFilter, dateFilter]);

    // คำนวณข้อมูลที่จะแสดงในหน้าปัจจุบัน
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

    return (
        <div style={styles.container}>
            <div style={styles.welcomeCard}>
                <div>
                    <span style={styles.miniTag}>
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>favorite</span>
                        การบริจาคของคุณในระบบ
                    </span>
                    <h2 style={styles.welcomeTitle}>ประวัติการบริจาคอาหารของคุณ</h2>
                    <p style={styles.welcomeDesc}>ตรวจสอบสถานะและประวัติการแบ่งปันอาหารทั้งหมดตามการขอรับบริจาคได้จากที่นี่</p>
                </div>
                <div style={styles.headerIconBox}>
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#c084fc' }}>
                        volunteer_activism
                    </span>
                </div>
            </div>

            <div style={styles.statsRow}>
                <div style={styles.statCardPink}>
                    <div style={{ ...styles.statIconBox, backgroundColor: '#ffe0f1', color: '#fc6fbc' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>package_2</span>
                    </div>
                    <div>
                        <p style={styles.statLabel}>รายการอาหารของฉันทั้งหมด</p>
                        <h3 style={{ ...styles.statValue, color: '#fc6fbc' }}>
                            {donationHistory.length} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>รายการ</span>
                        </h3>
                    </div>
                </div>

                <div style={styles.statCardSky}>
                    <div style={{ ...styles.statIconBox, backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>card_giftcard</span>
                    </div>
                    <div>
                        <p style={styles.statLabel}>จำนวนครั้งที่บริจาค</p>
                        <h3 style={{ ...styles.statValue, color: '#0369a1' }}>
                            {donationHistory.length} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>ครั้ง</span>
                        </h3>
                    </div>
                </div>
            </div>

            <div style={styles.feedSection}>
                <div style={styles.feedHeader}>
                    <h3 style={styles.feedTitle}>ประวัติการบริจาคของฉัน</h3>
                    <span style={styles.feedCount}>แสดง {filteredHistory.length} จาก {donationHistory.length} รายการ</span>
                </div>

                <div style={styles.filterToolbar}>
                    <div style={styles.searchBox}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#94a3b8' }}>search</span>
                        <input
                            type="text"
                            placeholder="ค้นหารายการ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>

                    <div style={styles.filterGroup}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#94a3b8' }}>filter_list</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ ...styles.selectInput, paddingRight: '30px' }}
                        >
                            <option value="all">ทุกสถานะ</option>
                            <option value="pending">รอดำเนินการ</option>
                            <option value="completed">เสร็จสิ้น</option>
                            <option value="cancelled">ยกเลิกแล้ว</option>
                        </select>
                    </div>

                    <div style={styles.filterGroup}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#94a3b8' }}>calendar_today</span>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            style={{ ...styles.selectInput, paddingRight: '30px' }}
                        >
                            <option value="all">ทุกช่วงเวลา</option>
                            <option value="7days">7 วันล่าสุด</option>
                            <option value="14days">14 วันล่าสุด</option>
                            <option value="30days">30 วันล่าสุด</option>
                        </select>
                    </div>
                </div>

                <div style={styles.feedList}>
                    {loading ? (
                        <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>กำลังโหลดข้อมูล...</p>
                    ) : currentItems.length > 0 ? (
                        currentItems.map((item) => {
                            const badgeStyle = getStatusStyle(item.status);
                            return (
                                <div key={item.id} style={styles.feedItem}>
                                    <div style={styles.feedItemLeft}>
                                        <div style={styles.itemIconBox}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#b672fa' }}>
                                                volunteer_activism
                                            </span>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                <h4 style={styles.itemName}>{item.name}</h4>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    backgroundColor: badgeStyle.bg,
                                                    color: badgeStyle.color,
                                                    border: `1px solid ${badgeStyle.border}`
                                                }}>
                                                    {item.statusText}
                                                </span>
                                            </div>
                                            <div style={styles.itemMetaRow}>
                                                <span style={styles.itemDate}>
                                                    {new Date(item.date).toLocaleDateString('th-TH', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })} เวลา {new Date(item.date).toLocaleTimeString('th-TH', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: false
                                                    })} น.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={styles.feedItemRight}>
                                        <span style={styles.itemWeightLabel}>จำนวนที่บริจาค</span>
                                        <span style={styles.itemWeightValue}>{item.amountText}</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={styles.emptyState}>
                            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#cbd5e1', marginBottom: '8px' }}>search_off</span>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>ไม่พบประวัติรายการตามเงื่อนไขที่คุณเลือก</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={styles.paginationContainer}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_left</span> ก่อนหน้า
                        </button>
                        <span style={styles.pageInfo}>
                            หน้า {currentPage} จาก {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}
                        >
                            ถัดไป <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_right</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { maxWidth: "1080px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px", padding: "30px 20px", fontFamily: "'Prompt', sans-serif" },
    welcomeCard: { backgroundColor: "#faf5ff", border: "1.5px solid #f3e8ff", borderRadius: "20px", padding: "28px 36px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 15px rgba(192, 132, 252, 0.05)" },
    headerIconBox: { backgroundColor: "#FFFFFF", padding: "16px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(192, 132, 252, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" },
    miniTag: { display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#f3e8ff", color: "#b672fa", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", marginBottom: "10px" },
    welcomeTitle: { fontSize: "24px", fontWeight: "700", color: "#c084fc", margin: "0 0 6px 0" },
    welcomeDesc: { fontSize: "14px", color: "#475569", margin: 0 },
    statsRow: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" },
    statCardPink: { backgroundColor: "#fdf2f8", border: "1.5px solid #fbcfe8", borderRadius: "20px", padding: "24px", display: "flex", alignItems: "center", gap: "18px" },
    statCardSky: { backgroundColor: "#f0f9ff", border: "1.5px solid #d7efff", borderRadius: "20px", padding: "24px", display: "flex", alignItems: "center", gap: "18px" },
    statIconBox: { padding: "14px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" },
    statLabel: { fontSize: "14px", color: "#64748b", margin: "0 0 6px 0", fontWeight: "500" },
    statValue: { fontSize: "26px", fontWeight: "700", margin: 0 },
    feedSection: { backgroundColor: "#FFFFFF", borderRadius: "20px", padding: "28px 36px", border: "1.5px solid #f1f5f9", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" },
    feedHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
    feedTitle: { fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: 0 },
    feedCount: { fontSize: "13px", color: "#64748b", backgroundColor: "#f8fafc", padding: "6px 12px", borderRadius: "12px", fontWeight: "600", border: "1px solid #e2e8f0" },
    filterToolbar: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
    searchBox: { flex: "1 1 220px", display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "0 14px" },
    searchInput: { width: "100%", border: "none", backgroundColor: "transparent", padding: "12px 0", fontSize: "14px", color: "#1e293b", outline: "none" },
    filterGroup: { display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "0 14px" },
    selectInput: { border: "none", backgroundColor: "transparent", padding: "12px 0", fontSize: "14px", color: "#475569", outline: "none", cursor: "pointer" },
    feedList: { display: "flex", flexDirection: "column", gap: "14px" },
    feedItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", backgroundColor: "#faf5ff", border: "1.5px solid #f3e8ff", borderRadius: "16px" },
    feedItemLeft: { display: "flex", alignItems: "center", gap: "16px" },
    itemIconBox: { backgroundColor: "#f3e8ff", padding: "12px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" },
    itemName: { fontSize: "15px", fontWeight: "600", color: "#1e293b", margin: 0 },
    itemMetaRow: { display: "flex", alignItems: "center", gap: "10px" },
    itemDate: { fontSize: "13px", color: "#64748b" },
    feedItemRight: { textAlign: "right" },
    itemWeightLabel: { display: "block", fontSize: "12px", color: "#64748b", marginBottom: "2px" },
    itemWeightValue: { fontSize: "15px", fontWeight: "700", color: "#b672fa" },
    emptyState: { textAlign: "center", padding: "40px 20px", backgroundColor: "#f8fafc", borderRadius: "16px", border: "1.5 dashed #e2e8f0" },
    paginationContainer: { display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "30px" },
    pageBtn: { backgroundColor: "#FFFFFF", border: "1.5px solid #E9D5FF", color: "#9333EA", padding: "8px 16px", borderRadius: "12px", fontWeight: "600", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" },
    pageInfo: { fontSize: "14px", fontWeight: "600", color: "#64748b" }
};