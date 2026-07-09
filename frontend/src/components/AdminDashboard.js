import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // เรียก API จาก Backend
                const response = await fetch('http://localhost:8082/dashboard/stats');
                if (!response.ok) throw new Error('Network response was not ok');
                
                const data = await response.json();
                setStats(data);
            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (!stats) return <div style={styles.loading}>กำลังโหลดข้อมูล...</div>;
    if (loading) return <div style={styles.loading}>กำลังโหลดข้อมูล...</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.mainTitle}>สถิติภาพรวมของระบบ</h2>

            <div style={styles.flexRow}>
                {/* ผู้ใช้งานทั้งหมด */}
                <div style={{ ...styles.card, backgroundColor: '#ffe8cc' }}>
                    <div style={styles.content}>
                        <p style={styles.label}>ผู้ใช้งานทั้งหมด</p>
                        <h3 style={styles.value}>{stats.totalUsers} <span style={styles.unit}>Accounts</span></h3>
                    </div>
                    <div>
                        <span className="material-symbols-outlined" style={styles.icon}>
                            diversity_3
                        </span>
                    </div>
                </div>

                {/* จำนวนอาหารบริจาค */}
                <div style={{ ...styles.card, backgroundColor: '#ffe8cc' }}>
                    <div style={styles.content}>
                        <p style={styles.label}>จำนวนอาหารบริจาค</p>
                        <h3 style={styles.value}>{stats.totalFoods} <span style={styles.unit}>Items</span></h3>
                    </div>
                    <div>
                        <span className="material-symbols-outlined" style={styles.icon}>
                            hand_meal
                        </span>
                    </div>
                </div>

                {/* CARBON ที่ช่วยลดได้ */}
                <div style={{ ...styles.card, backgroundColor: '#328d7d', color: '#fff' }}>
                    <div style={styles.content}>
                        <p style={styles.labelDark}>CARBON ที่ช่วยลดได้</p>
                        <h3 style={styles.value}>{stats.totalCarbon} <span style={styles.unitDark}>kgCO2e</span></h3>
                    </div>
                    <div>
                        <span className="material-symbols-outlined" style={{ ...styles.icon, color: 'white' }}>
                            temp_preferences_eco
                        </span>
                    </div>
                </div>
            </div>

            <h2 style={styles.header}>สถานะรายการอาหารในระบบ</h2>

            <div style={styles.statusGrid}>
                {/* 4 ช่องสถานะเล็ก */}
                <div style={styles.grid2x2}>
                    <div style={{ ...styles.smallBox, borderColor: '#6b9222', backgroundColor: '#f9ffed' }}>
                        <span style={{ fontWeight: '500', color: '#6b9222' }}>บริจาคเสร็จสิ้น</span> <br /><strong style={{ fontSize: '28px', color: '#6b9222' }}>{stats.completed}</strong>
                    </div>
                    <div style={{ ...styles.smallBox, borderColor: '#f9d601', backgroundColor: '#fffce6' }}>
                        <span style={{ fontWeight: '500', color: '#ebb512' }}>กำลังดำเนินการ</span> <br /><strong style={{ fontSize: '28px', color: '#ebb512' }}>{stats.pending}</strong>
                    </div>
                    <div style={{ ...styles.smallBox, borderColor: '#ed171f', backgroundColor: '#fef4f4' }}>
                        <span style={{ fontWeight: '500', color: '#ed171f' }}>ยกเลิก</span> <br /><strong style={{ fontSize: '28px', color: '#ed171f' }}>{stats.cancelled}</strong>
                    </div>
                    <div style={{ ...styles.smallBox, borderColor: '#ff8c00', backgroundColor: '#fff3e4' }}>
                        <span style={{ fontWeight: '500', color: '#ff8c00' }}>หมดอายุ</span> <br /><strong style={{ fontSize: '28px', color: '#ff8c00' }}>{stats.expired}</strong>
                    </div>
                </div>

                {/* ช่องรายงานปัญหาใหญ่ทางขวา */}
                <div style={{...styles.reportBox, backgroundColor: 'white'}}>
                    <div>
                        <span className="material-symbols-outlined" style={{ fontSize: '50px', color: '#f44336' }}>
                            report
                        </span>
                    </div>
                    <p style={{ fontSize: '20px', margin: '0 0' }}>จำนวนรายงานปัญหาทั้งหมด</p>
                    <strong style={{ fontSize: '36px', color: '#f44336' }}>{stats.totalReports}</strong>
                    <div style={styles.reportStatus}>
                        <span style={{ color: 'red' }}>รอตรวจสอบ : {stats.pendingReport || 0}</span>
                        {" | "}
                        <span style={{ color: 'green' }}>ตรวจสอบแล้ว : {stats.checkedReport || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "20px 20px"
    },
    mainTitle: {
        color: "#333",
        fontSize: "30px",
        fontWeight: "bold",
        marginBottom: "20px"
    },
    header: { marginTop: '40px' },
    flexRow: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
    card: {
        flex: '1',
        minWidth: '280px',
        padding: '30px',
        borderRadius: '15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        // boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    content: { display: 'flex', flexDirection: 'column' },
    label: { fontSize: '18px', color: '#328d7d', margin: '0 0 5px 0' },
    labelDark: { fontSize: '18px', color: '#fff', margin: '0 0 5px 0', opacity: 0.9 },
    value: { fontSize: '32px', margin: '0', fontWeight: 'bold' },
    unit: { fontSize: '18px', color: '#666', fontWeight: 'normal' },
    unitDark: { fontSize: '18px', color: '#eee', fontWeight: 'normal' },
    icon: { fontSize: '60px', color: '#ff8c00', marginTop: '10px' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' },
    // card: { padding: '25px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    statusGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr', // แบ่งเป็นกลุ่ม 4 ช่อง กับ ช่องรายงาน (ปรับสัดส่วนได้)
        gap: '20px'
    },
    grid2x2: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr', // บังคับให้ 4 ช่องข้างในเรียงเป็น 2x2
        gap: '15px'
    },
    smallBox: {
        padding: '20px',
        borderRadius: '15px',
        border: '2px solid',
        textAlign: 'left',
        fontWeight: 'bold'
    },
    reportBox: {
        padding: '20px',
        borderRadius: '15px',
        border: '2px solid #ccc',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    },
    reportStatus: {
        marginTop: '10px',
        fontSize: '16px',
        fontWeight: 'bold'
    },
    loading: {
        textAlign: "center",
        padding: "100px",
        color: "#ff8c00",
        fontSize: "20px"
    },
};