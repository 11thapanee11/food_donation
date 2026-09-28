import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

export default function BookingDetail() {
    const { bookingId: paramBookingId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const bookingId = paramBookingId || location.state?.id || location.state?.bookingId;

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // State สำหรับ Modal รายงานปัญหา
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("EXPIRED");
    const [reportDescription, setReportDescription] = useState("");
    const [reportImage, setReportImage] = useState(null);
    const [reportImagePreview, setReportImagePreview] = useState(null);
    const [submittingReport, setSubmittingReport] = useState(false);

    // State สำหรับ Modal รีวิว
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [ratingScore, setRatingScore] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    // Alert Modal State (Custom Popup)
    const [alertModal, setAlertModal] = useState({
        show: false,
        title: "",
        message: "",
        type: "info",
        confirmText: "ตกลง",
        cancelText: null,
        onConfirm: null
    });

    const BASE_URL = "http://localhost:8082";

    const fetchBookingDetail = () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            navigate("/login");
            return;
        }

        setLoading(true);
        fetch(`${BASE_URL}/bookings/${bookingId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => res.json())
            .then(async (resData) => {
                if (resData.success) {
                    let bookingData = resData.data;

                    const targetFoodId = bookingData.foodId || bookingData.food?.foodId || bookingData.food?.id;
                    if (targetFoodId) {
                        try {
                            const foodRes = await fetch(`${BASE_URL}/foods/${targetFoodId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            const foodResData = await foodRes.json();
                            if (foodResData.success || foodResData.data) {
                                bookingData.food = foodResData.data || foodResData;
                            }
                        } catch (foodErr) {
                            console.error("ไม่สามารถดึงข้อมูลอาหารได้:", foodErr);
                        }
                    }

                    try {
                        const reviewCheckRes = await fetch(`${BASE_URL}/reviews/check/${bookingId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const reviewCheckData = await reviewCheckRes.json();
                        bookingData.hasReviewed = reviewCheckData.success && reviewCheckData.data != null;
                    } catch (e) {
                        bookingData.hasReviewed = false;
                    }

                    try {
                        const reportCheckRes = await fetch(`${BASE_URL}/report/check/${bookingId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const reportCheckData = await reportCheckRes.json();
                        bookingData.hasReported = reportCheckData.success && reportCheckData.data === true;
                    } catch (e) {
                        bookingData.hasReported = false;
                    }

                    setBooking(bookingData);
                } else {
                    showAlert("เกิดข้อผิดพลาด", resData.message || "ไม่พบข้อมูลการรับบริจาค", "error", () => navigate(-1));
                }
            })
            .catch(() => {
                showAlert("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error", () => navigate(-1));
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!bookingId) {
            showAlert("เกิดข้อผิดพลาด", "ไม่พบรหัสการรับบริจาค กรุณาลองใหม่อีกครั้ง", "error", () => navigate(-1));
            setLoading(false);
            return;
        }
        fetchBookingDetail();
    }, [bookingId]);

    const showAlert = (title, message, type = "info", onConfirm = null, cancelText = null) => {
        setAlertModal({
            show: true,
            title,
            message,
            type,
            confirmText: "ตกลง",
            cancelText,
            onConfirm
        });
    };

    const handleCancelBooking = () => {
        showAlert(
            "ยืนยันการยกเลิก",
            "คุณต้องการยกเลิกการรับบริจาครายการนี้ใช่หรือไม่?",
            "error",
            () => {
                const token = localStorage.getItem("accessToken");
                setSubmitting(true);
                fetch(`${BASE_URL}/bookings/${bookingId}/cancel`, {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then((res) => res.json())
                    .then((resData) => {
                        if (resData.success) {
                            showAlert("ยกเลิกสำเร็จ", "ยกเลิกรายการรับบริจาคเรียบร้อยแล้ว", "success", () => {
                                fetchBookingDetail();
                            });
                        } else {
                            showAlert("เกิดข้อผิดพลาด", resData.message || "ไม่สามารถยกเลิกได้", "error");
                        }
                    })
                    .catch(() => showAlert("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error"))
                    .finally(() => setSubmitting(false));
            },
            "ยกเลิก"
        );
    };

    const handleReportImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReportImage(file);
            setReportImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmitReport = () => {
        if (!reportDescription || reportDescription.trim() === "") {
            showAlert("กรุณากรอกข้อมูล", "กรุณากรอกรายละเอียดเพิ่มเติมก่อนส่งรายงาน", "error");
            return;
        }

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setSubmittingReport(true);
        const formData = new FormData();
        formData.append("bookingId", bookingId);
        formData.append("reason", reportReason);
        formData.append("description", reportDescription);
        if (reportImage) {
            formData.append("fileImage", reportImage);
        }

        fetch(`${BASE_URL}/report`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        })
            .then(res => res.json())
            .then(resData => {
                setShowReportModal(false);
                setReportDescription("");
                setReportImage(null);
                setReportImagePreview(null);
                if (resData.success || resData) {
                    showAlert("ส่งรายงานสำเร็จ", "เจ้าหน้าที่ได้รับเรื่องร้องเรียนของคุณแล้ว จะทำการตรวจสอบโดยเร็วที่สุด", "success");
                    fetchBookingDetail();
                } else {
                    showAlert("เกิดข้อผิดพลาด", resData.message || "ไม่สามารถส่งรายงานได้", "error");
                }
            })
            .catch(() => {
                setShowReportModal(false);
                showAlert("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
            })
            .finally(() => setSubmittingReport(false));
    };

    const handleSubmitReview = () => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const targetFoodId = booking?.foodId || booking?.food?.foodId || booking?.food?.id;
        if (!targetFoodId) {
            showAlert("เกิดข้อผิดพลาด", "ไม่พบรหัสอาหารสำหรับรีวิว", "error");
            return;
        }

        setSubmittingReview(true);
        fetch(`${BASE_URL}/reviews`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                foodId: targetFoodId,
                bookingId: bookingId,
                ratingScore: ratingScore,
                reviewComment: reviewComment
            })
        })
            .then(res => res.json())
            .then(resData => {
                setShowReviewModal(false);
                setReviewComment("");
                if (resData.success || resData) {
                    showAlert("รีวิวสำเร็จ", "ขอบคุณสำหรับการประเมินและรีวิวอาหารบริจาคค่ะ", "success");
                    fetchBookingDetail();
                } else {
                    showAlert("เกิดข้อผิดพลาด", resData.message || "ไม่สามารถบันทึกรีวิวได้", "error");
                }
            })
            .catch(() => {
                setShowReviewModal(false);
                showAlert("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
            })
            .finally(() => setSubmittingReview(false));
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return `${date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })} เวลา ${date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`;
    };

    if (loading) return <div style={styles.loading}>กำลังโหลดข้อมูลการรับบริจาค...</div>;

    if (!booking) return (
        <div style={styles.pageBg}>
            <div style={styles.errorContainer}>
                <div style={styles.errorIconBox}>
                    <i className="material-icons-outlined" style={{ fontSize: "40px", color: "#f43f5e" }}>error_outline</i>
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#334155", margin: "16px 0 6px 0" }}>
                    ไม่พบข้อมูลการรับบริจาค
                </h3>
                <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px 0" }}>
                    รายการที่คุณพยายามเข้าถึงอาจถูกลบหรือไม่มีอยู่จริง
                </p>
                <button style={styles.secondaryBtn} onClick={() => navigate(-1)}>
                    ย้อนกลับ
                </button>
            </div>
        </div>
    );

    const statusValue = (booking.bookingStatus || booking.status || "").toLowerCase();
    const isPending = statusValue === "pending" || statusValue === "booked";
    const isCompleted = statusValue === "completed" || statusValue === "received";
    const isCancelled = statusValue === "cancelled";

    const foodInfo = booking.food || {};
    const foodName = foodInfo.foodName || booking.foodName || "รายการอาหาร";
    const foodImage = foodInfo.foodImage || booking.foodImage;
    const foodCateName = foodInfo.foodCateName || booking.foodCateName || "อาหารทั่วไป";
    const expiryDate = foodInfo.expiryDate || booking.expiryDate;
    const unitWeightKg = foodInfo.unitWeightKg || booking.unitWeightKg || 0;

    const address = foodInfo.address || foodInfo.locationName || booking.address || "ไม่ระบุที่อยู่";
    const latitude = foodInfo.latitude || booking.latitude;
    const longitude = foodInfo.longitude || booking.longitude;
    const donorName = foodInfo.donorName || booking.donorName || "ผู้บริจาคใจดี";
    const donorPhone = foodInfo.donorPhoneNum || booking.donorPhone;

    const googleMapEmbedUrl = latitude && longitude
        ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`
        : null;

    const directMapUrl = latitude && longitude
        ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        : null;

    return (
        <div style={styles.pageBg}>
            <div style={styles.topBarWrapper}>
                <div style={styles.topBar}>
                    <button
                        onClick={() => navigate(-1)}
                        style={styles.backBtn}
                    >
                        <i className="material-icons-outlined" style={{ fontSize: "20px", color: "#334155" }}>arrow_back</i>
                    </button>
                    <h2 style={styles.topTitle}>รายละเอียดการรับบริจาค</h2>
                    <div style={{ width: "40px" }} />
                </div>
            </div>

            <div style={styles.container}>
                <div style={styles.layoutGrid}>

                    {/* ฝั่งซ้าย: Sidebar สถานะ รหัส และปุ่มกระทำ */}
                    <div style={styles.sidebarColumn}>
                        <div style={styles.stickyCard}>
                            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                                <span style={styles.label}>สถานะการรับบริจาค</span>
                                <div style={{ marginTop: "8px" }}>
                                    <span style={{
                                        ...styles.statusBadge,
                                        backgroundColor: isPending ? "#fef3c7" : isCompleted ? "#dcfce7" : "#ffe4e6",
                                        color: isPending ? "#d97706" : isCompleted ? "#15803d" : "#e11d48",
                                        border: isPending ? "1px solid #fde68a" : isCompleted ? "1px solid #bbf7d0" : "1px solid #fecdd3"
                                    }}>
                                        {isPending ? "รอรับอาหารบริจาค" : isCompleted ? "รับอาหารเรียบร้อย" : "ยกเลิกแล้ว"}
                                    </span>
                                </div>
                            </div>

                            <div style={styles.codeHighlightBox}>
                                <span style={{ fontSize: "12px", color: "#9333ea", fontWeight: "700", marginBottom: "4px", display: "block" }}>
                                    รหัสรับบริจาค
                                </span>
                                <div style={styles.largeCodeBadge}>
                                    #{booking.confirmationCode || booking.bookingCode || booking.id}
                                </div>
                            </div>

                            <div style={styles.sidebarInfoBox}>
                                <span style={styles.label}>วันที่ทำรายการ</span>
                                <div style={{ fontSize: "13px", fontWeight: "600", color: "#334155", marginTop: "4px" }}>
                                    {formatDate(booking.createdAt || booking.bookingDate)}
                                </div>
                            </div>

                            <div style={styles.divider} />

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {isPending && (
                                    <button
                                        onClick={handleCancelBooking}
                                        disabled={submitting}
                                        style={styles.cancelBookingBtn}
                                    >
                                        {submitting ? "กำลังทำรายการ..." : "ยกเลิกการรับบริจาคนี้"}
                                    </button>
                                )}

                                {isCompleted && (
                                    <button
                                        onClick={() => setShowReviewModal(true)}
                                        disabled={booking.hasReviewed}
                                        style={{
                                            ...styles.primaryBtn,
                                            backgroundColor: booking.hasReviewed ? "#cbd5e1" : "#c084fc",
                                            cursor: booking.hasReviewed ? "not-allowed" : "pointer",
                                            boxShadow: booking.hasReviewed ? "none" : "0 4px 14px rgba(192, 132, 252, 0.35)"
                                        }}
                                    >
                                        {booking.hasReviewed ? "รีวิวรายการนี้แล้ว" : "ให้คะแนนและรีวิว"}
                                    </button>
                                )}

                                {!isCancelled && (
                                    <button
                                        onClick={() => setShowReportModal(true)}
                                        disabled={booking.hasReported}
                                        style={{
                                            ...styles.reportBtn,
                                            backgroundColor: booking.hasReported ? "#f8fafc" : "#fff1f2",
                                            color: booking.hasReported ? "#94a3b8" : "#e11d48",
                                            borderColor: booking.hasReported ? "#e2e8f0" : "#fecdd3",
                                            cursor: booking.hasReported ? "not-allowed" : "pointer"
                                        }}
                                    >
                                        <i className="material-icons-outlined" style={{ fontSize: "16px" }}>flag</i>
                                        {booking.hasReported ? "รายงานปัญหาแล้ว" : "รายงานปัญหาการรับบริจาค"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ฝั่งขวา: Main Content */}
                    <div style={styles.mainContentColumn}>

                        <div style={styles.card}>
                            <h3 style={styles.cardTitle}>
                                <i className="material-icons-outlined" style={{ color: "#c084fc" }}>restaurant</i>
                                รายการอาหารที่ขอรับบริจาค
                            </h3>

                            <div style={{ display: "flex", gap: "16px", marginTop: "14px", alignItems: "center", flexWrap: "wrap" }}>
                                <img
                                    src={foodImage ? `${BASE_URL}${foodImage}` : "https://placehold.co/200x200?text=No+Image"}
                                    alt={foodName}
                                    style={styles.foodImage}
                                    onError={(e) => { e.target.src = "https://placehold.co/200x200?text=No+Image"; }}
                                />
                                <div style={{ flex: 1, minWidth: "200px" }}>
                                    <span style={styles.categoryChip}>{foodCateName}</span>
                                    <h4 style={{ margin: "4px 0 6px 0", fontSize: "16px", color: "#334155", fontWeight: "700" }}>
                                        {foodName}
                                    </h4>
                                    <div style={{ fontSize: "13px", color: "#64748b" }}>
                                        จำนวนที่รับ: <span style={{ fontWeight: "700", color: "#c084fc", fontSize: "15px" }}>{booking.bookingQuantity || 1} {booking.bookingUnit || "ชิ้น"}</span>
                                    </div>
                                    {unitWeightKg > 0 && (
                                        <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                                            น้ำหนักรวมประมาณ: {(unitWeightKg * (booking.quantity || booking.bookingUnit || 1)).toFixed(2)} Kg
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ ...styles.alertBox, marginTop: "16px" }}>
                                <i className="material-icons-outlined" style={{ color: "#f472b6", fontSize: "20px" }}>schedule</i>
                                <div>
                                    <div style={{ fontSize: "11px", color: "#64748b" }}>ควรไปรับก่อนเวลา (หมดอายุ)</div>
                                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#e11d48" }}>
                                        {formatDate(expiryDate)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={styles.card}>
                            <h3 style={styles.cardTitle}>
                                <i className="material-icons-outlined" style={{ color: "#c084fc" }}>person</i>
                                ข้อมูลผู้บริจาค
                            </h3>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={styles.avatar}>
                                        <i className="material-icons-outlined" style={{ color: "#c084fc" }}>person</i>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: "700", fontSize: "14px", color: "#334155" }}>
                                            {donorName}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                                            {donorPhone || "ไม่มีเบอร์ติดต่อ"}
                                        </div>
                                    </div>
                                </div>

                                {donorPhone && (
                                    <a href={`tel:${donorPhone}`} style={styles.callBtn}>
                                        <i className="material-icons-outlined" style={{ fontSize: "18px" }}>call</i>
                                        โทรออก
                                    </a>
                                )}
                            </div>
                        </div>

                        <div style={styles.card}>
                            <h3 style={styles.cardTitle}>
                                <i className="material-icons-outlined" style={{ color: "#38bdf8" }}>location_on</i>
                                สถานที่นัดรับอาหาร
                            </h3>

                            <p style={{ fontSize: "13px", color: "#475569", margin: "8px 0 12px 0", lineHeight: "1.5" }}>
                                {address}
                            </p>

                            {googleMapEmbedUrl && (
                                <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #f1f5f9", marginBottom: "12px" }}>
                                    <iframe
                                        title="pickup-map"
                                        width="100%"
                                        height="160"
                                        style={{ border: 0 }}
                                        src={googleMapEmbedUrl}
                                    ></iframe>
                                </div>
                            )}

                            {directMapUrl && (
                                <a href={directMapUrl} target="_blank" rel="noopener noreferrer" style={styles.mapNavBtn}>
                                    <i className="material-icons-outlined" style={{ fontSize: "18px" }}>near_me</i>
                                    นำทางด้วย Google Maps
                                </a>
                            )}
                        </div>

                    </div>

                </div>
            </div>

            {/* --- Modal รีวิวและให้คะแนน --- */}
            {showReviewModal && (
                <div style={styles.centerModalBackdrop} onClick={() => setShowReviewModal(false)}>
                    <div style={styles.centerModalCard} onClick={(e) => e.stopPropagation()}>
                        <div style={{ textAlign: "center", marginBottom: "16px" }}>
                            <div style={{ ...styles.modalHeaderIcon, backgroundColor: "#faf5ff", border: "1px solid #e9d5ff" }}>
                                <i className="material-icons-outlined" style={{ fontSize: "28px", color: "#c084fc" }}>star</i>
                            </div>
                            <h3 style={{ margin: "12px 0 4px 0", fontSize: "18px", color: "#334155", fontWeight: "700" }}>
                                ให้คะแนนและรีวิว
                            </h3>
                            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                                แบ่งปันความประทับใจเกี่ยวกับรายการอาหารนี้
                            </p>
                        </div>

                        <div style={{ display: "flex", justifyContent: "center", gap: "8px", margin: "16px 0" }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    onClick={() => setRatingScore(star)}
                                    style={{
                                        fontSize: "28px",
                                        cursor: "pointer",
                                        color: star <= ratingScore ? "#fbbf24" : "#cbd5e1"
                                    }}
                                >
                                    ★
                                </span>
                            ))}
                        </div>

                        <div style={{ marginBottom: "20px", textAlign: "left" }}>
                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>
                                ความคิดเห็นเพิ่มเติม
                            </label>
                            <textarea
                                rows="3"
                                placeholder="เขียนรีวิวของคุณที่นี่..."
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                style={styles.textAreaInput}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button style={styles.cancelBtn} onClick={() => setShowReviewModal(false)}>
                                ยกเลิก
                            </button>
                            <button
                                style={styles.confirmBtn}
                                onClick={handleSubmitReview}
                                disabled={submittingReview}
                            >
                                {submittingReview ? "กำลังส่ง..." : "ส่งรีวิว"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modal รายงานปัญหา (พร้อมดอกจันทร์บังคับกรอก) --- */}
            {showReportModal && (
                <div style={styles.centerModalBackdrop} onClick={() => setShowReportModal(false)}>
                    <div style={styles.centerModalCard} onClick={(e) => e.stopPropagation()}>
                        <div style={{ textAlign: "center", marginBottom: "16px" }}>
                            <div style={{ ...styles.modalHeaderIcon, backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}>
                                <i className="material-icons-outlined" style={{ fontSize: "28px", color: "#f43f5e" }}>flag</i>
                            </div>
                            <h3 style={{ margin: "12px 0 4px 0", fontSize: "18px", color: "#334155", fontWeight: "700" }}>
                                แจ้งปัญหาการรับบริจาค
                            </h3>
                            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                                ระบุปัญหาที่คุณพบเพื่อให้เจ้าหน้าที่ตรวจสอบ
                            </p>
                        </div>

                        {/* หัวข้อปัญหา */}
                        <div style={{ marginBottom: "14px", textAlign: "left" }}>
                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>
                                หัวข้อปัญหา <span style={{ color: "#EF4444", marginLeft: "4px" }}>*</span>
                            </label>
                            <select
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                style={styles.selectInput}
                            >
                                <option value="EXPIRED">อาหารหมดอายุ</option>
                                <option value="SPOILED">อาหารมีกลิ่นและสภาพผิดปกติ</option>
                                <option value="NOT_MATCH">รายละเอียดอาหารไม่ตรงกับความเป็นจริง</option>
                                <option value="HYGIENE_ISSUE">ปัญหาด้านความสะอาดหรือบรรจุภัณฑ์ชำรุดเสียหาย</option>
                                <option value="OTHER">ปัญหาอื่นๆ ทั่วไป</option>
                            </select>
                        </div>

                        {/* รายละเอียดเพิ่มเติม */}
                        <div style={{ marginBottom: "14px", textAlign: "left" }}>
                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>
                                รายละเอียดเพิ่มเติม <span style={{ color: "#EF4444", marginLeft: "4px" }}>*</span>
                            </label>
                            <textarea
                                rows="3"
                                placeholder="อธิบายรายละเอียดเพิ่มเติม..."
                                value={reportDescription}
                                onChange={(e) => setReportDescription(e.target.value)}
                                style={styles.textAreaInput}
                            />
                        </div>

                        {/* แนบรูปภาพหลักฐาน (อยู่ล่างสุด แสดงเป็นชื่อไฟล์แทนภาพใหญ่) */}
                        <div style={{ marginBottom: "20px", textAlign: "left" }}>
                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>
                                แนบรูปภาพหลักฐาน (ถ้ามี)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                id="reportImageInput"
                                onChange={handleReportImageChange}
                                style={{ display: "none" }}
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <label htmlFor="reportImageInput" style={styles.uploadFileBtn}>
                                    <i className="material-icons-outlined" style={{ fontSize: "16px" }}>attach_file</i>
                                    {reportImage ? "เปลี่ยนไฟล์" : "เลือกไฟล์รูปภาพ"}
                                </label>
                                {reportImage && (
                                    <div style={styles.fileInfoRow}>
                                        <a
                                            href={reportImagePreview}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={styles.fileNameLink}
                                            title="คลิกเพื่อดูรูปภาพเต็ม"
                                        >
                                            {reportImage.name}
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => { setReportImage(null); setReportImagePreview(null); }}
                                            style={styles.removeFileBtn}
                                            title="ลบไฟล์รูปภาพ"
                                        >
                                            <i className="material-icons-outlined" style={{ fontSize: "12px", lineHeight: 1 }}>close</i>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button style={styles.cancelBtn} onClick={() => setShowReportModal(false)}>
                                ยกเลิก
                            </button>
                            <button
                                style={{ ...styles.confirmBtn, backgroundColor: "#f43f5e" }}
                                onClick={handleSubmitReport}
                                disabled={submittingReport}
                            >
                                {submittingReport ? "กำลังส่ง..." : "ส่งรายงาน"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Alert Modal */}
            {alertModal.show && (
                <div style={styles.centerModalBackdrop} onClick={() => setAlertModal(prev => ({ ...prev, show: false }))}>
                    <div style={styles.centerModalCard} onClick={(e) => e.stopPropagation()}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{
                                ...styles.modalHeaderIcon,
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
                                        style={styles.cancelBtn}
                                        onClick={() => setAlertModal(prev => ({ ...prev, show: false }))}
                                    >
                                        {alertModal.cancelText}
                                    </button>
                                )}
                                <button
                                    style={{
                                        ...styles.confirmBtn,
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

const styles = {
    pageBg: {
        background: "linear-gradient(135deg, #faf5ff 0%, #f0f9ff 50%, #f0fdf4 100%)",
        minHeight: "100vh",
        paddingBottom: "50px"
    },
    topBarWrapper: {
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #f1f5f9",
        position: "sticky",
        top: 0,
        zIndex: 10,
        maxWidth: "1080px",
        margin: "0 auto",
        borderRadius: "0 0 20px 20px",
        boxShadow: "0 4px 12px rgba(192, 132, 252, 0.05)",
        boxSizing: "border-box"
    },
    topBar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        maxWidth: "1080px",
        margin: "0 auto",
        boxSizing: "border-box"
    },
    backBtn: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        border: "1px solid #e2e8f0",
        backgroundColor: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer"
    },
    topTitle: {
        margin: 0,
        fontSize: "18px",
        fontWeight: "700",
        color: "#334155"
    },
    container: {
        maxWidth: "1080px",
        margin: "28px auto 0 auto",
        padding: "0 20px",
        boxSizing: "border-box"
    },
    layoutGrid: {
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: "24px",
        alignItems: "start"
    },
    sidebarColumn: {
        position: "sticky",
        top: "88px"
    },
    mainContentColumn: {
        display: "flex",
        flexDirection: "column",
        gap: "20px"
    },
    stickyCard: {
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "24px",
        border: "1px solid #f1f5f9",
        boxShadow: "0 10px 25px -5px rgba(192, 132, 252, 0.08)",
        boxSizing: "border-box"
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "24px",
        border: "1px solid #f1f5f9",
        boxShadow: "0 4px 16px rgba(192, 132, 252, 0.05)",
        boxSizing: "border-box"
    },
    codeHighlightBox: {
        backgroundColor: "#faf5ff",
        border: "1px solid #e9d5ff",
        borderRadius: "16px",
        padding: "16px",
        textAlign: "center",
        marginBottom: "16px"
    },
    largeCodeBadge: {
        fontSize: "20px",
        fontWeight: "800",
        color: "#9333ea",
        fontFamily: "monospace",
        letterSpacing: "1px"
    },
    sidebarInfoBox: {
        backgroundColor: "#f8fafc",
        padding: "12px 16px",
        borderRadius: "14px",
        marginBottom: "12px",
        border: "1px solid #f1f5f9"
    },
    cardTitle: {
        margin: "0 0 12px 0",
        fontSize: "15px",
        fontWeight: "700",
        color: "#334155",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    label: {
        fontSize: "11px",
        color: "#94a3b8",
        display: "block"
    },
    statusBadge: {
        padding: "6px 14px",
        borderRadius: "14px",
        fontSize: "13px",
        fontWeight: "700",
        display: "inline-block"
    },
    divider: {
        height: "1px",
        backgroundColor: "#f1f5f9",
        margin: "16px 0"
    },
    foodImage: {
        width: "90px",
        height: "90px",
        borderRadius: "16px",
        objectFit: "cover",
        border: "1px solid #f1f5f9"
    },
    categoryChip: {
        fontSize: "10px",
        fontWeight: "600",
        color: "#c084fc",
        backgroundColor: "#faf5ff",
        padding: "2px 8px",
        borderRadius: "6px",
        border: "1px solid #f3e8ff",
        display: "inline-block"
    },
    alertBox: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backgroundColor: "#fff1f2",
        padding: "10px 14px",
        borderRadius: "14px",
        border: "1px solid #fecdd3"
    },
    avatar: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "#faf5ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #f3e8ff"
    },
    callBtn: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        backgroundColor: "#f0fdf4",
        color: "#16a34a",
        border: "1px solid #bbf7d0",
        padding: "8px 14px",
        borderRadius: "12px",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: "600"
    },
    mapNavBtn: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        width: "100%",
        padding: "10px",
        backgroundColor: "#f0f9ff",
        color: "#0284c7",
        border: "1px solid #bae6fd",
        borderRadius: "14px",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: "600",
        boxSizing: "border-box"
    },
    cancelBookingBtn: {
        width: "100%",
        padding: "12px",
        borderRadius: "14px",
        backgroundColor: "#ffffff",
        color: "#f43f5e",
        border: "1.5px solid #fecdd3",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer"
    },
    primaryBtn: {
        width: "100%",
        padding: "12px",
        borderRadius: "14px",
        backgroundColor: "#c084fc",
        color: "#ffffff",
        border: "none",
        fontSize: "14px",
        fontWeight: "700",
        cursor: "pointer",
        boxShadow: "0 4px 14px rgba(192, 132, 252, 0.35)"
    },
    reportBtn: {
        width: "100%",
        padding: "12px",
        borderRadius: "14px",
        backgroundColor: "#fff1f2",
        color: "#e11d48",
        border: "1px solid #fecdd3",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px"
    },
    secondaryBtn: {
        width: "100%",
        padding: "12px",
        borderRadius: "14px",
        backgroundColor: "#f8fafc",
        color: "#64748b",
        border: "1px solid #e2e8f0",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer"
    },
    selectInput: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: "12px",
        border: "1px solid #cbd5e1",
        backgroundColor: "#f8fafc",
        fontSize: "13px",
        color: "#334155",
        boxSizing: "border-box",
    },
    textAreaInput: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: "12px",
        border: "1px solid #cbd5e1",
        backgroundColor: "#f8fafc",
        fontSize: "13px",
        color: "#334155",
        boxSizing: "border-box",
        resize: "vertical",
    },
    uploadFileBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 14px",
        borderRadius: "10px",
        border: "1px solid #f43f5e",
        backgroundColor: "#fff1f2",
        color: "#f43f5e",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
    fileInfoRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flex: 1,
        padding: "6px 10px",
        borderRadius: "10px",
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
    },
    fileNameLink: {
        fontSize: "12px",
        color: "#0284c7",
        textDecoration: "underline",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "180px",
        cursor: "pointer",
    },
    removeFileBtn: {
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        backgroundColor: "#fee2e2",
        color: "#ef4444",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        padding: 0,
    },
    loading: {
        textAlign: "center",
        padding: "100px 20px",
        color: "#c084fc",
        fontSize: "16px",
        fontFamily: "'Prompt', sans-serif"
    },
    errorContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        padding: "20px"
    },
    errorIconBox: {
        width: "70px",
        height: "70px",
        borderRadius: "50%",
        backgroundColor: "#fff1f2",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #fecdd3"
    },
    centerModalBackdrop: {
        position: "fixed", inset: 0, zIndex: 999,
        backgroundColor: "rgba(51, 65, 85, 0.45)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px"
    },
    centerModalCard: {
        width: "100%", maxWidth: "380px", backgroundColor: "#ffffff",
        borderRadius: "28px", padding: "28px",
        boxShadow: "0 20px 50px rgba(192, 132, 252, 0.25)",
        border: "1px solid rgba(243, 232, 255, 0.8)"
    },
    modalHeaderIcon: {
        width: "60px", height: "60px", borderRadius: "50%",
        display: "inline-flex", alignItems: "center", justifyContent: "center"
    },
    cancelBtn: {
        flex: 1, padding: "12px", borderRadius: "14px",
        border: "1.5px solid #cbd5e1", backgroundColor: "#ffffff",
        color: "#64748b", fontWeight: "600", cursor: "pointer",
    },
    confirmBtn: {
        flex: 1.5, padding: "12px", borderRadius: "14px",
        border: "none", backgroundColor: "#c084fc",
        color: "#ffffff", fontWeight: "700", cursor: "pointer",
    }
};