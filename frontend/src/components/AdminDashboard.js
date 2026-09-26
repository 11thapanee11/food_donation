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
    Cell,
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

                if (result.data) {
                    setStats(result.data);
                }

                // ข้อมูลจำลองสำหรับกราฟแนวโน้มรายเดือน
                setMonthlyData([
                    { month: 'ม.ค.', total: 50, completed: 42 },
                    { month: 'ก.พ.', total: 65, completed: 58 },
                    { month: 'มี.ค.', total: 80, completed: 72 },
                    { month: 'เม.ย.', total: 95, completed: 88 },
                    { month: 'พ.ค.', total: 120, completed: 110 },
                    { month: 'มิ.ย.', total: 140, completed: 132 },
                ]);

            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
                setError("ไม่สามารถเชื่อมต่อเพื่อดึงข้อมูลแผงควบคุมได้ในขณะนี้");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div style={styles.loadingContainer}><div style={styles.spinner}></div><p>กำลังโหลดข้อมูลผู้ดูแลระบบ...</p></div>;
    if (error) return <div style={styles.errorContainer}><span className="material-symbols-outlined" style={{ fontSize: '48px' }}>error</span><p>{error}</p></div>;
    if (!stats) return null;

    // คำนวณอัตราความสำเร็จ
    const successRate = stats.totalBookings > 0
        ? Math.round(((stats.completed || 0) / stats.totalBookings) * 100)
        : 0;

    const DONUT_COLORS = ['#C084FC', '#FACC15', '#F87171'];

    const pieData = [
        { name: 'ส่งมอบสำเร็จ', value: stats.completed || 0 },
        { name: 'รอรับของ', value: stats.pending || 0 },
        { name: 'ยกเลิก', value: stats.cancelled || 0 },
    ];

    return (
        <div style={styles.fullWidthBackground}>
            <div style={styles.contentContainer}>
                {/* ส่วนหัว */}
                <div style={styles.headerContainer}>
                    <div>
                        <div style={styles.topBadge}>
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>admin_panel_settings</span>
                            ระบบผู้ดูแล
                        </div>
                        <h1 style={styles.mainTitle}>สถิติและภาพรวมระบบ</h1>
                        <p style={styles.subHeaderDesc}>สรุปสถิติด้านการแบ่งปันอาหาร อัตราการขอรับบริจาค และการจัดการระบบ</p>
                    </div>

                </div>

                {/* ส่วนที่ 1: ตัวชี้วัดหลัก (KPIs) */}
                <div style={styles.kpiGrid}>
                    <div style={styles.kpiCard}>
                        <div style={{ ...styles.kpiIconBox, backgroundColor: '#ffe0f1', color: '#fc6fbc' }}>
                            <span className="material-symbols-outlined">package_2</span>
                        </div>
                        <div>
                            <p style={styles.kpiLabel}>จำนวนรายการอาหารที่ร่วมแบ่งปัน</p>
                            <h3 style={{ ...styles.kpiValue, color: '#fc6fbc' }}>
                                {stats.totalDonatedItems || 0} <span style={styles.kpiUnit}>รายการ</span>
                            </h3>
                        </div>
                    </div>

                    <div style={styles.kpiCard}>
                        <div style={{ ...styles.kpiIconBox, backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                            <span className="material-symbols-outlined">volunteer_activism</span>
                        </div>
                        <div>
                            <p style={styles.kpiLabel}>จำนวนครั้งที่มีการส่งมอบอาหาร</p>
                            <h3 style={{ ...styles.kpiValue, color: '#0369a1' }}>
                                {stats.totalDonationTimes || 0} <span style={styles.kpiUnit}>ครั้ง</span>
                            </h3>
                        </div>
                    </div>

                    <div style={styles.kpiCard}>
                        <div style={{ ...styles.kpiIconBox, backgroundColor: '#FEF3C7', color: '#D97706' }}>
                            <span className="material-symbols-outlined">diversity_3</span>
                        </div>
                        <div>
                            <p style={styles.kpiLabel}>ผู้ใช้งานในระบบ</p>
                            <h3 style={styles.kpiValue}>{stats.totalUsers || 0} <span style={styles.kpiUnit}>คน</span></h3>
                        </div>
                    </div>
                </div>

                {/* ส่วนที่ 2: กราฟแสดงผล */}
                <div style={styles.mainChartsGrid}>
                    {/* กราฟแท่ง */}
                    <div style={styles.cardBox}>
                        <div style={styles.cardHeaderFlex}>
                            <div>
                                <h3 style={styles.cardHeading}>สถิติการแบ่งปันอาหารรายเดือน</h3>
                                <p style={styles.cardSubHeading}>แสดงปริมาณรายการอาหารที่ส่งมอบสำเร็จในแต่ละเดือน</p>
                            </div>
                        </div>
                        <div style={{ width: '100%', height: '260px', marginTop: '16px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1.5px solid #F3E8FF', boxShadow: '0 4px 12px rgba(192, 132, 252, 0.1)' }} />
                                    <Bar dataKey="completed" name="ส่งมอบสำเร็จ" fill="#C084FC" radius={[6, 6, 0, 0]} barSize={28} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* กราฟโดนัท: สรุปสถานะการขอรับบริจาค */}
                    <div style={styles.cardBox}>
                        <h3 style={styles.cardHeading}>สถานะการขอรับบริจาคและอัตราสำเร็จ</h3>
                        <p style={styles.cardSubHeading}>ภาพรวมประสิทธิภาพการส่งมอบ (อัตราสำเร็จ: {successRate}%)</p>

                        <div style={styles.donutLayout}>
                            <div style={{ width: '130px', height: '130px', position: 'relative' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={42}
                                            outerRadius={58}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={styles.donutCenter}>
                                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B' }}>{successRate}%</span>
                                    <span style={{ fontSize: '10px', color: '#64748B' }}>สำเร็จ</span>
                                </div>
                            </div>

                            <div style={styles.legendColumn}>
                                <div style={styles.legendRow}>
                                    <span style={{ ...styles.dotIndicator, backgroundColor: '#C084FC' }}></span>
                                    <span style={styles.legendLabel}>สำเร็จ</span>
                                    <span style={styles.legendVal}>{stats.completed || 0}</span>
                                </div>
                                <div style={styles.legendRow}>
                                    <span style={{ ...styles.dotIndicator, backgroundColor: '#FACC15' }}></span>
                                    <span style={styles.legendLabel}>รอรับของ</span>
                                    <span style={styles.legendVal}>{stats.pending || 0}</span>
                                </div>
                                <div style={styles.legendRow}>
                                    <span style={{ ...styles.dotIndicator, backgroundColor: '#F87171' }}></span>
                                    <span style={styles.legendLabel}>ยกเลิก</span>
                                    <span style={styles.legendVal}>{stats.cancelled || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ส่วนที่ 3: ข้อมูลเชิงลึกด้านล่าง */}
                <div style={styles.bottomGrid}>
                    {/* หมวดหมู่อาหารยอดนิยม */}
                    <div style={styles.cardBox}>
                        <h3 style={styles.cardHeading}>หมวดหมู่อาหารยอดนิยม</h3>
                        <p style={styles.cardSubHeading}>ประเภทอาหารที่มีการนำมาแบ่งปันมากที่สุด</p>

                        <div style={styles.categoryListContainer}>
                            {stats.categories && stats.categories.length > 0 ? (
                                stats.categories.map((cat, idx) => (
                                    <div key={idx} style={styles.catRow}>
                                        <span style={styles.catTitle}>{cat.name}</span>
                                        <div style={styles.catBarBg}>
                                            <div style={{
                                                ...styles.catBarFill,
                                                width: `${cat.max ? (cat.count / cat.max) * 100 : 40}%`
                                            }}></div>
                                        </div>
                                        <span style={styles.catCount}>{cat.count}</span>
                                    </div>
                                ))
                            ) : (
                                <p style={styles.emptyText}>ยังไม่มีข้อมูลหมวดหมู่</p>
                            )}
                        </div>
                    </div>

                    {/* รายงานปัญหาและข้อร้องเรียน */}
                    <div style={styles.cardBox}>
                        <h3 style={styles.cardHeading}>รายงานปัญหาและข้อร้องเรียน</h3>
                        <p style={styles.cardSubHeading}>ติดตามเคสที่ผู้ใช้งานแจ้งเรื่องเข้ามา</p>

                        <div style={styles.reportStack}>
                            <div style={styles.reportRowItem}>
                                <span style={styles.reportTextLabel}>รายงานปัญหาทั้งหมด</span>
                                <span style={styles.reportNumBadge}>{stats.totalReports || 0} เคส</span>
                            </div>
                            <div style={{ ...styles.reportRowItem, backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
                                <span style={{ ...styles.reportTextLabel, color: '#DC2626' }}>รอดำเนินการแก้ไข</span>
                                <span style={{ ...styles.reportNumBadge, color: '#DC2626', backgroundColor: '#FFFFFF' }}>{stats.pendingReport || 0} เคส</span>
                            </div>
                            <div style={{ ...styles.reportRowItem, backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }}>
                                <span style={{ ...styles.reportTextLabel, color: '#16A34A' }}>ตรวจสอบและแก้ไขแล้ว</span>
                                <span style={{ ...styles.reportNumBadge, color: '#16A34A', backgroundColor: '#FFFFFF' }}>{stats.checkedReport || 0} เคส</span>
                            </div>
                        </div>
                    </div>
                </div>
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
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "15px"
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
        fontSize: "26px",
        fontWeight: "bold",
        color: "#1E293B",
        margin: 0
    },
    subHeaderDesc: {
        fontSize: "14px",
        color: "#64748B",
        margin: "4px 0 0 0"
    },
    kpiGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
        marginBottom: "20px"
    },
    kpiCard: {
        backgroundColor: "#FFFFFF",
        border: "1.5px solid #F3E8FF",
        borderRadius: "16px",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: "0 4px 15px rgba(192, 132, 252, 0.04)"
    },
    kpiIconBox: {
        width: "50px",
        height: "50px",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
    },
    kpiLabel: {
        fontSize: "13px",
        color: "#64748B",
        margin: "0 0 2px 0",
        fontWeight: "500"
    },
    kpiValue: {
        fontSize: "22px",
        fontWeight: "bold",
        color: "#1E293B",
        margin: 0
    },
    kpiUnit: {
        fontSize: "12px",
        fontWeight: "normal",
        color: "#94A3B8"
    },
    mainChartsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "20px",
        marginBottom: "20px"
    },
    cardBox: {
        backgroundColor: "#FFFFFF",
        border: "1.5px solid #F3E8FF",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 4px 15px rgba(192, 132, 252, 0.04)"
    },
    cardHeaderFlex: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start"
    },
    cardHeading: {
        fontSize: "16px",
        fontWeight: "bold",
        color: "#1E293B",
        margin: "0 0 4px 0"
    },
    cardSubHeading: {
        fontSize: "13px",
        color: "#64748B",
        margin: 0
    },
    donutLayout: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        marginTop: "16px",
        minHeight: "140px"
    },
    donutCenter: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        display: "flex",
        flexDirection: "column"
    },
    legendColumn: {
        display: "flex",
        flexDirection: "column",
        gap: "10px"
    },
    legendRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        color: "#334155"
    },
    dotIndicator: {
        width: "10px",
        height: "10px",
        borderRadius: "50%"
    },
    legendLabel: {
        flex: 1
    },
    legendVal: {
        fontWeight: "bold",
        color: "#1E293B"
    },
    bottomGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "20px"
    },
    categoryListContainer: {
        marginTop: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
    },
    catRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "13px"
    },
    catTitle: {
        width: "110px",
        color: "#334155",
        fontWeight: "500",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    },
    catBarBg: {
        flex: 1,
        backgroundColor: "#F1F5F9",
        height: "8px",
        borderRadius: "4px",
        overflow: "hidden"
    },
    catBarFill: {
        height: "100%",
        backgroundColor: "#C084FC",
        borderRadius: "4px"
    },
    catCount: {
        width: "24px",
        textAlign: "right",
        fontWeight: "bold",
        color: "#1E293B"
    },
    emptyText: {
        textAlign: "center",
        color: "#94A3B8",
        fontSize: "13px",
        margin: "30px 0"
    },
    reportStack: {
        marginTop: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
    },
    reportRowItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 14px",
        backgroundColor: "#FAF5FF",
        border: "1.5px solid #F3E8FF",
        borderRadius: "12px"
    },
    reportTextLabel: {
        fontSize: "13px",
        color: "#475569",
        fontWeight: "500"
    },
    reportNumBadge: {
        fontSize: "13px",
        fontWeight: "bold",
        color: "#1E293B",
        backgroundColor: "#FFFFFF",
        padding: "2px 10px",
        borderRadius: "8px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
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
    },
    errorContainer: {
        textAlign: "center",
        padding: "100px 20px",
        color: "#EF4444",
        fontFamily: "'Prompt', sans-serif"
    }
};