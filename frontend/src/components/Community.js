import React, { useEffect, useState } from "react";

export default function CommunityImpactPage() {
    const [impactData, setImpactData] = useState({
        totalDonations: 0,
        activeDonors: 0,
        pickupLocations: 0,
        recentActivities: []
    });
    const [loading, setLoading] = useState(true);

    // State สำหรับการแบ่งหน้า (Pagination)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const BASE_URL = "http://localhost:8082";

    useEffect(() => {
        // ดึงข้อมูลสถิติและกิจกรรมจาก Backend
        fetch(`${BASE_URL}/community/impact`)
            .then((res) => res.json())
            .then((resData) => {
                if (resData.success && resData.data) {
                    // กรองเฉพาะรายการที่ส่งมอบสำเร็จ และปรับข้อความให้กระชับ อ่านง่าย ไม่ซ้ำซ้อน
                    const completedActivities = (resData.data.recentActivities || [])
                        .filter(act => act.status === "completed" || (act.text && act.text.includes("สำเร็จ")))
                        .map(act => ({
                            ...act,
                            text: act.text
                                .replace(/ผู้รับได้ดำเนินการจองและรับมอบ/g, "ผู้รับบริจาคได้ดำเนินขอรับบริจาคและรับมอบ")
                                .replace(/สำเร็จ/g, "")
                                .trim() + " สำเร็จ"
                        }));

                    setImpactData({
                        ...resData.data,
                        recentActivities: completedActivities
                    });
                }
            })
            .catch((err) => {
                console.error("Fetch Community Impact Error:", err);
            })
            .finally(() => setLoading(false));
    }, []);

    // คำนวณข้อมูลสำหรับการแบ่งหน้า
    const allActivities = impactData.recentActivities || [];
    const totalPages = Math.ceil(allActivities.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentActivities = allActivities.slice(indexOfFirstItem, indexOfLastItem);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <div style={styles.fullWidthWrapper}>
            <div style={styles.container}>

                {/* Header Section */}
                <div style={styles.headerSection}>
                    <div style={styles.headerBadge}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#C084FC" }}>
                            favorite
                        </span>
                        <span>พลังแห่งการส่งต่อของพวกเรา</span>
                    </div>
                    <h1 style={styles.mainTitle}>ผลลัพธ์การร่วมใจ แจกจ่ายเพื่อลดขยะอาหาร</h1>
                    <p style={styles.subTitle}>
                        ทุกรายการอาหารที่นำมาแบ่งปันและแจกจ่าย ช่วยเปลี่ยนอาหารส่วนเกินให้กลายเป็นมื้อที่มีคุณค่า ร่วมกันขับเคลื่อนชุมชนของเราให้ปลอดขยะอาหาร
                    </p>
                </div>

                {/* Stat Cards Grid */}
                <div style={styles.statsGrid}>

                    {/* 1. ยอดการแบ่งปันทั้งหมด */}
                    <div style={{ ...styles.statCard, borderColor: "#E9D5FF" }}>
                        <div style={styles.cardHeader}>
                            <div style={{ ...styles.iconBadge, backgroundColor: "#FAF5FF", color: "#C084FC" }}>
                                <span className="material-symbols-outlined">volunteer_activism</span>
                            </div>
                        </div>
                        <div style={styles.cardBody}>
                            <span style={styles.cardLabel}>ยอดการแบ่งปันทั้งหมด</span>
                            <h2 style={{ ...styles.cardValue, color: "#C084FC" }}>
                                {loading ? "..." : (impactData.totalDonations || 0).toLocaleString()}{" "}
                                <span style={{ fontSize: "18px", fontWeight: "700" }}>ครั้ง</span>
                            </h2>
                            <p style={styles.cardDescription}>จำนวนครั้งที่มีการส่งมอบอาหารสำเร็จ</p>
                        </div>
                    </div>

                    {/* 2. ผู้ร่วมส่งต่อ */}
                    <div style={{ ...styles.statCard, borderColor: "#BAE6FD" }}>
                        <div style={styles.cardHeader}>
                            <div style={{ ...styles.iconBadge, backgroundColor: "#F0F9FF", color: "#38BDF8" }}>
                                <span className="material-symbols-outlined">group</span>
                            </div>
                        </div>
                        <div style={styles.cardBody}>
                            <span style={styles.cardLabel}>ผู้ร่วมแบ่งปัน</span>
                            <h2 style={{ ...styles.cardValue, color: "#38BDF8" }}>
                                {loading ? "..." : (impactData.activeDonors || 0).toLocaleString()}
                            </h2>
                            <p style={styles.cardDescription}>ร้านค้าและบุคคลที่ร่วมบริจาคอาหาร</p>
                        </div>
                    </div>

                    {/* 3. จุดรับ-ส่งมอบอาหาร */}
                    <div style={{ ...styles.statCard, borderColor: "#A7F3D0" }}>
                        <div style={styles.cardHeader}>
                            <div style={{ ...styles.iconBadge, backgroundColor: "#ECFDF5", color: "#34D399" }}>
                                <span className="material-symbols-outlined">location_on</span>
                            </div>
                        </div>
                        <div style={styles.cardBody}>
                            <span style={styles.cardLabel}>จุดรับ-ส่งมอบอาหาร</span>
                            <h2 style={{ ...styles.cardValue, color: "#34D399" }}>
                                {loading ? "..." : (impactData.pickupLocations || 0).toLocaleString()}
                            </h2>
                            <p style={styles.cardDescription}>พื้นที่แบ่งปันอาหารกระจายทั่วเมือง</p>
                        </div>
                    </div>

                </div>

                {/* Live Activity Feed */}
                <div style={styles.sectionCard}>
                    <div style={styles.sectionHeader}>
                        <div style={styles.historyIconCircle}>
                            <span className="material-symbols-outlined" style={{ color: "#C084FC", fontSize: "22px" }}>
                                history
                            </span>
                        </div>
                        <div>
                            <h3 style={styles.sectionTitle}>การเคลื่อนไหวล่าสุดในระบบ (Live Feed)</h3>
                            <p style={{ margin: 0, fontSize: "13px", color: "#94A3B8" }}>
                                รายการที่มีการส่งมอบอาหารสำเร็จเรียบร้อยแล้ว
                            </p>
                        </div>
                    </div>

                    <div style={styles.feedList}>
                        {loading ? (
                            <p style={{ textAlign: "center", color: "#94A3B8", padding: "20px 0" }}>กำลังโหลดข้อมูล...</p>
                        ) : currentActivities.length > 0 ? (
                            currentActivities.map((act) => (
                                <div key={act.id} style={styles.feedItem}>
                                    <div style={styles.feedDot} />
                                    <div style={{ flex: 1 }}>
                                        <p style={styles.feedText}>{act.text}</p>
                                        <div style={styles.feedMeta}>
                                            <span style={styles.metaWithIcon}>
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>location_on</span>
                                                {act.location}
                                            </span>
                                            <span>•</span>
                                            <span style={styles.metaWithIcon}>
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>schedule</span>
                                                {act.time}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ textAlign: "center", color: "#94A3B8", padding: "20px 0" }}>ยังไม่มีกิจกรรมการส่งมอบอาหารสำเร็จในระบบ</p>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {allActivities.length > itemsPerPage && (
                        <div style={styles.paginationContainer}>
                            <button
                                style={{
                                    ...styles.pageButton,
                                    opacity: currentPage === 1 ? 0.5 : 1,
                                    cursor: currentPage === 1 ? "not-allowed" : "pointer"
                                }}
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_left</span>
                                ก่อนหน้า
                            </button>
                            <span style={styles.pageInfo}>
                                หน้า {currentPage} จาก {totalPages}
                            </span>
                            <button
                                style={{
                                    ...styles.pageButton,
                                    opacity: currentPage === totalPages ? 0.5 : 1,
                                    cursor: currentPage === totalPages ? "not-allowed" : "pointer"
                                }}
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                            >
                                ถัดไป
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_right</span>
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

// Inline Styles
const styles = {
    fullWidthWrapper: {
        width: "100%",
        backgroundColor: "#FAF5FF",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
    },
    container: {
        maxWidth: "1080px",
        width: "100%",
        padding: "36px 20px",
        fontFamily: "'Prompt', 'Kanit', sans-serif",
        color: "#334155",
        boxSizing: "border-box",
    },
    headerSection: {
        textAlign: "center",
        marginBottom: "40px",
    },
    headerBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: "#FFFFFF",
        border: "1px solid #F3E8FF",
        color: "#C084FC",
        padding: "6px 18px",
        borderRadius: "30px",
        fontSize: "13px",
        fontWeight: "600",
        marginBottom: "14px",
        boxShadow: "0 2px 8px rgba(192, 132, 252, 0.08)",
    },
    mainTitle: {
        fontSize: "32px",
        fontWeight: "800",
        color: "#334155",
        margin: "0 0 12px 0",
        letterSpacing: "-0.02em",
    },
    subTitle: {
        fontSize: "15px",
        color: "#64748B",
        maxWidth: "640px",
        margin: "0 auto",
        lineHeight: "1.6",
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px",
        marginBottom: "32px",
    },
    statCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: "24px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
        border: "1.5px solid",
        transition: "all 0.25s ease",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
    },
    iconBadge: {
        width: "44px",
        height: "44px",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    cardBody: {
        display: "flex",
        flexDirection: "column",
    },
    cardLabel: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#64748B",
        marginBottom: "6px",
    },
    cardValue: {
        fontSize: "32px",
        fontWeight: "800",
        margin: "0 0 6px 0",
        lineHeight: "1",
        letterSpacing: "-0.02em",
    },
    cardDescription: {
        fontSize: "12px",
        color: "#94A3B8",
        margin: 0,
        lineHeight: "1.4",
    },
    sectionCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: "24px",
        border: "1.5px solid #F3E8FF",
        padding: "28px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
    },
    sectionHeader: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        paddingBottom: "16px",
        borderBottom: "1px solid #F8FAFC",
    },
    historyIconCircle: {
        width: "42px",
        height: "42px",
        borderRadius: "14px",
        backgroundColor: "#FAF5FF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    sectionTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#334155",
        margin: 0,
    },
    feedList: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    feedItem: {
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        backgroundColor: "#FAF5FF",
        padding: "16px 20px",
        borderRadius: "18px",
        border: "1.5px solid #F3E8FF",
    },
    feedDot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        backgroundColor: "#C084FC",
        marginTop: "7px",
    },
    feedText: {
        margin: 0,
        fontSize: "14px",
        fontWeight: "600",
        color: "#334155",
    },
    feedMeta: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "12px",
        color: "#94A3B8",
        marginTop: "6px",
    },
    metaWithIcon: {
        display: "flex",
        alignItems: "center",
        gap: "3px",
    },
    paginationContainer: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "24px",
        paddingTop: "16px",
        borderTop: "1px solid #F1F5F9",
    },
    pageButton: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        backgroundColor: "#FAF5FF",
        color: "#9333EA",
        border: "1.5px solid #F3E8FF",
        padding: "8px 16px",
        borderRadius: "12px",
        fontSize: "13px",
        fontWeight: "600",
        transition: "all 0.2s",
    },
    pageInfo: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#64748B",
    },
};