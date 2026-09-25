import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';

export default function ListDonorFood() {
    const navigate = useNavigate();

    const [userId, setUserId] = useState(null);
    const [myFoods, setMyFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");

    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );

    const BASE_URL = "http://localhost:8082";

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (token && token !== "undefined" && token !== "null") {
            try {
                const decoded = jwtDecode(token);
                setUserId(decoded?.sub);
            } catch (error) {
                console.error("Token Decode Error:", error);
                setUserId(null);
            }
        } else {
            setUserId(null);
        }

        fetch(`${BASE_URL}/foods/my-donations`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then((res) => {
                if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลการบริจาคได้");
                return res.json();
            })
            .then((resData) => {
                if (resData.success) {
                    setMyFoods(resData.data);
                } else {
                    throw new Error(resData.message || "ไม่สามารถโหลดข้อมูลได้");
                }
            })
            .catch((err) => console.error("Error:", err))
            .finally(() => setLoading(false));
    }, []);

    const formatExpiryDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);

        const formattedDate = date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        const formattedTime = date.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });

        return `${formattedDate} (${formattedTime} น.)`;
    };

    const formatPickupDate = (dateString) => {
        if (!dateString) return "-";
        const cleanDate = dateString.split("T")[0];
        const date = new Date(cleanDate);
        if (isNaN(date.getTime())) return dateString;

        return date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short"
        });
    };

    const formatPickupTime = (timeString) => {
        if (!timeString) return "-";
        return timeString.substring(0, 5);
    };

    const STATUS_CONFIG = {
        available: {
            text: "เปิดรับบริจาค",
            color: "#047857",
            bgColor: "#ECFDF5",
            borderColor: "#A7F3D0"
        },
        closed: {
            text: "ปิดการรับบริจาค",
            color: "#475569",
            bgColor: "#F8FAFC",
            borderColor: "#E2E8F0"
        },
        disable: {
            text: "ซ่อนการแสดงผล",
            color: "#B91C1C",
            bgColor: "#FEF2F2",
            borderColor: "#FECACA"
        },
        expired: {
            text: "หมดอายุ",
            color: "#B45309",
            bgColor: "#FFFBEB",
            borderColor: "#FDE68A"
        }
    };

    const handleCreateClick = async () => {
        const token = localStorage.getItem("accessToken");

        try {
            const response = await fetch(`${BASE_URL}/donor/check-status`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const resData = await response.json();

            if (response.status === 404 || resData.isFirstTime) {
                navigate("/food-form");
                return;
            }

            if (response.status === 403 || !response.ok || !resData.success) {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่สามารถสร้างบริจาคได้',
                    text: resData.message || 'บัญชีของคุณไม่สามารถทำการบริจาคได้ในขณะนี้',
                    confirmButtonColor: '#C084FC'
                });
                return;
            }

            navigate("/food-form");
        } catch (error) {
            console.error("Check Status Error:", error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ กรุณาลองใหม่อีกครั้ง");
        }
    };

    const filteredFoods = myFoods.filter((food) => {
        if (activeTab === "all") return true;
        return food.foodStatus === activeTab;
    });

    const renderContent = () => {
        if (loading) return <p style={styles.emptyText}>กำลังโหลดข้อมูล...</p>;
        if (!myFoods || myFoods.length === 0) return (
            <div style={styles.emptyCard}>
                <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#C084FC" }}>
                    inventory_2
                </span>
                <p style={styles.emptyText}>ยังไม่มีรายการอาหารที่คุณลงบริจาค</p>
                <button style={styles.emptyBtn} onClick={handleCreateClick}>+ สร้างการบริจาคแรกของคุณ</button>
            </div>
        );

        if (filteredFoods.length === 0) {
            return <p style={styles.emptyText}>ไม่พบรายการในหมวดหมู่นี้</p>;
        }

        return (
            <div style={styles.gridContainer}>
                {[...filteredFoods].reverse().map((food) => {
                    const status = STATUS_CONFIG[food.foodStatus] || {
                        text: "ไม่ระบุสถานะ",
                        color: "#475569",
                        bgColor: "#F1F5F9",
                        borderColor: "#CBD5E1"
                    };

                    return (
                        <div key={food.foodId} style={styles.gridCard}>
                            {/* ส่วนรูปภาพ + Badge ลอยบนภาพ */}
                            <div style={styles.cardImageContainer}>
                                <img
                                    src={`${BASE_URL}${food.foodImage}`}
                                    alt={food.foodName}
                                    style={styles.cardImage}
                                />
                                <span
                                    style={{
                                        ...styles.statusBadgeOverlay,
                                        backgroundColor: status.bgColor,
                                        color: status.color,
                                        border: `1px solid ${status.borderColor}`
                                    }}
                                >
                                    {status.text}
                                </span>
                            </div>

                            {/* รายละเอียดในการ์ด */}
                            <div style={styles.cardContent}>
                                <h3 style={styles.foodNameGrid}>{food.foodName}</h3>

                                <div style={styles.infoList}>
                                    <div style={styles.infoItem}>
                                        <span className="material-symbols-outlined" style={styles.iconStyle}>inventory</span>
                                        <span style={styles.infoText}>
                                            คงเหลือ <strong style={{ color: "#C084FC" }}>{food.remainingUnit}</strong> / ทั้งหมด {food.totalUnit} ชุด
                                        </span>
                                    </div>

                                    <div style={styles.infoItem}>
                                        <span className="material-symbols-outlined" style={styles.iconStyle}>event</span>
                                        <span style={styles.infoText}>
                                            หมดอายุ: {formatExpiryDate(food.expiryDate)}
                                        </span>
                                    </div>

                                    <div style={styles.infoItem}>
                                        <span className="material-symbols-outlined" style={styles.iconStyle}>schedule</span>
                                        <span style={styles.infoText}>
                                            รับได้: {formatPickupDate(food.pickupDateStart)} - {formatPickupDate(food.pickupDateEnd)} ({formatPickupTime(food.pickupStartTime)}-{formatPickupTime(food.pickupEndTime)} น.)
                                        </span>
                                    </div>
                                </div>

                                <button
                                    style={styles.actionBtnGrid}
                                    onClick={() => navigate('/food-form', { state: { id: food.foodId } })}
                                >
                                    <span>จัดการ / ดูรายละเอียด</span>
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={styles.fullWidthWrapper}>
            <div style={{ ...styles.container, padding: isMobile ? "20px 16px" : "36px 20px" }}>

                {/* Header */}
                <div
                    style={{
                        ...styles.header,
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: isMobile ? "flex-start" : "center",
                        gap: isMobile ? "16px" : "0"
                    }}
                >
                    <div>
                        <h1 style={{ ...styles.title, fontSize: isMobile ? "24px" : "28px" }}>
                            รายการอาหารบริจาคของฉัน
                        </h1>
                        <p style={styles.subtitle}>จัดการรายการอาหารและติดตามสถานะการส่งมอบของคุณ</p>
                    </div>

                    <button
                        style={{
                            ...styles.createBtn,
                            width: isMobile ? "100%" : "auto"
                        }}
                        onClick={handleCreateClick}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "20px", marginRight: "6px" }}>add</span>
                        สร้างการบริจาค
                    </button>
                </div>

                {/* Filter Tabs */}
                <div style={styles.tabsContainer}>
                    {[
                        { key: "all", label: "ทั้งหมด" },
                        { key: "available", label: "เปิดรับบริจาค" },
                        { key: "closed", label: "ปิดการรับบริจาค" },
                        { key: "expired", label: "หมดอายุ" }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            style={{
                                padding: "8px 18px",
                                borderRadius: "20px",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                outline: "none",
                                backgroundColor: activeTab === tab.key ? "#C084FC" : "#FFFFFF",
                                color: activeTab === tab.key ? "#FFFFFF" : "#64748B",
                                border: activeTab === tab.key ? "1px solid #C084FC" : "1px solid #E9D5FF",
                                fontWeight: activeTab === tab.key ? "600" : "500",
                            }}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {renderContent()}
            </div>
        </div>
    );
}

// Inline Styles (Grid Gallery Pastel Theme)
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
    header: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "24px",
    },
    title: {
        color: "#334155",
        fontWeight: "800",
        margin: "0 0 4px 0",
    },
    subtitle: {
        fontSize: "14px",
        color: "#64748B",
        margin: 0,
    },
    createBtn: {
        backgroundColor: "#C084FC",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "12px",
        padding: "10px 24px",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(192, 132, 252, 0.25)",
    },
    tabsContainer: {
        display: "flex",
        gap: "8px",
        marginBottom: "24px",
        overflowX: "auto",
        paddingBottom: "4px",
    },
    tabBtn: {
        padding: "8px 18px",
        borderRadius: "20px",
        border: "1px solid #E9D5FF",
        backgroundColor: "#FFFFFF",
        color: "#64748B",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        whiteSpace: "nowrap",
        outline: "none",

    },
    activeTabBtn: {
        backgroundColor: "#C084FC",
        color: "#FFFFFF",
        borderColor: "#C084FC",
        fontWeight: "600",
        outline: "none",
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
    cardImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    statusBadgeOverlay: {
        position: "absolute",
        top: "12px",
        right: "12px",
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    },
    cardContent: {
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: "space-between",
    },
    foodNameGrid: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#1E293B",
        margin: "0 0 12px 0",
    },
    infoList: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "16px",
        backgroundColor: "#FAF5FF",
        padding: "12px",
        borderRadius: "12px",
    },
    infoItem: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    iconStyle: {
        fontSize: "16px",
        color: "#C084FC",
    },
    infoText: {
        fontSize: "12px",
        color: "#475569",
        fontWeight: "500",
    },
    actionBtnGrid: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        color: "#C084FC",
        border: "1px solid #E9D5FF",
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
    emptyCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        border: "1.5px solid #F3E8FF",
        padding: "48px 20px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
    },
    emptyText: {
        textAlign: "center",
        color: "#64748B",
        fontSize: "15px",
        margin: 0,
    },
    emptyBtn: {
        backgroundColor: "#C084FC",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "12px",
        padding: "10px 20px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        marginTop: "8px",
    },
};