import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from 'jwt-decode';

export default function FoodDetailEdgeToEdge() {
    const location = useLocation();
    const { fromPage, bookingStatus } = location.state || {};
    const incomingId = location.state?.id;
    const navigate = useNavigate();

    const [userId, setUserId] = useState(null);
    const [food, setFood] = useState(null);
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    // State สำหรับการจอง
    const [showReserveModal, setShowReserveModal] = useState(false);
    const [reserveQuantity, setReserveQuantity] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );

    const isOwner = food && food.donorId && String(food.donorId) === String(userId);
    const BASE_URL = "http://localhost:8082";

    const isFromReceive = fromPage === "/receive";
    const isFromManage = fromPage === "/manage-foods";
    const isBookingCompleted = bookingStatus === "completed";

    const [reviews, setReviews] = useState([]);

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
        }
    }, []);

    useEffect(() => {
        if (!incomingId) {
            setLoading(false);
            return;
        }

        window.scrollTo(0, 0);
        const token = localStorage.getItem("accessToken");
        const isValidToken = token && token !== "null" && token !== "undefined";

        const fetchBookingStatus = async (foodId) => {
            if (!isValidToken) return false;
            try {
                const res = await fetch(`${BASE_URL}/bookings/foods/${foodId}/check-booking`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const resData = await res.json();
                return resData?.data ?? false;
            } catch (err) {
                return false;
            }
        };

        if (isFromReceive) {
            setLoading(true);
            fetch(`${BASE_URL}/bookings/${incomingId}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
            })
                .then((res) => res.json())
                .then(async (resData) => {
                    if (resData.success) {
                        const bookingData = resData.data;
                        setBooking(bookingData);
                        if (bookingData.foodId) {
                            const foodResult = await fetch(`${BASE_URL}/foods/${bookingData.foodId}`, {
                                headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
                            }).then(res => res.json());
                            setFood(foodResult.data || foodResult);
                        }
                    }
                })
                .finally(() => setLoading(false));
        } else {
            fetch(`${BASE_URL}/foods/${incomingId}`)
                .then((res) => res.json())
                .then(async (resData) => {
                    if (resData.success) {
                        const actualFoodData = resData.data;
                        actualFoodData.isCurrentByUserBooked = await fetchBookingStatus(incomingId);
                        setFood(actualFoodData);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [incomingId, isFromReceive]);

    useEffect(() => {
        if (incomingId) {
            fetch(`${BASE_URL}/reviews/food/${incomingId}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
            })
                .then(res => res.json())
                .then(result => {
                    if (result.success) setReviews(result.data || []);
                })
                .catch(err => console.error("Error:", err));
        }
    }, [incomingId]);

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
        ? (reviews.reduce((acc, curr) => acc + (curr.ratingScore || 0), 0) / totalReviews).toFixed(1)
        : "5.0";

    const formatExpiryDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return `${date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })} (${date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.)`;
    };

    const handleOpenReserveModal = () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            Swal.fire({
                title: 'กรุณาเข้าสู่ระบบ',
                text: 'คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถจองรายการอาหารได้',
                icon: 'warning',
                confirmButtonColor: '#ff9100',
                confirmButtonText: 'ไปหน้าเข้าสู่ระบบ',
            }).then((res) => { if (res.isConfirmed) navigate('/login'); });
            return;
        }

        setReserveQuantity(1);
        setShowReserveModal(true);
    };

    const handleConfirmBooking = () => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setSubmitting(true);
        fetch(`${BASE_URL}/bookings`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ foodId: incomingId, quantity: reserveQuantity })
        })
            .then(res => res.json())
            .then(resData => {
                setShowReserveModal(false);
                if (resData.success) {
                    Swal.fire({
                        title: 'จองสำเร็จ!',
                        text: 'สามารถรับอาหารได้ตามสถานที่ที่ระบุไว้',
                        icon: 'success',
                        confirmButtonColor: '#328d7d',
                        confirmButtonText: 'ดูรายการจองของฉัน'
                    }).then(() => navigate('/receive'));
                } else {
                    Swal.fire('เกิดข้อผิดพลาด', resData.message || 'ไม่สามารถทำรายการได้', 'error');
                }
            })
            .catch(() => {
                setShowReserveModal(false);
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
            })
            .finally(() => setSubmitting(false));
    };

    if (loading || !food) return <div style={{ textAlign: "center", padding: "50px", fontFamily: "'Prompt', sans-serif" }}>กำลังโหลดข้อมูล...</div>;

    const googleMapEmbedUrl = food?.latitude && food?.longitude
        ? `https://maps.google.com/maps?q=${food.latitude},${food.longitude}&z=16&output=embed`
        : null;

    // คำนวณขีดจำกัดจริงที่จองได้
    const maxLimit = Math.min(food.limitPerPerson || 1, food.remainingUnit || 1);

    return (
        <div style={styleOne.pageBg}>

            {/* Header Image Display */}
            <div style={{
                position: "relative",
                width: "100%",
                height: isMobile ? "280px" : "360px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <div style={{
                    position: "absolute", inset: "-10px",
                    backgroundImage: `url(${BASE_URL}${food.foodImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "blur(28px) brightness(0.7) opacity(0.5)"
                }} />

                <img
                    src={`${BASE_URL}${food.foodImage}`}
                    alt={food.foodName}
                    style={{
                        position: "relative", zIndex: 1,
                        maxHeight: "90%", maxWidth: "90%",
                        objectFit: "contain", borderRadius: "16px",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
                    }}
                    onError={(e) => { e.target.src = "https://placehold.co/800x500?text=No+Image"; }}
                />

                <button style={{ ...styleOne.floatingBackBtn, zIndex: 2 }} onClick={() => navigate(-1)}>
                    <i className="material-icons-outlined">arrow_back</i>
                </button>

                <div style={{
                    position: "absolute", bottom: "16px", right: "16px", zIndex: 2,
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    color: "#0f172a", padding: "6px 12px", borderRadius: "14px",
                    display: "flex", alignItems: "center", gap: "6px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)", backdropFilter: "blur(6px)"
                }}>
                    <span style={{ color: "#ffb800", fontSize: "16px", lineHeight: "1" }}>★</span>
                    <span style={{ fontWeight: "700", fontSize: "14px" }}>{averageRating}</span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>({totalReviews} รีวิว)</span>
                </div>
            </div>

            {/* Overlapping Content Box */}
            <div style={styleOne.contentSheet}>
                <div style={styleOne.sheetHeader}>
                    <div>
                        <span style={styleOne.categoryChip}>{food.foodCateName || "อาหารทั่วไป"}</span>
                        <h1 style={{ ...styleOne.foodTitle, fontSize: isMobile ? "22px" : "26px" }}>{food.foodName}</h1>
                    </div>
                    <span style={{
                        ...styleOne.statusPill,
                        backgroundColor: food.remainingUnit > 0 ? "#e6f4f1" : "#fef2f2",
                        color: food.remainingUnit > 0 ? "#277265" : "#ef4444"
                    }}>
                        {food.remainingUnit > 0 ? `เหลือในระบบ ${food.remainingUnit} ชิ้น` : "หมดแล้ว"}
                    </span>
                </div>

                <p style={styleOne.descriptionText}>{food.description || "ไม่มีรายละเอียดเพิ่มเติมเกี่ยวกับรายการนี้"}</p>

                {/* Donor Quick Info Row */}
                <div style={styleOne.donorBox}>
                    <div style={styleOne.donorAvatar}>
                        <i className="material-icons-outlined" style={{ color: "#328d7d" }}>person</i>
                    </div>
                    <div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>แบ่งปันโดย</div>
                        <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "14px" }}>{food.donorName || "ผู้บริจาคใจดี"}</div>
                    </div>
                </div>

                {/* Key Specifications Grid */}
                <div style={styleOne.specGrid}>
                    <div style={styleOne.specItem}>
                        <i className="material-icons-outlined" style={{ color: "#ff9100" }}>schedule</i>
                        <div>
                            <span style={styleOne.specLabel}>หมดอายุ</span>
                            <span style={styleOne.specValue}>{formatExpiryDate(food.expiryDate)}</span>
                        </div>
                    </div>
                    <div style={styleOne.specItem}>
                        <i className="material-icons-outlined" style={{ color: "#328d7d" }}>scale</i>
                        <div>
                            <span style={styleOne.specLabel}>น้ำหนัก/หน่วย</span>
                            <span style={styleOne.specValue}>{food.unitWeightKg || "0.00"} Kg</span>
                        </div>
                    </div>
                </div>

                {/* Location Section */}
                <div style={styleOne.sectionCard}>
                    <h3 style={styleOne.sectionTitle}>
                        <i className="material-icons-outlined" style={{ color: "#328d7d" }}>location_on</i>
                        สถานที่รับอาหาร
                    </h3>
                    <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 12px 0" }}>{food.address || "ไม่ระบุที่อยู่"}</p>
                    {googleMapEmbedUrl && (
                        <iframe
                            title="food-map"
                            width="100%"
                            height="180"
                            style={{ border: 0, borderRadius: "12px" }}
                            src={googleMapEmbedUrl}
                        ></iframe>
                    )}
                </div>

                {/* Overall Reviews */}
                <div style={styleOne.sectionCard}>
                    <h3 style={styleOne.sectionTitle}>
                        <i className="material-icons-outlined" style={{ color: "#ffb800" }}>star</i>
                        การประเมินและรีวิวรวม
                    </h3>

                    <div style={styleOne.overallReviewContainer}>
                        <div style={styleOne.ratingScoreBig}>
                            <div style={{ fontSize: "36px", fontWeight: "800", color: "#0f172a", lineHeight: "1" }}>{averageRating}</div>
                            <div style={{ display: "flex", gap: "2px", margin: "6px 0" }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <span key={s} style={{ color: s <= Math.round(Number(averageRating)) ? "#ffb800" : "#cbd5e1", fontSize: "14px" }}>★</span>
                                ))}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>จาก {totalReviews} รีวิว</div>
                        </div>

                        <div style={styleOne.ratingBarsList}>
                            {[5, 4, 3, 2, 1].map(starCount => {
                                const countForStar = reviews.filter(r => Math.round(r.ratingScore) === starCount).length;
                                const percentage = totalReviews > 0 ? (countForStar / totalReviews) * 100 : 0;
                                return (
                                    <div key={starCount} style={styleOne.barRow}>
                                        <span style={{ fontSize: "12px", color: "#64748b", width: "24px" }}>{starCount}★</span>
                                        <div style={styleOne.barTrack}>
                                            <div style={{ ...styleOne.barFill, width: `${percentage}%` }}></div>
                                        </div>
                                        <span style={{ fontSize: "11px", color: "#94a3b8", width: "20px", textAlign: "right" }}>{countForStar}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ marginTop: "16px" }}>
                        {reviews.length > 0 ? (
                            reviews.map((item, idx) => (
                                <div key={idx} style={styleOne.reviewBubble}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                        <span style={{ fontWeight: "600", fontSize: "13px", color: "#1e293b" }}>{item.reviewerName || "ผู้รับบริการ"}</span>
                                        <span style={{ color: "#94a3b8", fontSize: "11px" }}>{new Date(item.reviewDate).toLocaleDateString('th-TH')}</span>
                                    </div>
                                    <div style={{ color: "#ffb800", fontSize: "12px", marginBottom: "4px" }}>
                                        {"★".repeat(item.ratingScore)}{"☆".repeat(5 - item.ratingScore)}
                                    </div>
                                    <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>{item.reviewComment}</p>
                                </div>
                            ))
                        ) : (
                            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", margin: "12px 0 0 0" }}>ยังไม่มีข้อความรีวิว</p>
                        )}
                    </div>
                </div>

                {/* Bottom Main Action Button */}
                {(!isFromReceive && !isOwner && !isFromManage) && (
                    <button
                        onClick={handleOpenReserveModal}
                        disabled={food?.isCurrentByUserBooked || food.remainingUnit <= 0}
                        style={{
                            ...styleOne.mainCtaBtn,
                            backgroundColor: (food?.isCurrentByUserBooked || food.remainingUnit <= 0) ? "#cbd5e1" : "#ff9100",
                            cursor: (food?.isCurrentByUserBooked || food.remainingUnit <= 0) ? "not-allowed" : "pointer"
                        }}
                    >
                        {food?.isCurrentByUserBooked ? 'คุณได้ทำการจองรายการนี้แล้ว' : food.remainingUnit <= 0 ? 'รายการนี้หมดแล้ว' : 'กดรับอาหารบริจาค'}
                    </button>
                )}
            </div>

            {/* --- ALERT MODAL ลอยกลางหน้า --- */}
            {showReserveModal && (
                <div style={styleOne.centerModalBackdrop} onClick={() => setShowReserveModal(false)}>
                    <div style={styleOne.centerModalCard} onClick={(e) => e.stopPropagation()}>

                        {/* Header & Icon */}
                        <div style={{ textAlign: "center", marginBottom: "16px" }}>
                            <div style={styleOne.modalHeaderIcon}>
                                <i className="material-icons-outlined" style={{ fontSize: "28px", color: "#ff9100" }}>shopping_basket</i>
                            </div>
                            <h3 style={{ margin: "12px 0 4px 0", fontSize: "20px", color: "#0f172a", fontWeight: "700" }}>
                                ยืนยันรับอาหารบริจาค
                            </h3>
                            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                                {food.foodName}
                            </p>
                        </div>

                        {/* Banner แสดงจำนวนชิ้นคงเหลือที่จองได้ */}
                        <div style={styleOne.stockAlertBanner}>
                            <i className="material-icons-outlined" style={{ fontSize: "20px", color: "#328d7d" }}>info</i>
                            <div style={{ textAlign: "left" }}>
                                <div style={{ fontSize: "12px", color: "#277265", fontWeight: "600" }}>
                                    สามารถจองได้สูงสุด <span style={{ fontSize: "15px", fontWeight: "800", color: "#115e59" }}>{maxLimit}</span> ชิ้น
                                </div>
                                <div style={{ fontSize: "11px", color: "#0aa089" }}>
                                    (คงเหลือในระบบ {food.remainingUnit} ชิ้น • จำกัด {food.limitPerPerson || 1} ชิ้น/คน)
                                </div>
                            </div>
                        </div>

                        {/* Stepper Control & Quick Chips */}
                        <div style={{ margin: "20px 0" }}>
                            <label style={{ fontSize: "13px", color: "#475569", fontWeight: "600", display: "block", textAlign: "center", marginBottom: "12px" }}>
                                เลือกจำนวนที่ต้องการรับ
                            </label>

                            {/* Stepper + / - */}
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "center", marginBottom: "16px" }}>
                                <button
                                    onClick={() => setReserveQuantity(prev => Math.max(1, prev - 1))}
                                    disabled={reserveQuantity <= 1}
                                    style={{
                                        ...styleOne.qtyStepperBtn,
                                        opacity: reserveQuantity <= 1 ? 0.4 : 1
                                    }}
                                >
                                    -
                                </button>
                                <span style={{ fontSize: "24px", fontWeight: "800", width: "48px", textAlign: "center", color: "#0f172a" }}>
                                    {reserveQuantity}
                                </span>
                                <button
                                    onClick={() => setReserveQuantity(prev => Math.min(maxLimit, prev + 1))}
                                    disabled={reserveQuantity >= maxLimit}
                                    style={{
                                        ...styleOne.qtyStepperBtn,
                                        opacity: reserveQuantity >= maxLimit ? 0.4 : 1
                                    }}
                                >
                                    +
                                </button>
                            </div>

                            {/* Quick Selection Chips */}
                            {maxLimit > 1 && (
                                <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                                    {Array.from({ length: maxLimit }, (_, i) => i + 1).map((qty) => (
                                        <button
                                            key={qty}
                                            onClick={() => setReserveQuantity(qty)}
                                            style={{
                                                ...styleOne.quickQtyChip,
                                                backgroundColor: reserveQuantity === qty ? "#ff9100" : "#f1f5f9",
                                                color: reserveQuantity === qty ? "#ffffff" : "#475569",
                                                fontWeight: reserveQuantity === qty ? "700" : "500",
                                                border: reserveQuantity === qty ? "1px solid #ff9100" : "1px solid #e2e8f0"
                                            }}
                                        >
                                            {qty} ชิ้น
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                            <button
                                style={styleOne.cancelBtn}
                                onClick={() => setShowReserveModal(false)}
                            >
                                ยกเลิก
                            </button>
                            <button
                                style={styleOne.confirmBtn}
                                onClick={handleConfirmBooking}
                                disabled={submitting}
                            >
                                {submitting ? "กำลังบันทึก..." : "ยืนยันการรับ"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styleOne = {
    pageBg: { backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Prompt', sans-serif", paddingBottom: "40px" },
    floatingBackBtn: {
        position: "absolute", top: "16px", left: "16px", zIndex: 10,
        width: "40px", height: "40px", borderRadius: "50%",
        backgroundColor: "rgba(255, 255, 255, 0.9)", border: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
    },
    contentSheet: {
        maxWidth: "680px", margin: "-24px auto 0 auto", position: "relative", zIndex: 5,
        backgroundColor: "#ffffff", borderRadius: "24px 24px 0 0", padding: "24px 20px",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.05)"
    },
    sheetHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "10px" },
    categoryChip: { fontSize: "11px", fontWeight: "600", color: "#328d7d", backgroundColor: "#e6f4f1", padding: "2px 8px", borderRadius: "6px" },
    foodTitle: { margin: "4px 0 0 0", fontWeight: "700", color: "#0f172a" },
    statusPill: { padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
    descriptionText: { color: "#64748b", fontSize: "14px", lineHeight: "1.5", margin: "0 0 16px 0" },
    donorBox: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "12px", marginBottom: "16px" },
    donorAvatar: { width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#e6f4f1", display: "flex", alignItems: "center", justifyContent: "center" },
    specGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" },
    specItem: { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#f8fafc", padding: "10px 12px", borderRadius: "12px" },
    specLabel: { fontSize: "11px", color: "#64748b", display: "block" },
    specValue: { fontSize: "12px", fontWeight: "600", color: "#1e293b" },
    sectionCard: { backgroundColor: "#ffffff", borderRadius: "16px", padding: "16px", border: "1px solid #f1f5f9", marginBottom: "16px" },
    sectionTitle: { margin: "0 0 12px 0", fontSize: "15px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" },
    overallReviewContainer: { display: "flex", gap: "20px", alignItems: "center", backgroundColor: "#f8fafc", padding: "16px", borderRadius: "14px" },
    ratingScoreBig: { textAlign: "center", paddingRight: "16px", borderRight: "1px solid #e2e8f0" },
    ratingBarsList: { flex: 1, display: "flex", flexDirection: "column", gap: "4px" },
    barRow: { display: "flex", alignItems: "center", gap: "8px" },
    barTrack: { flex: 1, height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" },
    barFill: { height: "100%", backgroundColor: "#ffb800" },
    reviewBubble: { backgroundColor: "#f8fafc", padding: "10px 12px", borderRadius: "10px", marginTop: "8px" },
    mainCtaBtn: { width: "100%", padding: "14px", borderRadius: "14px", backgroundColor: "#ff9100", color: "#fff", border: "none", fontSize: "16px", fontWeight: "700", cursor: "pointer", marginTop: "10px" },

    // Alert Modal ลอยกลางหน้า
    centerModalBackdrop: {
        position: "fixed", inset: 0, zIndex: 999,
        backgroundColor: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px"
    },
    centerModalCard: {
        width: "100%", maxWidth: "400px", backgroundColor: "#ffffff",
        borderRadius: "20px", padding: "24px",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
        animation: "scaleUp 0.15s ease-out"
    },
    modalHeaderIcon: {
        width: "56px", height: "56px", borderRadius: "50%",
        backgroundColor: "#fff7ed", display: "inline-flex",
        alignItems: "center", justifyContent: "center"
    },
    stockAlertBanner: {
        backgroundColor: "#e6f4f1", border: "1px solid #b2dfdb",
        borderRadius: "12px", padding: "10px 12px",
        display: "flex", alignItems: "center", gap: "10px"
    },
    qtyStepperBtn: {
        width: "42px", height: "42px", borderRadius: "12px",
        border: "1px solid #cbd5e1", backgroundColor: "#f8fafc",
        fontSize: "20px", fontWeight: "600", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
    },
    quickQtyChip: {
        padding: "6px 14px", borderRadius: "18px",
        fontSize: "13px", cursor: "pointer", transition: "all 0.15s ease"
    },
    cancelBtn: {
        flex: 1, padding: "12px", borderRadius: "12px",
        border: "1px solid #cbd5e1", backgroundColor: "#ffffff",
        color: "#475569", fontWeight: "600", cursor: "pointer"
    },
    confirmBtn: {
        flex: 1.5, padding: "12px", borderRadius: "12px",
        border: "none", backgroundColor: "#ff9100",
        color: "#ffffff", fontWeight: "700", cursor: "pointer",
        boxShadow: "0 4px 12px rgba(255, 145, 0, 0.25)"
    }
};