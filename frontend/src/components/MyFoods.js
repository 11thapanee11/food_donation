import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MyFoods() {
    const navigate = useNavigate();

    const [myFoods, setMyFoods] = useState([]);
    const [loading, setLoading] = useState(true);

    // useEffect(() => {
    //     // สมมติว่าดึงข้อมูลอาหารที่เราเป็นคนบริจาค (อาจจะมีการส่ง userId ใน header หรือ query)
    //     fetch("http://localhost:8082/foods/my-donations")
    //         .then((res) => res.json())
    //         .then((data) => setMyFoods(data))
    //         .catch((err) => console.error("Error:", err))
    //         .finally(() => setLoading(false));
    // }, []);

    // useEffect(() => {
    //     const token = localStorage.getItem("accessToken"); // ดึง token ที่เก็บไว้หลัง login

    //     fetch("http://localhost:8082/foods/my-donations", {
    //         headers: {
    //             "Authorization": `Bearer ${token}`
    //         }
    //     })
    //         .then((res) => {
    //             if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
    //             return res.json();
    //         })
    //         .then((data) => setMyFoods(data))
    //         .catch((err) => console.error("Error:", err))
    //         .finally(() => setLoading(false));
    // }, []);

    // ฟังก์ชันช่วยแก้ปัญหาเส้นดำเวลาคลิก
    // const handlePress = (e) => e.target.blur();


    const IMAGE_BASE_URL = "http://localhost:8082";

    //
    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        fetch("http://localhost:8082/foods/my-donations", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then((res) => {
                if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
                return res.json();
            })
            .then((data) => setMyFoods(data))
            .catch((err) => console.error("Error:", err))
            .finally(() => setLoading(false));
    }, []);

    // 1. ฟังก์ชันฟอร์แมตวันหมดอายุ (เช่น: 25 มีนาคม 2569 เวลา 13:00 น.)
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

    // 2. ฟังก์ชันฟอร์แมตเฉพาะวันที่รับของ (เช่น: 20 มีนาคม 2569)
    // const formatPickupDate = (dateString) => {
    //     if (!dateString) return "-";
    //     const date = new Date(dateString);

    //     return date.toLocaleDateString("th-TH", {
    //         day: "numeric",
    //         month: "long",
    //         year: "numeric"
    //     });
    // };

    // ฟังก์ชันแปลงวันที่เริ่ม-จบ ให้เป็นแบบไทยย่อ (เช่น 20 มี.ค. 2569)
    const formatPickupDate = (dateString) => {
        if (!dateString) return "-";

        // แยกเอาเฉพาะปี-เดือน-วัน (ป้องกันกรณีหลังบ้านส่งมาพร้อมตัว T หรือเวลา)
        const cleanDate = dateString.split("T")[0];
        const date = new Date(cleanDate);

        if (isNaN(date.getTime())) return dateString;

        return date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short", // ใช้ "short" จะได้ "มี.ค." ประหยัดพื้นที่ และดูมินิมอลขึ้นครับ
            year: "numeric"
        });
    };

    // ฟังก์ชันตัดเลขวินาทีของเวลา (เช่น 13:00:00 -> 13:00)
    const formatPickupTime = (timeString) => {
        if (!timeString) return "-";
        // เอาเฉพาะตำแหน่งชั่วโมงและนาที (5 ตัวแรก)
        return timeString.substring(0, 5);
    };

    // สร้างตารางจับคู่
    const STATUS_TEXTS = {
        AVAILABLE: "เปิดให้รับบริจาค",
        CLOSED: "ปิดให้รับบริจาค",
        SUSPENDED: "ถูกระงับ",
        EXPIRED: "หมดอายุ"
    };
    const STATUS_CONFIG = {
        AVAILABLE: {
            text: "เปิดให้รับบริจาค",
            color: "#2e7d32",     // สีเขียวเข้มสบายตา
            bgColor: "#e8f5e9"    // สีเขียวพาสเทลอ่อน
        },
        CLOSED: {
            text: "ปิดให้รับบริจาค",
            color: "#c62828",     // สีแดงเข้มอมชมพู
            bgColor: "#ffebee"    // สีชมพู/แดงพาสเทลอ่อน
        },
        SUSPENDED: {
            text: "ถูกระงับ",
            color: "#ef6c00",     // สีส้มอิฐ
            bgColor: "#fff3e0"    // สีครีมส้มพาสเทล
        },
        EXPIRED: {
            text: "หมดอายุ",
            color: "#37474f",     // สีเทาเข้ม
            bgColor: "#eceff1"    // สีเทาพาสเทลอ่อน
        }
    };


    const renderContent = () => {
        if (loading) {
            return <p style={styles.emptyText}>กำลังโหลดข้อมูล...</p>;
        }

        if (!myFoods || myFoods.length === 0) {
            return <p style={styles.emptyText}>ไม่พบข้อมูลอาหารบริจาค</p>;
        }

        return (
            <div style={styles.list}>
                {myFoods.map((food) => {

                    const foodStatusText = STATUS_TEXTS[food.foodStatus] || food.foodStatus || "ไม่ระบุ";

                    return (
                        <div key={food.foodId} style={styles.card}>
                            {/* ฝั่งซ้าย: รูปภาพอาหาร */}
                            <div style={styles.imageWrapper}>
                                <img
                                    src={`${IMAGE_BASE_URL}${food.foodImage}`}
                                    alt={food.foodName}
                                    style={styles.image}
                                />
                            </div>

                            {/* ฝั่งขวา: รายละเอียดข้อความ */}
                            <div style={styles.details}>
                                <div style={styles.rowBetween}>
                                    <h3 style={styles.foodName}>{food.foodName}</h3>
                                    {/* <span style={styles.statusBadge}>
                                        {foodStatusText}
                                    </span> */}
                                    <span
                                        style={{
                                            ...styles.statusBadge,
                                            backgroundColor: food.foodStatus && STATUS_CONFIG[food.foodStatus]
                                                ? STATUS_CONFIG[food.foodStatus].bgColor
                                                : "#eceff1", // สีเทาอ่อนเผื่อไว้กันพัง

                                            color: food.foodStatus && STATUS_CONFIG[food.foodStatus]
                                                ? STATUS_CONFIG[food.foodStatus].color
                                                : "#37474f",
                                        }}
                                    >
                                        {foodStatusText} {/* ข้อความภาษาไทยที่คุณดึงมาแสดงผลอยู่แล้ว */}
                                    </span>
                                </div>

                                <div style={styles.infoContainer}>
                                    <div style={styles.infoRow}>
                                        <span className="material-symbols-outlined" style={styles.icon}>
                                            calendar_clock
                                        </span>
                                        <span style={styles.label}>วันหมดอายุ</span>
                                        <span style={styles.value}>
                                            {formatExpiryDate(food.expiryDate)} น.
                                        </span>
                                    </div>

                                    <div style={styles.infoRow}>
                                        <span className="material-symbols-outlined" style={styles.icon}>
                                            package_2
                                        </span>
                                        <span style={styles.label}>จำนวนที่บริจาค และ คงเหลือ</span>
                                        <span style={styles.value}>
                                            {food.totalUnit} : {food.remainingUnit}
                                        </span>
                                    </div>

                                    <div style={styles.infoRow}>
                                        <span className="material-symbols-outlined" style={styles.icon}>
                                            schedule
                                        </span>
                                        <span style={styles.label}>วันและเวลาที่สามารถรับได้</span>
                                        <span style={styles.value}>
                                            {formatPickupDate(food.pickupDateStart)} - {formatPickupDate(food.pickupDateEnd)} &nbsp; {formatPickupTime(food.pickupStartTime)} น. - {formatPickupTime(food.pickupEndTime)} น.
                                        </span>
                                    </div>
                                </div>

                                {/* ปุ่มกดดูรายละเอียด */}
                                <button
                                    style={styles.detailBtn}
                                    // onClick={() => navigate(`/food-detail/${food.foodId}`)}
                                    onClick={() => navigate(`/food-form/${food.foodId}`)}
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
            <div style={styles.container}>
                {/* Header Section */}
                <div style={styles.header}>
                    <h1 style={styles.title}>รายการอาหารบริจาคของฉัน</h1>
                    <button
                        style={styles.createBtn} onClick={() => navigate("/food-form")}
                    >
                        <span style={{ fontSize: "20px", marginRight: "8px" }}  >+</span>{" "}
                        สร้างบริจาค
                    </button>
                </div>

                {/* Content Section */}
                {/* Content Section เรียกใช้งานฟังก์ชันอิสระด้านบน */}
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
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
    },
    title: {
        color: "#328d7d",
        fontSize: "30px",
        fontWeight: "bold",
        marginBottom: "20px"
    },
    createBtn: {
        backgroundColor: "#ff8c00",
        color: "#fff",
        border: "none",
        borderRadius: "12px",
        padding: "8px 40px",
        fontSize: "17px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        outline: "none",
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    /* แก้ไข: เปลี่ยนสีพื้นหลังเป็นโทนส้มครีมพาสเทล เพิ่มความโค้งมน ขอบสี และ Padding */
    card: {
        display: "flex",
        backgroundColor: "#ffe8cc",
        borderRadius: "20px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.01)",
        alignItems: "stretch"
    },
    imageWrapper: {
        width: "220px",
        height: "220px",
        flexShrink: 0,
    },
    /* แก้ไข: ปรับรูปภาพให้ขอบโค้งมนนุ่มนวลตัดเหลี่ยมเข้ากับการ์ด */
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
        fontSize: "24px",
        fontWeight: "bold",
        color: "#000",
        marginTop: "5px",
        marginBottom: "0px",
    },
    /* แก้ไข: ปรับสีของ Badge สถานะตามแบบ (เขียวละมุน ขอบมนโค้ง) */
    statusBadge: {
        backgroundColor: "#d4e2a6",
        color: "#6b9222",
        padding: "6px 14px",
        borderRadius: "10px",
        fontSize: "15px",
        // fontWeight: "bold"
    },
    infoContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
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
        color: "#ff8c00"
    },
    label: {
        color: "#111",
        marginRight: "15px",
        fontWeight: "500",
        flexShrink: 0
    },
    /* แก้ไข: สีตัวเลข/ตัวอักษรข้อมูลผลลัพธ์เป็นสีเขียวหัวเป็ดเข้มแบบในภาพเดโม */
    value: {
        color: "#328d7d",
        // fontWeight: "bold"
    },
    /* เพิ่มปุ่ม: สไตล์ปุ่มกดดูรายละเอียดสีส้มสดตาม Layout */
    detailBtn: {
        backgroundColor: "#ff8c00",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "8px 25px",
        fontSize: "15px",
        // fontWeight: "bold",
        cursor: "pointer",
        width: "fit-content",
        marginTop: "5px" // ดันปุ่มล็อกติดอยู่ใต้ขอบล่างของการ์ดเสมอ
    },
    // emptyContainer: {
    //     textAlign: "center",
    //     padding: "100px 20px",
    //     backgroundColor: "#fff",
    //     borderRadius: "20px",
    //     border: "2px dashed #ddd",
    // },
    emptyText: {
        textAlign: "center",
        marginTop: "50px",
        color: "#999",
        fontSize: "18px",
    },
};