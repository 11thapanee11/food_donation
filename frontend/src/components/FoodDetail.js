import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

    // State สำหรับการแสดงผล Alert Custom Popup (ใช้แทน SweetAlert2)
    const [alertModal, setAlertModal] = useState({
        show: false,
        title: "",
        message: "",
        type: "info", // "info" | "success" | "error"
        confirmText: "ตกลง",
        cancelText: null,
        onConfirm: null
    });

    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );

    const isOwner = food && food.donorId && String(food.donorId) === String(userId);
    const BASE_URL = "http://localhost:8082";

    const isFromReceive = fromPage === "/receive";
    const isFromManage = fromPage === "/manage-foods";

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

    // เปิดการจองหรือแสดง Alert ให้ Login
    const handleOpenReserveModal = () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            setAlertModal({
                show: true,
                title: "กรุณาเข้าสู่ระบบ",
                message: "คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถจองรายการอาหารได้",
                type: "info",
                confirmText: "ไปหน้าเข้าสู่ระบบ",
                cancelText: "ยกเลิก",
                onConfirm: () => navigate('/login')
            });
            return;
        }

        setReserveQuantity(1);
        setShowReserveModal(true);
    };

    // ยืนยันการจอง
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
                    const newBookingId = resData.data?.id; // หรือ field ID การจองที่ API ส่งกลับมา
                    setAlertModal({
                        show: true,
                        title: "จองสำเร็จ!",
                        message: "สามารถรับอาหารได้ตามสถานที่ที่ระบุไว้",
                        type: "success",
                        confirmText: "ดูรายละเอียดการจอง",
                        cancelText: "ตกลง", // ปิดหน้าต่างแล้วอยู่หน้าเดิม
                        onConfirm: () => {
                            if (newBookingId) {
                                navigate(`/receive/${newBookingId}`); // หรือ navigate('/receive', { state: { id: newBookingId } })
                            } else {
                                navigate('/receive');
                            }
                        }
                    });
                } else {
                    setAlertModal({
                        show: true,
                        title: "เกิดข้อผิดพลาด",
                        message: resData.message || "ไม่สามารถทำรายการได้",
                        type: "error",
                        confirmText: "ตกลง",
                        cancelText: null,
                        onConfirm: null
                    });
                }
            })
            .catch(() => {
                setShowReserveModal(false);
                setAlertModal({
                    show: true,
                    title: "เกิดข้อผิดพลาด",
                    message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
                    type: "error",
                    confirmText: "ลองอีกครั้ง",
                    cancelText: null,
                    onConfirm: null
                });
            })
            .finally(() => setSubmitting(false));
    };

    if (loading || !food) return <div style={styleOne.loading}>กำลังโหลดข้อมูล...</div>;

    const googleMapEmbedUrl = food?.latitude && food?.longitude
        ? `https://maps.google.com/maps?q=${food.latitude},${food.longitude}&z=16&output=embed`
        : null;

    const maxLimit = Math.min(food.limitPerPerson || 1, food.remainingUnit || 1);

    return (
        <div style={styleOne.pageBg}>

            {/* Header Image Display */}
            <div style={{
                position: "relative", width: "100%", height: isMobile ? "280px" : "360px",
                overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
                <div style={{
                    position: "absolute", inset: "-10px",
                    backgroundImage: `url(${BASE_URL}${food.foodImage})`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    filter: "blur(28px) brightness(0.85) opacity(0.6)"
                }} />

                <img
                    src={`${BASE_URL}${food.foodImage}`}
                    alt={food.foodName}
                    style={{
                        position: "relative", zIndex: 1, maxHeight: "90%", maxWidth: "90%",
                        objectFit: "contain", borderRadius: "20px",
                        boxShadow: "0 12px 28px rgba(192, 132, 252, 0.15)"
                    }}
                    onError={(e) => { e.target.src = "https://placehold.co/800x500?text=No+Image"; }}
                />

                <button style={{ ...styleOne.floatingBackBtn, zIndex: 2 }} onClick={() => navigate(-1)}>
                    <i className="material-icons-outlined" style={{ color: "#334155" }}>arrow_back</i>
                </button>

                <div style={{
                    position: "absolute", bottom: "16px", right: "16px", zIndex: 2,
                    backgroundColor: "rgba(255, 255, 255, 0.95)", color: "#334155", padding: "6px 14px", borderRadius: "16px",
                    display: "flex", alignItems: "center", gap: "6px",
                    boxShadow: "0 4px 14px rgba(192, 132, 252, 0.12)", backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255, 255, 255, 0.8)"
                }}>
                    <span style={{ color: "#fbbf24", fontSize: "16px", lineHeight: "1" }}>★</span>
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
                        backgroundColor: food.remainingUnit > 0 ? "#ecfdf5" : "#fff1f2",
                        color: food.remainingUnit > 0 ? "#10b981" : "#f43f5e",
                        border: food.remainingUnit > 0 ? "1px solid #a7f3d0" : "1px solid #fecdd3"
                    }}>
                        {food.remainingUnit > 0 ? `เหลือในระบบ ${food.remainingUnit} ชิ้น` : "หมดแล้ว"}
                    </span>
                </div>

                <p style={styleOne.descriptionText}>{food.description || "ไม่มีรายละเอียดเพิ่มเติมเกี่ยวกับรายการนี้"}</p>

                {/* Donor Quick Info Row */}
                <div style={styleOne.donorBox}>
                    <div style={styleOne.donorAvatar}>
                        <i className="material-icons-outlined" style={{ color: "#c084fc" }}>person</i>
                    </div>
                    <div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>แบ่งปันโดย</div>
                        <div style={{ fontWeight: "600", color: "#334155", fontSize: "14px" }}>{food.donorName || "ผู้บริจาคใจดี"}</div>
                    </div>
                </div>

                {/* Key Specifications Grid */}
                <div style={styleOne.specGrid}>
                    <div style={styleOne.specItem}>
                        <i className="material-icons-outlined" style={{ color: "#f472b6" }}>schedule</i>
                        <div>
                            <span style={styleOne.specLabel}>หมดอายุ</span>
                            <span style={styleOne.specValue}>{formatExpiryDate(food.expiryDate)}</span>
                        </div>
                    </div>
                    <div style={styleOne.specItem}>
                        <i className="material-icons-outlined" style={{ color: "#38bdf8" }}>scale</i>
                        <div>
                            <span style={styleOne.specLabel}>น้ำหนัก/หน่วย</span>
                            <span style={styleOne.specValue}>{food.unitWeightKg || "0.00"} Kg</span>
                        </div>
                    </div>
                </div>

                {/* Location Section */}
                <div style={styleOne.sectionCard}>
                    <h3 style={styleOne.sectionTitle}>
                        <i className="material-icons-outlined" style={{ color: "#38bdf8" }}>location_on</i>
                        สถานที่รับอาหาร
                    </h3>
                    <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 12px 0" }}>{food.address || "ไม่ระบุที่อยู่"}</p>
                    {googleMapEmbedUrl && (
                        <iframe
                            title="food-map"
                            width="100%"
                            height="180"
                            style={{ border: 0, borderRadius: "14px" }}
                            src={googleMapEmbedUrl}
                        ></iframe>
                    )}
                </div>

                {/* Overall Reviews */}
                <div style={styleOne.sectionCard}>
                    <h3 style={styleOne.sectionTitle}>
                        <i className="material-icons-outlined" style={{ color: "#fbbf24" }}>star</i>
                        การประเมินและรีวิวรวม
                    </h3>

                    <div style={styleOne.overallReviewContainer}>
                        <div style={styleOne.ratingScoreBig}>
                            <div style={{ fontSize: "36px", fontWeight: "800", color: "#334155", lineHeight: "1" }}>{averageRating}</div>
                            <div style={{ display: "flex", gap: "2px", margin: "6px 0" }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <span key={s} style={{ color: s <= Math.round(Number(averageRating)) ? "#fbbf24" : "#e2e8f0", fontSize: "14px" }}>★</span>
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
                                        <span style={{ fontWeight: "600", fontSize: "13px", color: "#334155" }}>{item.reviewerName || "ผู้รับบริการ"}</span>
                                        <span style={{ color: "#94a3b8", fontSize: "11px" }}>{new Date(item.reviewDate).toLocaleDateString('th-TH')}</span>
                                    </div>
                                    <div style={{ color: "#fbbf24", fontSize: "12px", marginBottom: "4px" }}>
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
                            backgroundColor: (food?.isCurrentByUserBooked || food.remainingUnit <= 0) ? "#cbd5e1" : "#c084fc",
                            boxShadow: (food?.isCurrentByUserBooked || food.remainingUnit <= 0) ? "none" : "0 4px 14px rgba(192, 132, 252, 0.35)",
                            cursor: (food?.isCurrentByUserBooked || food.remainingUnit <= 0) ? "not-allowed" : "pointer"
                        }}
                    >
                        {food?.isCurrentByUserBooked ? 'คุณได้ทำการจองรายการนี้แล้ว' : food.remainingUnit <= 0 ? 'รายการนี้หมดแล้ว' : 'กดรับอาหารบริจาค'}
                    </button>
                )}
            </div>

            {/* --- 1. RESERVATION POPUP MODAL (หน้าต่างเลือกจำนวน) --- */}
            {showReserveModal && (
                <div style={styleOne.centerModalBackdrop} onClick={() => setShowReserveModal(false)}>
                    <div style={styleOne.centerModalCard} onClick={(e) => e.stopPropagation()}>
                        <div style={{ textAlign: "center", marginBottom: "16px" }}>
                            <div style={styleOne.modalHeaderIcon}>
                                <i className="material-icons-outlined" style={{ fontSize: "28px", color: "#c084fc" }}>shopping_basket</i>
                            </div>
                            <h3 style={{ margin: "12px 0 4px 0", fontSize: "20px", color: "#334155", fontWeight: "700" }}>
                                ยืนยันรับอาหารบริจาค
                            </h3>
                            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                                {food.foodName}
                            </p>
                        </div>

                        <div style={styleOne.stockAlertBanner}>
                            <i className="material-icons-outlined" style={{ fontSize: "20px", color: "#38bdf8" }}>info</i>
                            <div style={{ textAlign: "left" }}>
                                <div style={{ fontSize: "12px", color: "#0284c7", fontWeight: "600" }}>
                                    สามารถจองได้สูงสุด <span style={{ fontSize: "15px", fontWeight: "800", color: "#0369a1" }}>{maxLimit}</span> ชิ้น
                                </div>
                                <div style={{ fontSize: "11px", color: "#38bdf8" }}>
                                    (คงเหลือในระบบ {food.remainingUnit} ชิ้น • จำกัด {food.limitPerPerson || 1} ชิ้น/คน)
                                </div>
                            </div>
                        </div>

                        <div style={{ margin: "20px 0" }}>
                            <label style={{ fontSize: "13px", color: "#475569", fontWeight: "600", display: "block", textAlign: "center", marginBottom: "12px" }}>
                                เลือกจำนวนที่ต้องการรับ
                            </label>

                            <div style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "center", marginBottom: "16px" }}>
                                <button
                                    onClick={() => setReserveQuantity(prev => Math.max(1, prev - 1))}
                                    disabled={reserveQuantity <= 1}
                                    style={{ ...styleOne.qtyStepperBtn, opacity: reserveQuantity <= 1 ? 0.4 : 1 }}
                                >
                                    -
                                </button>
                                <span style={{ fontSize: "24px", fontWeight: "800", width: "48px", textAlign: "center", color: "#334155" }}>
                                    {reserveQuantity}
                                </span>
                                <button
                                    onClick={() => setReserveQuantity(prev => Math.min(maxLimit, prev + 1))}
                                    disabled={reserveQuantity >= maxLimit}
                                    style={{ ...styleOne.qtyStepperBtn, opacity: reserveQuantity >= maxLimit ? 0.4 : 1 }}
                                >
                                    +
                                </button>
                            </div>

                            {maxLimit > 1 && (
                                <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                                    {Array.from({ length: maxLimit }, (_, i) => i + 1).map((qty) => (
                                        <button
                                            key={qty}
                                            onClick={() => setReserveQuantity(qty)}
                                            style={{
                                                ...styleOne.quickQtyChip,
                                                backgroundColor: reserveQuantity === qty ? "#c084fc" : "#f8fafc",
                                                color: reserveQuantity === qty ? "#ffffff" : "#475569",
                                                fontWeight: reserveQuantity === qty ? "700" : "500",
                                                border: reserveQuantity === qty ? "1px solid #c084fc" : "1px solid #e2e8f0"
                                            }}
                                        >
                                            {qty} ชิ้น
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                            <button style={styleOne.cancelBtn} onClick={() => setShowReserveModal(false)}>
                                ยกเลิก
                            </button>
                            <button style={styleOne.confirmBtn} onClick={handleConfirmBooking} disabled={submitting}>
                                {submitting ? "กำลังบันทึก..." : "ยืนยันการรับ"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 2. CUSTOM SYSTEM ALERT POPUP (ใช้แทน SweetAlert2) --- */}
            {alertModal.show && (
                <div style={styleOne.centerModalBackdrop} onClick={() => setAlertModal(prev => ({ ...prev, show: false }))}>
                    <div style={styleOne.centerModalCard} onClick={(e) => e.stopPropagation()}>
                        <div style={{ textAlign: "center" }}>
                            {/* Alert Icon ตามประเภท */}
                            <div style={{
                                ...styleOne.modalHeaderIcon,
                                backgroundColor: alertModal.type === 'success' ? '#f0fdf4' : alertModal.type === 'error' ? '#fff1f2' : '#faf5ff',
                                border: alertModal.type === 'success' ? '1px solid #bbf7d0' : alertModal.type === 'error' ? '1px solid #fecdd3' : '1px solid #f3e8ff'
                            }}>
                                <i className="material-icons-outlined" style={{
                                    fontSize: "32px",
                                    color: alertModal.type === 'success' ? '#10b981' : alertModal.type === 'error' ? '#f43f5e' : '#c084fc'
                                }}>
                                    {alertModal.type === 'success' ? 'check_circle' : alertModal.type === 'error' ? 'error_outline' : 'info'}
                                </i>
                            </div>

                            <h3 style={{ margin: "16px 0 8px 0", fontSize: "20px", color: "#334155", fontWeight: "700" }}>
                                {alertModal.title}
                            </h3>
                            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
                                {alertModal.message}
                            </p>

                            <div style={{ display: "flex", gap: "12px" }}>
                                {alertModal.cancelText && (
                                    <button
                                        style={styleOne.cancelBtn}
                                        onClick={() => setAlertModal(prev => ({ ...prev, show: false }))}
                                    >
                                        {alertModal.cancelText}
                                    </button>
                                )}
                                <button
                                    style={{
                                        ...styleOne.confirmBtn,
                                        backgroundColor: alertModal.type === 'error' ? '#f43f5e' : '#c084fc',
                                        boxShadow: alertModal.type === 'error' ? '0 4px 14px rgba(244, 63, 94, 0.35)' : '0 4px 14px rgba(192, 132, 252, 0.35)'
                                    }}
                                    onClick={() => {
                                        const action = alertModal.onConfirm;
                                        setAlertModal(prev => ({ ...prev, show: false }));
                                        if (action) action();
                                    }}
                                >
                                    {alertModal.confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

const styleOne = {
    pageBg: {
        background: "linear-gradient(135deg, #faf5ff 0%, #f0f9ff 50%, #f0fdf4 100%)",
        minHeight: "100vh",
        fontFamily: "'Prompt', sans-serif",
        paddingBottom: "40px"
    },
    loading: {
        textAlign: "center",
        padding: "100px 20px",
        fontFamily: "'Prompt', sans-serif",
        color: "#c084fc",
        fontSize: "18px",
        fontWeight: "500"
    },
    floatingBackBtn: {
        position: "absolute", top: "16px", left: "16px", zIndex: 10,
        width: "40px", height: "40px", borderRadius: "50%",
        backgroundColor: "rgba(255, 255, 255, 0.9)", border: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", boxShadow: "0 4px 12px rgba(192, 132, 252, 0.2)"
    },
    contentSheet: {
        maxWidth: "680px", margin: "-24px auto 0 auto", position: "relative", zIndex: 5,
        backgroundColor: "#ffffff", borderRadius: "24px 24px 0 0", padding: "28px 24px",
        boxShadow: "0 -8px 24px rgba(192, 132, 252, 0.08)",
        border: "1px solid rgba(241, 245, 249, 0.9)"
    },
    sheetHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" },
    categoryChip: { fontSize: "11px", fontWeight: "600", color: "#c084fc", backgroundColor: "#faf5ff", padding: "4px 10px", borderRadius: "8px", border: "1px solid #f3e8ff" },
    foodTitle: { margin: "6px 0 0 0", fontWeight: "700", color: "#334155" },
    statusPill: { padding: "4px 12px", borderRadius: "14px", fontSize: "12px", fontWeight: "600" },
    descriptionText: { color: "#64748b", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px 0" },
    donorBox: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: "#faf5ff", borderRadius: "16px", marginBottom: "20px", border: "1px solid #f3e8ff" },
    donorAvatar: { width: "38px", height: "38px", borderRadius: "50%", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(192, 132, 252, 0.15)" },
    specGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" },
    specItem: { display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#f8fafc", padding: "12px 14px", borderRadius: "16px", border: "1px solid #f1f5f9" },
    specLabel: { fontSize: "11px", color: "#64748b", display: "block" },
    specValue: { fontSize: "12px", fontWeight: "600", color: "#334155" },
    sectionCard: { backgroundColor: "#ffffff", borderRadius: "20px", padding: "20px", border: "1px solid #f1f5f9", marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" },
    sectionTitle: { margin: "0 0 14px 0", fontSize: "15px", fontWeight: "700", color: "#334155", display: "flex", alignItems: "center", gap: "6px" },
    overallReviewContainer: { display: "flex", gap: "20px", alignItems: "center", backgroundColor: "#f8fafc", padding: "18px", borderRadius: "16px", border: "1px solid #f1f5f9" },
    ratingScoreBig: { textAlign: "center", paddingRight: "18px", borderRight: "1px solid #e2e8f0" },
    ratingBarsList: { flex: 1, display: "flex", flexDirection: "column", gap: "6px" },
    barRow: { display: "flex", alignItems: "center", gap: "8px" },
    barTrack: { flex: 1, height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" },
    barFill: { height: "100%", backgroundColor: "#fbbf24", borderRadius: "3px" },
    reviewBubble: { backgroundColor: "#f8fafc", padding: "12px 14px", borderRadius: "14px", marginTop: "10px", border: "1px solid #f1f5f9" },
    mainCtaBtn: { width: "100%", padding: "14px", borderRadius: "16px", backgroundColor: "#c084fc", color: "#fff", border: "none", fontSize: "16px", fontWeight: "700", cursor: "pointer", marginTop: "12px", transition: "all 0.2s ease" },

    // Custom Pop-up Styles
    centerModalBackdrop: {
        position: "fixed", inset: 0, zIndex: 999,
        backgroundColor: "rgba(51, 65, 85, 0.45)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px"
    },
    centerModalCard: {
        width: "100%", maxWidth: "400px", backgroundColor: "#ffffff",
        borderRadius: "28px", padding: "28px",
        boxShadow: "0 20px 50px rgba(192, 132, 252, 0.25)",
        border: "1px solid rgba(243, 232, 255, 0.8)"
    },
    modalHeaderIcon: {
        width: "60px", height: "60px", borderRadius: "50%",
        display: "inline-flex", alignItems: "center", justifyContent: "center"
    },
    stockAlertBanner: {
        backgroundColor: "#f0f9ff", border: "1px solid #bae6fd",
        borderRadius: "16px", padding: "12px 16px",
        display: "flex", alignItems: "center", gap: "10px"
    },
    qtyStepperBtn: {
        width: "44px", height: "44px", borderRadius: "14px",
        border: "1px solid #cbd5e1", backgroundColor: "#ffffff",
        fontSize: "20px", fontWeight: "600", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", color: "#334155"
    },
    quickQtyChip: {
        padding: "8px 16px", borderRadius: "14px",
        fontSize: "13px", cursor: "pointer"
    },
    cancelBtn: {
        flex: 1, padding: "12px", borderRadius: "14px",
        border: "1.5px solid #cbd5e1", backgroundColor: "#ffffff",
        color: "#64748b", fontWeight: "600", cursor: "pointer"
    },
    confirmBtn: {
        flex: 1.5, padding: "12px", borderRadius: "14px",
        border: "none", backgroundColor: "#c084fc",
        color: "#ffffff", fontWeight: "700", cursor: "pointer"
    }
};