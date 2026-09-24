// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams, useLocation } from "react-router-dom";
// import { jwtDecode } from 'jwt-decode';

// export default function BookingDetail() {
//     const { bookingId: paramBookingId } = useParams();
//     const location = useLocation();
//     const navigate = useNavigate();

//     // รับ bookingId จาก URL param หรือ location.state
//     const bookingId = paramBookingId || location.state?.id;

//     const [booking, setBooking] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [submitting, setSubmitting] = useState(false);

//     // Alert Modal State (Custom Popup)
//     const [alertModal, setAlertModal] = useState({
//         show: false,
//         title: "",
//         message: "",
//         type: "info", // "info" | "success" | "error"
//         confirmText: "ตกลง",
//         cancelText: null,
//         onConfirm: null
//     });

//     const BASE_URL = "http://localhost:8082";

//     const fetchBookingDetail = () => {
//         const token = localStorage.getItem("accessToken");
//         if (!token) {
//             navigate("/login");
//             return;
//         }

//         setLoading(true);
//         fetch(`${BASE_URL}/bookings/${bookingId}`, {
//             headers: { Authorization: `Bearer ${token}` }
//         })
//             .then((res) => res.json())
//             .then((resData) => {
//                 if (resData.success) {
//                     setBooking(resData.data);
//                 } else {
//                     showAlert("เกิดข้อผิดพลาด", resData.message || "ไม่พบข้อมูลการจอง", "error", () => navigate(-1));
//                 }
//             })
//             .catch(() => {
//                 showAlert("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error", () => navigate(-1));
//             })
//             .finally(() => setLoading(false));
//     };

//     useEffect(() => {
//         if (bookingId) {
//             fetchBookingDetail();
//         } else {
//             setLoading(false);
//         }
//     }, [bookingId]);

//     const showAlert = (title, message, type = "info", onConfirm = null, cancelText = null) => {
//         setAlertModal({
//             show: true,
//             title,
//             message,
//             type,
//             confirmText: "ตกลง",
//             cancelText,
//             onConfirm
//         });
//     };

//     // ฟังก์ชันยกเลิกการจอง
//     const handleCancelBooking = () => {
//         showAlert(
//             "ยืนยันการยกเลิก",
//             "คุณต้องการยกเลิกการจองรายการนี้ใช่หรือไม่?",
//             "error",
//             () => {
//                 const token = localStorage.getItem("accessToken");
//                 setSubmitting(true);
//                 fetch(`${BASE_URL}/bookings/${bookingId}/cancel`, {
//                     method: "PATCH",
//                     headers: { Authorization: `Bearer ${token}` }
//                 })
//                     .then((res) => res.json())
//                     .then((resData) => {
//                         if (resData.success) {
//                             showAlert("ยกเลิกสำเร็จ", "ยกเลิกรายการจองเรียบร้อยแล้ว", "success", () => {
//                                 fetchBookingDetail();
//                             });
//                         } else {
//                             showAlert("เกิดข้อผิดพลาด", resData.message || "ไม่สามารถยกเลิกได้", "error");
//                         }
//                     })
//                     .catch(() => showAlert("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error"))
//                     .finally(() => setSubmitting(false));
//             },
//             "ยกเลิก"
//         );
//     };

//     const formatDate = (dateString) => {
//         if (!dateString) return "-";
//         const date = new Date(dateString);
//         return `${date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })} เวลา ${date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`;
//     };

//     if (loading) return <div style={styles.loading}>กำลังโหลดข้อมูลการจอง...</div>;

//     if (!booking) return (
//         <div style={{ ...styles.loading, color: "#f43f5e" }}>
//             ไม่พบข้อมูลการจอง
//             <button style={{ ...styles.cancelBtn, marginTop: "16px" }} onClick={() => navigate(-1)}>กลับ</button>
//         </div>
//     );

//     const isPending = booking.status === "pending" || booking.status === "BOOKED";
//     const isCompleted = booking.status === "cancelled" || booking.status === "RECEIVED";
//     const isCancelled = booking.status === "cancelled";

//     const googleMapEmbedUrl = booking.latitude && booking.longitude
//         ? `https://maps.google.com/maps?q=${booking.latitude},${booking.longitude}&z=16&output=embed`
//         : null;

//     const directMapUrl = booking.latitude && booking.longitude
//         ? `https://www.google.com/maps/search/?api=1&query=${booking.latitude},${booking.longitude}`
//         : null;

//     return (
//         <div style={styles.pageBg}>
//             {/* Top Navigation */}
//             <div style={styles.topBar}>
//                 <button style={styles.backBtn} onClick={() => navigate(-1)}>
//                     <i className="material-icons-outlined" style={{ color: "#334155" }}>arrow_back</i>
//                 </button>
//                 <h2 style={styles.topTitle}>รายละเอียดการจอง</h2>
//                 <div style={{ width: "40px" }} />
//             </div>

//             <div style={styles.container}>

//                 {/* 1. Status Card */}
//                 <div style={styles.card}>
//                     <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", gap: "12px" }}>
//                         <div style={{ flex: 1 }}>
//                             <span style={styles.label}>สถานะการจอง</span>
//                             <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
//                                 <span style={{
//                                     ...styles.statusBadge,
//                                     backgroundColor: isPending ? "#fef3c7" : isCompleted ? "#dcfce7" : "#ffe4e6",
//                                     color: isPending ? "#d97706" : isCompleted ? "#15803d" : "#e11d48",
//                                     border: isPending ? "1px solid #fde68a" : isCompleted ? "1px solid #bbf7d0" : "1px solid #fecdd3"
//                                 }}>
//                                     {isPending ? "รอการรับอาหาร" : isCompleted ? "รับอาหารเรียบร้อย" : "ยกเลิกแล้ว"}
//                                 </span>
//                             </div>
//                         </div>
//                         <div style={{ textAlign: "right" }}>
//                             <span style={styles.label}>รหัสการจอง</span>
//                             <div style={{ fontSize: "14px", fontWeight: "700", color: "#334155", fontFamily: "monospace" }}>
//                                 #{booking.bookingCode || booking.id}
//                             </div>
//                         </div>
//                     </div>

//                     <div style={styles.divider} />

//                     <div style={{ fontSize: "12px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
//                         <span>วันที่ทำรายการ:</span>
//                         <span style={{ fontWeight: "500", color: "#334155" }}>{formatDate(booking.createdAt || booking.bookingDate)}</span>
//                     </div>
//                 </div>

//                 {/* 2. Food Summary Card */}
//                 <div style={styles.card}>
//                     <h3 style={styles.cardTitle}>
//                         <i className="material-icons-outlined" style={{ color: "#c084fc" }}>restaurant</i>
//                         รายการอาหารที่จอง
//                     </h3>

//                     <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
//                         <img
//                             src={booking.foodImage ? `${BASE_URL}${booking.foodImage}` : "https://placehold.co/200x200?text=No+Image"}
//                             alt={booking.foodName}
//                             style={styles.foodImage}
//                             onError={(e) => { e.target.src = "https://placehold.co/200x200?text=No+Image"; }}
//                         />
//                         <div style={{ flex: 1 }}>
//                             <span style={styles.categoryChip}>{booking.foodCateName || "อาหารทั่วไป"}</span>
//                             <h4 style={{ margin: "4px 0 6px 0", fontSize: "16px", color: "#334155", fontWeight: "700" }}>
//                                 {booking.foodName}
//                             </h4>
//                             <div style={{ fontSize: "13px", color: "#64748b" }}>
//                                 จำนวนที่จอง: <span style={{ fontWeight: "700", color: "#c084fc", fontSize: "15px" }}>{booking.quantity || 1}</span> ชิ้น
//                             </div>
//                             {booking.unitWeightKg && (
//                                 <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
//                                     น้ำหนักรวมประมาณ: {(booking.unitWeightKg * (booking.quantity || 1)).toFixed(2)} Kg
//                                 </div>
//                             )}
//                         </div>
//                     </div>

//                     <div style={{ ...styles.infoBox, marginTop: "16px" }}>
//                         <i className="material-icons-outlined" style={{ color: "#f472b6", fontSize: "20px" }}>schedule</i>
//                         <div>
//                             <div style={{ fontSize: "11px", color: "#64748b" }}>ควรไปรับก่อนเวลา (หมดอายุ)</div>
//                             <div style={{ fontSize: "13px", fontWeight: "600", color: "#e11d48" }}>
//                                 {formatDate(booking.expiryDate)}
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* 3. Donor Contact Card */}
//                 <div style={styles.card}>
//                     <h3 style={styles.cardTitle}>
//                         <i className="material-icons-outlined" style={{ color: "#c084fc" }}>person</i>
//                         ข้อมูลผู้บริจาค
//                     </h3>

//                     <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", gap: "12px", marginTop: "12px" }}>
//                         <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//                             <div style={styles.avatar}>
//                                 <i className="material-icons-outlined" style={{ color: "#c084fc" }}>person</i>
//                             </div>
//                             <div>
//                                 <div style={{ fontWeight: "700", fontSize: "14px", color: "#334155" }}>
//                                     {booking.donorName || "ผู้บริจาคใจดี"}
//                                 </div>
//                                 <div style={{ fontSize: "12px", color: "#64748b" }}>
//                                     {booking.donorPhone || "ไม่มีเบอร์ติดต่อ"}
//                                 </div>
//                             </div>
//                         </div>

//                         {booking.donorPhone && (
//                             <a href={`tel:${booking.donorPhone}`} style={styles.callBtn}>
//                                 <i className="material-icons-outlined" style={{ fontSize: "18px" }}>call</i>
//                                 โทรออก
//                             </a>
//                         )}
//                     </div>
//                 </div>

//                 {/* 4. Pickup Location & Map Card */}
//                 <div style={styles.card}>
//                     <h3 style={styles.cardTitle}>
//                         <i className="material-icons-outlined" style={{ color: "#38bdf8" }}>location_on</i>
//                         สถานที่รับอาหาร
//                     </h3>

//                     <p style={{ fontSize: "13px", color: "#475569", margin: "8px 0 12px 0", lineHeight: "1.5" }}>
//                         {booking.address || "ไม่ระบุที่อยู่"}
//                     </p>

//                     {googleMapEmbedUrl && (
//                         <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #f1f5f9", marginBottom: "12px" }}>
//                             <iframe
//                                 title="pickup-map"
//                                 width="100%"
//                                 height="180"
//                                 style={{ border: 0 }}
//                                 src={googleMapEmbedUrl}
//                             ></iframe>
//                         </div>
//                     )}

//                     {directMapUrl && (
//                         <a href={directMapUrl} target="_blank" rel="noopener noreferrer" style={styles.mapNavBtn}>
//                             <i className="material-icons-outlined" style={{ fontSize: "18px" }}>near_me</i>
//                             นำทางด้วย Google Maps
//                         </a>
//                     )}
//                 </div>

//                 {/* Action Buttons */}
//                 <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
//                     {isPending && (
//                         <button
//                             onClick={handleCancelBooking}
//                             disabled={submitting}
//                             style={styles.cancelBookingBtn}
//                         >
//                             {submitting ? "กำลังทำรายการ..." : "ยกเลิกการจองนี้"}
//                         </button>
//                     )}

//                     {isCompleted && (
//                         <button
//                             onClick={() => navigate(`/review/${bookingId}`, { state: { booking } })}
//                             style={styles.primaryBtn}
//                         >
//                             ให้คะแนนและรีวิว
//                         </button>
//                     )}

//                     <button onClick={() => navigate('/receive')} style={styles.secondaryBtn}>
//                         กลับไปหน้ารายการจองทั้งหมด
//                     </button>
//                 </div>

//             </div>

//             {/* Custom Alert Modal */}
//             {alertModal.show && (
//                 <div style={styles.centerModalBackdrop} onClick={() => setAlertModal(prev => ({ ...prev, show: false }))}>
//                     <div style={styles.centerModalCard} onClick={(e) => e.stopPropagation()}>
//                         <div style={{ textAlign: "center" }}>
//                             <div style={{
//                                 ...styles.modalHeaderIcon,
//                                 backgroundColor: alertModal.type === 'success' ? '#f0fdf4' : alertModal.type === 'error' ? '#fff1f2' : '#faf5ff',
//                                 border: alertModal.type === 'success' ? '1px solid #bbf7d0' : alertModal.type === 'error' ? '1px solid #fecdd3' : '1px solid #f3e8ff'
//                             }}>
//                                 <i className="material-icons-outlined" style={{
//                                     fontSize: "32px",
//                                     color: alertModal.type === 'success' ? '#10b981' : alertModal.type === 'error' ? '#f43f5e' : '#c084fc'
//                                 }}>
//                                     {alertModal.type === 'success' ? 'check_circle' : alertModal.type === 'error' ? 'error_outline' : 'info'}
//                                 </i>
//                             </div>

//                             <h3 style={{ margin: "16px 0 8px 0", fontSize: "20px", color: "#334155", fontWeight: "700" }}>
//                                 {alertModal.title}
//                             </h3>
//                             <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
//                                 {alertModal.message}
//                             </p>

//                             <div style={{ display: "flex", gap: "12px" }}>
//                                 {alertModal.cancelText && (
//                                     <button
//                                         style={styles.cancelBtn}
//                                         onClick={() => setAlertModal(prev => ({ ...prev, show: false }))}
//                                     >
//                                         {alertModal.cancelText}
//                                     </button>
//                                 )}
//                                 <button
//                                     style={{
//                                         ...styles.confirmBtn,
//                                         backgroundColor: alertModal.type === 'error' ? '#f43f5e' : '#c084fc',
//                                     }}
//                                     onClick={() => {
//                                         const action = alertModal.onConfirm;
//                                         setAlertModal(prev => ({ ...prev, show: false }));
//                                         if (action) action();
//                                     }}
//                                 >
//                                     {alertModal.confirmText}
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// const styles = {
//     pageBg: {
//         background: "linear-gradient(135deg, #faf5ff 0%, #f0f9ff 50%, #f0fdf4 100%)",
//         minHeight: "100vh",
//         fontFamily: "'Prompt', sans-serif",
//         paddingBottom: "40px"
//     },
//     topBar: {
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "space-between",
//         padding: "16px 20px",
//         backgroundColor: "#ffffff",
//         borderBottom: "1px solid #f1f5f9",
//         sticky: "top",
//         zIndex: 10
//     },
//     backBtn: {
//         width: "40px",
//         height: "40px",
//         borderRadius: "50%",
//         border: "none",
//         backgroundColor: "#f8fafc",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         cursor: "pointer"
//     },
//     topTitle: {
//         margin: 0,
//         fontSize: "18px",
//         fontWeight: "700",
//         color: "#334155"
//     },
//     container: {
//         maxWidth: "600px",
//         margin: "20px auto 0 auto",
//         padding: "0 16px"
//     },
//     card: {
//         backgroundColor: "#ffffff",
//         borderRadius: "20px",
//         padding: "20px",
//         marginBottom: "16px",
//         border: "1px solid #f1f5f9",
//         boxShadow: "0 4px 12px rgba(192, 132, 252, 0.05)"
//     },
//     cardTitle: {
//         margin: "0 0 12px 0",
//         fontSize: "15px",
//         fontWeight: "700",
//         color: "#334155",
//         display: "flex",
//         alignItems: "center",
//         gap: "6px"
//     },
//     label: {
//         fontSize: "11px",
//         color: "#94a3b8",
//         display: "block"
//     },
//     statusBadge: {
//         padding: "4px 12px",
//         borderRadius: "12px",
//         fontSize: "12px",
//         fontWeight: "700",
//         display: "inline-block"
//     },
//     divider: {
//         height: "1px",
//         backgroundColor: "#f1f5f9",
//         margin: "14px 0"
//     },
//     foodImage: {
//         width: "80px",
//         height: "80px",
//         borderRadius: "16px",
//         objectFit: "cover",
//         border: "1px solid #f1f5f9"
//     },
//     categoryChip: {
//         fontSize: "10px",
//         fontWeight: "600",
//         color: "#c084fc",
//         backgroundColor: "#faf5ff",
//         padding: "2px 8px",
//         borderRadius: "6px",
//         border: "1px solid #f3e8ff",
//         display: "inline-block"
//     },
//     infoBox: {
//         display: "flex",
//         alignItems: "center",
//         gap: "10px",
//         backgroundColor: "#fff1f2",
//         padding: "10px 14px",
//         borderRadius: "14px",
//         border: "1px solid #fecdd3"
//     },
//     avatar: {
//         width: "40px",
//         height: "40px",
//         borderRadius: "50%",
//         backgroundColor: "#faf5ff",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         border: "1px solid #f3e8ff"
//     },
//     callBtn: {
//         display: "flex",
//         alignItems: "center",
//         gap: "4px",
//         backgroundColor: "#f0fdf4",
//         color: "#16a34a",
//         border: "1px solid #bbf7d0",
//         padding: "8px 14px",
//         borderRadius: "12px",
//         textDecoration: "none",
//         fontSize: "13px",
//         fontWeight: "600"
//     },
//     mapNavBtn: {
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         gap: "6px",
//         width: "100%",
//         padding: "12px",
//         backgroundColor: "#f0f9ff",
//         color: "#0284c7",
//         border: "1px solid #bae6fd",
//         borderRadius: "14px",
//         textDecoration: "none",
//         fontSize: "13px",
//         fontWeight: "600",
//         boxSizing: "border-box"
//     },
//     cancelBookingBtn: {
//         width: "100%",
//         padding: "14px",
//         borderRadius: "16px",
//         backgroundColor: "#ffffff",
//         color: "#f43f5e",
//         border: "1.5px solid #fecdd3",
//         fontSize: "15px",
//         fontWeight: "600",
//         cursor: "pointer"
//     },
//     primaryBtn: {
//         width: "100%",
//         padding: "14px",
//         borderRadius: "16px",
//         backgroundColor: "#c084fc",
//         color: "#ffffff",
//         border: "none",
//         fontSize: "15px",
//         fontWeight: "700",
//         cursor: "pointer",
//         boxShadow: "0 4px 14px rgba(192, 132, 252, 0.35)"
//     },
//     secondaryBtn: {
//         width: "100%",
//         padding: "14px",
//         borderRadius: "16px",
//         backgroundColor: "#ffffff",
//         color: "#64748b",
//         border: "1px solid #e2e8f0",
//         fontSize: "14px",
//         fontWeight: "600",
//         cursor: "pointer"
//     },
//     loading: {
//         textAlign: "center",
//         padding: "100px 20px",
//         color: "#c084fc",
//         fontSize: "16px"
//     },
//     centerModalBackdrop: {
//         position: "fixed", inset: 0, zIndex: 999,
//         backgroundColor: "rgba(51, 65, 85, 0.45)", backdropFilter: "blur(8px)",
//         display: "flex", alignItems: "center", justifyContent: "center",
//         padding: "16px"
//     },
//     centerModalCard: {
//         width: "100%", maxWidth: "380px", backgroundColor: "#ffffff",
//         borderRadius: "28px", padding: "28px",
//         boxShadow: "0 20px 50px rgba(192, 132, 252, 0.25)",
//         border: "1px solid rgba(243, 232, 255, 0.8)"
//     },
//     modalHeaderIcon: {
//         width: "60px", height: "60px", borderRadius: "50%",
//         display: "inline-flex", alignItems: "center", justifyContent: "center"
//     },
//     cancelBtn: {
//         flex: 1, padding: "12px", borderRadius: "14px",
//         border: "1.5px solid #cbd5e1", backgroundColor: "#ffffff",
//         color: "#64748b", fontWeight: "600", cursor: "pointer"
//     },
//     confirmBtn: {
//         flex: 1.5, padding: "12px", borderRadius: "14px",
//         border: "none", backgroundColor: "#c084fc",
//         color: "#ffffff", fontWeight: "700", cursor: "pointer"
//     }
// };
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

export default function BookingDetail() {
    const { bookingId: paramBookingId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const bookingId = paramBookingId || location.state?.id || "BK-882914";

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

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

    // ข้อมูลสมมติสำหรับการแสดงผล UI
    const mockData = {
        id: "BK-882914",
        bookingCode: "BK-882914",
        status: "pending", // ตัวเลือกทดสอบ: "pending", "RECEIVED", "cancelled"
        createdAt: new Date().toISOString(),
        foodName: "ข้าวผัดกะเพราไก่ไข่ดาว (กล่อง)",
        foodCateName: "อาหารพร้อมรับประทาน",
        foodImage: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60",
        quantity: 2,
        unitWeightKg: 0.35,
        expiryDate: new Date(Date.now() + 3600000 * 4).toISOString(), // หมดอายุในอีก 4 ชั่วโมง
        donorName: "ร้านอาหารใจดี (คุณสมชาย)",
        donorPhone: "0812345678",
        address: "123/45 ถนนมิตรภาพ ต.ในเมือง อ.เมือง จ.พิษณุโลก 65000 (ใกล้กับหอนักศึกษา)",
        latitude: 16.8211,
        longitude: 100.2659
    };

    const fetchBookingDetail = () => {
        setLoading(true);
        // จำลองการโหลดข้อมูล 500ms
        setTimeout(() => {
            setBooking(mockData);
            setLoading(false);
        }, 500);
    };

    useEffect(() => {
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

    // ฟังก์ชันยกเลิกการจอง (จำลองการทำงาน)
    const handleCancelBooking = () => {
        showAlert(
            "ยืนยันการยกเลิก",
            "คุณต้องการยกเลิกการจองรายการนี้ใช่หรือไม่?",
            "error",
            () => {
                setSubmitting(true);
                setTimeout(() => {
                    setBooking(prev => ({ ...prev, status: "cancelled" }));
                    setSubmitting(false);
                    showAlert("ยกเลิกสำเร็จ", "ยกเลิกรายการจองเรียบร้อยแล้ว", "success");
                }, 800);
            },
            "ยกเลิก"
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return `${date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })} เวลา ${date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`;
    };

    if (loading) return <div style={styles.loading}>กำลังโหลดข้อมูลการจอง...</div>;

    if (!booking) return (
        <div style={{ ...styles.loading, color: "#f43f5e" }}>
            ไม่พบข้อมูลการจอง
            <button style={{ ...styles.cancelBtn, marginTop: "16px" }} onClick={() => navigate(-1)}>กลับ</button>
        </div>
    );

    const isPending = booking.status === "pending" || booking.status === "BOOKED";
    const isCompleted = booking.status === "cancelled" || booking.status === "RECEIVED";

    const googleMapEmbedUrl = booking.latitude && booking.longitude
        ? `https://maps.google.com/maps?q=${booking.latitude},${booking.longitude}&z=16&output=embed`
        : null;

    const directMapUrl = booking.latitude && booking.longitude
        ? `https://www.google.com/maps/search/?api=1&query=${booking.latitude},${booking.longitude}`
        : null;

    return (
        <div style={styles.pageBg}>
            {/* Top Navigation */}
            <div style={styles.topBar}>
                <button style={styles.backBtn} onClick={() => navigate(-1)}>
                    <i className="material-icons-outlined" style={{ color: "#334155" }}>arrow_back</i>
                </button>
                <h2 style={styles.topTitle}>รายละเอียดการจอง</h2>
                <div style={{ width: "40px" }} />
            </div>

            <div style={styles.container}>

                {/* 1. Status Card */}
                <div style={styles.card}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ flex: 1 }}>
                            <span style={styles.label}>สถานะการจอง</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                                <span style={{
                                    ...styles.statusBadge,
                                    backgroundColor: isPending ? "#fef3c7" : booking.status === "RECEIVED" ? "#dcfce7" : "#ffe4e6",
                                    color: isPending ? "#d97706" : booking.status === "RECEIVED" ? "#15803d" : "#e11d48",
                                    border: isPending ? "1px solid #fde68a" : booking.status === "RECEIVED" ? "1px solid #bbf7d0" : "1px solid #fecdd3"
                                }}>
                                    {isPending ? "รอการรับอาหาร" : booking.status === "RECEIVED" ? "รับอาหารเรียบร้อย" : "ยกเลิกแล้ว"}
                                </span>
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <span style={styles.label}>รหัสการจอง</span>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#334155", fontFamily: "monospace" }}>
                                #{booking.bookingCode || booking.id}
                            </div>
                        </div>
                    </div>

                    <div style={styles.divider} />

                    <div style={{ fontSize: "12px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                        <span>วันที่ทำรายการ:</span>
                        <span style={{ fontWeight: "500", color: "#334155" }}>{formatDate(booking.createdAt || booking.bookingDate)}</span>
                    </div>
                </div>

                {/* 2. Food Summary Card */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>
                        <i className="material-icons-outlined" style={{ color: "#c084fc" }}>restaurant</i>
                        รายการอาหารที่จอง
                    </h3>

                    <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                        <img
                            src={booking.foodImage}
                            alt={booking.foodName}
                            style={styles.foodImage}
                            onError={(e) => { e.target.src = "https://placehold.co/200x200?text=No+Image"; }}
                        />
                        <div style={{ flex: 1 }}>
                            <span style={styles.categoryChip}>{booking.foodCateName || "อาหารทั่วไป"}</span>
                            <h4 style={{ margin: "4px 0 6px 0", fontSize: "16px", color: "#334155", fontWeight: "700" }}>
                                {booking.foodName}
                            </h4>
                            <div style={{ fontSize: "13px", color: "#64748b" }}>
                                จำนวนที่จอง: <span style={{ fontWeight: "700", color: "#c084fc", fontSize: "15px" }}>{booking.quantity || 1}</span> ชิ้น
                            </div>
                            {booking.unitWeightKg && (
                                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                                    น้ำหนักรวมประมาณ: {(booking.unitWeightKg * (booking.quantity || 1)).toFixed(2)} Kg
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ ...styles.infoBox, marginTop: "16px" }}>
                        <i className="material-icons-outlined" style={{ color: "#f472b6", fontSize: "20px" }}>schedule</i>
                        <div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>ควรไปรับก่อนเวลา (หมดอายุ)</div>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: "#e11d48" }}>
                                {formatDate(booking.expiryDate)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Donor Contact Card */}
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
                                    {booking.donorName || "ผู้บริจาคใจดี"}
                                </div>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>
                                    {booking.donorPhone || "ไม่มีเบอร์ติดต่อ"}
                                </div>
                            </div>
                        </div>

                        {booking.donorPhone && (
                            <a href={`tel:${booking.donorPhone}`} style={styles.callBtn}>
                                <i className="material-icons-outlined" style={{ fontSize: "18px" }}>call</i>
                                โทรออก
                            </a>
                        )}
                    </div>
                </div>

                {/* 4. Pickup Location & Map Card */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>
                        <i className="material-icons-outlined" style={{ color: "#38bdf8" }}>location_on</i>
                        สถานที่รับอาหาร
                    </h3>

                    <p style={{ fontSize: "13px", color: "#475569", margin: "8px 0 12px 0", lineHeight: "1.5" }}>
                        {booking.address || "ไม่ระบุที่อยู่"}
                    </p>

                    {googleMapEmbedUrl && (
                        <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #f1f5f9", marginBottom: "12px" }}>
                            <iframe
                                title="pickup-map"
                                width="100%"
                                height="180"
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

                {/* Action Buttons */}
                <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {isPending && (
                        <button
                            onClick={handleCancelBooking}
                            disabled={submitting}
                            style={styles.cancelBookingBtn}
                        >
                            {submitting ? "กำลังทำรายการ..." : "ยกเลิกการจองนี้"}
                        </button>
                    )}

                    {booking.status === "RECEIVED" && (
                        <button
                            onClick={() => navigate(`/review/${bookingId}`, { state: { booking } })}
                            style={styles.primaryBtn}
                        >
                            ให้คะแนนและรีวิว
                        </button>
                    )}

                    <button onClick={() => navigate('/receive')} style={styles.secondaryBtn}>
                        กลับไปหน้ารายการจองทั้งหมด
                    </button>
                </div>

            </div>

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
        fontFamily: "'Prompt', sans-serif",
        paddingBottom: "40px"
    },
    topBar: {
        display: "flex",
        alignItems: "center",
        justifyBetween: "space-between",
        padding: "16px 20px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #f1f5f9",
        sticky: "top",
        zIndex: 10
    },
    backBtn: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        border: "none",
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
        maxWidth: "600px",
        margin: "20px auto 0 auto",
        padding: "0 16px"
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        padding: "20px",
        marginBottom: "16px",
        border: "1px solid #f1f5f9",
        boxShadow: "0 4px 12px rgba(192, 132, 252, 0.05)"
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
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "700",
        display: "inline-block"
    },
    divider: {
        height: "1px",
        backgroundColor: "#f1f5f9",
        margin: "14px 0"
    },
    foodImage: {
        width: "80px",
        height: "80px",
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
    infoBox: {
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
        padding: "12px",
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
        padding: "14px",
        borderRadius: "16px",
        backgroundColor: "#ffffff",
        color: "#f43f5e",
        border: "1.5px solid #fecdd3",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer"
    },
    primaryBtn: {
        width: "100%",
        padding: "14px",
        borderRadius: "16px",
        backgroundColor: "#c084fc",
        color: "#ffffff",
        border: "none",
        fontSize: "15px",
        fontWeight: "700",
        cursor: "pointer",
        boxShadow: "0 4px 14px rgba(192, 132, 252, 0.35)"
    },
    secondaryBtn: {
        width: "100%",
        padding: "14px",
        borderRadius: "16px",
        backgroundColor: "#ffffff",
        color: "#64748b",
        border: "1px solid #e2e8f0",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer"
    },
    loading: {
        textAlign: "center",
        padding: "100px 20px",
        color: "#c084fc",
        fontSize: "16px"
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
        color: "#64748b", fontWeight: "600", cursor: "pointer"
    },
    confirmBtn: {
        flex: 1.5, padding: "12px", borderRadius: "14px",
        border: "none", backgroundColor: "#c084fc",
        color: "#ffffff", fontWeight: "700", cursor: "pointer"
    }
};