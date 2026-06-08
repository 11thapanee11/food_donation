import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FoodReceive() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('current');

    // กรองข้อมูลตามสถานะของการจอง (Booking Status)
    const currentBookings = bookings.filter(b => b.bookingStatus === 'pending');
    const historyBookings = bookings.filter(b => b.bookingStatus === 'completed' || b.bookingStatus === 'cancelled');

    const BASE_URL = "http://localhost:8082";

    // ดึงข้อมูลรายการจองของผู้รับบริจาคที่ล็อกอินอยู่
    // useEffect(() => {
    //     const token = localStorage.getItem("accessToken");

    //     // เปลี่ยน URL ให้ยิงไปหา Controller ฝั่ง Booking ของคุณ
    //     fetch("http://localhost:8082/bookings", {
    //         headers: {
    //             "Authorization": `Bearer ${token}`
    //         }
    //     })
    //         .then((res) => {
    //             if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลการจองได้");
    //             return res.json();
    //         })
    //         .then((data) => setBookings(data)) // บันทึกอาเรย์การจองลง state
    //         .catch((err) => console.error("Error fetching bookings:", err))
    //         .finally(() => setLoading(false));
    // }, []);
    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        // ยิงไปหา Controller ฝั่ง Booking เพื่อดึงประวัติการจองทั้งหมด
        fetch("http://localhost:8082/bookings", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then((res) => {
                if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลการจองได้");
                return res.json();
            })
            .then((resData) => {
                if (resData.success && Array.isArray(resData.data)) {
                    setBookings(resData.data); // บันทึกอาเรย์การจองลง state
                } else {
                    setBookings([]); // หากหลังบ้านไม่มีข้อมูลหรือผิดพลาด ให้เคลียร์เป็นอาเรย์ว่างป้องกันการพังของ .map() ใน JSX
                }
            })
            .catch((err) => {
                console.error("Error fetching bookings:", err);
                setBookings([]); // ป้องกันหน้าเว็บค้างหากเกิดข้อผิดพลาด
            })
            .finally(() => setLoading(false));
    }, []);

    // ฟังก์ชันฟอร์แมตวันหมดอายุ และ วันที่ทำรายการจอง
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

    // ฟังก์ชันแปลงวันที่ให้เป็นแบบไทยย่อ
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

    // ฟังก์ชันตัดเลขวินาทีของเวลา
    const formatPickupTime = (timeString) => {
        if (!timeString) return "-";
        return timeString.substring(0, 5);
    };

    // 2. กำหนดป้ายสถานะสำหรับ "ฝั่งการจอง (Booking)" ให้ตรงกับรูปภาพ Layout ของคุณ
    const STATUS_CONFIG = {
        pending: {
            text: "รอการเข้ารับ",
            color: "#f0b002",     // สีส้มอมน้ำตาลเข้มอ่านง่าย
            bgColor: "#fff3a6"   // สีครีมส้มพาสเทลแบบในรูปเดโมของคุณ
        },
        completed: {
            text: "รับบริจาคสำเร็จ",
            color: "#2e7d32",     // สีเขียวเข้มสบายตา
            bgColor: "#e8f5e9"    // สีเขียวพาสเทลอ่อน
        },
        cancelled: {
            text: "ยกเลิกรายการ",
            color: "#c62828",     // สีแดงเข้มอมชมพู
            bgColor: "#ffebee"    // สีชมพู/แดงพาสเทลอ่อน
        }
    };

    const renderContent = () => {
        if (loading) {
            return <p style={styles.emptyText}>กำลังโหลดข้อมูลการจองของคุณ...</p>;
        }

        // เลือกชุดข้อมูลมาลูปตามแท็บที่เปิดใช้งานอยู่
        const displayData = activeTab === 'current' ? currentBookings : historyBookings;

        if (!displayData || displayData.length === 0) {
            return <p style={styles.emptyText}>ไม่พบรายการข้อมูลในหมวดหมู่นี้</p>;
        }

        return (
            <div style={styles.list}>
                {displayData.map((booking) => {
                    // แตก Object ชั้นอาหารออกมาใช้งานเพื่อให้อ่านโค้ดง่ายขึ้น
                    const food = booking.food;
                    const status = STATUS_CONFIG[booking.bookingStatus] || { text: booking.bookingStatus, color: "#37474f", bgColor: "#eceff1" };

                    return (
                        <div key={booking.id} style={styles.card}>
                            {/* ฝั่งซ้าย: รูปภาพอาหารที่ถูกจอง */}
                            <div style={styles.imageWrapper}>
                                <img
                                    src={`${BASE_URL}${food?.foodImage}`}
                                    alt={food?.foodName}
                                    style={styles.image}
                                />
                            </div>

                            {/* ฝั่งขวา: รายละเอียดข้อความการจอง */}
                            <div style={styles.details}>
                                <div style={styles.rowBetween}>
                                    <h3 style={styles.foodName}>{food?.foodName}</h3>
                                    {/* ป้ายสถานะการจองตามที่ตั้งค่าพาสเทลไว้ */}
                                    <span
                                        style={{
                                            ...styles.statusBadge,
                                            backgroundColor: status.bgColor,
                                            color: status.color,
                                        }}
                                    >
                                        {status.text}
                                    </span>
                                </div>

                                <div style={styles.infoContainer}>
                                    <div style={styles.infoRow}>
                                        <span className="material-symbols-outlined" style={styles.icon}>
                                            calendar_clock
                                        </span>
                                        <span style={styles.label}>วันหมดอายุ</span>
                                        <span style={styles.value}>
                                            {formatExpiryDate(food?.expiryDate)} น.
                                        </span>
                                    </div>

                                    <div style={styles.infoRow}>
                                        <span className="material-symbols-outlined" style={styles.icon}>
                                            schedule
                                        </span>
                                        <span style={styles.label}>วันและเวลาที่สามารถรับได้</span>
                                        <span style={styles.value}>
                                            {formatPickupDate(food?.pickupDateStart)} - {formatPickupDate(food?.pickupDateEnd)} &nbsp; {formatPickupTime(food?.pickupStartTime)} น. - {formatPickupTime(food?.pickupEndTime)} น.
                                        </span>
                                    </div>

                                    <div style={styles.infoRow}>
                                        <span className="material-symbols-outlined" style={styles.icon}>
                                            package_2
                                        </span>
                                        <span style={styles.label}>จำนวนที่รับบริจาค</span>
                                        <span style={styles.value}>
                                            {booking.bookingUnit}
                                        </span>
                                    </div>

                                    <div style={styles.infoRow}>
                                        <span className="material-symbols-outlined" style={styles.icon}>
                                            calendar_month
                                        </span>
                                        <span style={styles.label}>วันที่ทำการจอง</span>
                                        <span style={styles.value}>
                                            {formatExpiryDate(booking.bookingDate)} น.
                                        </span>
                                    </div>
                                </div>

                                {/* ปุ่มกดเข้าไปดูหน้ารายละเอียดเพื่อโชว์ตั๋ว/รหัสยืนยันรับอาหาร */}
                                <button
                                    type="button"
                                    style={styles.detailBtn}
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
            <div style={styles.container}>
                {/* Header Section */}
                <div style={styles.header}>
                    <h1 style={styles.title}>รายการรับอาหารบริจาคของฉัน</h1>
                </div>

                {/* ส่วนหัวแท็บ (Tabs Navigation) ขยับลงมาอยู่ด้านล่างอย่างอิสระสวยงาม */}
                <div style={{
                    display: 'flex',
                    gap: '32px',
                    marginBottom: '24px',
                    paddingBottom: '8px'
                }}>
                    <button
                        type="button" // ระบุประเภทปุ่มป้องกันการซับมิตฟอร์ม
                        onClick={() => setActiveTab('current')}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '0 0 8px 0',
                            fontSize: '18px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            color: activeTab === 'current' ? '#ff9800' : '#6b7280',
                            borderBottom: activeTab === 'current' ? '3px solid #ff9800' : '3px solid transparent',
                            outline: 'none' // ล้างเส้นขอบสีดำตอนกดโฟกัส
                        }}
                    >
                        รายการจอง
                    </button>

                    {/* แท็บ ประวัติรายการจอง */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '0 0 8px 0',
                            fontSize: '18px',
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

                {/* Content Section เรียกใช้งานฟังก์ชันที่กรองตามสวิตช์แท็บไว้แล้ว */}
                {renderContent()}

            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "20px 20px"
    },
    header: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        marginBottom: "10px",
    },
    title: {
        color: "#328d7d",
        fontSize: "30px",
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
        backgroundColor: "#ffe8cc", // พื้นการ์ดสีครีมส้มอ่อนละมุนตาตรงตามตัวเดโมของคุณ
        borderRadius: "20px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        alignItems: "stretch"
    },
    imageWrapper: {
        width: "220px",
        height: "220px",
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
        paddingLeft: "25px",
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
        fontSize: "22px",
        fontWeight: "bold",
        color: "#000",
        marginTop: "5px",
        marginBottom: "0px",
    },
    statusBadge: {
        padding: "6px 14px",
        borderRadius: "10px",
        fontSize: "15px",
        fontWeight: "500"
    },
    infoContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "15px"
    },
    infoRow: {
        display: "flex",
        alignItems: "center",
        fontSize: "15px",
    },
    icon: {
        fontSize: "24px",
        marginRight: "10px",
        display: "inline-block",
        width: "20px",
        color: "#ff8c00" // ไอคอนสัญลักษณ์สีส้มสดตัดสวย
    },
    label: {
        color: "#111",
        marginRight: "15px",
        fontWeight: "500",
        flexShrink: 0
    },
    value: {
        color: "#328d7d", // ข้อมูลผลลัพธ์สีเขียวมินิมอล
    },
    detailBtn: {
        backgroundColor: "#ff8c00",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "8px 25px",
        fontSize: "15px",
        cursor: "pointer",
        width: "fit-content",
        marginTop: "auto" // บล็อกปุ่มไว้ล่างสุดของการ์ดเสมอเพิ่มความสมดุล
    },
    emptyText: {
        textAlign: "center",
        marginTop: "60px",
        color: "#999",
        fontSize: "18px",
    },
};