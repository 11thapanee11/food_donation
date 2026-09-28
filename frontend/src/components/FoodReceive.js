import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FoodReceiveOptimized() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('current'); // 'current' | 'history'
    const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'completed' | 'cancelled'

    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const BASE_URL = "http://localhost:8082";

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        setLoading(true);

        fetch(`${BASE_URL}/bookings`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(async (resData) => {
                if (resData.success && Array.isArray(resData.data)) {
                    const bookingsData = resData.data;

                    const bookingsWithFood = await Promise.all(
                        bookingsData.map(async (booking, index) => {
                            const donorInfo = {
                                donorName: booking.donorName || booking.food?.donorName || "ไม่ระบุชื่อผู้บริจาค",
                                pickupLocation: booking.locationName || booking.food?.locationName || "ไม่ระบุสถานที่"
                            };

                            try {
                                const foodRes = await fetch(`${BASE_URL}/foods/${booking.foodId}`, {
                                    headers: { "Authorization": `Bearer ${token}` }
                                });
                                const foodData = await foodRes.json();
                                const fetchedFood = foodRes.ok ? (foodData.data || foodData) : null;

                                return {
                                    ...booking,
                                    donor: {
                                        ...donorInfo,
                                        donorName: fetchedFood?.donorName || donorInfo.donorName
                                    },
                                    food: fetchedFood
                                };
                            } catch (e) {
                                return { ...booking, donor: donorInfo, food: null };
                            }
                        })
                    );
                    setBookings(bookingsWithFood);
                } else {
                    setBookings([]);
                }
            })
            .catch((err) => {
                console.error("Fetch Bookings Error:", err);
                setBookings([]);
            })
            .finally(() => setLoading(false));
    }, []);

    // แยกรายการตามสถานะ
    const currentBookings = bookings.filter(b => b.bookingStatus === 'pending');

    // กรองประวัติรายการจองตามสถานะที่เลือกในตัวกรองย่อย
    const historyBookings = bookings.filter(b => {
        const isHistory = b.bookingStatus === 'completed' || b.bookingStatus === 'cancelled';
        if (!isHistory) return false;
        if (historyFilter === 'all') return true;
        return b.bookingStatus === historyFilter;
    });

    // ฟอร์แมตวันที่ & เวลา
    const formatDateShort = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const d = date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
        const t = date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });
        return `${d} เวลา ${t} น.`;
    };

    const STATUS_CONFIG = {
        pending: { text: "รอรับบริจาค", color: "#B45309", bgColor: "#FFFBEB", borderColor: "#FDE68A" },
        completed: { text: "เสร็จสิ้น", color: "#047857", bgColor: "#ECFDF5", borderColor: "#A7F3D0" },
        cancelled: { text: "ยกเลิก", color: "#B91C1C", bgColor: "#FEF2F2", borderColor: "#FECACA" }
    };

    {/* ==================== 1. Render สำหรับ Tab: รายการจอง ( Active Grid ) ==================== */ }
    const renderCurrentBookings = () => {
        if (currentBookings.length === 0) {
            return (
                <div style={styles.emptyCard}>
                    <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#C084FC" }}>shopping_bag</span>
                    <p style={styles.emptyText}>ไม่มีรายการที่อยู่ระหว่างรอรับอาหาร</p>
                </div>
            );
        }

        return (
            <div style={styles.gridContainer}>
                {[...currentBookings].reverse().map((booking) => {
                    const food = booking.food;
                    const status = STATUS_CONFIG.pending;

                    return (
                        <div key={booking.id} style={styles.gridCard}>
                            <div style={styles.cardImageContainer}>
                                <img src={`${BASE_URL}${food?.foodImage}`} alt={food?.foodName} style={styles.cardImage} />
                                <span style={{ ...styles.statusBadgeOverlay, backgroundColor: status.bgColor, color: status.color, border: `1px solid ${status.borderColor}` }}>
                                    {status.text}
                                </span>
                            </div>

                            <div style={styles.cardContent}>
                                <h3 style={styles.foodNameGrid}>{food?.foodName}</h3>

                                <div style={styles.infoListActive}>
                                    <div style={styles.infoItem}>
                                        <span className="material-symbols-outlined" style={styles.iconStyle}>pin_drop</span>
                                        <span style={styles.infoText}>
                                            สถานที่รับ: <strong>{food?.locationName}</strong>
                                        </span>
                                    </div>

                                    <div style={styles.infoItem}>
                                        <span className="material-symbols-outlined" style={styles.iconStyle}>schedule</span>
                                        <span style={styles.infoText}>
                                            กำหนดรับภายใน: {formatDateTime(booking.pickupDeadline)}
                                        </span>
                                    </div>

                                    <div style={styles.infoItem}>
                                        <span className="material-symbols-outlined" style={styles.iconStyle}>inventory_2</span>
                                        <span style={styles.infoText}>
                                            จำนวนที่รับ: <strong style={{ color: "#C084FC" }}>{booking.bookingQuantity} {booking.bookingUnit}</strong>
                                        </span>
                                    </div>

                                    <div style={styles.infoItem}>
                                        <span className="material-symbols-outlined" style={{ ...styles.iconStyle, color: "#C084FC" }}>calendar_today</span>
                                        <span style={{ ...styles.infoText, color: "#64748B" }}>
                                            วันที่ทำรายการ: {formatDateTime(booking.bookingDate)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    style={styles.actionBtnPrimary}
                                    onClick={() => navigate("/booking-detail", { state: { id: booking.bookingId || booking.id, fromPage: '/receive' } })}
                                >
                                    <span>ดูรายละเอียดนัดรับ</span>
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    {/* ==================== 2. Render สำหรับ Tab: ประวัติรายการจอง ( History List ) ==================== */ }
    const renderHistoryBookings = () => {
        return (
            <div>
                {/* ตัวกรองสถานะย่อยในประวัติ */}
                <div style={styles.filterSubContainer}>
                    <button
                        type="button"
                        onClick={() => setHistoryFilter('all')}
                        style={{
                            ...styles.filterChip,
                            backgroundColor: historyFilter === 'all' ? '#C084FC' : '#FFFFFF',
                            color: historyFilter === 'all' ? '#FFFFFF' : '#64748B',
                            borderColor: historyFilter === 'all' ? '#C084FC' : '#E2E8F0',
                        }}
                    >
                        ทั้งหมด
                    </button>
                    <button
                        type="button"
                        onClick={() => setHistoryFilter('completed')}
                        style={{
                            ...styles.filterChip,
                            backgroundColor: historyFilter === 'completed' ? '#18a04c' : '#FFFFFF',
                            color: historyFilter === 'completed' ? '#FFFFFF' : '#64748B',
                            borderColor: historyFilter === 'completed' ? '#18a04c' : '#E2E8F0',
                        }}
                    >
                        เสร็จสิ้น
                    </button>
                    <button
                        type="button"
                        onClick={() => setHistoryFilter('cancelled')}
                        style={{
                            ...styles.filterChip,
                            backgroundColor: historyFilter === 'cancelled' ? '#f52626' : '#FFFFFF',
                            color: historyFilter === 'cancelled' ? '#FFFFFF' : '#64748B',
                            borderColor: historyFilter === 'cancelled' ? '#fa7070' : '#E2E8F0',
                        }}
                    >
                        ยกเลิก
                    </button>
                </div>

                {historyBookings.length === 0 ? (
                    <div style={styles.emptyCard}>
                        <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#CBD5E1" }}>history</span>
                        <p style={styles.emptyText}>ไม่พบประวัติการรับอาหารตามเงื่อนไขที่เลือก</p>
                    </div>
                ) : (
                    <div style={styles.historyListContainer}>
                        {[...historyBookings]
                            .sort((a, b) => b.bookingDate - a.bookingDate) // หรือเทียบจากวันที่ bookingDate
                            .map((booking) => {
                                const food = booking.food;
                                const status = STATUS_CONFIG[booking.bookingStatus] || STATUS_CONFIG.completed;

                                return (
                                    <div key={booking.id} style={styles.historyRow}>
                                        <img src={`${BASE_URL}${food?.foodImage}`} alt={food?.foodName} style={styles.historyThumb} />

                                        <div style={styles.historyMainInfo}>
                                            <div style={styles.historyHeaderRow}>
                                                <h4 style={styles.historyFoodName}>{food?.foodName}</h4>
                                                <span style={{ ...styles.statusBadgeCompact, backgroundColor: status.bgColor, color: status.color, border: `1px solid ${status.borderColor}` }}>
                                                    {status.text}
                                                </span>
                                            </div>

                                            <div style={styles.historyMetaRow}>
                                                <span>จองเมื่อ: {formatDateTime(booking.bookingDate)}</span>
                                                <span>•</span>
                                                <span>จำนวน: {booking.bookingQuantity} {booking.bookingUnit} </span>
                                                <span>•</span>
                                                <span>ผู้บริจาค: {booking.donor?.donorName}</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            style={styles.historyBtn}
                                            onClick={() => navigate('/booking-detail', { state: { id: booking.bookingId, fromPage: '/receive', bookingStatus: booking.bookingStatus } })}
                                        >
                                            ดูรายละเอียด
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={styles.fullWidthWrapper}>
            <div style={{ ...styles.container, padding: isMobile ? "20px 16px" : "36px 20px" }}>

                {/* Header Section */}
                <div style={styles.header}>
                    <h1 style={{ ...styles.title, fontSize: isMobile ? "24px" : "28px" }}>
                        รายการรับอาหารบริจาคของฉัน
                    </h1>
                    <p style={styles.subtitle}>ติดตามรายการที่อยู่ระหว่างนัดรับ และย้อนดูประวัติการรับบริจาคที่ผ่านมา</p>
                </div>

                {/* Tabs Section */}
                <div style={styles.tabsContainer}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('current')}
                        style={{
                            ...styles.tabBtn,
                            color: activeTab === 'current' ? '#C084FC' : '#94A3B8',
                            borderBottom: activeTab === 'current' ? '2.5px solid #C084FC' : '2.5px solid transparent',
                        }}
                    >
                        รายการจอง (รอรับ)
                        {currentBookings.length > 0 && <span style={styles.activeTabBadge}>{currentBookings.length}</span>}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        style={{
                            ...styles.tabBtn,
                            color: activeTab === 'history' ? '#C084FC' : '#94A3B8',
                            borderBottom: activeTab === 'history' ? '2.5px solid #C084FC' : '2.5px solid transparent',
                        }}
                    >
                        ประวัติรายการจอง
                    </button>
                </div>

                {/* Content Render ตาม Tab ที่เลือก */}
                {loading ? (
                    <p style={styles.emptyText}>กำลังโหลดข้อมูล...</p>
                ) : (
                    activeTab === 'current' ? renderCurrentBookings() : renderHistoryBookings()
                )}

            </div>
        </div>
    );
}

// Stylesheet (Minimal Pastel Theme)
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
        fontFamily: "'Prompt', 'Kanit', sans-serif",
        color: "#334155",
        boxSizing: "border-box",
    },
    header: { marginBottom: "20px" },
    title: { color: "#334155", fontWeight: "800", margin: "0 0 4px 0" },
    subtitle: { fontSize: "14px", color: "#64748B", margin: 0 },
    tabsContainer: {
        display: 'flex',
        gap: '24px',
        marginBottom: '24px',
        borderBottom: '1px solid #F3E8FF',
    },
    tabBtn: {
        background: 'none',
        border: 'none',
        padding: '0 4px 10px 4px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        outline: 'none',
    },
    activeTabBadge: {
        backgroundColor: "#C084FC",
        color: "#FFFFFF",
        fontSize: "11px",
        borderRadius: "20px",
        padding: "2px 6px",
        marginLeft: "6px",
    },
    filterSubContainer: {
        display: "flex",
        gap: "10px",
        marginBottom: "16px",
    },
    filterChip: {
        padding: "6px 14px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        border: "1px solid",
        transition: "all 0.2s ease",
    },
    gridContainer: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
        gap: "20px",
    },
    gridCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        overflow: "hidden",
        border: "1.5px solid #F3E8FF",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
    },
    cardImageContainer: {
        position: "relative",
        width: "100%",
        height: "180px",
        backgroundColor: "#FAF5FF",
    },
    cardImage: { width: "100%", height: "100%", objectFit: "cover" },
    statusBadgeOverlay: {
        position: "absolute",
        top: "12px",
        right: "12px",
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600",
    },
    cardContent: {
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: "space-between",
    },
    foodNameGrid: { fontSize: "18px", fontWeight: "700", color: "#1E293B", margin: "0 0 12px 0" },
    infoListActive: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "16px",
        backgroundColor: "#FAF5FF",
        padding: "12px",
        borderRadius: "12px",
    },
    infoItem: { display: "flex", alignItems: "center", gap: "8px" },
    iconStyle: { fontSize: "16px", color: "#C084FC" },
    infoText: { fontSize: "12px", color: "#475569", fontWeight: "500" },
    actionBtnPrimary: {
        width: "100%",
        backgroundColor: "#C084FC",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "10px",
        padding: "10px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
    },
    historyListContainer: { display: "flex", flexDirection: "column", gap: "12px" },
    historyRow: {
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #F1F5F9",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
    },
    historyThumb: { width: "60px", height: "60px", borderRadius: "12px", objectFit: "cover" },
    historyMainInfo: { flex: 1, display: "flex", flexDirection: "column", gap: "4px" },
    historyHeaderRow: { display: "flex", alignItems: "center", gap: "10px" },
    historyFoodName: { fontSize: "16px", fontWeight: "700", color: "#334155", margin: 0 },
    statusBadgeCompact: { padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
    historyMetaRow: { display: "flex", gap: "8px", fontSize: "13px", color: "#94A3B8" },
    historyBtn: {
        backgroundColor: "#F8FAFC",
        color: "#64748B",
        border: "1px solid #E2E8F0",
        borderRadius: "8px",
        padding: "6px 14px",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
    },
    emptyCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        border: "1.5px solid #F3E8FF",
        padding: "48px 20px",
        textAlign: "center",
    },
    emptyText: { color: "#94A3B8", fontSize: "15px", margin: 0, textAlign: "center" },
};