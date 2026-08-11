import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";

export default function ListFood() {
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const BASE_URL = "http://localhost:8082";

    const STATUS_CONFIG = {
        available: {
            text: "AVAILABLE",
            color: "#51862e",
            bgColor: "#e8f5e9"
        },
        closed: {
            text: "UNAVAILABLE",
            color: "#707070",
            bgColor: "#f0f0f0"
        },
        // suspended: {
        //     text: "ถูกระงับ",
        //     color: "#ef6c00",
        //     bgColor: "#fff3e0"
        // },
        disable: {
            text: "DISABLE",
            color: "#d32f2f", 
            bgColor: "#ffebee"
        },
        expired: {
            text: "EXPIRED",
            color: "#f1d900",
            bgColor: "#eceff1"
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

    return (
        <div style={styles.container}>
            <p style={styles.mainTitle}>รายการอาหารทั้งหมด</p>
            
            {foods.slice().reverse().map((food) => {
                // ดึงค่า config ตามสถานะ (ถ้าไม่ตรงกับ key เลย ให้ใช้ค่า default หรือแสดงข้อความว่าง)
                const statusInfo = STATUS_CONFIG[food.foodStatus] || { text: food.status, color: "gray" };

                return (
                    <div key={food.foodId} style={styles.card}>
                        <img src={`${BASE_URL}${food.foodImage}`} alt={food.foodName} style={styles.image} />

                        <div style={styles.info}>
                            <span style={{ color: '#333', fontWeight: 'bold', fontSize: '18px' }}>{food.foodName}</span>

                            <div style={{ marginLeft: '8px' }}>
                                <span style={{ color: '#333', marginRight: '5px' }}>จำนวนที่บริจาค และจำนวนที่เหลือ :</span>
                                <span style={{ color: '#328d7d' }}> {food.totalUnit} / {food.remainingUnit}</span>
                            </div>

                            <div style={{ marginLeft: '8px' }}>
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

                        {/* แสดงสถานะด้วยสไตล์ที่ดึงมาจาก STATUS_CONFIG */}
                        <div style={styles.status}>
                            <span style={{
                                color: statusInfo.color,
                                fontSize: '16px'
                            }}>
                                {statusInfo.text}
                            </span>
                        </div>

                        <button style={styles.detailBtn} onClick={() => {
                            navigate('/food-detail', { state: { id: food.id, fromPage: '/manage-foods' } });
                        }}>ดูรายละเอียด</button>
                    </div>
                );
            })}
        </div>
    );
};

// ตัวอย่าง style เบื้องต้น
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
    card: {
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #ccc',
        padding: '15px',
        marginBottom: '15px',
        borderRadius: '12px',
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
        cursor: 'pointer',
        color: '#ff8c00',
        border: 'none',
        background: 'none',
        fontSize: "16px",
        marginRight: '20px',
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
