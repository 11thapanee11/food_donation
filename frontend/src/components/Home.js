import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const [categories, setCategories] = useState([]);
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
    const [userLocation, setUserLocation] = useState(null);

    // State สำหรับตัวกรองระยะทางและวันหมดอายุ
    const [maxDistance, setMaxDistance] = useState("all"); // ระยะทางสูงสุด (กม.)
    const [maxExpiryDays, setMaxExpiryDays] = useState("all"); // จำนวนวันหมดอายุสูงสุด (วัน)

    const navigate = useNavigate();
    const BASE_URL = "http://localhost:8082";

    // ขอพิกัดตำแหน่งปัจจุบันของผู้ใช้งาน (GPS)
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (err) => {
                    console.warn("ไม่สามารถดึงตำแหน่งผู้ใช้ได้:", err.message);
                }
            );
        }
    }, []);

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
                    setFoods(resData.data || []);
                } else {
                    throw new Error(resData.message || "โหลดข้อมูลอาหารไม่สำเร็จ");
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));

    }, [selectedCategory, categories]);

    // ฟังก์ชันคำนวณระยะทางแบบ Haversine Formula (กิโลเมตร)
    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const formatDistanceText = (distance) => {
        if (distance === Infinity || distance === null) return "ไม่ทราบระยะทาง";
        if (distance < 1) return `${Math.round(distance * 1000)} เมตร`;
        return `${distance.toFixed(1)} กม.`;
    };

    // คำนวณจำนวนวันที่เหลือก่อนหมดอายุ
    const getDaysRemaining = (expiryDateString) => {
        if (!expiryDateString) return null;
        const now = new Date();
        const expiry = new Date(expiryDateString);

        now.setHours(0, 0, 0, 0);
        const expiryZero = new Date(expiry);
        expiryZero.setHours(0, 0, 0, 0);

        const diffTime = expiryZero - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: "หมดอายุแล้ว", isExpired: true, days: diffDays };
        if (diffDays === 0) return { text: "หมดอายุวันนี้", isUrgent: true, days: 0 };
        return { text: `หมดอายุในอีก ${diffDays} วัน`, isUrgent: diffDays <= 2, days: diffDays };
    };

    const scrollToFoodSection = () => {
        const foodSection = document.getElementById("food-list-section");
        if (foodSection) {
            foodSection.scrollIntoView({ behavior: "smooth" });
        }
    };

    // 3. กรองข้อมูล + เรียงลำดับตามวันหมดอายุ (หมดอายุเร็วกว่าอยู่หน้าสุด)
    const filteredFoods = foods
        .filter(f => {
            // กรองคำค้นหา
            const matchesSearch = f.foodName.toLowerCase().includes(search.toLowerCase());
            if (!matchesSearch) return false;

            const daysInfo = getDaysRemaining(f.expiryDate);

            // ❌ หากหมดอายุแล้ว ให้ตัดออกทันที ไม่แสดงผล
            if (!daysInfo || daysInfo.isExpired || daysInfo.days < 0) {
                return false;
            }

            // กรองตามระยะทางสูงสุดที่เลือก
            if (maxDistance !== "all" && userLocation && f.latitude && f.longitude) {
                const dist = getDistanceKm(userLocation.lat, userLocation.lng, f.latitude, f.longitude);
                if (dist > parseFloat(maxDistance)) return false;
            }

            // กรองตามช่วงวันหมดอายุที่เลือก
            if (maxExpiryDays !== "all") {
                const limitDays = parseInt(maxExpiryDays, 10);
                if (daysInfo.days > limitDays) return false;
            }

            return true;
        })
        .sort((a, b) => {
            // ⏰ เรียงจากวันหมดอายุใกล้ที่สุด -> ไกลที่สุด
            const dateA = new Date(a.expiryDate).getTime();
            const dateB = new Date(b.expiryDate).getTime();
            return dateA - dateB;
        });

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);

        const formattedDate = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(date);

        const formattedTime = new Intl.DateTimeFormat('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);

        return `${formattedDate} (${formattedTime} น.)`;
    };

    if (loading) {
        return (
            <div style={styles.centerState}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>กำลังโหลดรายการอาหาร...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.centerState}>
                <i className="material-icons-outlined" style={{ fontSize: "48px", color: "#ef4444" }}>error_outline</i>
                <p style={styles.errorText}>เกิดข้อผิดพลาด: {error}</p>
            </div>
        );
    }

    return (
        <div style={styles.pageBackground}>
            {/* Hero Banner Section */}
            <div style={styles.heroBanner}>
                <div style={styles.heroContent}>
                    <span style={styles.heroBadge}>🌱 สังคมแห่งการแบ่งปันอาหาร</span>
                    <h1 style={styles.heroTitle}>บริจาคอาหาร ส่งต่อความสุข</h1>
                    <p style={styles.heroSubtitle}>
                        เชื่อมต่อผู้ส่งต่อและผู้รับอาหารเข้าด้วยกัน ร่วมกันลดขยะอาหารและขจัดความหิวโภชนาการในชุมชนของเรา
                    </p>

                    <div style={styles.actionButtonGroup}>
                        <button style={styles.donateBtn} onClick={() => navigate('/add-food')}>
                            <i className="material-icons-outlined" style={{ fontSize: '20px' }}>volunteer_activism</i>
                            บริจาคอาหาร
                        </button>
                        <button style={styles.requestBtn} onClick={scrollToFoodSection}>
                            <i className="material-icons-outlined" style={{ fontSize: '20px' }}>restaurant</i>
                            ขอรับอาหาร
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div style={styles.searchWrapper}>
                        <i className="material-icons-outlined" style={styles.searchIcon}>search</i>
                        <input
                            type="text"
                            placeholder="ค้นหารายการอาหารบริจาคที่คุณสนใจ..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} style={styles.clearBtn}>
                                <i className="material-icons-outlined" style={{ fontSize: '18px' }}>close</i>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div id="food-list-section" style={styles.container}>
                {/* Category Header */}
                <div style={styles.categoryHeader}>
                    <h2 style={styles.sectionTitle}>
                        <i className="material-icons-outlined" style={{ color: '#328d7d' }}>grid_view</i>
                        หมวดหมู่รายการ
                    </h2>
                    <span style={styles.itemCount}>พบ {filteredFoods.length} รายการ</span>
                </div>

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

                {/* Filter Control Bar (กรองระยะทาง & ช่วงวันหมดอายุ) */}
                <div style={styles.filterControlBar}>
                    <div style={styles.filterGroup}>
                        <span style={styles.filterLabel}>
                            <i className="material-icons-outlined" style={{ fontSize: '18px' }}>filter_list</i>
                            ตัวกรองข้อมูล:
                        </span>

                        {/* กรองระยะทาง */}
                        <div style={styles.selectWrapper}>
                            <span style={styles.selectLabel}>📍 ระยะทาง:</span>
                            <select
                                value={maxDistance}
                                onChange={(e) => setMaxDistance(e.target.value)}
                                style={styles.filterSelect}
                            >
                                <option value="all">ทั้งหมด</option>
                                <option value="1">ไม่เกิน 1 กม.</option>
                                <option value="3">ไม่เกิน 3 กม.</option>
                                <option value="5">ไม่เกิน 5 กม.</option>
                                <option value="10">ไม่เกิน 10 กม.</option>
                            </select>
                        </div>

                        {/* กรองช่วงวันหมดอายุ */}
                        <div style={styles.selectWrapper}>
                            <span style={styles.selectLabel}>⏰ หมดอายุภายใน:</span>
                            <select
                                value={maxExpiryDays}
                                onChange={(e) => setMaxExpiryDays(e.target.value)}
                                style={styles.filterSelect}
                            >
                                <option value="all">ทั้งหมด (เฉพาะที่ยังไม่หมดอายุ)</option>
                                <option value="0">วันนี้เท่านั้น</option>
                                <option value="1">ไม่เกิน 1 วัน (พรุ่งนี้)</option>
                                <option value="3">ไม่เกิน 3 วัน</option>
                                <option value="5">ไม่เกิน 5 วัน</option>
                                <option value="7">ไม่เกิน 7 วัน (1 สัปดาห์)</option>
                                <option value="14">ไม่เกิน 14 วัน (2 สัปดาห์)</option>
                                <option value="30">ไม่เกิน 30 วัน (1 เดือน)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Food Grid */}
                <div style={styles.foodGrid}>
                    {filteredFoods.length > 0 ? (
                        filteredFoods.map(food => {
                            const daysInfo = getDaysRemaining(food.expiryDate);
                            const isBooked = food.isBooked || food.foodStatus === "booked" || food.remainingUnit <= 0;
                            const unitName = food.unit || food.quantityUnit || "ชิ้น";

                            const distKm = userLocation && food.latitude && food.longitude
                                ? getDistanceKm(userLocation.lat, userLocation.lng, food.latitude, food.longitude)
                                : null;

                            return (
                                <div
                                    key={food.id}
                                    style={{
                                        ...styles.foodCard,
                                        ...(isBooked ? styles.bookedCard : {})
                                    }}
                                    onClick={() => navigate('/food-detail', { state: { id: food.id, fromPage: '/' } })}
                                >
                                    {/* Image Box */}
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
                                        
                                        <div style={styles.imageOverlay} />

                                        {/* Tag สถานะการจอง */}
                                        {isBooked ? (
                                            <span style={styles.bookedBadge}>
                                                <i className="material-icons-outlined" style={{ fontSize: '14px' }}>check_circle</i>
                                                จองแล้ว / สิทธิ์เต็ม
                                            </span>
                                        ) : daysInfo && (
                                            <span style={{
                                                ...styles.expiryBadge,
                                                ...(daysInfo.isUrgent ? styles.badgeUrgent : {})
                                            }}>
                                                <i className="material-icons-outlined" style={{ fontSize: '14px' }}>schedule</i>
                                                {daysInfo.text}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content Box */}
                                    <div style={styles.cardContent}>
                                        <h3 style={styles.foodNameText}>{food.foodName}</h3>

                                        <div style={styles.infoStack}>
                                            {/* วันหมดอายุ */}
                                            <div style={styles.infoLine}>
                                                <i className="material-icons-outlined" style={styles.iconStyle}>event_available</i>
                                                <div style={styles.infoTextGroup}>
                                                    <span style={styles.labelSpan}>หมดอายุ</span>
                                                    <span style={styles.valueSpan}>{formatDate(food.expiryDate)}</span>
                                                </div>
                                            </div>

                                            {/* ช่วงเวลารับของ */}
                                            {(food.pickupTime || food.receiveTime) && (
                                                <div style={styles.infoLine}>
                                                    <i className="material-icons-outlined" style={styles.iconStyle}>access_time</i>
                                                    <div style={styles.infoTextGroup}>
                                                        <span style={styles.labelSpan}>เวลารับของ</span>
                                                        <span style={styles.valueSpan}>{food.pickupTime || food.receiveTime}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* จำนวนที่บริจาค & คงเหลือ */}
                                            <div style={styles.infoLine}>
                                                <i className="material-icons-outlined" style={styles.iconStyle}>inventory_2</i>
                                                <div style={styles.infoTextGroup}>
                                                    <span style={styles.labelSpan}>คงเหลือ / บริจาคทั้งหมด</span>
                                                    <span style={styles.highlightBadge}>
                                                        {food.remainingUnit} / {food.totalUnit} {unitName}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* จำนวนจำกัดต่อคน */}
                                            <div style={styles.infoLine}>
                                                <i className="material-icons-outlined" style={styles.iconStyle}>person_outline</i>
                                                <div style={styles.infoTextGroup}>
                                                    <span style={styles.labelSpan}>จำกัดต่อคน</span>
                                                    <span style={styles.valueSpan}>{food.limitPerPerson} {unitName}</span>
                                                </div>
                                            </div>

                                            {/* ระยะทาง */}
                                            <div style={styles.infoLine}>
                                                <i className="material-icons-outlined" style={styles.iconStyle}>near_me</i>
                                                <div style={styles.infoTextGroup}>
                                                    <span style={styles.labelSpan}>ระยะทาง</span>
                                                    <span style={styles.distanceBadge}>
                                                        {distKm !== null ? `ห่างออกไป ${formatDistanceText(distKm)}` : "ไม่ทราบระยะทาง"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ปุ่มการทำงาน */}
                                        <button
                                            type="button"
                                            disabled={isBooked}
                                            style={{
                                                ...styles.detailBtn,
                                                ...(isBooked ? styles.disabledBtn : {})
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!isBooked) {
                                                    navigate('/food-detail', { state: { id: food.id, fromPage: '/' } });
                                                }
                                            }}
                                        >
                                            <span>{isBooked ? "รายการนี้ถูกจองแล้ว" : "รับอาหารรายการนี้"}</span>
                                            {!isBooked && <i className="material-icons-outlined" style={{ fontSize: "18px" }}>arrow_forward</i>}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={styles.noDataCard}>
                            <i className="material-icons-outlined" style={{ fontSize: '56px', color: '#cbd5e1' }}>search_off</i>
                            <h3 style={{ margin: '12px 0 4px 0', color: '#475569', fontSize: '18px' }}>ไม่พบรายการอาหาร</h3>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>ลองปรับเปลี่ยนเงื่อนไขระยะทางหรือวันหมดอายุดูนะครับ</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Dynamic Styles ---
const styles = {
    pageBackground: {
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "'Prompt', sans-serif",
        paddingBottom: "80px",
    },
    heroBanner: {
        // ปรับเป็น Gradient ม่วงพาสเทล -> ฟ้าพาสเทล นุ่มนวล
        background: "linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 100%)",
        padding: "50px 20px 60px 20px",
        color: "#334155",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        borderBottom: "1px solid #e2e8f0",
    },
    heroContent: {
        maxWidth: "760px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    heroBadge: {
        // ใช้ม่วงพาสเทล (Soft Lavender)
        backgroundColor: "#f3e8ff",
        color: "#8b5cf6",
        padding: "6px 16px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
        marginBottom: "16px",
    },
    heroTitle: {
        fontSize: "40px",
        fontWeight: "800",
        color: "#334155",
        margin: "0 0 12px 0",
        letterSpacing: "-0.5px",
        lineHeight: "1.25",
    },
    heroSubtitle: {
        fontSize: "16px",
        color: "#64748b",
        margin: "0 0 28px 0",
        fontWeight: "400",
        lineHeight: "1.6",
        maxWidth: "600px",
    },
    actionButtonGroup: {
        display: "flex",
        gap: "16px",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "32px",
        flexWrap: "wrap",
    },
    donateBtn: {
        // ปรับเป็นม่วงพาสเทลหลัก (#C084FC / #a855f7)
        backgroundColor: "#a855f7",
        color: "#ffffff",
        border: "none",
        padding: "12px 28px",
        borderRadius: "30px",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 14px rgba(168, 85, 247, 0.3)",
    },
    requestBtn: {
        // ปุ่มรองใช้ขอบม่วงพาสเทล
        backgroundColor: "#ffffff",
        color: "#a855f7",
        border: "2px solid #a855f7",
        padding: "10px 26px",
        borderRadius: "30px",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    searchWrapper: {
        position: "relative",
        width: "100%",
        maxWidth: "580px",
        boxShadow: "0 8px 20px -4px rgba(168, 85, 247, 0.08)",
        borderRadius: "16px",
    },
    searchIcon: {
        position: "absolute",
        color: "#64748b",
        left: "20px",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "22px",
    },
    clearBtn: {
        position: "absolute",
        right: "16px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "#e2e8f0",
        border: "none",
        borderRadius: "50%",
        width: "26px",
        height: "26px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "#64748b",
    },
    searchInput: {
        width: "100%",
        padding: "16px 50px 16px 56px",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        fontSize: "15px",
        color: "#334155",
        outline: "none",
        boxSizing: "border-box",
    },
    container: {
        maxWidth: "1140px",
        margin: "32px auto 0 auto",
        padding: "0 20px",
        position: "relative",
    },
    categoryHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
    },
    sectionTitle: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#334155",
        margin: 0,
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    itemCount: {
        fontSize: "14px",
        color: "#64748b",
        fontWeight: "500",
    },
    categoryContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginBottom: "20px",
        backgroundColor: "#ffffff",
        padding: "16px 20px",
        borderRadius: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        border: "1px solid #f1f5f9",
    },
    categoryBtn: {
        padding: "8px 20px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#f8fafc",
        color: "#64748b",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "500",
        outline: "none",
    },
    categoryBtnActive: {
        // ปุ่มหมวดหมู่ที่เลือก เปลี่ยนเป็นสีฟ้าเข้มสดใส (Sky Blue Accent)
        backgroundColor: "#0284c7",
        borderColor: "#0284c7",
        color: "#ffffff",
        boxShadow: "0 4px 10px rgba(2, 132, 199, 0.25)",
    },
    filterControlBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "28px",
        backgroundColor: "#ffffff",
        padding: "14px 20px",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
    },
    filterGroup: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap",
    },
    filterLabel: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#475569",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    selectWrapper: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    selectLabel: {
        fontSize: "13px",
        fontWeight: "500",
        color: "#64748b",
    },
    filterSelect: {
        padding: "6px 12px",
        borderRadius: "10px",
        border: "1px solid #cbd5e1",
        backgroundColor: "#ffffff",
        color: "#334155",
        fontSize: "13px",
        fontWeight: "500",
        outline: "none",
        cursor: "pointer",
    },
    foodGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "28px",
    },
    foodCard: {
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 10px 20px -5px rgba(0,0,0,0.04)",
        border: "1px solid #f1f5f9",
        cursor: "pointer",
        transition: "all 0.25s ease",
        display: "flex",
        flexDirection: "column",
    },
    bookedCard: {
        opacity: 0.85,
        backgroundColor: "#fafafa",
    },
    cardImageWrapper: {
        position: "relative",
        width: "100%",
        height: "210px",
        backgroundColor: "#f1f5f9",
        overflow: "hidden",
    },
    cardImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    imageOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40%)",
    },
    expiryBadge: {
        position: "absolute",
        top: "14px",
        right: "14px",
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        color: "#ffffff",
        padding: "6px 12px",
        borderRadius: "10px",
        fontSize: "12px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "5px",
    },
    badgeUrgent: {
        // สถานะเร่งด่วนใช้สีส้มเตือนความสนใจ
        backgroundColor: "#f97316",
    },
    bookedBadge: {
        position: "absolute",
        top: "14px",
        right: "14px",
        backgroundColor: "#64748b",
        color: "#ffffff",
        padding: "6px 12px",
        borderRadius: "10px",
        fontSize: "12px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "5px",
    },
    cardContent: {
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
    },
    foodNameText: {
        color: "#334155",
        fontSize: "18px",
        fontWeight: "700",
        margin: "0 0 16px 0",
        lineHeight: "1.3",
    },
    infoStack: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginBottom: "20px",
    },
    infoLine: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    iconStyle: {
        // ไอคอนการ์ดใช้สีเขียวมิ้นต์ (Emerald Mint) สื่อถึง Eco & Waste Saving
        color: "#10b981",
        fontSize: "20px",
    },
    infoTextGroup: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        fontSize: "13px",
    },
    labelSpan: {
        color: "#64748b",
        fontWeight: "400",
    },
    valueSpan: {
        color: "#334155",
        fontWeight: "600",
    },
    highlightBadge: {
        // ไฮไลต์เขียวมิ้นต์อ่อน
        backgroundColor: "#d1fae5",
        color: "#047857",
        padding: "2px 8px",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "12px",
    },
    distanceBadge: {
        // แท็กระยะทางใช้สีฟ้าพาสเทลอ่อน
        backgroundColor: "#e0f2fe",
        color: "#0369a1",
        padding: "2px 8px",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "12px",
    },
    detailBtn: {
        marginTop: "auto",
        width: "100%",
        padding: "12px 16px",
        borderRadius: "12px",
        border: "none",
        // ปุ่มกระทำหลักใช้สีม่วงพาสเทล
        backgroundColor: "#a855f7",
        color: "#ffffff",
        fontWeight: "600",
        cursor: "pointer",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: "0 4px 10px rgba(168, 85, 247, 0.2)",
    },
    disabledBtn: {
        backgroundColor: "#cbd5e1",
        color: "#64748b",
        cursor: "not-allowed",
        boxShadow: "none",
    },
    noDataCard: {
        gridColumn: "1 / -1",
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        padding: "60px 20px",
        textAlign: "center",
        border: "1px solid #f1f5f9",
    },
    centerState: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "16px",
    },
    loadingText: {
        color: "#a855f7",
        fontSize: "16px",
        fontWeight: "500",
    },
    errorText: {
        color: "#ef4444",
        fontSize: "16px",
        fontWeight: "500",
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid #e2e8f0",
        borderTop: "4px solid #a855f7",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    }
};