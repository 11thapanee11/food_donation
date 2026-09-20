import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";

export default function ListFood() {
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // State สำหรับตรวจจับหน้าจอมือถือ
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );

    const navigate = useNavigate();

    const BASE_URL = "http://localhost:8082";

    // ดักจับ Resize Event โดยใช้ useEffect
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const STATUS_CONFIG = {
        available: {
            text: "เปิดให้รับบริจาค",
            color: "#51862e",
            bgColor: "#e8f5e9"
        },
        closed: {
            text: "ปิดให้รับบริจาค",
            color: "#707070",
            bgColor: "#f0f0f0"
        },
        disable: {
            text: "ถูกปิดการแสดงผล",
            color: "#d32f2f",
            bgColor: "#ffebee"
        },
        expired: {
            text: "หมดอายุ",
            color: "#f0a400",
            bgColor: "#fff6db"
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const url = `${BASE_URL}/foods`;

        fetch(url, {
            method: "GET",
            headers: {
                "Authorization": token ? `Bearer ${token}` : "",
                "Content-Type": "application/json"
            }
        })
            .then(res => {
                if (!res.ok) throw new Error("โหลดข้อมูลอาหารไม่สำเร็จ");
                return res.json();
            })
            .then(resData => {
                if (resData.success) {
                    setFoods(resData.data); // ดึงข้อมูลอาหารทั้งหมดมาเก็บใน state
                } else {
                    throw new Error(resData.message || "โหลดข้อมูลอาหารไม่สำเร็จ");
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));

    }, []);

    if (loading) return <div style={styles.loading}>กำลังโหลด...</div>;
    if (error) return <div style={styles.error}>เกิดข้อผิดพลาด: {error}</div>;

    const reversedFoods = foods.slice().reverse();

    return (
        <div style={styles.container}>
            <p style={{ ...styles.mainTitle, fontSize: isMobile ? "22px" : "30px" }}>รายการอาหารทั้งหมด</p>

            {/* รวมไว้ใน 1 กรอบใหญ่ */}
            <div style={styles.listWrapper}>
                {reversedFoods.map((food, index) => {
                    // ดึงค่า config ตามสถานะ (ถ้าไม่ตรงกับ key เลย ให้ใช้ค่า default หรือแสดงข้อความว่าง)
                    const statusInfo = STATUS_CONFIG[food.foodStatus] || { text: food.status, color: "gray" };
                    const isLastItem = index === reversedFoods.length - 1;

                    return (
                        <div
                            key={food.foodId || food.id}
                            style={{
                                ...styles.card,
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: isMobile ? 'stretch' : 'center',
                                gap: isMobile ? '15px' : '0',
                                // ใช้เส้นแบ่งระหว่างรายการ (เว้นรายการสุดท้าย)
                                borderBottom: isLastItem ? 'none' : '1px solid #ccc',
                            }}
                        >
                            <img
                                src={`${BASE_URL}${food.foodImage}`}
                                alt={food.foodName}
                                style={{
                                    ...styles.image,
                                    width: isMobile ? '100%' : '130px',
                                    height: isMobile ? '180px' : '130px',
                                    marginRight: isMobile ? '0' : '20px'
                                }}
                            />

                            <div style={{ ...styles.info, marginLeft: isMobile ? '0' : '8px' }}>
                                <span style={{ color: '#333', fontWeight: 'bold', fontSize: isMobile ? '16px' : '18px' }}>
                                    {food.foodName}
                                </span>

                                <div style={{ marginLeft: isMobile ? '0' : '8px' }}>
                                    <span style={{ color: '#333', marginRight: '5px' }}>จำนวนที่บริจาค และจำนวนที่เหลือ :</span>
                                    <span style={{ color: '#328d7d' }}> {food.totalUnit} / {food.remainingUnit}</span>
                                </div>

                                <div style={{ marginLeft: isMobile ? '0' : '8px' }}>
                                    <span style={{ color: '#333', marginRight: '5px' }}>วันหมดอายุ :</span>
                                    <span style={{ color: '#328d7d' }}>
                                        {new Date(food.expiryDate).toLocaleDateString('th-TH', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: false
                                        })
                                            .replace('เวลา', '')
                                            .trim() + ' น.'}
                                    </span>
                                </div>
                            </div>

                            {/* โครงสร้างปุ่มกดและสถานะ ปรับแบบจัดวางซ้าย-ขวา ยามแสดงผลบน Mobile */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: isMobile ? 'space-between' : 'flex-end',
                                alignItems: 'center',
                                width: isMobile ? '100%' : 'auto',
                                borderTop: isMobile ? '1px solid #eee' : 'none',
                                paddingTop: isMobile ? '10px' : '0'
                            }}>
                                {/* แสดงสถานะด้วยสไตล์ดั้งเดิม */}
                                <div style={{
                                    ...styles.status,
                                    marginRight: isMobile ? '0' : '50px',
                                    width: isMobile ? 'fit-content' : '120px',
                                    textAlign: 'center',

                                    // ปรับแต่งกรอบและสีพื้นหลังตามสถานะ
                                    backgroundColor: statusInfo.bgColor,
                                    borderRadius: '10px',                  // ปรับความโค้งมนของกรอบ
                                    padding: '6px',                   // ระยะห่างด้านในกรอบ
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span style={{
                                        color: statusInfo.color,
                                        fontSize: '15px',
                                        // fontWeight: 'bold'                 // เพิ่มความหนาตัวอักษรให้ดูอ่านง่ายขึ้น
                                    }}>
                                        {statusInfo.text}
                                    </span>
                                </div>

                                <button
                                    style={{
                                        ...styles.detailBtn,
                                        marginRight: isMobile ? '0' : '20px'
                                    }}
                                    onClick={() => {
                                        navigate('/food-detail', { state: { id: food.foodId || food.id, fromPage: '/manage-foods' } });
                                    }}
                                >
                                    ดูรายละเอียด
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// สไตล์เดิมคงไว้ครบถ้วน
const styles = {
    container: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "20px 20px"
    },
    mainTitle: {
        // color: "#328d7d",
        color: "#333",
        fontSize: "30px",
        fontWeight: "bold",
        marginBottom: "20px"
    },
    // สไตล์สำหรับกรอบใหญ่ 1 กรอบที่ครอบทั้งหมด
    listWrapper: {
        backgroundColor: '#fdfcf9',
        border: '2px solid #e6e6e6',
        borderRadius: '20px',
        padding: '0 20px',
        overflow: 'hidden'
    },
    card: {
        display: 'flex',
        alignItems: 'center',
        padding: '15px 0', // ลบ padding ซ้าย-ขวาออก เพื่อให้ชิดขอบกรอบใหญ่เท่ากัน
        // background: '#fff'
    },
    image: {
        width: '130px',
        height: "130px",
        borderRadius: '12px',
        marginRight: '20px',
        objectFit: "cover",
        display: "block",
    },
    info: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginLeft: '8px'
    },
    status: {
        marginRight: '50px',
        width: "150px",
        textAlign: "center"
    },
    detailBtn: {
        backgroundColor: '#ff8c00',          // หรือใช้สีส้มทึบ #ff8c00 แล้วตัวอักษรสีขาว
        border: '1.5px solid #ff8c00',       // เส้นขอบสีส้มเข้ากับธีม
        color: '#fff',
        padding: '6px 16px',
        borderRadius: '12px',
        // fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '15px',
        transition: 'all 0.2s ease'
    },
    loading: {
        textAlign: "center",
        padding: "100px",
        color: "#ff8c00",
        fontSize: "20px"
    },
    error: {
        textAlign: "center",
        padding: "100px",
        color: "red"
    },
};