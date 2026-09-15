import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // ดักจับการ resize หน้าจอใน useEffect
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ดึงข้อมูล API
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:8082/dashboard/stats');
                if (!response.ok) throw new Error('Network response was not ok');

                const result = await response.json();
                console.log("Data from API:", result);

                setStats(result.data);
            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading || !stats) return <div style={styles.loading}>กำลังโหลดข้อมูล...</div>;

    return (
        <div style={styles.container}>
            <h2 style={{ ...styles.mainTitle, fontSize: isMobile ? '22px' : '30px' }}>
                สถิติภาพรวมของระบบ
            </h2>

            {/* การ์ด 3 ช่องบน */}
            <div style={{
                ...styles.flexRow,
                flexDirection: isMobile ? 'column' : 'row'
            }}>
                {/* ผู้ใช้งานทั้งหมด */}
                <div style={{ ...styles.card, backgroundColor: '#ffe8cc' }}>
                    <div style={styles.content}>
                        <p style={styles.label}>ผู้ใช้งานทั้งหมด</p>
                        <h3 style={styles.value}>
                            {stats.totalUsers} <span style={styles.unit}>Accounts</span>
                        </h3>
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
                        <h3 style={styles.value}>
                            {stats.totalFoods} <span style={styles.unit}>Items</span>
                        </h3>
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
                        <h3 style={styles.value}>
                            {stats.totalCarbon} <span style={styles.unitDark}>kgCO2e</span>
                        </h3>
                    </div>
                    <div>
                        <span className="material-symbols-outlined" style={{ ...styles.icon, color: 'white' }}>
                            temp_preferences_eco
                        </span>
                    </div>
                </div>
            </div>

            <h2 style={{ ...styles.header, fontSize: isMobile ? '20px' : '24px' }}>
                สถานะรายการอาหารในระบบ
            </h2>

            {/* สถานะรายการอาหารและรายงานปัญหา */}
            <div style={{
                ...styles.statusGrid,
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'
            }}>
                {/* ช่องสถานะเล็ก 4 ช่อง */}
                <div style={{
                    ...styles.grid2x2,
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'
                }}>
                    <div style={{ ...styles.smallBox, borderColor: '#6b9222', backgroundColor: '#f9ffed' }}>
                        <span style={{ fontWeight: '500', color: '#6b9222' }}>บริจาคเสร็จสิ้น</span> <br />
                        <strong style={{ fontSize: '28px', color: '#6b9222' }}>{stats.completed}</strong>
                    </div>
                    <div style={{ ...styles.smallBox, borderColor: '#f9d601', backgroundColor: '#fffce6' }}>
                        <span style={{ fontWeight: '500', color: '#ebb512' }}>กำลังดำเนินการ</span> <br />
                        <strong style={{ fontSize: '28px', color: '#ebb512' }}>{stats.pending}</strong>
                    </div>
                    <div style={{ ...styles.smallBox, borderColor: '#ed171f', backgroundColor: '#fef4f4' }}>
                        <span style={{ fontWeight: '500', color: '#ed171f' }}>ยกเลิก</span> <br />
                        <strong style={{ fontSize: '28px', color: '#ed171f' }}>{stats.cancelled}</strong>
                    </div>
                    <div style={{ ...styles.smallBox, borderColor: '#ff8c00', backgroundColor: '#fff3e4' }}>
                        <span style={{ fontWeight: '500', color: '#ff8c00' }}>หมดอายุ</span> <br />
                        <strong style={{ fontSize: '28px', color: '#ff8c00' }}>{stats.expired}</strong>
                    </div>
                </div>

                {/* ช่องรายงานปัญหา */}
                <div style={{ ...styles.reportBox, backgroundColor: 'white' }}>
                    <div>
                        <span className="material-symbols-outlined" style={{ fontSize: '50px', color: '#f44336' }}>
                            report
                        </span>
                    </div>
                    <p style={{ fontSize: isMobile ? '16px' : '20px', margin: '0 0' }}>จำนวนรายงานปัญหาทั้งหมด</p>
                    <strong style={{ fontSize: isMobile ? '28px' : '36px', color: '#f44336' }}>
                        {stats.totalReports}
                    </strong>
                    <div style={{
                        ...styles.reportStatus,
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '4px' : '0'
                    }}>
                        <span style={{ color: 'red' }}>รอตรวจสอบ : {stats.pendingReport || 0}</span>
                        {!isMobile && " | "}
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
        fontWeight: "bold",
        marginBottom: "20px"
    },
    header: { 
        marginTop: '40px',
        marginBottom: '20px',
        color: "#333",
        fontWeight: "bold"
    },
    flexRow: { 
        display: 'flex', 
        gap: '20px',
        width: '100%'
    },
    card: {
        flex: '1',
        minWidth: '0',
        padding: '30px',
        borderRadius: '15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
    },
    content: { display: 'flex', flexDirection: 'column' },
    label: { fontSize: '18px', color: '#328d7d', margin: '0 0 5px 0' },
    labelDark: { fontSize: '18px', color: '#fff', margin: '0 0 5px 0', opacity: 0.9 },
    value: { fontSize: '32px', margin: '0', fontWeight: 'bold' },
    unit: { fontSize: '18px', color: '#666', fontWeight: 'normal' },
    unitDark: { fontSize: '18px', color: '#eee', fontWeight: 'normal' },
    icon: { fontSize: '60px', color: '#ff8c00' },
    statusGrid: {
        display: 'grid',
        gap: '20px'
    },
    grid2x2: {
        display: 'grid',
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
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px'
    },
    reportStatus: {
        marginTop: '10px',
        fontSize: '16px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    loading: {
        textAlign: "center",
        padding: "100px",
        color: "#ff8c00",
        fontSize: "20px"
    },
};