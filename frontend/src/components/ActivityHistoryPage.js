import React, { useState, useMemo } from 'react';

export default function ActivityHistoryPage() {
    const [roleTab, setRoleTab] = useState("donate"); // 'donate' หรือ 'receive'

    const [donationHistory] = useState([
        {
            id: 1,
            date: "2026-05-18T11:30:00Z",
            name: "ข้าวกล่องกระเพราไก่ (ทำสดใหม่)",
            category: "อาหารพร้อมทาน",
            amountText: "25 กล่อง",
        },
        {
            id: 2,
            date: "2026-05-15T16:00:00Z",
            name: "ขนมปังและเบเกอรี่โฮมเมด",
            category: "เบเกอรี่ / ขนม",
            amountText: "3 กิโลกรัม",
        },
        {
            id: 3,
            date: "2026-05-10T14:20:00Z",
            name: "แกงเขียวหวานและข้าวสวย",
            category: "อาหารพร้อมทาน",
            amountText: "10 กล่อง",
        }
    ]);

    const [receiveHistory] = useState([
        {
            id: 101,
            date: "2026-05-20T12:00:00Z",
            name: "ข้าวต้มหมูสับร้อนๆ",
            category: "อาหารพร้อมทาน",
            amountText: "2 ชุด",
        },
        {
            id: 102,
            date: "2026-05-12T15:30:00Z",
            name: "ชุดผลไม้รวมวิตามินซี",
            category: "ผลไม้",
            amountText: "1 แพ็ก",
        }
    ]);

    // State สำหรับการค้นหาและกรองช่วงเวลา
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState("all");

    // เลือกชุดข้อมูลตาม Tab ที่กำลังเลือกอยู่
    const currentList = roleTab === "donate" ? donationHistory : receiveHistory;

    // คำนวณหมวดหมู่ที่บริจาคบ่อยที่สุด (ตัวอย่างอย่างง่าย)
    const favoriteCategory = "อาหารพร้อมทาน";

    // ฟังก์ชันกรองข้อมูลตามช่วงเวลาและคำค้นหา
    const filteredHistory = useMemo(() => {
        const now = new Date();

        return currentList.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());

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

            return matchesSearch && matchesDate;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [currentList, searchQuery, dateFilter]);

    return (
        <div style={styles.container}>

            {/* ส่วนหัวต้อนรับ */}
            <div style={styles.welcomeCard}>
                <div>
                    <span style={styles.miniTag}>
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>favorite</span>
                        กิจกรรมของคุณในระบบ
                    </span>
                    <h2 style={styles.welcomeTitle}>ส่งต่อความสุขและรับน้ำใจไมตรี</h2>
                    <p style={styles.welcomeDesc}>ตรวจสอบประวัติการแบ่งปันอาหารและการรับมอบอาหารของคุณได้จากที่นี่</p>
                </div>
                <div style={styles.headerIconBox}>
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#c084fc' }}>
                        volunteer_activism
                    </span>
                </div>
            </div>

            {/* ส่วนสถิติภาพรวม 3 กรอบใหม่ */}
            <div style={styles.statsRow}>
                {/* กรอบที่ 1: จำนวนรายการอาหารที่ลงบริจาค (โทนสีชมพูพาสเทล) */}
                <div style={styles.statCardPink}>
                    <div style={{ ...styles.statIconBox, backgroundColor: '#ffe0f1', color: '#fc6fbc' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>package_2</span>
                    </div>
                    <div>
                        <p style={styles.statLabel}>รายการอาหารที่ลงบริจาค</p>
                        <h3 style={{ ...styles.statValue, color: '#fc6fbc' }}>
                            {donationHistory.length} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>รายการ</span>
                        </h3>
                    </div>
                </div>

                {/* กรอบที่ 2: บริจาคไปแล้วกี่ครั้ง (โทนสีฟ้าพาสเทล) */}
                <div style={styles.statCardSky}>
                    <div style={{ ...styles.statIconBox, backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>card_giftcard</span>
                    </div>
                    <div>
                        <p style={styles.statLabel}>จำนวนครั้งที่บริจาค</p>
                        <h3 style={{ ...styles.statValue, color: '#0369a1' }}>
                            {/* สมมติว่ามีตัวแปรนับจำนวนครั้งรวม หรือนับจากจำนวนโพสต์ */}
                            {donationHistory.length} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>ครั้ง</span>
                        </h3>
                    </div>
                </div>

                {/* กรอบที่ 3: หมวดหมู่ที่บริจาคบ่อยที่สุด */}
                <div style={styles.statCardMint}>
                    <div style={{ ...styles.statIconBox, backgroundColor: '#dcfce7', color: '#059669' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>restaurant_menu</span>
                    </div>
                    <div>
                        <p style={styles.statLabel}>หมวดหมู่บริจาค/รับบริจาคบ่อย</p>
                        <h3 style={{ fontSize: '15px', color: '#047857', marginTop: '4px', fontWeight: '700' }}>
                            {favoriteCategory}
                        </h3>
                    </div>
                </div>
            </div>

            {/* ส่วนรายการประวัติ พร้อมปุ่มสลับ Tab และเครื่องมือค้นหา */}
            <div style={styles.feedSection}>

                {/* ปุ่มสลับ Tab (ผู้บริจาค / ผู้รับบริจาค) */}
                <div style={styles.roleTabContainer}>
                    <button
                        onClick={() => { setRoleTab("donate"); setSearchQuery(""); }}
                        style={{
                            ...styles.roleTabButton,
                            backgroundColor: roleTab === "donate" ? "#C084FC" : "#f8fafc",
                            color: roleTab === "donate" ? "#ffffff" : "#64748b",
                            borderColor: roleTab === "donate" ? "#C084FC" : "#e2e8f0"
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>card_giftcard</span>
                        ประวัติการบริจาคของฉัน ({donationHistory.length})
                    </button>
                    <button
                        onClick={() => { setRoleTab("receive"); setSearchQuery(""); }}
                        style={{
                            ...styles.roleTabButton,
                            backgroundColor: roleTab === "receive" ? "#C084FC" : "#f8fafc",
                            color: roleTab === "receive" ? "#ffffff" : "#64748b",
                            borderColor: roleTab === "receive" ? "#C084FC" : "#e2e8f0"
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>redeem</span>
                        ประวัติการรับบริจาคของฉัน ({receiveHistory.length})
                    </button>
                </div>

                <div style={styles.feedHeader}>
                    <h3 style={styles.feedTitle}>
                        {roleTab === "donate" ? "รายการที่เคยบริจาค" : "รายการที่เคยขอรับ"}
                    </h3>
                    <span style={styles.feedCount}>แสดง {filteredHistory.length} จาก {currentList.length} รายการ</span>
                </div>

                {/* แถบเครื่องมือค้นหาและฟิลเตอร์ช่วงเวลา */}
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
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#94a3b8' }}>calendar_today</span>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            style={{ ...styles.selectInput, paddingRight: '30px' }}
                        >
                            <option value="all">ทั้งหมด</option>
                            <option value="7days">7 วันล่าสุด</option>
                            <option value="14days">14 วันล่าสุด</option>
                            <option value="30days">30 วันล่าสุด</option>
                            <option value="thisyear">ปีนี้</option>
                        </select>
                    </div>
                </div>

                {/* รายการ Feed List */}
                <div style={styles.feedList}>
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((item) => (
                            <div key={item.id} style={styles.feedItem}>
                                <div style={styles.feedItemLeft}>
                                    <div style={styles.itemIconBox}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#b672fa' }}>
                                            {roleTab === 'donate' ? 'volunteer_activism' : 'redeem'}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 style={styles.itemName}>{item.name}</h4>
                                        <div style={styles.itemMetaRow}>
                                            <span style={styles.itemCategory}>{item.category}</span>
                                            <span style={styles.dotSeparator}>•</span>
                                            <span style={styles.itemDate}>
                                                {new Date(item.date).toLocaleDateString('th-TH', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={styles.feedItemRight}>
                                    <span style={styles.itemWeightLabel}>
                                        {roleTab === 'donate' ? 'จำนวนที่บริจาค' : 'จำนวนที่รับ'}
                                    </span>
                                    <span style={styles.itemWeightValue}>{item.amountText}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={styles.emptyState}>
                            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#cbd5e1', marginBottom: '8px' }}>search_off</span>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>ไม่พบประวัติรายการในช่วงเวลาที่คุณเลือก</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

const styles = {
    container: {
        maxWidth: "1080px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "30px 20px",
        fontFamily: "'Prompt', sans-serif",
    },
    welcomeCard: {
        backgroundColor: "#faf5ff",
        border: "1.5px solid #f3e8ff",
        borderRadius: "20px",
        padding: "28px 36px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 4px 15px rgba(192, 132, 252, 0.05)",
    },
    headerIconBox: {
        backgroundColor: "#FFFFFF",
        padding: "16px",
        borderRadius: "16px",
        boxShadow: "0 4px 12px rgba(192, 132, 252, 0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    miniTag: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: "#f3e8ff",
        color: "#b672fa",
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
        marginBottom: "10px",
    },
    welcomeTitle: {
        fontSize: "24px",
        fontWeight: "700",
        color: "#c084fc",
        margin: "0 0 6px 0",
    },
    welcomeDesc: {
        fontSize: "14px",
        color: "#475569",
        margin: 0,
    },
    statsRow: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "20px",
    },
    statCardPrimary: {
        backgroundColor: "#c084fc",
        borderRadius: "20px",
        padding: "24px",
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        gap: "18px",
        boxShadow: "0 8px 20px rgba(192, 132, 252, 0.25)",
    },
    statIconBoxPrimary: {
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        padding: "14px",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    statLabelPrimary: {
        fontSize: "14px",
        opacity: "0.95",
        margin: "0 0 6px 0",
        fontWeight: "500",
    },
    statValuePrimary: {
        fontSize: "26px",
        fontWeight: "700",
        margin: 0,
    },
    statCardPink: {
        backgroundColor: "#fdf2f8",
        border: "1.5px solid #fbcfe8",
        borderRadius: "20px",
        padding: "24px",
        display: "flex",
        alignItems: "center",
        gap: "18px",
        boxShadow: "0 4px 12px rgba(244, 114, 182, 0.05)",
    },
    statCardSky: {
        backgroundColor: "#f0f9ff",
        border: "1.5px solid #d7efff",
        borderRadius: "20px",
        padding: "24px",
        display: "flex",
        alignItems: "center",
        gap: "18px",
        boxShadow: "0 4px 12px rgba(56, 189, 248, 0.05)",
    },
    statCardMint: {
        backgroundColor: "#ecfdf5",
        border: "1.5px solid #d1fae5",
        borderRadius: "20px",
        padding: "24px",
        display: "flex",
        alignItems: "center",
        gap: "18px",
        boxShadow: "0 4px 12px rgba(52, 211, 153, 0.05)",
    },
    statIconBox: {
        padding: "14px",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    statLabel: {
        fontSize: "14px",
        color: "#64748b",
        margin: "0 0 6px 0",
        fontWeight: "500",
    },
    statValue: {
        fontSize: "26px",
        fontWeight: "700",
        margin: 0,
    },
    feedSection: {
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        padding: "28px 36px",
        border: "1.5px solid #f1f5f9",
        boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
    },
    roleTabContainer: {
        display: "flex",
        gap: "12px",
        marginBottom: "24px",
    },
    roleTabButton: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "12px 20px",
        borderRadius: "14px",
        fontSize: "14px",
        fontWeight: "600",
        border: "1.5px solid",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    feedHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
    },
    feedTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#1e293b",
        margin: 0,
    },
    feedCount: {
        fontSize: "13px",
        color: "#64748b",
        backgroundColor: "#f8fafc",
        padding: "6px 12px",
        borderRadius: "12px",
        fontWeight: "600",
        border: "1px solid #e2e8f0",
    },
    filterToolbar: {
        display: "flex",
        gap: "12px",
        marginBottom: "20px",
        flexWrap: "wrap",
    },
    searchBox: {
        flex: "1 1 240px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backgroundColor: "#f8fafc",
        border: "1.5px solid #e2e8f0",
        borderRadius: "14px",
        padding: "0 14px",
    },
    searchInput: {
        width: "100%",
        border: "none",
        backgroundColor: "transparent",
        padding: "12px 0",
        fontSize: "14px",
        color: "#1e293b",
        outline: "none",
    },
    filterGroup: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "#f8fafc",
        border: "1.5px solid #e2e8f0",
        borderRadius: "14px",
        padding: "0 14px",
    },
    selectInput: {
        border: "none",
        backgroundColor: "transparent",
        padding: "12px 0",
        fontSize: "14px",
        color: "#475569",
        outline: "none",
        cursor: "pointer",
    },
    feedList: {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },
    feedItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        backgroundColor: "#faf5ff",
        border: "1.5px solid #f3e8ff",
        borderRadius: "16px",
    },
    feedItemLeft: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
    },
    itemIconBox: {
        backgroundColor: "#f3e8ff",
        padding: "12px",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    itemName: {
        fontSize: "15px",
        fontWeight: "600",
        color: "#1e293b",
        margin: "0 0 6px 0",
    },
    itemMetaRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    itemCategory: {
        fontSize: "13px",
        color: "#b672fa",
        backgroundColor: "#f3e8ff",
        padding: "2px 10px",
        borderRadius: "8px",
        fontWeight: "500",
    },
    dotSeparator: {
        color: "#cbd5e1",
        fontSize: "12px",
    },
    itemDate: {
        fontSize: "13px",
        color: "#64748b",
    },
    feedItemRight: {
        textAlign: "right",
    },
    itemWeightLabel: {
        display: "block",
        fontSize: "12px",
        color: "#64748b",
        marginBottom: "2px",
    },
    itemWeightValue: {
        fontSize: "15px",
        fontWeight: "700",
        color: "#b672fa",
    },
    emptyState: {
        textAlign: "center",
        padding: "40px 20px",
        backgroundColor: "#f8fafc",
        borderRadius: "16px",
        border: "1.5 dashed #e2e8f0",
    },
};