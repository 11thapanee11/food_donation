import React, { useState, useMemo } from 'react';

export default function ImpactDashboard() {
    // สมมติข้อมูลจำลอง (Mock Data)
    const [summary] = useState({
        totalWeight: 68.5,
        totalDonations: 14,
        favoriteCategory: "อาหารกล่องพร้อมทาน",
        peopleHelpedApprox: 135
    });

    const [impactHistory] = useState([
        {
            id: 1,
            date: "2026-05-18T11:30:00Z",
            name: "ข้าวกล่องกระเพราไก่ (ทำสดใหม่)",
            category: "อาหารพร้อมทาน",
            weight: 5.5,
        },
        {
            id: 2,
            date: "2026-05-15T16:00:00Z",
            name: "ขนมปังและเบเกอรี่โฮมเมด",
            category: "เบเกอรี่ / ขนม",
            weight: 3.0,
        },
        {
            id: 3,
            date: "2026-05-10T14:20:00Z",
            name: "แกงเขียวหวานและข้าวสวย",
            category: "อาหารพร้อมทาน",
            weight: 8.2,
        },
        {
            id: 4,
            date: "2026-05-02T10:00:00Z",
            name: "ผลไม้สดตามฤดูกาล (มะม่วง/กล้วย)",
            category: "ผลไม้",
            weight: 4.5,
        }
    ]);

    // State สำหรับการค้นหาและกรองช่วงเวลา
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState("all");

    // ฟังก์ชันกรองข้อมูลตามช่วงเวลาและคำค้นหา
    const filteredHistory = useMemo(() => {
        const now = new Date();

        return impactHistory.filter(item => {
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
    }, [impactHistory, searchQuery, dateFilter]);

    return (
        <div style={styles.container}>

            {/* ส่วนหัวต้อนรับ */}
            <div style={styles.welcomeCard}>
                <div>
                    <span style={styles.miniTag}>
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>eco</span>
                        สถิติการแบ่งปันของคุณ
                    </span>
                    <h2 style={styles.welcomeTitle}>ส่งต่อความสุข ลดขยะอาหารไปด้วยกัน</h2>
                    <p style={styles.welcomeDesc}>ทุกชิ้นส่วนของอาหารที่คุณนำมาแบ่งปัน ช่วยสร้างประโยชน์และคุณค่าให้สังคมได้เสมอ</p>
                </div>
                <div style={styles.headerIconBox}>
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#c084fc' }}>
                        volunteer_activism
                    </span>
                </div>
            </div>

            {/* ส่วนสถิติภาพรวม */}
            <div style={styles.statsRow}>
                <div style={styles.statCardPrimary}>
                    <div style={styles.statIconBoxPrimary}>
                        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#FFFFFF' }}>scale</span>
                    </div>
                    <div>
                        <p style={styles.statLabelPrimary}>น้ำหนักอาหารที่ช่วยลดขยะ</p>
                        <h3 style={styles.statValuePrimary}>{summary.totalWeight.toFixed(1)} <span style={{ fontSize: '18px', fontWeight: '400' }}>กก.</span></h3>
                    </div>
                </div>

                <div style={styles.statCardSky}>
                    <div style={{ ...styles.statIconBox, backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>card_giftcard</span>
                    </div>
                    <div>
                        <p style={styles.statLabel}>แบ่งปันไปแล้ว</p>
                        <h3 style={styles.statValue}>{summary.totalDonations} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>ครั้ง</span></h3>
                    </div>
                </div>

                <div style={styles.statCardMint}>
                    <div style={{ ...styles.statIconBox, backgroundColor: '#dcfce7', color: '#059669' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>restaurant_menu</span>
                    </div>
                    <div>
                        <p style={styles.statLabel}>หมวดหมู่ยอดฮิต</p>
                        <h3 style={{ ...styles.statValue, fontSize: '16px', color: '#047857', marginTop: '4px' }}>{summary.favoriteCategory}</h3>
                    </div>
                </div>
            </div>

            {/* ส่วนรายการประวัติ พร้อมระบบค้นหาและฟิลเตอร์ช่วงเวลา */}
            <div style={styles.feedSection}>
                <div style={styles.feedHeader}>
                    <h3 style={styles.feedTitle}>ประวัติการแบ่งปันล่าสุด</h3>
                    <span style={styles.feedCount}>แสดง {filteredHistory.length} จาก {impactHistory.length} รายการ</span>
                </div>

                {/* แถบเครื่องมือค้นหาและฟิลเตอร์ช่วงเวลา */}
                <div style={styles.filterToolbar}>
                    {/* ค้นหาด้วยชื่อ */}
                    <div style={styles.searchBox}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#94a3b8' }}>search</span>
                        <input
                            type="text"
                            placeholder="ค้นหารายการแบ่งปัน..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>

                    {/* กรองตามช่วงเวลา */}
                    <div style={styles.filterGroup}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#94a3b8' }}>calendar_today</span>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            style={styles.selectInput}
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
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#9333ea' }}>
                                            fastfood
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
                                    <span style={styles.itemWeightLabel}>น้ำหนัก</span>
                                    <span style={styles.itemWeightValue}>+{item.weight.toFixed(1)} กก.</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={styles.emptyState}>
                            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#cbd5e1', marginBottom: '8px' }}>search_off</span>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>ไม่พบรายการในช่วงเวลาที่คุณเลือก</p>
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
        fontFamily: "'Sarabun', sans-serif",
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
        color: "#9333ea",
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
        marginBottom: "10px",
    },
    welcomeTitle: {
        fontSize: "24px",
        fontWeight: "700",
        color: "#6b21a8",
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
        fontSize: "30px",
        fontWeight: "700",
        margin: 0,
    },
    statCardSky: {
        backgroundColor: "#f0f9ff",
        border: "1.5px solid #e0f2fe",
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
        color: "#1e293b",
        margin: 0,
    },
    feedSection: {
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        padding: "28px 36px",
        border: "1.5px solid #f1f5f9",
        boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
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
        color: "#9333ea",
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
        fontSize: "16px",
        fontWeight: "700",
        color: "#9333ea",
    },
    emptyState: {
        textAlign: "center",
        padding: "40px 20px",
        backgroundColor: "#f8fafc",
        borderRadius: "16px",
        border: "1.5 dashed #e2e8f0",
    },
};