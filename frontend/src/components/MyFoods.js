import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';

export default function MyFoods() {
    const navigate = useNavigate();

    const [userId, setUserId] = useState(null);
    const [myFoods, setMyFoods] = useState([]);
    const [loading, setLoading] = useState(true);

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

        fetch("http://localhost:8082/foods/my-donations", {
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
        available: { text: "เปิดให้รับบริจาค", color: "#2e7d32", bgColor: "#e8f5e9" },
        closed: { text: "ปิดให้รับบริจาค", color: "#707070", bgColor: "#f0f0f0" },
        disable: { text: "ถูกระงับ", color: "#c41414", bgColor: "#ffc8c8" },
        expired: { text: "หมดอายุ", color: "#37474f", bgColor: "#eceff1" }
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

            if (response.status === 403 || !resData.success) {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่สามารถสร้างบริจาคได้',
                    text: resData.message,
                    confirmButtonColor: '#e74c3c'
                });
                return;
            }
            
            navigate("/food-form");
        } catch (error) {
            console.error("Check Status Error:", error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ กรุณาลองใหม่อีกครั้ง");
        }
    };

    const renderContent = () => {
        if (loading) return <p style={styles.emptyText}>กำลังโหลดข้อมูล...</p>;
        if (!myFoods || myFoods.length === 0) return <p style={styles.emptyText}>ไม่พบข้อมูลอาหารบริจาค</p>;

        return (
            <div style={styles.list}>
                {[...myFoods].reverse().map((food) => {
                    return (
                        <div 
                            key={food.foodId} 
                            style={{
                                ...styles.card,
                                flexDirection: isMobile ? "column" : "row",
                                alignItems: isMobile ? "stretch" : "stretch"
                            }}
                        >
                            <div 
                                style={{
                                    ...styles.imageWrapper,
                                    width: isMobile ? "100%" : "220px",
                                    height: isMobile ? "200px" : "220px"
                                }}
                            >
                                <img
                                    src={`${BASE_URL}${food.foodImage}`}
                                    alt={food.foodName}
                                    style={styles.image}
                                />
                            </div>

                            <div 
                                style={{
                                    ...styles.details,
                                    paddingLeft: isMobile ? "0px" : "25px",
                                    marginTop: isMobile ? "15px" : "0px"
                                }}
                            >
                                <div style={styles.rowBetween}>
                                    <h3 style={{ ...styles.foodName, fontSize: isMobile ? "20px" : "24px" }}>
                                        {food.foodName}
                                    </h3>
                                    <span
                                        style={{
                                            ...styles.statusBadge,
                                            backgroundColor: food.foodStatus && STATUS_CONFIG[food.foodStatus]
                                                ? STATUS_CONFIG[food.foodStatus].bgColor
                                                : "#eceff1",
                                            color: food.foodStatus && STATUS_CONFIG[food.foodStatus]
                                                ? STATUS_CONFIG[food.foodStatus].color
                                                : "#37474f",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {STATUS_CONFIG[food.foodStatus]?.text || "ไม่ระบุสถานะ"}
                                    </span>
                                </div>

                                <div style={styles.infoContainer}>
                                    <div style={{ ...styles.infoRow, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                                            <span className="material-symbols-outlined" style={styles.icon}>
                                                calendar_clock
                                            </span>
                                            <span style={styles.label}>วันหมดอายุ</span>
                                        </div>
                                        <span style={{ ...styles.value, marginLeft: isMobile ? "32px" : "0", whiteSpace: "nowrap" }}>
                                            {formatExpiryDate(food.expiryDate)} น.
                                        </span>
                                    </div>

                                    <div style={{ ...styles.infoRow, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                                            <span className="material-symbols-outlined" style={styles.icon}>
                                                package_2
                                            </span>
                                            <span style={styles.label}>จำนวนที่บริจาค และ คงเหลือ</span>
                                        </div>
                                        <span style={{ ...styles.value, marginLeft: isMobile ? "32px" : "0", whiteSpace: "nowrap" }}>
                                            {food.totalUnit} : {food.remainingUnit}
                                        </span>
                                    </div>

                                    <div style={{ ...styles.infoRow, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                                            <span className="material-symbols-outlined" style={styles.icon}>
                                                schedule
                                            </span>
                                            <span style={styles.label}>วันและเวลาที่สามารถรับได้</span>
                                        </div>
                                        <span style={{ ...styles.value, marginLeft: isMobile ? "32px" : "0", whiteSpace: "normal" }}>
                                            {formatPickupDate(food.pickupDateStart)} - {formatPickupDate(food.pickupDateEnd)} &nbsp; {formatPickupTime(food.pickupStartTime)} น. - {formatPickupTime(food.pickupEndTime)} น.
                                        </span>
                                    </div>
                                </div>

                                <button
                                    style={{
                                        ...styles.detailBtn,
                                        width: isMobile ? "100%" : "fit-content",
                                        textAlign: "center"
                                    }}
                                    onClick={() => navigate('/food-form', { state: { id: food.foodId } })}
                                >
                                    ดูรายละเอียด
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
            <div style={{ ...styles.container, padding: isMobile ? "15px" : "20px" }}>
                <div 
                    style={{
                        ...styles.header,
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: isMobile ? "flex-start" : "center",
                        gap: isMobile ? "15px" : "0"
                    }}
                >
                    <h1 style={{ ...styles.title, fontSize: isMobile ? "22px" : "30px", marginBottom: "0px" }}>
                        รายการอาหารบริจาคของฉัน
                    </h1>
                    <button
                        style={{
                            ...styles.createBtn,
                            width: isMobile ? "100%" : "auto",
                            justifyContent: "center",
                            padding: isMobile ? "10px 20px" : "8px 40px"
                        }}
                        onClick={handleCreateClick}
                    >
                        <span style={{ fontSize: "20px", marginRight: "8px" }}>+</span>
                        สร้างบริจาค
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
        justifyContent: "space-between",
        marginBottom: "30px",
    },
    title: {
        color: "#328d7d",
        fontWeight: "bold",
    },
    createBtn: {
        backgroundColor: "#ff8c00",
        color: "#fff",
        border: "none",
        borderRadius: "12px",
        fontSize: "17px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        outline: "none",
        margin: "0px"
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
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.01)",
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
        marginTop: "0px",
        marginBottom: "0px",
    },
    statusBadge: {
        padding: "6px 14px",
        borderRadius: "10px",
        fontSize: "15px",
    },
    infoContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginBottom: "15px"
    },
    infoRow: {
        display: "flex",
        fontSize: "15px",
        flexWrap: "wrap"
    },
    icon: {
        fontSize: "24px",
        marginRight: "8px",
        display: "inline-block",
        color: "#ff8c00",
        flexShrink: 0
    },
    label: {
        color: "#111",
        marginRight: "15px",
        fontWeight: "500",
        flexShrink: 0
    },
    value: {
        color: "#328d7d",
    },
    detailBtn: {
        backgroundColor: "#ff8c00",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "8px 25px",
        fontSize: "15px",
        cursor: "pointer",
        marginTop: "5px"
    },
    emptyText: {
        textAlign: "center",
        marginTop: "50px",
        color: "#999",
        fontSize: "18px",
    },
};