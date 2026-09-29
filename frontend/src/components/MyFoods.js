import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';

export default function ListDonorFood() {
    const navigate = useNavigate();

    const [userId, setUserId] = useState(null);
    const [myFoods, setMyFoods] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");

    // เพิ่ม State สำหรับระบบ Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // กำหนดจำนวนรายการต่อหน้า

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

        // โหลดข้อมูลหมวดหมู่
        fetch(`${BASE_URL}/food-categories`, {
            headers: { "Content-Type": "application/json" }
        })
            .then(res => res.json())
            .then(resData => {
                if (resData.success) setCategories(resData.data);
            })
            .catch(err => console.error("Error fetching categories:", err));

        // โหลดข้อมูลรายการบริจาค
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

    // รีเซ็ตหน้ากลับไปหน้า 1 เมื่อมีการเปลี่ยน Tab หรือ Category
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, selectedCategory]);

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

    const formatPickupTime = (timeString) => {
        if (!timeString) return "-";
        return timeString.substring(0, 5);
    };

    const STATUS_CONFIG = {
        available: { text: "เปิดรับบริจาค", color: "#047857", bgColor: "#ECFDF5", borderColor: "#A7F3D0" },
        closed: { text: "ปิดการรับบริจาค", color: "#475569", bgColor: "#F8FAFC", borderColor: "#E2E8F0" },
        disable: { text: "ถูกปิดการแสดงผล", color: "#B91C1C", bgColor: "#FEF2F2", borderColor: "#FECACA" },
        expired: { text: "หมดอายุ", color: "#B45309", bgColor: "#FFFBEB", borderColor: "#FDE68A" }
    };

    const handleCreateClick = () => {
        navigate("/food-form");
    };

    const filteredFoods = myFoods.filter((food) => {
        const matchesTab = activeTab === "all" || food.foodStatus === activeTab;
        const foodCatId = food.foodCategory?.foodCateId || food.foodCateId;
        const matchesCategory = selectedCategory === "all" || String(foodCatId) === String(selectedCategory);
        return matchesTab && matchesCategory;
    });

    // คำนวณข้อมูลสำหรับแสดงผลในหน้าปัจจุบัน
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = [...filteredFoods].reverse().slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);

    const renderContent = () => {
        if (loading) return <p style={styles.emptyText}>กำลังโหลดข้อมูล...</p>;
        if (!myFoods || myFoods.length === 0) return (
            <div style={styles.emptyCard}>
                <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#C084FC" }}>inventory_2</span>
                <p style={styles.emptyText}>ยังไม่มีรายการที่คุณลงบริจาค</p>
            </div>
        );

        if (filteredFoods.length === 0) {
            return <p style={styles.emptyText}>ไม่พบรายการในเงื่อนไขที่เลือก</p>;
        }

        return (
            <>
                <div style={styles.gridContainer}>
                    {currentItems.map((food) => {
                        const status = STATUS_CONFIG[food.foodStatus] || {
                            text: "ไม่ระบุสถานะ", color: "#475569", bgColor: "#F1F5F9", borderColor: "#CBD5E1"
                        };
                        const categoryName = food.foodCategory?.foodCateName || food.foodCategory?.name || "ไม่ระบุหมวดหมู่";

                        return (
                            <div key={food.foodId} style={styles.gridCard}>
                                <div style={styles.cardImageContainer}>
                                    <img src={`${BASE_URL}${food.foodImage}`} alt={food.foodName} style={styles.cardImage} />
                                    <span style={{ ...styles.statusBadgeOverlay, backgroundColor: status.bgColor, color: status.color, border: `1px solid ${status.borderColor}` }}>
                                        {status.text}
                                    </span>
                                </div>

                                <div style={styles.cardContent}>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                            <h3 style={styles.foodNameGrid}>{food.foodName}</h3>
                                            <span style={styles.categoryBadge}>{categoryName}</span>
                                        </div>

                                        <div style={styles.infoList}>
                                            <div style={styles.infoItem}>
                                                <span className="material-symbols-outlined" style={styles.iconStyle}>inventory</span>
                                                <span style={styles.infoText}>
                                                    คงเหลือ <strong style={{ color: "#C084FC" }}>{food.remainingQuantity}</strong> / ทั้งหมด {food.quantity} {food.unit}
                                                </span>
                                            </div>
                                            <div style={styles.infoItem}>
                                                <span className="material-symbols-outlined" style={styles.iconStyle}>event</span>
                                                <span style={styles.infoText}>หมดอายุ: {formatExpiryDate(food.expiryDate)}</span>
                                            </div>
                                            <div style={styles.infoItem}>
                                                <span className="material-symbols-outlined" style={styles.iconStyle}>schedule</span>
                                                <span style={styles.infoText}>รับได้: {formatPickupTime(food.pickupStartTime)}-{formatPickupTime(food.pickupEndTime)} น.</span>
                                            </div>
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={styles.paginationContainer}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_left</span> ก่อนหน้า
                        </button>
                        <span style={styles.pageInfo}>
                            หน้า {currentPage} จาก {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}
                        >
                            ถัดไป <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_right</span>
                        </button>
                    </div>
                )}
            </>
        );
    };

    return (
        <div style={styles.fullWidthWrapper}>
            <div style={{ ...styles.container, padding: isMobile ? "20px 16px" : "36px 20px" }}>
                <div style={{ ...styles.header, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "16px" : "0" }}>
                    <div>
                        <h1 style={{ ...styles.title, fontSize: isMobile ? "24px" : "28px" }}>รายการบริจาคของฉัน</h1>
                        <p style={styles.subtitle}>จัดการรายการและติดตามสถานะการส่งมอบของคุณ</p>
                    </div>
                    <button style={{ ...styles.createBtn, width: isMobile ? "100%" : "auto" }} onClick={handleCreateClick}>
                        <span className="material-symbols-outlined" style={{ fontSize: "20px", marginRight: "6px" }}>add</span>
                        สร้างการบริจาค
                    </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ ...styles.tabsContainer, marginBottom: 0 }}>
                        {[
                            { key: "all", label: "ทั้งหมด" },
                            { key: "available", label: "เปิดรับบริจาค" },
                            { key: "closed", label: "ปิดการรับบริจาค" },
                            { key: "expired", label: "หมดอายุ" },
                            { key: "disable", label: "ถูกปิดการแสดงผล" }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                style={{
                                    padding: "8px 18px", borderRadius: "20px", cursor: "pointer", whiteSpace: "nowrap", outline: "none",
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

                    <div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{
                                padding: "8px 30px 8px 14px", borderRadius: "16px", border: "1px solid #E9D5FF",
                                color: '#64748B', backgroundColor: "#FFFFFF", fontSize: "13px", outline: "none", cursor: "pointer"
                            }}
                        >
                            <option value="all">หมวดหมู่ทั้งหมด</option>
                            {categories.map((cat) => {
                                const catId = cat.foodCateId || cat.id;
                                const catName = cat.foodCateName || cat.name;
                                return <option key={catId} value={String(catId)}>{catName}</option>;
                            })}
                        </select>
                    </div>
                </div>

                {renderContent()}
            </div>
        </div>
    );
}

const styles = {
    fullWidthWrapper: { width: "100%", backgroundColor: "#FAF5FF", minHeight: "100vh", display: "flex", justifyContent: "center" },
    container: { maxWidth: "1080px", width: "100%", fontFamily: "'Prompt', 'Kanit', sans-serif", color: "#334155", boxSizing: "border-box" },
    header: { display: "flex", justifyContent: "space-between", marginBottom: "24px" },
    title: { color: "#334155", fontWeight: "800", margin: "0 0 4px 0" },
    subtitle: { fontSize: "14px", color: "#64748B", margin: 0 },
    createBtn: { backgroundColor: "#C084FC", color: "#FFFFFF", border: "none", borderRadius: "12px", padding: "10px 24px", fontSize: "15px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(192, 132, 252, 0.25)" },
    tabsContainer: { display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" },
    gridContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "20px" },
    gridCard: { backgroundColor: "#FFFFFF", borderRadius: "20px", overflow: "hidden", border: "1.5px solid #F3E8FF", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between" },
    cardImageContainer: { position: "relative", width: "100%", height: "180px", backgroundColor: "#FAF5FF" },
    cardImage: { width: "100%", height: "100%", objectFit: "cover" },
    statusBadgeOverlay: { position: "absolute", top: "12px", right: "12px", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
    categoryBadge: { fontSize: "11px", backgroundColor: "#F3E8FF", color: "#9333EA", padding: "2px 8px", borderRadius: "8px", fontWeight: "600" },
    cardContent: { padding: "16px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" },
    foodNameGrid: { fontSize: "18px", fontWeight: "700", color: "#1E293B", margin: "0" },
    infoList: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", backgroundColor: "#FAF5FF", padding: "12px", borderRadius: "12px" },
    infoItem: { display: "flex", alignItems: "center", gap: "8px" },
    iconStyle: { fontSize: "16px", color: "#C084FC" },
    infoText: { fontSize: "12px", color: "#475569", fontWeight: "500" },
    actionBtnGrid: { width: "100%", backgroundColor: "#FFFFFF", color: "#C084FC", border: "1px solid #E9D5FF", borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" },
    paginationContainer: { display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "30px" },
    pageBtn: { backgroundColor: "#FFFFFF", border: "1px solid #E9D5FF", color: "#9333EA", padding: "8px 16px", borderRadius: "12px", fontWeight: "600", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" },
    pageInfo: { fontSize: "14px", fontWeight: "600", color: "#64748B" },
    emptyCard: { backgroundColor: "#FFFFFF", borderRadius: "20px", border: "1.5px solid #F3E8FF", padding: "48px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
    emptyText: { textAlign: "center", color: "#64748B", fontSize: "15px", margin: 0 },
};