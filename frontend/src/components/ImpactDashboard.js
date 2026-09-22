import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

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

    // เตรียมข้อมูลสำหรับแสดงผลในกราฟ (แปลงวันที่ให้อ่านง่ายขึ้น)
    const chartData = impactHistory.map(item => ({
        ...item,
        formattedDate: new Date(item.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })
    })).reverse(); // เรียงจากอดีต -> ปัจจุบัน

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
                    <p style={styles.greenCardLabel}>ลดการปล่อยก๊าซเรือนกระจกรวมทั้งหมด</p>
                    <h1 style={styles.greenCardValue}>
                        {summary.totalCarbon.toFixed(2)} <span style={styles.greenCardUnit}>kgCO2e</span>
                    </h1>
                    <div style={styles.globeContainer}>
                        <span style={styles.globeIcon} className="material-symbols-outlined">globe</span>
                    </div>
                </div>

                {/* กล่องขวา: ย่อยออกมาเป็น 2 แถวพาสเทล */}
                <div style={styles.sideCardsContainer}>
                    <div style={{ ...styles.pastelCard, border: "2px solid #ff8c00", backgroundColor: "none" }}>
                        <div>
                            <p style={styles.pastelCardLabel}>ช่วยลดขยะอาหาร</p>
                            <h3 style={styles.pastelCardValue}>
                                {summary.totalWeight.toFixed(2)} <span style={styles.pastelCardUnit}>กิโลกรัม</span>
                            </h3>
                        </div>
                        <span style={styles.cardEmoji} className="material-symbols-outlined">takeout_dining_2</span>
                    </div>

                    <div style={styles.pastelCard}>
                        <div>
                            <p style={styles.pastelCardLabel}>จำนวนที่ส่งมอบ</p>
                            <h3 style={styles.pastelCardValue}>
                                {summary.totalDonations} <span style={styles.pastelCardUnit}>ครั้ง</span>
                            </h3>
                        </div>
                        <span style={styles.cardEmoji} className="material-symbols-outlined">fork_spoon</span>
                    </div>
                </div>

            </div>

            {/* ส่วนแสดงกราฟ */}
            <div style={styles.chartContainer}>
                <h3 style={styles.sectionTitle}>แนวโน้มการช่วยลดก๊าซเรือนกระจก</h3>
                {chartData.length > 0 ? (
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                                {/* เส้น Grid แนวนอนแบบจางๆ */}
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />

                                {/* แกน X และ Y */}
                                <XAxis
                                    dataKey="formattedDate"
                                    tick={{ fill: '#777777', fontSize: 13 }}
                                    axisLine={{ stroke: '#EAEAEA' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#777777', fontSize: 13 }}
                                    axisLine={false}
                                    tickLine={false}
                                />

                                {/* Tooltip เมื่อเอาเมาส์ไปชี้ */}
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                        border: '1px solid #fff0df',
                                        padding: '10px 15px'
                                    }}
                                    labelStyle={{ color: '#333333', fontWeight: 'bold', marginBottom: '4px' }}
                                    formatter={(value) => [`${Number(value).toFixed(2)} kgCO2e`, 'การลดคาร์บอน']}
                                />

                                {/* เส้นกราฟ Smooth สีเขียวธีมหลัก */}
                                <Line
                                    type="liner"
                                    dataKey="carbon"
                                    stroke="#328d7d"
                                    strokeWidth={3.5}
                                    dot={{ r: 5, fill: '#328d7d', stroke: '#FFFFFF', strokeWidth: 2 }}
                                    activeDot={{ r: 8, fill: '#ff8c00', stroke: '#FFFFFF', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', color: '#888888', padding: '30px' }}>ยังไม่มีข้อมูลสำหรับแสดงกราฟ</p>
                )}
            </div>

            {/* ส่วนตารางประวัติ (Table Report) */}
            <div style={styles.tableContainer}>
                <h3 style={styles.sectionTitle}>ประวัติการบริจาค</h3>
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
                                    <td style={styles.td}>
                                        {item.weight ? item.weight.toFixed(1) : '0.0'} kg
                                    </td>
                                    <td style={{ ...styles.td, ...styles.carbonText, textAlign: 'right' }}>
                                        <span style={{ color: '#ff8c00', fontWeight: 'bold' }}>
                                            {item.carbon ? item.carbon.toFixed(1) : '0.0'}
                                        </span>
                                        <span style={{ color: '#328d7d', marginLeft: '4px' }}>
                                            kgCO2e
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ ...styles.td, textAlign: 'center', padding: '20px', color: '#666666' }}>
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
        gap: "25px",
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
    sectionTitle: {
        fontSize: "18px",
        fontWeight: "600",
        color: "#333333",
        marginBottom: "15px",
        marginTop: "0px",
    },
    statsGrid: {
        display: "flex",
        flexDirection: "row",
        gap: "25px",
        width: "100%",
        flexWrap: "wrap",
    },
    statsGrid: {
        display: "flex",
        flexDirection: "row",
        gap: "15px",
        width: "100%",
        flexWrap: "wrap",
    },
    mainGreenCard: {
        flex: 1,
        minWidth: "320px",
        backgroundColor: "#328d7d",
        borderRadius: "18px",
        padding: "16px 24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "center",
        color: "#FFFFFF",
        boxShadow: "0 4px 15px rgba(58, 139, 115, 0.1)",
    },
    greenCardLabel: {
        fontSize: "22px",
        fontWeight: "500",
        margin: "0 0 6px 0",
    },
    greenCardValue: {
        fontSize: "40px",
        fontWeight: "bold",
        margin: "0 0 4px 0",
        letterSpacing: "0.5px"
    },
    greenCardUnit: {
        fontSize: "20px",
        fontWeight: "500"
    },
    globeContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    globeIcon: {
        fontSize: "32px"
    },
    sideCardsContainer: {
        flex: 1,
        minWidth: "320px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    pastelCard: {
        backgroundColor: "#fff0df",
        borderRadius: "18px",
        padding: "14px 22px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 4px 10px rgba(255, 238, 218, 0.3)",
    },
    pastelCardLabel: {
        fontSize: "16px",
        color: "#333",
        margin: "0 0 4px 0",
        fontWeight: "500"
    },
    pastelCardValue: {
        fontSize: "26px",
        fontWeight: "700",
        color: "#ff8c00",
        margin: 0
    },
    pastelCardUnit: {
        fontSize: "16px",
        color: "#777777",
        fontWeight: "400",
        marginLeft: "4px"
    },
    cardEmoji: {
        fontSize: "32px",
        color: "#ff8c00"
    },
    chartContainer: {
        backgroundColor: "#ffff",
        borderRadius: "20px",
        padding: "25px",
        border: "2px solid #bdddd7"
    },
    tableContainer: {
        backgroundColor: "#ffff",
        borderRadius: "20px",
        padding: "25px",
        border: "2px solid #ffdfb7"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "left",
    },
    tableHeaderRow: {
        borderBottom: "2px solid #EAEAEA"
    },
    th: {
        padding: "16px 12px",
        fontSize: "16px",
        color: "#4A5568",
        fontWeight: "600",
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