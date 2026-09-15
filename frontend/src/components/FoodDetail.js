import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import Swal from "sweetalert2";
import { jwtDecode } from 'jwt-decode';

export default function FoodDetail() {
    const location = useLocation();
    const { fromPage, bookingStatus } = location.state || {};
    const incomingId = location.state?.id;
    const navigate = useNavigate();

    const [userId, setUserId] = useState(null);
    const [food, setFood] = useState(null);
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );

    const isOwner = food && food.donorId && String(food.donorId) === String(userId);
    const BASE_URL = "http://localhost:8082";

    const isFromReceive = fromPage === "/receive";
    const isFromManage = fromPage === "/manage-foods";
    const isBookingCompleted = bookingStatus === "completed";
    const shouldShowReviewAndReport = isFromReceive && isBookingCompleted;

    const [rating, setRating] = useState(1);
    const [reviewText, setReviewText] = useState("");
    const [existingReview, setExistingReview] = useState(null);
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
        } else {
            setUserId(null);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!incomingId) {
            console.error("ไม่พบ ID อาหาร");
            setLoading(false);
            return;
        }

        window.scrollTo(0, 0);
        const token = localStorage.getItem("accessToken");
        const isValidToken = token && token !== "null" && token !== "undefined";

        const fetchBookingStatus = async (foodId) => {
            if (!isValidToken) return false;
            try {
                const res = await fetch(`http://localhost:8082/bookings/foods/${foodId}/check-booking`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const resData = await res.json();
                return resData?.data ?? false;
            } catch (err) {
                console.error("Error checking booking status:", err);
                return false;
            }
        };

        if (isFromReceive) {
            setLoading(true);
            fetch(`http://localhost:8082/bookings/${incomingId}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
            })
                .then((res) => {
                    if (!res.ok) throw new Error("ไม่พบรายละเอียดข้อมูลการจองนี้");
                    return res.json();
                })
                .then(async (resData) => {
                    if (resData.success) {
                        const booking = resData.data;
                        setBooking(booking);

                        if (booking.foodId) {
                            try {
                                const foodPromise = fetch(`http://localhost:8082/foods/${booking.foodId}`, {
                                    headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
                                }).then(res => res.json());

                                const [foodResult] = await Promise.all([foodPromise]);
                                const actualFoodData = foodResult.data || foodResult;

                                setFood(actualFoodData);
                            } catch (error) {
                                console.error("Error fetching food details:", error);
                                setFood(null);
                            }
                        } else {
                            setFood(null);
                        }
                    } else {
                        throw new Error(resData.message || "ไม่พบรายละเอียดข้อมูลการจองนี้");
                    }
                })
                .catch((err) => {
                    console.error("Error fetching booking:", err);
                    setFood(null);
                })
                .finally(() => setLoading(false));
        } else {
            fetch(`http://localhost:8082/foods/${incomingId}`)
                .then((res) => {
                    if (!res.ok) throw new Error("ไม่พบข้อมูลอาหารรายการนี้");
                    return res.json();
                })
                .then(async (resData) => {
                    if (resData.success) {
                        const actualFoodData = resData.data;
                        const isBooked = await fetchBookingStatus(incomingId);
                        actualFoodData.isCurrentByUserBooked = isBooked;
                        setFood(actualFoodData);
                        setBooking(null);
                    } else {
                        throw new Error(resData.message || "ไม่พบข้อมูลอาหารรายการนี้");
                    }
                })
                .catch((err) => console.error("Error fetching food:", err))
                .finally(() => setLoading(false));
        }
    }, [incomingId, isFromReceive]);

    useEffect(() => {
        const bookingId = booking?.bookingId;

        if (bookingId) {
            fetch(`http://localhost:8082/reviews/check/${bookingId}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data) {
                        setExistingReview(data.data);
                    }
                });
        }
    }, [booking]);

    useEffect(() => {
        if (incomingId) {
            fetch(`http://localhost:8082/reviews/food/${incomingId}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
            })
                .then(res => res.json())
                .then(result => {
                    if (result.success) setReviews(result.data);
                })
                .catch(err => console.error("Error:", err));
        }
    }, [incomingId]);

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

        return `${formattedDate} ${formattedTime}`;
    };

    const formatPickupDate = (dateString) => {
        if (!dateString) return "-";
        const cleanDate = dateString.split("T")[0];
        const date = new Date(cleanDate);

        if (isNaN(date.getTime())) return dateString;

        return date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const formatPickupTime = (timeString) => {
        if (!timeString) return "-";
        return timeString.substring(0, 5);
    };

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: "AIzaSyCz2II4Ff_LEqyvP03ls-0qb6-PVZWxw-0"
    });

    if (loading || !isLoaded) {
        return <div style={styles.centerPage}>กำลังโหลดรายละเอียดอาหาร...</div>;
    }

    if (!food) {
        return <div style={styles.centerPage}>ไม่พบข้อมูล</div>;
    }

    const handleReserveClick = () => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            Swal.fire({
                title: 'กรุณาเข้าสู่ระบบ',
                text: 'คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถจองรายการอาหารได้',
                icon: 'warning',
                confirmButtonColor: '#ff8c00',
                confirmButtonText: 'ไปหน้าเข้าสู่ระบบ',
                showCancelButton: true,
                cancelButtonText: 'ยกเลิก',
                cancelButtonColor: '#a0a0a0',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/login');
                }
            });
            return;
        }

        Swal.fire({
            title: 'จองรายการอาหารบริจาค',
            html: `กรุณากรอกจำนวนที่ต้องการ จำกัดไม่เกิน ${food.limitPerPerson} <br />สามารถดูรหัสยืนยัน ได้ที่รายการรับบริจาค`,
            input: 'number',
            inputAttributes: {
                min: '1',
                step: '1'
            },
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#ff8c00',
            cancelButtonColor: '#a0a0a0',
            buttonsStyling: true,
            reverseButtons: true,
            didOpen: () => {
                const input = Swal.getInput();
                if (input) {
                    input.onkeydown = (e) => {
                        if (e.key === '-' || e.key === '+' || e.key === '.' || e.key === 'e' || e.key === 'E') {
                            e.preventDefault();
                        }
                    };
                }
            },
            inputValidator: (value) => {
                if (!value || Number.parseInt(value) <= 0) {
                    return 'กรุณากรอกจำนวนเป็นตัวเลขที่มากกว่า 0';
                }

                const quantity = Number.parseInt(value);

                if (food.limitPerPerson && quantity > food.limitPerPerson) {
                    return `ขออภัยครับ รายการนี้จำกัดสิทธิ์การจองไม่เกิน ${food.limitPerPerson} ชิ้นต่อคน`;
                }

                if (quantity > food.remainingUnit) {
                    return `ขออภัยครับ อาหารรายการนี้เหลือให้จองได้อีกเพียง ${food.remainingUnit} ชิ้นเท่านั้น`;
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const quantity = Number.parseInt(result.value);
                const token = localStorage.getItem("accessToken");

                Swal.fire({
                    title: 'กำลังบันทึกการจอง...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                fetch(`http://localhost:8082/bookings`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": token ? `Bearer ${token}` : ""
                    },
                    body: JSON.stringify({
                        foodId: incomingId,
                        quantity: quantity
                    })
                })
                    .then((res) => {
                        if (!res.ok) {
                            throw new Error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
                        }
                        return res.json();
                    })
                    .then((resData) => {
                        if (resData.success) {
                            Swal.fire({
                                title: 'จองสำเร็จเรียบร้อย!',
                                icon: 'success',
                                confirmButtonColor: '#2ecc71',
                            }).then(() => {
                                navigate('/receive');
                            });
                        } else {
                            throw new Error(resData.message || "จองอาหารไม่สำเร็จเนื่องจากเงื่อนไขระบบ");
                        }
                    })
                    .catch((err) => {
                        Swal.fire({
                            title: 'เกิดข้อผิดพลาด',
                            text: err.message,
                            icon: 'error',
                            confirmButtonColor: '#e57373',
                        });
                    });
            }
        });
    };

    const handleCancelBooking = () => {
        if (!booking) return;

        const bookingId = booking.bookingId || booking.id;

        Swal.fire({
            title: 'ยืนยันการยกเลิกการจอง?',
            html: 'คุณต้องการยกเลิกการจองใช่หรือไม่? </br>หากยกเลิก การจองของคุณจะถูกลบออกจากระบบ',
            showCancelButton: true,
            confirmButtonColor: '#ff3131',
            cancelButtonColor: '#a0a0a0',
            confirmButtonText: 'ยืนยันการยกเลิก',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'กำลังดำเนินการยกเลิก...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                fetch(`http://localhost:8082/bookings/${bookingId}/cancel`, {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
                    }
                })
                    .then((res) => {
                        if (!res.ok) throw new Error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
                        return res.json();
                    })
                    .then((resData) => {
                        if (resData.success) {
                            Swal.fire({
                                title: 'ยกเลิกการจองสำเร็จ!',
                                icon: 'success',
                                confirmButtonColor: '#2ecc71'
                            }).then(() => {
                                navigate('/receive');
                            });
                        } else {
                            throw new Error(resData.message || "ไม่สามารถยกเลิกการจองได้");
                        }
                    })
                    .catch((err) => {
                        Swal.fire({
                            title: 'เกิดข้อผิดพลาด',
                            text: err.message,
                            icon: 'error',
                            confirmButtonColor: '#ff4d4d'
                        });
                    });
            }
        });
    };

    const handleReport = async () => {
        try {
            const res = await fetch(`http://localhost:8082/report/check/${booking.bookingId}`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
                }
            });
            const result = await res.json();

            if (result.data === true) {
                Swal.fire({
                    icon: "info",
                    title: "คุณได้รายงานปัญหานี้ไปแล้ว",
                    confirmButtonColor: "#3498db"
                });
                return;
            }
        } catch (error) {
            console.error("Error:", error);
        }

        Swal.fire({
            didOpen: () => {
                window.previewFile = previewFile;
            },
            title: 'รายงานปัญหาเกี่ยวกับบริจาคนี้',
            html: `
            <div style="text-align: left;">
                <label>เหตุผลในการรายงาน</label>
                <select id="reason" class="swal2-select" style="width: 100%; margin: 0 0 10px 0;">
                    <option value="" disabled selected>เลือกเหตุผลในการรายงาน</option>
                    <option value="EXPIRED">อาหารหมดอายุ</option>
                    <option value="NOT_MATCH">ข้อมูลไม่ตรงปก</option>
                    <option value="SPOILED">อาหารมีกลิ่นหรือสภาพผิดปกติ</option>
                    <option value="OTHER">อื่นๆ</option>
                </select>
                
                <label>รายละเอียดเพิ่มเติม</label>
                <textarea id="detail" class="swal2-textarea" placeholder="ระบุรายละเอียดของปัญหาที่คุณพบ..." style="width: 100%; margin: 0 0 10px 0;"></textarea>
                
                <label>รูปภาพหลักฐาน (ถ้ามี)</label>
                <div style="display: flex; gap: 15px; align-items: flex-start; margin-top: 10px;">
                    <label for="image-upload" style="
                        display: flex; flex-direction: column; align-items: center; justify-content: center;
                        width: 120px; height: 120px; border: 2px dashed #ccc; border-radius: 12px;
                        cursor: pointer; color: #888; text-align: center;">
                        <span style="font-size: 30px; font-weight: bold; color: #aaa;">+</span>
                        <span style="font-size: 14px;">คลิกเพื่ออัปโหลด</span>
                    </label>
                    <input type="file" id="image-upload" accept="image/*" style="display: none;" onchange="previewFile()" />

                    <div id="preview-container" style="display: none; width: 120px; height: 120px; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">
                        <img id="preview-image" src="" style="width: 100%; height: 100%; object-fit: cover;" />
                    </div>
                </div>
            </div>
        `,
            confirmButtonText: 'รายงาน',
            confirmButtonColor: '#ff9800',
            showCancelButton: true,
            cancelButtonColor: '#a0a0a0',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            preConfirm: () => {
                const reason = document.getElementById('reason').value;
                const detail = document.getElementById('detail').value;
                const file = document.getElementById('image-upload').files[0];

                if (!reason) {
                    Swal.showValidationMessage('กรุณาเลือกเหตุผลในการรายงาน');
                    return false;
                }
                if (!detail.trim()) {
                    Swal.showValidationMessage('กรุณาระบุรายละเอียดของปัญหา');
                    return false;
                }

                return { reason, detail, file };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { reason, detail, file } = result.value;

                const formData = new FormData();
                formData.append("reason", result.value.reason);
                formData.append("description", result.value.detail);
                formData.append("bookingId", booking.bookingId);
                formData.append("recipientId", localStorage.getItem("userId"));

                if (file) {
                    formData.append("report_image", file);
                }

                try {
                    const response = await fetch("http://localhost:8082/report", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
                        },
                        body: formData
                    });

                    const data = await response.json();

                    if (data.success) {
                        Swal.fire({
                            icon: "success",
                            title: "ส่งรายงานปัญหาเรียบร้อยแล้ว",
                            confirmButtonColor: "#2ecc71"
                        });
                    } else {
                        Swal.fire("เกิดข้อผิดพลาด", data.message || "ไม่สามารถบันทึกรายงานได้", "error");
                    }
                } catch (error) {
                    console.error("Error:", error);
                    Swal.fire("ล้มเหลว", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
                }
            }
        });
    };

    const previewFile = () => {
        const file = document.getElementById('image-upload').files[0];
        const reader = new FileReader();
        const preview = document.getElementById('preview-image');
        const container = document.getElementById('preview-container');

        reader.onloadend = () => {
            preview.src = reader.result;
            container.style.display = 'block';
        };

        if (file) {
            reader.readAsDataURL(file);
        }
    };

    const handleReviewSubmit = async () => {
        const reviewData = {
            ratingScore: rating,
            reviewComment: reviewText,
            bookingBookingId: booking.bookingId,
        };

        try {
            const response = await fetch("http://localhost:8082/reviews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
                },
                body: JSON.stringify(reviewData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                Swal.fire({
                    icon: "success",
                    title: "บันทึกรีวิวเรียบร้อยแล้ว",
                    confirmButtonColor: "#2ecc71"
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.reload();
                    }
                });
                setRating(1);
                setReviewText("");
            } else {
                throw new Error(result.message || "เกิดข้อผิดพลาดในการส่งรีวิว");
            }
        } catch (error) {
            console.error("Error:", error);
            Swal.fire({
                icon: "error",
                title: "ไม่สามารถบันทึกรีวิวได้",
                text: error.message,
                confirmButtonColor: "#e74c3c"
            });
        }
    };

    const handleToggleStatus = async (food) => {
        const newStatus = food.foodStatus === 'disable' ? 'available' : 'disable';
        const actionText = food.foodStatus === 'disable' ? 'เปิดการแสดงผล' : 'ปิดการแสดงผล';

        if (newStatus === 'available' && food.expiryDate) {
            const expiryTime = new Date(food.expiryDate).getTime();
            const currentTime = new Date().getTime();

            if (expiryTime < currentTime) {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่สามารถเปิดการแสดงผลได้',
                    text: 'อาหารชิ้นนี้หมดอายุไปแล้ว ไม่สามารถเปิดใช้งานได้อีก',
                    confirmButtonColor: '#ff4d4d',
                    confirmButtonText: 'ตกลง'
                });
                return;
            }
        }

        const result = await Swal.fire({
            title: `ยืนยันการ${actionText}?`,
            icon: food.foodStatus === 'disable' ? 'question' : 'warning',
            iconColor: food.foodStatus === 'disable' ? '#219b54' : '#ff4d4d',
            showCancelButton: true,
            confirmButtonColor: food.foodStatus === 'disable' ? '#219b54' : '#ff4d4d',
            confirmButtonText: `${actionText}`,
            cancelButtonText: 'ยกเลิก',
            cancelButtonColor: '#b0b0b0',
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`${BASE_URL}/foods/${food.id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });

                if (response.ok) {
                    Swal.fire({
                        icon: "success",
                        title: `${actionText}เรียบร้อยแล้ว`,
                        confirmButtonColor: "#2ecc71"
                    }).then(() => {
                        navigate('/manage-foods');
                    });
                } else {
                    throw new Error("ไม่สามารถเปิดหรือปิดการแสดงผลได้");
                }
            } catch (error) {
                Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
            }
        }
    };

    if (!food || (!isFromReceive && !isFromManage && food.foodStatus !== "available")) {
        return (
            <p style={{ ...styles.centerPage }}>
                ไม่พบรายการอาหาร หรืออาหารนี้ไม่พร้อมใช้งาน
            </p>
        );
    }

    return (
        <div style={{ ...styles.page, padding: isMobile ? "20px 15px" : "40px 20px" }}>
            <div style={{ ...styles.headerRow, justifyContent: shouldShowReviewAndReport ? "space-between" : "flex-end" }}>
                <div></div>
                {shouldShowReviewAndReport && (
                    <button
                        type="button"
                        style={{ ...styles.reportBtn, fontSize: isMobile ? "14px" : "17px" }}
                        onClick={handleReport}
                    >
                        <span style={styles.reportIcon} className="material-symbols-outlined">
                            report
                        </span> รายงานเกี่ยวกับบริจาคนี้
                    </button>
                )}
            </div>

            <div style={{ ...styles.container, flexDirection: isMobile ? "column" : "row", gap: isMobile ? "30px" : "60px" }}>
                {/* ฝั่งซ้าย */}
                <div style={styles.leftColumn}>
                    <img
                        src={`${BASE_URL}${food.foodImage}`}
                        alt={food.foodName}
                        style={{ ...styles.foodImage, height: isMobile ? "250px" : "360px" }}
                    />
                    <p style={styles.donorText}>
                        <span style={{ color: "#ff8c00", fontWeight: "bold" }}>บริจาคโดย</span>
                        <span> {food.donorName}</span>
                    </p>

                    {isFromReceive ? (
                        <>
                            <div style={{ ...styles.bookingDetailCard, padding: isMobile ? "20px" : "30px" }}>
                                <h3 style={styles.bookingCardTitle}>รายละเอียดการจอง</h3>

                                {!booking ? (
                                    <p style={{ fontSize: "14px", color: "#666" }}>ไม่พบรายละเอียดข้อมูลการจองนี้</p>
                                ) : (
                                    <div style={styles.bookingBody}>
                                        <p style={styles.bookingRow}>
                                            <span style={{ ...styles.bookingLabel, width: isMobile ? "130px" : "160px" }}>จำนวนที่รับบริจาค :</span>
                                            <span style={styles.bookingValue}> {booking.bookingUnit}</span>
                                        </p>
                                        <p style={styles.bookingRow}>
                                            <span style={{ ...styles.bookingLabel, width: isMobile ? "130px" : "160px" }}>น้ำหนักที่รับบริจาค :</span>
                                            <span style={styles.bookingValue}>
                                                {booking.bookingWeightKg} Kg
                                            </span>
                                        </p>
                                        <p style={styles.bookingRow}>
                                            <span style={{ ...styles.bookingLabel, width: isMobile ? "130px" : "160px" }}>วันที่ทำการจอง :</span>
                                            <span style={styles.bookingValue}> {formatExpiryDate(booking.bookingDate || booking.createdAt)}</span>
                                        </p>

                                        {booking.bookingStatus !== "completed" && (
                                            <div style={{ ...styles.claimCodeContainer, flexDirection: isMobile ? "column" : "row", gap: isMobile ? "8px" : "0" }}>
                                                <span style={{ ...styles.claimCodeLabel, fontSize: isMobile ? "18px" : "24px" }}>รหัสยืนยันการจอง</span>
                                                <span style={{ ...styles.claimCodeValue, fontSize: isMobile ? "28px" : "36px" }}>
                                                    {booking.confirmationCode || "000000"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {shouldShowReviewAndReport && (
                                <div style={{ ...styles.reviewCard, marginTop: "8px", padding: isMobile ? "20px" : "30px" }}>
                                    {existingReview ? (
                                        <div>
                                            <h3 style={{ ...styles.reviewTitle, fontSize: "18px", fontWeight: "bold" }}>รีวิวของคุณ</h3>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#328d7d" }}>
                                                    {existingReview.recipient.user.firstName + " " + existingReview.recipient.user.lastName}
                                                </span>
                                                <span style={{ color: "#888", fontSize: "14px" }}>
                                                    {new Date(existingReview.reviewDate).toLocaleDateString('th-TH')}
                                                </span>
                                            </div>

                                            <div style={{ marginLeft: isMobile ? "0" : "8px", marginTop: "6px" }}>
                                                <div style={styles.ratingStarsContainer}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <span key={star} style={{
                                                            fontSize: '24px',
                                                            color: star <= existingReview.ratingScore ? "#FFB800" : "#D3D3D3",
                                                        }}>★</span>
                                                    ))}
                                                </div>

                                                <p style={{ margin: "0", color: "#737373", lineHeight: "1.5" }}>
                                                    {existingReview.reviewComment}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <h3 style={{ ...styles.reviewTitle, fontSize: "18px", fontWeight: "bold" }}>รีวิวรายการจอง</h3>
                                            <div style={styles.ratingStarsContainer}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button key={star} type="button" onClick={() => setRating(star)}
                                                        style={{ ...styles.starButton, color: star <= rating ? "#FFB800" : "#D3D3D3" }}>
                                                        ★
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea placeholder="เขียนรีวิว..." value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                                                style={styles.reviewInput} rows={4} />
                                            <div style={{ display: "flex", justifyContent: "center" }}>
                                                <button onClick={handleReviewSubmit} style={{ ...styles.reviewButton, marginTop: "10px", width: isMobile ? "100%" : "40%" }}>ส่งรีวิว</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ ...styles.reviewCard, padding: isMobile ? "20px" : "30px" }}>
                            <h4 style={styles.reviewTitle}>รีวิวจากผู้รับบริจาค</h4>
                            {reviews.length > 0 ? (
                                reviews.map((item, index) => (
                                    <div key={index} style={{ marginTop: '15px' }}>
                                        <div style={styles.reviewHeader}>
                                            <span style={{ color: "#328d7d", fontSize: "16px" }}>{item.reviewerName}</span>
                                            <span style={{ color: "#888", fontSize: "14px" }}>
                                                {new Date(item.reviewDate).toLocaleDateString('th-TH')}
                                            </span>
                                        </div>
                                        <div style={{ marginLeft: isMobile ? "0" : "8px" }}>
                                            <div style={styles.ratingStarsContainer}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <span
                                                        key={star}
                                                        style={{
                                                            fontSize: '24px',
                                                            color: star <= (item?.ratingScore) ? "#FFB800" : "#D3D3D3",
                                                            margin: '0px',
                                                            cursor: 'default'
                                                        }}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <p style={{ margin: "0", color: "#737373", lineHeight: "1.5", fontSize: "16px" }}>{item.reviewComment}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: "#999", textAlign: "center" }}>
                                    <p>ยังไม่มีรีวิว</p>
                                </div>
                            )}
                        </div>
                    )}

                    {isFromReceive && booking && booking.bookingStatus === "pending" && (
                        <button
                            type="button"
                            style={{ ...styles.cancelBookingBtn, width: isMobile ? "100%" : "45%" }}
                            onClick={handleCancelBooking}
                        >
                            ยกเลิกการจอง
                        </button>
                    )}
                </div>

                {/* ฝั่งขวา */}
                <div style={styles.rightColumn}>
                    <h1 style={{ ...styles.foodName, fontSize: isMobile ? "24px" : "30px" }}>{food.foodName}</h1>
                    <p style={styles.foodDescription}>{food.description}</p>
                    <p style={styles.categoryText}>
                        <span style={styles.labelBold}>หมวดหมู่ :</span>
                        <span style={styles.categoryBadge}> {food.foodCateName} </span>
                    </p>

                    <div style={styles.infoList}>
                        <div style={styles.infoRow}>
                            <span className="material-symbols-outlined" style={styles.icon}>
                                calendar_clock
                            </span>
                            <div>
                                <div style={styles.infoLabel}>วันหมดอายุ</div>
                                <div style={styles.infoValue}>{formatExpiryDate(food.expiryDate)} น.</div>
                            </div>
                        </div>

                        <div style={styles.infoRow}>
                            <span className="material-symbols-outlined" style={styles.icon}>
                                scale
                            </span>
                            <div>
                                <div style={styles.infoLabel}>น้ำหนักต่อหน่วยที่บริจาค</div>
                                <div style={styles.infoValue}>{food.unitWeightKg} Kg</div>
                            </div>
                        </div>

                        <div style={styles.infoRow}>
                            <span className="material-symbols-outlined" style={styles.icon}>
                                package_2
                            </span>
                            <div>
                                <div style={styles.infoLabel}>จำนวนที่บริจาค และ คงเหลือ</div>
                                <div style={styles.infoValue}>{food.totalUnit} : {food.remainingUnit}</div>
                            </div>
                        </div>

                        <div style={styles.infoRow}>
                            <span className="material-icons" style={styles.icon}>
                                person
                            </span>
                            <div>
                                <div style={styles.infoLabel}>จำนวนคนที่เหมาะต่อการบริโภค</div>
                                <div style={styles.infoValue}>{food.peopleCountPerMeal === null ? "ไม่ระบุ" : food.peopleCountPerMeal} คน</div>
                            </div>
                        </div>

                        <div style={styles.infoRow}>
                            <span className="material-icons" style={styles.icon}>
                                location_on
                            </span>
                            <div>
                                <div style={styles.infoLabel}>ที่อยู่</div>
                                <div style={styles.infoValue}>{food.address}</div>
                            </div>
                        </div>

                        <div style={styles.infoRow}>
                            <span className="material-icons-outlined" style={styles.icon}>
                                access_time
                            </span>
                            <div>
                                <div style={styles.infoLabel}>วันและเวลาที่สามารถรับได้</div>
                                <div style={styles.infoValue}>
                                    {formatPickupDate(food.pickupDateStart)} - {formatPickupDate(food.pickupDateEnd)}
                                    <br />
                                    {formatPickupTime(food.pickupStartTime)} น. - {formatPickupTime(food.pickupEndTime)} น.
                                </div>
                            </div>
                        </div>

                        <div style={styles.infoRow}>
                            <span className="material-symbols-outlined" style={styles.icon}>
                                hand_package
                            </span>
                            <div>
                                <div style={styles.infoLabel}>จำนวนจำกัดต่อคน</div>
                                <div style={styles.infoValue}>{food.limitPerPerson} </div>
                            </div>
                        </div>
                    </div>

                    <div style={styles.mapWrapper}>
                        <GoogleMap
                            mapContainerStyle={{ width: "100%", height: "100%" }}
                            center={{
                                lat: Number(food.latitude),
                                lng: Number(food.longitude)
                            }}
                            zoom={17}
                            options={{
                                gestureHandling: "cooperative",
                                fullscreenControl: true,
                                mapTypeControl: false
                            }}
                        >
                            <Marker
                                position={{
                                    lat: Number(food.latitude),
                                    lng: Number(food.longitude)
                                }}
                                draggable={false}
                            />
                        </GoogleMap>
                    </div>

                    {(!isFromReceive && !isOwner && !isFromManage) && (
                        <button
                            onClick={handleReserveClick}
                            disabled={food?.isCurrentByUserBooked}
                            style={{
                                ...styles.reserveBtn,
                                width: isMobile ? "100%" : "50%",
                                backgroundColor: food?.isCurrentByUserBooked ? '#e0e0e0' : '#ff8c00',
                                color: food?.isCurrentByUserBooked ? '#9c9c9c' : '#ffffff',
                                cursor: food?.isCurrentByUserBooked ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {food?.isCurrentByUserBooked ? 'คุณจองรายการนี้แล้ว' : 'จองรายการอาหาร'}
                        </button>
                    )}
                </div>
            </div>

            {(isFromManage && food && ['available', 'disable'].includes(food.foodStatus)) && (
                <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '15px',
                    marginTop: '20px',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: '10px 25px',
                            borderRadius: '10px',
                            border: '1px solid #ccc',
                            backgroundColor: '#c5c5c5',
                            color: '#5c5c5c',
                            cursor: 'pointer',
                            fontSize: '18px',
                            width: isMobile ? '100%' : '200px'
                        }}
                    >
                        ย้อนกลับ
                    </button>

                    <button
                        onClick={() => handleToggleStatus(food)}
                        style={{
                            padding: '10px 25px',
                            borderRadius: '10px',
                            border: food.foodStatus === 'disable'
                                ? '2px solid #219b54'
                                : '2px solid #ff4d4d',
                            backgroundColor: 'transparent',
                            color: food.foodStatus === 'disable'
                                ? '#219b54'
                                : '#ff4d4d',
                            cursor: 'pointer',
                            fontSize: '18px',
                            width: isMobile ? '100%' : '200px'
                        }}
                    >
                        {food.foodStatus === 'disable' ? 'เปิดการแสดงผล' : 'ปิดการแสดงผล'}
                    </button>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        width: "100%",
        maxWidth: "1150px",
        margin: "0 auto",
        boxSizing: "border-box"
    },
    container: {
        display: "flex",
    },
    centerPage: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        fontSize: "18px",
        color: "#ff8c00"
    },
    leftColumn: {
        flex: "1.2",
        display: "flex",
        flexDirection: "column"
    },
    rightColumn: {
        flex: "1",
        display: "flex",
        flexDirection: "column"
    },
    foodImage: {
        width: "100%",
        objectFit: "cover",
        borderRadius: "20px"
    },
    donorText: {
        fontSize: "18px",
        marginTop: "16px",
        color: "#333"
    },
    reviewCard: {
        backgroundColor: "#ffe8cc",
        borderRadius: "16px",
        marginTop: "2px"
    },
    reviewTitle: {
        margin: "0 0 12px 0",
        color: "#000",
        fontSize: "18px",
        fontWeight: "500",
    },
    reviewHeader: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "13px",
        color: "#888"
    },
    ratingStarsContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '5px'
    },
    starButton: {
        background: 'none',
        border: 'none',
        padding: '0',
        fontSize: '28px',
        cursor: 'pointer',
        outline: 'none',
    },
    reviewInput: {
        width: '100%',
        backgroundColor: '#fff3e4',
        border: '1px solid #d9d9d9',
        borderRadius: '12px',
        padding: '14px 16px',
        fontSize: '15px',
        color: '#333333',
        outline: 'none',
        resize: 'none',
        boxSizing: 'border-box',
        fontFamily: 'inherit'
    },
    foodName: {
        color: "#333",
        margin: "0 0 8px 0",
        fontWeight: "bold"
    },
    foodDescription: {
        fontSize: "16px",
        color: "#777",
        margin: "0 0 20px 0"
    },
    categoryText: {
        fontSize: "18px",
        margin: "0 0 10px 0"
    },
    labelBold: {
        fontWeight: "bold",
        color: "#ff8c00",
        fontSize: "18px",
    },
    categoryBadge: {
        color: "#555"
    },
    infoList: {
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        marginBottom: "30px"
    },
    infoRow: {
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        marginBottom: "0px"
    },
    icon: {
        fontSize: "30px",
        marginTop: "2px",
        color: "#ff8c00",
        flexShrink: 0
    },
    infoLabel: {
        fontSize: "15px",
        color: "#000",
        marginBottom: "2px"
    },
    infoValue: {
        fontSize: "15px",
        color: "#328d7d",
        fontWeight: "500"
    },
    mapWrapper: {
        width: "100%",
        height: "180px",
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "30px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
    },
    reserveBtn: {
        backgroundColor: "#ff8c00",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "12px",
        padding: "14px 0",
        fontSize: "18px",
        cursor: "pointer",
        textAlign: "center",
        boxShadow: "0 6px 16px rgba(255, 138, 0, 0.25)",
        transition: "background-color 0.2s",
        alignSelf: "center"
    },
    bookingDetailCard: {
        backgroundColor: "#ffe8cc",
        borderRadius: "24px",
        marginTop: "2px",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
    },
    bookingCardTitle: {
        margin: 0,
        color: "#ff8c00",
        fontSize: "18px",
        fontWeight: "bold"
    },
    bookingBody: {
        display: "flex",
        flexDirection: "column",
        gap: "14px"
    },
    bookingRow: {
        margin: 0,
        fontSize: "16px",
        display: "flex",
        alignItems: "center"
    },
    bookingLabel: {
        color: "#333333",
        flexShrink: 0
    },
    bookingValue: {
        color: "#328d7d",
        fontWeight: "500",
    },
    claimCodeContainer: {
        display: "flex",
        alignItems: "center",
        marginTop: "16px",
        paddingTop: "6px"
    },
    claimCodeLabel: {
        fontWeight: "bold",
        color: "#328d7d"
    },
    claimCodeValue: {
        fontWeight: "bold",
        color: "#ff8c00",
        letterSpacing: "4px"
    },
    cancelBookingBtn: {
        backgroundColor: "#FFFFFF",
        color: "#ff3131",
        border: "3px solid #ff3131",
        borderRadius: "14px",
        padding: "10px 0",
        fontSize: "18px",
        fontWeight: "500",
        cursor: "pointer",
        textAlign: "center",
        alignSelf: "center",
        marginTop: "20px",
    },
    headerRow: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        marginBottom: '15px',
    },
    reportBtn: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'transparent',
        border: '2px solid #A0A0A0',
        borderRadius: '12px',
        padding: '8px 16px',
        color: '#A0A0A0',
        fontWeight: '500',
        cursor: 'pointer',
        outline: 'none',
    },
    reportIcon: {
        marginRight: '8px',
        fontSize: '24px',
        display: 'inline-flex',
        alignItems: 'center'
    },
    reviewButton: {
        backgroundColor: "#ff8c00",
        color: "white",
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        cursor: "pointer",
    }
};