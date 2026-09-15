import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FoodReceive() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('current');

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // กรองข้อมูลตามสถานะของการจอง (Booking Status)
    const currentBookings = bookings.filter(b => b.bookingStatus === 'pending');
    const historyBookings = bookings.filter(b => b.bookingStatus === 'completed' || b.bookingStatus === 'cancelled');

    const BASE_URL = "http://localhost:8082";

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        setLoading(true);

        // ดึงข้อมูลการจองทั้งหมด
        fetch("http://localhost:8082/bookings", {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(async (resData) => {
                if (resData.success && Array.isArray(resData.data)) {
                    const bookings = resData.data;

                    // ดึงข้อมูล Food ของทุกรายการ (ใช้ Promise.all เพื่อเรียกพร้อมกัน)
                    const bookingsWithFood = await Promise.all(
                        bookings.map(async (booking) => {
                            try {
                                const foodRes = await fetch(`http://localhost:8082/foods/${booking.foodId}`, {
                                    headers: { "Authorization": `Bearer ${token}` }
                                });
                                const foodData = await foodRes.json();
                                return { ...booking, food: foodData.data || foodData };
                            } catch (e) {
                                return { ...booking, food: null };
                            }
                        })
                    );

                    setBookings(bookingsWithFood);
                } else {
                    setBookings([]);
                }
            })
            .catch((err) => {
                console.error("Error:", err);
                setBookings([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const formatExpiryDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);

        const formattedDate = date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        const formattedTime = date.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });

        return `${formattedDate} เวลา ${formattedTime}`;
    };

    const formatPickupDate = (dateString) => {
        if (!dateString) return "-";
        const cleanDate = dateString.split("T")[0];
        const date = new Date(cleanDate);

        if (isNaN(date.getTime())) return dateString;

        return date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const formatPickupTime = (timeString) => {
        if (!timeString) return "-";
        return timeString.substring(0, 5);
    };

    const STATUS_CONFIG = {
        pending: {
            text: "รอการเข้ารับ",
            color: "#f0b002",
            bgColor: "#fff3a6"
        },
        completed: {
            text: "รับบริจาคสำเร็จ",
            color: "#2e7d32",
            bgColor: "#e8f5e9"
        },
        cancelled: {
            text: "ยกเลิกรายการ",
            color: "#c62828",
            bgColor: "#ffebee"
        },
        deactivate: {
            text: "ถูกระงับ",
            color: "#ef6c00",
            bgColor: "#fff3e0"
        }
    };

    const renderContent = () => {
        if (loading) {
            return <p style={styles.emptyText}>กำลังโหลดข้อมูลการจองของคุณ...</p>;
        }

        const displayData = activeTab === 'current' ? currentBookings : historyBookings;

        if (!displayData || displayData.length === 0) {
            return <p style={styles.emptyText}>ไม่พบรายการข้อมูลในหมวดหมู่นี้</p>;
        }

        return (
            <div style={styles.list}>
                {displayData.map((booking) => {
                    const food = booking.food;
                    const status = STATUS_CONFIG[booking.bookingStatus] || { text: booking.bookingStatus, color: "#37474f", bgColor: "#eceff1" };

                    return (
                        <div
                            key={booking.id}
                            style={{
                                ...styles.card,
                                flexDirection: isMobile ? "column" : "row", // เปลี่ยนการจัดวางการ์ดเป็นแนวตั้งบนมือถือ
                                padding: isMobile ? "15px" : "20px"
                            }}
                        >
                            {/* ฝั่งซ้าย/บน: รูปภาพอาหารที่ถูกจอง */}
                            <div
                                style={{
                                    ...styles.imageWrapper,
                                    width: isMobile ? "100%" : "220px",
                                    height: isMobile ? "200px" : "220px",
                                }}
                            >
                                <img
                                    src={`${BASE_URL}${food?.foodImage}`}
                                    alt={food?.foodName}
                                    style={styles.image}
                                />
                            </div>

                            {/* ฝั่งขวา/ล่าง: รายละเอียดข้อความการจอง */}
                            <div
                                style={{
                                    ...styles.details,
                                    paddingLeft: isMobile ? "0px" : "25px",
                                    paddingTop: isMobile ? "15px" : "0px"
                                }}
                            >
                                <div style={styles.rowBetween}>
                                    <h3 style={{ ...styles.foodName, fontSize: isMobile ? "18px" : "22px" }}>
                                        {food?.foodName}
                                    </h3>
                                    <span
                                        style={{
                                            ...styles.statusBadge,
                                            backgroundColor: status.bgColor,
                                            color: status.color,
                                            fontSize: isMobile ? "13px" : "15px",
                                            padding: isMobile ? "4px 10px" : "6px 14px"
                                        }}
                                    >
                                        {status.text}
                                    </span>
                                </div>

                                <div style={styles.infoContainer}>
                                    <div style={{ ...styles.infoRow, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center" }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span className="material-symbols-outlined" style={styles.icon}>calendar_clock</span>
                                            <span style={styles.label}>วันหมดอายุ</span>
                                        </div>
                                        <span style={{ ...styles.value, marginLeft: isMobile ? "30px" : "0px" }}>
                                            {formatExpiryDate(food?.expiryDate)} น.
                                        </span>
                                    </div>

                                    <div style={{ ...styles.infoRow, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center" }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span className="material-symbols-outlined" style={styles.icon}>schedule</span>
                                            <span style={styles.label}>วันและเวลาที่สามารถรับได้</span>
                                        </div>
                                        <span style={{ ...styles.value, marginLeft: isMobile ? "30px" : "0px" }}>
                                            {formatPickupDate(food?.pickupDateStart)} - {formatPickupDate(food?.pickupDateEnd)} &nbsp; {formatPickupTime(food?.pickupStartTime)} น. - {formatPickupTime(food?.pickupEndTime)} น.
                                        </span>
                                    </div>

                                    <div style={{ ...styles.infoRow, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center" }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span className="material-symbols-outlined" style={styles.icon}>package_2</span>
                                            <span style={styles.label}>จำนวนที่รับบริจาค</span>
                                        </div>
                                        <span style={{ ...styles.value, marginLeft: isMobile ? "30px" : "0px" }}>
                                            {booking.bookingUnit}
                                        </span>
                                    </div>

                                    <div style={{ ...styles.infoRow, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center" }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span className="material-symbols-outlined" style={styles.icon}>calendar_month</span>
                                            <span style={styles.label}>วันที่ทำการจอง</span>
                                        </div>
                                        <span style={{ ...styles.value, marginLeft: isMobile ? "30px" : "0px" }}>
                                            {formatExpiryDate(booking.bookingDate)} น.
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    style={{
                                        ...styles.detailBtn,
                                        width: isMobile ? "100%" : "fit-content", // บนมือถือปรับให้ปุ่มเต็มความกว้าง
                                        marginTop: isMobile ? "15px" : "auto"
                                    }}
                                    onClick={() => navigate('/food-detail', { state: { id: booking.bookingId, fromPage: '/receive', bookingStatus: booking.bookingStatus } })}
                                >
                                    ดูรายละเอียดการจอง
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={styles.page}>
            <div style={{ ...styles.container, padding: isMobile ? "15px 12px" : "20px 20px" }}>
                {/* Header Section */}
                <div style={styles.header}>
                    <h1 style={{ ...styles.title, fontSize: isMobile ? "22px" : "30px" }}>
                        รายการรับอาหารบริจาคของฉัน
                    </h1>
                </div>

                <div style={{
                    display: 'flex',
                    gap: isMobile ? '16px' : '32px',
                    marginBottom: '24px',
                    paddingBottom: '8px',
                }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('current')}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '0 0 8px 0',
                            fontSize: isMobile ? '15px' : '18px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            color: activeTab === 'current' ? '#ff9800' : '#6b7280',
                            borderBottom: activeTab === 'current' ? '3px solid #ff9800' : '3px solid transparent',
                            outline: 'none'
                        }}
                    >
                        รายการจอง
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '0 0 8px 0',
                            fontSize: isMobile ? '15px' : '18px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            color: activeTab === 'history' ? '#ff9800' : '#6b7280',
                            borderBottom: activeTab === 'history' ? '3px solid #ff9800' : '3px solid transparent',
                            outline: 'none'
                        }}
                    >
                        ประวัติรายการจอง
                    </button>
                </div>

                {renderContent()}
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "1100px",
        margin: "0 auto",
    },
    header: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        marginBottom: "10px",
    },
    title: {
        color: "#328d7d",
        fontWeight: "bold",
        marginBottom: "10px"
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    card: {
        display: "flex",
        backgroundColor: "#ffe8cc",
        borderRadius: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        alignItems: "stretch"
    },
    imageWrapper: {
        flexShrink: 0,
    },
    image: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "16px",
    },
    details: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
    },
    rowBetween: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
    },
    foodName: {
        fontWeight: "bold",
        color: "#000",
        marginTop: "5px",
        marginBottom: "0px",
    },
    statusBadge: {
        borderRadius: "10px",
        fontWeight: "500",
        whiteSpace: "nowrap"
    },
    infoContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "15px"
    },
    infoRow: {
        display: "flex",
        fontSize: "14px",
    },
    icon: {
        fontSize: "20px",
        marginRight: "8px",
        display: "inline-block",
        color: "#ff8c00"
    },
    label: {
        color: "#111",
        marginRight: "10px",
        fontWeight: "500",
        flexShrink: 0
    },
    value: {
        color: "#328d7d",
        wordBreak: "break-word"
    },
    detailBtn: {
        backgroundColor: "#ff8c00",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "10px 25px",
        fontSize: "15px",
        cursor: "pointer",
        textAlign: "center"
    },
    emptyText: {
        textAlign: "center",
        marginTop: "60px",
        color: "#999",
        fontSize: "16px",
    },
};