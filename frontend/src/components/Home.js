import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const [categories, setCategories] = useState([]);
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");

    const navigate = useNavigate();
    const BASE_URL = "http://localhost:8082";

    // 1. โหลดหมวดหมู่
    useEffect(() => {
        fetch(`${BASE_URL}/food-categories`)
            .then(res => {
                if (!res.ok) throw new Error("โหลดข้อมูลหมวดหมู่ไม่สำเร็จ");
                return res.json();
            })
            .then(resData => {
                if (resData.success) {
                    const allOption = { id: 0, name: "ทั้งหมด" };
                    setCategories([allOption, ...resData.data]);
                } else {
                    throw new Error(resData.message || "โหลดข้อมูลหมวดหมู่ไม่สำเร็จ");
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    // 2. โหลดรายการอาหาร
    useEffect(() => {
        if (categories.length === 0) return;

        const token = localStorage.getItem("accessToken");
        let url = `${BASE_URL}/foods`;

        if (selectedCategory !== "ทั้งหมด") {
            const category = categories.find(c => c.name === selectedCategory);
            if (category) {
                url = `${BASE_URL}/foods/category/${category.id}`;
            }
        }

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
                    const availableFoods = resData.data.filter(
                        food => food.foodStatus === "available"
                    );
                    setFoods(availableFoods);
                } else {
                    throw new Error(resData.message || "โหลดข้อมูลอาหารไม่สำเร็จ");
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));

    }, [selectedCategory, categories]);

    // ฟังก์ชันคำนวณจำนวนวันที่เหลือก่อนหมดอายุ
    const getDaysRemaining = (expiryDateString) => {
        if (!expiryDateString) return null;
        const now = new Date();
        const expiry = new Date(expiryDateString);
        
        // เคลียร์เวลาให้เปรียบเทียบเฉพาะวันที่
        now.setHours(0, 0, 0, 0);
        const expiryZero = new Date(expiry);
        expiryZero.setHours(0, 0, 0, 0);

        const diffTime = expiryZero - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: "หมดอายุแล้ว", isExpired: true };
        if (diffDays === 0) return { text: "หมดอายุวันนี้", isUrgent: true };
        return { text: `จะหมดอายุในอีก ${diffDays} วัน`, isUrgent: diffDays <= 2 };
    };

    // 3. กรองข้อมูลตามคำค้นหา + เรียงลำดับตามวันใกล้หมดอายุก่อนให้อัตโนมัติ
    const filteredFoods = foods
        .filter(f => f.foodName.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);

        const formattedDate = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);

        const formattedTime = new Intl.DateTimeFormat('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);

        return `${formattedDate} ${formattedTime} น.`;
    };

    if (loading) return <div style={styles.loading}>กำลังโหลด...</div>;
    if (error) return <div style={styles.error}>เกิดข้อผิดพลาด: {error}</div>;

    return (
        <div style={styles.pageBackground}>
            <div style={styles.container}>
                <h1 style={styles.mainTitle}>รายการอาหารบริจาค</h1>

                {/* Search Bar */}
                <div style={styles.filterBarWrapper}>
                    <div style={styles.searchWrapper}>
                        <i className="material-icons-outlined" style={styles.searchIcon}>search</i>
                        <input
                            type="text"
                            placeholder="ค้นหารายการอาหารบริจาค"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                </div>

                {/* Category Buttons */}
                <div style={styles.categoryContainer}>
                    {categories.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedCategory(c.name)}
                            aria-pressed={selectedCategory === c.name}
                            style={{
                                ...styles.categoryBtn,
                                ...(selectedCategory === c.name ? styles.categoryBtnActive : {})
                            }}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>

                {/* Food Grid */}
                <div style={styles.foodGrid}>
                    {filteredFoods.length > 0 ? (
                        filteredFoods.map(food => {
                            const daysInfo = getDaysRemaining(food.expiryDate);

                            return (
                                <div key={food.id} style={styles.foodCard}>
                                    <div style={styles.cardImageWrapper}>
                                        <img
                                            src={`${BASE_URL}${food.foodImage}`}
                                            alt={food.foodName}
                                            style={styles.cardImage}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://placehold.co/600x400?text=No+Image";
                                            }}
                                        />
                                        {/* ปุ่มบอกจำนวนวันที่เหลือ มุมขวาบนของการ์ด */}
                                        {daysInfo && (
                                            <span style={{
                                                ...styles.expiryBadge,
                                                ...(daysInfo.isExpired ? styles.badgeExpired : {}),
                                                ...(daysInfo.isUrgent ? styles.badgeUrgent : {})
                                            }}>
                                                {daysInfo.text}
                                            </span>
                                        )}
                                    </div>

                                    <div style={styles.cardContent}>
                                        <h3 style={styles.foodNameText}>{food.foodName}</h3>
                                        <div style={styles.infoLine}>
                                            <span className="material-symbols-outlined" style={{ color: "#ff8c00" }}>
                                                calendar_clock
                                            </span>
                                            <span>
                                                <span style={{ color: "black", fontSize: "15px" }}>หมดอายุ : </span>
                                                <span style={{ color: "#328d7d", fontSize: "15px" }}>{formatDate(food.expiryDate)}</span>
                                            </span>
                                        </div>
                                        <div style={styles.infoLine}>
                                            <span className="material-symbols-outlined" style={{ color: "#ff8c00" }}>
                                                package_2
                                            </span>
                                            <span style={{ color: "black", fontSize: "15px" }}>จำนวนที่บริจาค และ คงเหลือ : </span>
                                            <span style={{ color: "#328d7d", fontSize: "15px" }}>{food.totalUnit} / {food.remainingUnit}</span>
                                        </div>
                                        <div style={styles.infoLine}>
                                            <span className="material-symbols-outlined" style={{ color: "#ff8c00" }}>
                                                hand_package
                                            </span>
                                            <span style={{ color: "black", fontSize: "15px" }}>จำนวนจำกัดต่อคน : </span>
                                            <span style={{ color: "#328d7d", fontSize: "15px" }}>{food.limitPerPerson}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigate('/food-detail', { state: { id: food.id, fromPage: '/' } });
                                            }}
                                            style={styles.detailBtn}
                                        >
                                            ดูรายละเอียด
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p style={styles.noData}>ไม่พบผลลัพธ์ที่ตรงกับเงื่อนไขการค้นหา</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Styles ---
const styles = {
    container: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "20px 20px"
    },
    mainTitle: {
        color: "#328d7d",
        fontSize: "30px",
        fontWeight: "bold",
        marginBottom: "20px"
    },
    filterBarWrapper: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "30px"
    },
    searchWrapper: {
        position: "relative",
        width: "80%",
    },
    searchIcon: {
        position: "absolute",
        color: '#328d7d',
        left: "20px",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "20px",
        opacity: 0.5
    },
    searchInput: {
        width: "100%",
        padding: "14px 30px 14px 55px",
        borderRadius: "50px",
        border: "none",
        backgroundColor: "#fff0df",
        fontSize: "16px",
        color: "#4A7C72",
        outline: "none",
        boxSizing: "border-box",
    },
    categoryContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "40px"
    },
    categoryBtn: {
        padding: "8px 22px",
        borderRadius: "10px",
        border: "2px solid #328d7d",
        backgroundColor: "#fffcf8",
        color: "#328d7d",
        cursor: "pointer",
        fontSize: "15px",
        outline: "none",
    },
    categoryBtnActive: {
        backgroundColor: "#ff8c00",
        borderColor: "#ff8c00",
        color: "#fff",
    },
    foodGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "30px"
    },
    foodCard: {
        backgroundColor: "#fff",
        borderRadius: "30px",
        overflow: "hidden",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
        border: "1px solid #FFF2E2"
    },
    cardImageWrapper: {
        position: "relative",
        width: "100%",
        height: "220px"
    },
    cardImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
    },
    expiryBadge: {
        position: "absolute",
        top: "15px",
        right: "15px",
        backgroundColor: "#ff9114",
        color: "#fff",
        padding: "6px 14px",
        borderRadius: "15px",
        fontSize: "14px",
        fontWeight: "bold",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        zIndex: 1
    },
    badgeUrgent: {
        backgroundColor: "#ff8c00",
    },
    badgeExpired: {
        backgroundColor: "#ef4444",
    },
    cardContent: {
        padding: "20px",
        backgroundColor: "#fff0df"
    },
    foodNameText: {
        color: "#328d7d",
        fontSize: "18px",
        fontWeight: "bold",
        marginBottom: "12px",
        marginTop: "5px"
    },
    infoLine: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: "#4B5563",
        fontSize: "14px",
        marginBottom: "10px"
    },
    detailBtn: {
        width: "100%",
        marginTop: "8px",
        padding: "0px",
        border: "none",
        background: "transparent",
        color: "#ff8c00",
        fontWeight: "500",
        cursor: "pointer",
        fontSize: "18px",
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
    noData: {
        textAlign: "center",
        color: "#9CA3AF",
        gridColumn: "1 / -1",
        padding: "50px"
    }
};