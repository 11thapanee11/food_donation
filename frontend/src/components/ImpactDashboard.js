import React, { useState, useEffect } from 'react';

export default function ImpactDashboard() {

    const [summary, setSummary] = useState({
        totalCarbon: 0,
        totalWeight: 0,
        totalDonations: 0
    });
    const [impactHistory, setImpactHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [summaryRes, historyRes] = await Promise.all([
                    fetch('http://localhost:8082/donor/impact-summary', { headers }),
                    fetch('http://localhost:8082/impact-logs', { headers })
                ]);

                const summaryData = await summaryRes.json();
                const historyData = await historyRes.json();

                if (summaryData.success) {
                    setSummary(summaryData.data);
                }

                if (historyData.success) {
                    setImpactHistory(historyData.data);
                }

            } catch (err) {
                setError(err.message);
                console.error("Dashboard Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div style={styles.loading}>กำลังโหลดข้อมูลแดชบอร์ด...</div>;
    if (error) return <div style={styles.error}>เกิดข้อผิดพลาด: {error}</div>;

    return (
        <div style={styles.container}>

            <div style={styles.headerContainer}>
                <span style={styles.leafIcon} className="material-symbols-outlined">
                    temp_preferences_eco</span>
                <h2 style={styles.headerTitle}>สรุปผลลัพธ์การลดก๊าซเรือนกระจกจากการบริจาคอาหาร</h2>
            </div>

            <div style={styles.statsGrid}>

                {/* กล่องซ้ายใหญ่: ยอดรวมก๊าซเรือนกระจก */}
                <div style={styles.mainGreenCard}>
                    <p style={styles.greenCardLabel}>ลดการปล่อยก๊าซปล่อยก๊าซเรือนกระจกรวมทั้งหมด</p>
                    <h1 style={styles.greenCardValue}>
                        {summary.totalCarbon.toFixed(2)} <span style={styles.greenCardUnit}>kgCO2e</span>
                    </h1>
                    <div style={styles.globeContainer}>
                        <span style={styles.globeIcon} className="material-symbols-outlined">globe</span>
                    </div>
                </div>

                {/* กล่องขวา: ย่อยออกมาเป็น 2 แถวพาสเทล */}
                <div style={styles.sideCardsContainer}>
                    {/* การ์ดช่วยลดขยะอาหาร */}
                    <div style={styles.pastelCard}>
                        <div>
                            <p style={styles.pastelCardLabel}>ช่วยลดขยะอาหาร</p>
                            <h3 style={styles.pastelCardValue}>
                                {summary.totalWeight.toFixed(2)} <span style={styles.pastelCardUnit}>กิโลกรัม</span>
                            </h3>
                        </div>
                        <span style={styles.cardEmoji} className="material-symbols-outlined">takeout_dining_2</span>
                    </div>

                    {/* การ์ดจำนวนที่ส่งมอบ */}
                    <div style={styles.pastelCard}>
                        <div>
                            <p style={styles.pastelCardLabel}>จำนวนที่ส่งมอบ</p>
                            <h3 style={styles.pastelCardValue}>
                                {summary.totalDonations} <span style={styles.pastelCardUnit}>มื้อ</span>
                            </h3>
                        </div>
                        <span style={styles.cardEmoji} className="material-symbols-outlined">fork_spoon</span>
                    </div>
                </div>

            </div>

            {/* ส่วนตารางประวัติ (Table Report) */}
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={{ ...styles.th, width: '25%' }}>วันที่</th>
                            <th style={{ ...styles.th, width: '35%' }}>รายการบริจาค</th>
                            <th style={{ ...styles.th, width: '20%' }}>จำนวนกิโลกรัม</th>
                            <th style={{ ...styles.th, width: '20%', textAlign: 'right' }}>การลดคาร์บอน</th>
                        </tr>
                    </thead>
                    <tbody>
                        {impactHistory && impactHistory.length > 0 ? (
                            impactHistory.map((item) => (
                                <tr key={item.id} style={styles.tableBodyRow}>
                                    <td style={styles.td}>
                                        {new Date(item.date).toLocaleDateString('th-TH', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td style={styles.td}>{item.name}</td>
                                    {/* ใช้ ?. เพื่อป้องกัน Error หาก weight เป็น null และ .toFixed(1) ให้ดูสะอาดตา */}
                                    <td style={styles.td}>
                                        {item.weight ? item.weight.toFixed(1) : '0.0'} kg
                                    </td>
                                    <td style={{ ...styles.td, ...styles.carbonText, textAlign: 'right' }}>
                                        <span style={{ color: '#ff8c00', fontWeight: 'bold' }}>
                                            {item.carbon ? item.carbon.toFixed(1) : '0.0'}
                                        </span>

                                        {/* ส่วนของหน่วย */}
                                        <span style={{ color: '#328d7d', marginLeft: '4px' }}>
                                            kgCO2e
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ ...styles.td, textAlign: 'center', padding: '20px' }}>
                                    ยังไม่มีประวัติการบริจาค
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

const styles = {
    container: {
        maxWidth: "1150px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "35px",
        padding: "40px 20px",
    },
    headerContainer: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    leafIcon: {
        fontSize: "42px",
        color: "#328d7d"
    },
    headerTitle: {
        fontSize: "24px",
        fontWeight: "bold",
        color: "#328d7d",
        margin: 0,
    },
    statsGrid: {
        display: "flex",
        flexDirection: "row",
        gap: "25px",
        width: "100%",
        flexWrap: "wrap",
    },
    mainGreenCard: {
        flex: 1,
        minWidth: "400px",
        backgroundColor: "#328d7d",
        borderRadius: "20px",
        padding: "30px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "center",
        color: "#FFFFFF",
        boxShadow: "0 4px 15px rgba(58, 139, 115, 0.1)",
    },
    greenCardLabel: {
        fontSize: "20px",
        fontWeight: "500",
        margin: "0 0 20px 0",
    },
    greenCardValue: {
        fontSize: "48px",
        fontWeight: "bold",
        margin: "0 0 20px 0",
        letterSpacing: "0.5px"
    },
    greenCardUnit: {
        fontWeight: "500"
    },
    globeContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    globeIcon: {
        fontSize: "60px"
    },
    sideCardsContainer: {
        flex: 1,
        minWidth: "400px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    pastelCard: {
        backgroundColor: "#ffe8cc",
        borderRadius: "20px",
        padding: "24px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 4px 10px rgba(255, 238, 218, 0.3)",
    },
    pastelCardLabel: {
        fontSize: "17px",
        color: "#333",
        margin: "0 0 8px 0",
        fontWeight: "500"
    },
    pastelCardValue: {
        fontSize: "34px",
        fontWeight: "700",
        color: "#ff8c00",
        margin: 0
    },
    pastelCardUnit: {
        fontSize: "16px",
        color: "#777777",
        fontWeight: "400",
        marginLeft: "5px"
    },
    cardEmoji: {
        fontSize: "40px",
        color: "#ff8c00"
    },
    tableContainer: {
        width: "100%",
        marginTop: "10px",
        overflowX: "auto"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "left",
    },
    tableHeaderRow: {
        // borderBottom: "2px solid #EAEAEA"

    },
    th: {
        padding: "16px 12px",
        fontSize: "17px",
        color: "#888888",
        fontWeight: "500",
    },
    tableBodyRow: {
        borderBottom: "1px solid #F1F1F1",
    },
    td: {
        padding: "18px 12px",
        fontSize: "16px",
        color: "#333333",
    },
    carbonText: {
        color: "#ff8c00",
        // fontWeight: "600",
        textAlign: "right"
    },
    loading: {
        textAlign: "center",
        padding: "100px",
        color: "#ff8c00",
        fontSize: "20px"
    },
    error: {
        textAlign: "center",
        padding: "100px",
        color: "red"
    },
};