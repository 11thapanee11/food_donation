import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
} from 'recharts';

export default function ImpactDashboard() {
    const [stats, setStats] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:8082/dashboard/stats');
                const result = await response.json();

                // แกะค่าจาก response.data (เพราะมี ApiResponse หุ้มอยู่)
                if (result.data) {
                    setStats(result.data);
                }
            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
                setError("ไม่สามารถดึงข้อมูลได้");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div style={styles.loading}>กำลังโหลดข้อมูล...</div>;
    if (error) return <div style={{ ...styles.loading, color: '#ef4444' }}>{error}</div>;
    if (!stats) return null;

    const successRate = stats.totalBookings > 0
        ? Math.round(((stats.completed || 0) / stats.totalBookings) * 100)
        : 0;

    // อัปเดตการกำหนดสี (COLORS) ด้านบนของไฟล์/คอมโพเนนต์
    const DONUT_COLORS = ['#a9b988', '#f7eb90', '#ffb2b2'];
    // เรียงตาม: สำเร็จ (#6b9222), รอรับของ (#f9d601), ยกเลิก (#ed171f), หมดอายุ (#8c8c8c)

    const pieData = [
        { name: 'สำเร็จ', value: stats.completed || 0, fill: DONUT_COLORS[0] },
        { name: 'รอรับของ', value: stats.pending || 0, fill: DONUT_COLORS[1] },
        { name: 'ยกเลิก', value: stats.cancelled || 0, fill: DONUT_COLORS[2] },
    ];

    const reportData = [
        { name: 'ทั้งหมด', count: stats.totalReports || 0 },
        { name: 'รอดำเนินการ', count: stats.pendingReport || 0 },
        { name: 'ตรวจสอบแล้ว', count: stats.checkedReport || 0 },
    ];

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.mainTitle}>สถิติภาพรวมของระบบ</h1>
            </div>

            {/* แถวที่ 1: HERO CARD (Carbon) + การ์ดย่อย 3 ใบ (ขยะอาหาร, บริจาคสำเร็จ, ผู้ใช้งาน) */}
            <div style={styles.topSection}>
                {/* Hero Card: CARBON ที่ช่วยลดได้ */}
                <div style={styles.heroCard}>
                    <div style={styles.heroHeader}>
                        <div>
                            <p style={styles.heroLabel}>CARBON ที่ช่วยลดได้สะสม</p>
                            <h2 style={styles.heroValue}>
                                {stats.totalCarbon.toFixed(2)} <span style={styles.heroUnit}>kgCO2e</span>
                            </h2>
                        </div>
                        <span className="material-symbols-outlined" style={styles.heroIcon}>temp_preferences_eco</span>
                    </div>
                    <div style={styles.equivalenceBox}>
                        <span className="material-symbols-outlined" style={styles.equivIcon}>forest</span>
                        <p style={styles.equivText}>
                            เทียบเท่าการปลูกต้นไม้ <strong style={styles.equivHighlight}>{stats.treesEquivalent.toFixed(1)}</strong> ต้น ใน 1 ปี
                        </p>
                    </div>
                </div>

                {/* การ์ดย่อย 3 ใบที่แยกออกจากกัน */}
                <div style={styles.subKpiGrid}>
                    {/* ขยะอาหารที่ช่วยลดได้ */}
                    <div style={{ ...styles.subCard, backgroundColor: '#FFE8CD', borderColor: '#D97706' }}>
                        <div>
                            <p style={styles.subCardLabel}>จำนวนรายการอาหารที่หมดอายุ</p>
                            <h3 style={{ ...styles.subCardValue, color: '#D97706' }}>
                                {stats.expired} <span style={styles.subCardUnit}>รายการ</span>
                            </h3>
                        </div>
                        <div style={{ ...styles.iconBg }}>
                            <span className="material-symbols-outlined" style={{ color: '#D97706', fontSize: '30px' }}>delete_sweep</span>
                        </div>
                    </div>

                    {/* บริจาคสำเร็จ (แยกออกมา) */}
                    <div style={{ ...styles.subCard, backgroundColor: '#E0F2FE', borderColor: '#0369A1' }}>
                        <div>
                            <p style={styles.subCardLabel}>จำนวนอาหารบริจาค</p>
                            <h3 style={{ ...styles.subCardValue, color: '#0369A1' }}>
                                {stats.totalFoods} <span style={styles.subCardUnit}>รายการ</span>
                            </h3>
                        </div>
                        <div style={{ ...styles.iconBg }}>
                            <span className="material-symbols-outlined" style={{ color: '#0369A1', fontSize: '30px' }}>hand_meal</span>
                        </div>
                    </div>

                    {/* ผู้ใช้งานทั้งหมด (แยกออกมา) */}
                    <div style={{ ...styles.subCard, backgroundColor: '#F3E8FF', borderColor: '#664680' }}>
                        <div>
                            <p style={styles.subCardLabel}>ผู้ใช้งานทั้งหมด</p>
                            <h3 style={{ ...styles.subCardValue, color: '#664680' }}>
                                {stats.totalUsers} <span style={styles.subCardUnit}>ราย</span>
                            </h3>
                        </div>
                        <div style={{ ...styles.iconBg }}>
                            <span className="material-symbols-outlined" style={{ color: '#664680', fontSize: '30px' }}>diversity_3</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* แถวที่ 2: 3 การ์ดเดิม (การจองทั้งหมด, สถานะการจอง, หมวดหมู่) */}
            <div style={styles.threeCardsRow}>
                {/* การ์ดที่ 1: การจองทั้งหมด */}
                <div style={styles.whiteCard}>
                    <p style={{ color: '#000000', margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>การจองทั้งหมด</p>
                    <h1 style={{ fontSize: '44px', margin: '0 0 12px 0', fontWeight: 'bold' }}>{stats.totalBookings}</h1>
                    <p style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#595959' }}>
                        อัตราสำเร็จ <span style={{ color: '#6b9222', fontWeight: 'bold' }}>{successRate}%</span>
                    </p>
                    <p style={{ color: '#8c8c8c', margin: 0, fontSize: '14px' }}>
                        ({stats.completed}/{stats.totalBookings})
                    </p>
                </div>

                {/* การ์ดที่ 2: สถานะการจอง */}
                <div style={styles.whiteCard}>
                    <h3 style={styles.cardTitle}>สถานะการจอง</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '140px' }}>
                        <div style={{ width: '120px', height: '120px', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={38}
                                        outerRadius={52}
                                        paddingAngle={2}
                                        dataKey="value"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={styles.donutCenterText}>
                                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{stats.totalBookings}</div>
                                <div style={{ fontSize: '10px', color: '#8c8c8c' }}>การจอง</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, marginLeft: '12px' }}>
                            <div style={styles.legendItem}>
                                <span style={{ ...styles.badge, backgroundColor: '#a9b988' }}></span>
                                <span>สำเร็จ {stats.completed}</span>
                            </div>
                            <div style={styles.legendItem}>
                                <span style={{ ...styles.badge, backgroundColor: '#f7eb90' }}></span>
                                <span>รอรับของ {stats.pending}</span>
                            </div>
                            <div style={styles.legendItem}>
                                <span style={{ ...styles.badge, backgroundColor: '#ffb2b2' }}></span>
                                <span>ยกเลิก {stats.cancelled}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* การ์ดที่ 3: หมวดหมู่อาหารที่บริจาคมากที่สุด */}
                <div style={styles.whiteCard}>
                    <h3 style={styles.cardTitle}>หมวดหมู่อาหารที่บริจาคมากที่สุด</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {stats.categories.map((cat, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <span style={styles.catName}>{cat.name}</span>
                                <div style={styles.progressBarBg}>
                                    <div style={{
                                        ...styles.progressBarFill,
                                        width: `${(cat.count / cat.max) * 100}%`,
                                        backgroundColor: idx === 0 ? '#ff8c00' : idx === 1 ? '#fa9922' : idx === 2 ? '#faa945' : '#fcbd71'
                                    }} />
                                </div>
                                <span style={{ fontWeight: 'bold', fontSize: '14px', width: '20px', textAlign: 'right' }}>{cat.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ ...styles.whiteCard, marginTop: '20px' }}>
                <h1 style={{ ...styles.cardTitle, marginBottom: '16px' }}>
                    รายงานปัญหา
                </h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ color: '#595959' }}>รายงานทั้งหมด</span>
                        <span style={{ fontWeight: 'bold', color: '#262626' }}>{stats.totalReports || 0} รายการ</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ color: '#595959' }}>รอดำเนินการ (Pending)</span>
                        <span style={{ color: '#ed171f' }}>{stats.pendingReport || 0} รายการ</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                        <span style={{ color: '#595959' }}>ตรวจสอบแล้ว (Checked)</span>
                        <span style={{ color: '#6a9e50' }}>{stats.checkedReport || 0} รายการ</span>
                    </div>
                </div>
            </div>

        </div>
    );
}

const styles = {
    container: { maxWidth: "1140px", margin: "0 auto", padding: "20px 20px" },
    header: { marginBottom: "20px", marginTop: "20px" },
    mainTitle: { fontSize: "30px", fontWeight: "bold", color: "#1A1A1A", margin: 0 },
    topSection: { display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" },

    // Hero Card
    heroCard: {
        flex: "1 1 380px",
        backgroundColor: "#328d7d",
        color: "#FFFFFF",
        padding: "24px",
        borderRadius: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
    },
    heroHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    heroLabel: { fontSize: "15px", color: "rgba(255, 255, 255, 0.9)", margin: "0 0 6px 0" },
    heroValue: { fontSize: "40px", fontWeight: "bold", margin: 0, lineHeight: "1" },
    heroUnit: { fontSize: "20px", fontWeight: "normal", color: "rgba(255, 255, 255, 0.8)" },
    heroIcon: { fontSize: "56px", color: "rgba(255, 255, 255, 0.2)" },
    equivalenceBox: {
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        padding: "12px 16px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginTop: "16px",
    },
    equivIcon: { fontSize: "22px", color: "#A7F3D0" },
    equivText: { fontSize: "13px", margin: 0, color: "rgba(255, 255, 255, 0.9)" },
    equivHighlight: { color: "#A7F3D0", fontWeight: "bold" },

    // การ์ดย่อย 3 ใบ
    subKpiGrid: { flex: "1 1 500px", display: "flex", flexDirection: "column", gap: "12px" },
    subCard: {
        padding: "16px 20px",
        borderRadius: "16px",
        borderStyle: 'solid',
        borderWidth: '1.5px',
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    subCardLabel: { fontSize: "13px", color: "#555", margin: "0 0 4px 0" },
    subCardValue: { fontSize: "24px", fontWeight: "bold", margin: 0 },
    subCardUnit: { fontSize: "14px", fontWeight: "normal", color: "#666" },
    iconBg: { borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" },

    // แถว 3 การ์ดเดิม
    threeCardsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" },
    whiteCard: { padding: '20px', borderRadius: '16px', border: '2px solid #f0f0f0' },
    cardTitle: { fontSize: '16px', fontWeight: 'bold', color: '#262626', margin: '0 0 15px 0' },
    donutCenterText: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
    badge: { width: '8px', height: '8px', borderRadius: '2px', display: 'inline-block' },
    catName: { fontSize: '13px', width: '120px', color: '#262626', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    progressBarBg: { flex: 1, backgroundColor: '#f5f5f5', height: '8px', borderRadius: '4px', overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: '4px' },
    loading: { textAlign: "center", padding: "100px", color: "#1B6B58" },
};