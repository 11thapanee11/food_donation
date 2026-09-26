import React, { useState } from "react";

export default function CommunityImpactPage() {
    const [impactData] = useState({
        totalDonations: 1420,
        activeDonors: 2483,
        pickupLocations: 156,
        recentActivities: [
            { id: 1, text: "ร้าน Green Valley ส่งมอบอาหารพร้อมทาน 25 มื้อ", location: "ย่านใจกลางเมือง", time: "2 นาทีที่แล้ว" },
            { id: 2, text: "ร้าน Happy Bakery แบ่งปันเบเกอรี่อบสดใหม่", location: "เขตเหนือ", time: "15 นาทีที่แล้ว" },
            { id: 3, text: "คุณสมชาย ส่งมอบอาหารสดและวัตถุดิบ 15 ชุด", location: "ตลาดตะวันตก", time: "1 ชั่วโมงที่แล้ว" },
            { id: 4, text: "ร้านกาแฟชิวชิว ส่งมอบเบเกอรี่เหลือประจำวัน", location: "โซน ม.เชียงใหม่", time: "2 ชั่วโมงที่แล้ว" },
        ]
    });

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

                    {/* 1. ยอดการแบ่งปันทั้งหมด (สี #C084FC) */}
                    <div style={{ ...styles.statCard, borderColor: "#E9D5FF" }}>
                        <div style={styles.cardHeader}>
                            <div style={{ ...styles.iconBadge, backgroundColor: "#FAF5FF", color: "#C084FC" }}>
                                <span className="material-symbols-outlined">volunteer_activism</span>
                            </div>
                            <span style={{ ...styles.trendTag, color: "#C084FC" }}>↗ +23% เดือนนี้</span>
                        </div>
                        <div style={styles.cardBody}>
                            <span style={styles.cardLabel}>ยอดการแบ่งปันทั้งหมด</span>
                            <h2 style={{ ...styles.cardValue, color: "#C084FC" }}>
                                {impactData.totalDonations.toLocaleString()}{" "}
                                <span style={{ fontSize: "18px", fontWeight: "700" }}>ครั้ง</span>
                            </h2>
                            <p style={styles.cardDescription}>จำนวนครั้งที่มีการส่งมอบอาหารสำเร็จ</p>
                        </div>
                    </div>

                    {/* 2. ผู้ร่วมส่งต่อสายบุญ (สี #38BDF8) */}
                    <div style={{ ...styles.statCard, borderColor: "#BAE6FD" }}>
                        <div style={styles.cardHeader}>
                            <div style={{ ...styles.iconBadge, backgroundColor: "#F0F9FF", color: "#38BDF8" }}>
                                <span className="material-symbols-outlined">group</span>
                            </div>
                            <span style={{ ...styles.trendTag, color: "#38BDF8" }}>↗ +8% เดือนนี้</span>
                        </div>
                        <div style={styles.cardBody}>
                            <span style={styles.cardLabel}>ผู้ร่วมส่งต่อสายบุญ</span>
                            <h2 style={{ ...styles.cardValue, color: "#38BDF8" }}>
                                {impactData.activeDonors.toLocaleString()}
                            </h2>
                            <p style={styles.cardDescription}>ร้านค้าและบุคคลที่ร่วมบริจาคอาหาร</p>
                        </div>
                    </div>

                    {/* 3. จุดรับ-ส่งมอบอาหาร (สี #34D399) */}
                    <div style={{ ...styles.statCard, borderColor: "#A7F3D0" }}>
                        <div style={styles.cardHeader}>
                            <div style={{ ...styles.iconBadge, backgroundColor: "#ECFDF5", color: "#34D399" }}>
                                <span className="material-symbols-outlined">location_on</span>
                            </div>
                            <span style={{ ...styles.trendTag, color: "#34D399" }}>↗ +12% เดือนนี้</span>
                        </div>
                        <div style={styles.cardBody}>
                            <span style={styles.cardLabel}>จุดรับ-ส่งมอบอาหาร</span>
                            <h2 style={{ ...styles.cardValue, color: "#34D399" }}>
                                {impactData.pickupLocations.toLocaleString()}
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
                            <h3 style={styles.sectionTitle}>การส่งต่อล่าสุดในระบบ (Live Feed)</h3>
                            <p style={{ margin: 0, fontSize: "13px", color: "#94A3B8" }}>
                                ความเคลื่อนไหวการบริจาคอาหารแบบเรียลไทม์
                            </p>
                        </div>
                    </div>

                    <div style={styles.feedList}>
                        {impactData.recentActivities.map((act) => (
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
                        ))}
                    </div>
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
    trendTag: {
        fontSize: "12px",
        fontWeight: "700",
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
        marginBottom: "24px",
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
};