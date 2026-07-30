import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import Swal from "sweetalert2";
import { jwtDecode } from 'jwt-decode';

export default function FoodDetail() {
    // const { id } = useParams();
    const location = useLocation();
    // const foodId = location.state?.id;

    // ดึงค่าหน้าต้นทางมาตรวจสอบบริบทการแสดงผล
    // const fromPage = location.state?.fromPage;
    const { fromPage, bookingStatus } = location.state || {};
    const incomingId = location.state?.id; // อาจจะเป็น foodId หรือ bookingId ขึ้นอยู่กับหน้าต้นทาง
    const navigate = useNavigate();

    const [userId, setUserId] = useState(null);
    const [food, setFood] = useState(null);
    const [booking, setBooking] = useState(null);
    // const [bookingHistory, setBookingHistory] = useState([]); // สร้าง State เก็บประวัติผู้จองอาหาร
    const [loading, setLoading] = useState(true);

    // const currentUserId = localStorage.getItem("userId");

    // เปรียบเทียบกับ donorId
    // หมายเหตุ: เช็คให้แน่ใจว่า donorId ใน formData เป็นอะไร (บางทีอาจจะเป็น object หรือ id)
    // const isOwner = currentUserId && String(food?.donor?.userId) === String(currentUserId);
    const isOwner = food && food.donorId && String(food.donorId) === String(userId);

    const BASE_URL = "http://localhost:8082";

    // เช็กเงื่อนไขว่ามาจากหน้าจัดการรับบริจาคหรือไม่
    const isFromReceive = fromPage === "/receive";
    const isFromManage = fromPage === "/manage-foods";
    // console.log("เช็คค่าที่รับมา:", { fromPage, isFromManage, incomingId });

    // เช็กสถานะการจองว่าเสร็จสมบูรณ์แล้วหรือไม่
    const isBookingCompleted = bookingStatus === "completed";

    // รวมเงื่อนไข จะโชว์รีวิวและปุ่มรายงาน ก็ต่อเมื่อมาจากหน้า receive และส่งมอบสำเร็จแล้วเท่านั้น
    const shouldShowReviewAndReport = isFromReceive && isBookingCompleted;

    const [rating, setRating] = useState(1);
    const [reviewText, setReviewText] = useState("");
    const [existingReview, setExistingReview] = useState(null);
    const [reviews, setReviews] = useState([]);

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
        if (!incomingId) return;

        const token = localStorage.getItem("accessToken");
        const isValidToken = token && token !== "null" && token !== "undefined";

        // สร้างฟังก์ชันกลางสำหรับดึงสถานะการจองซ้ำจากหลังบ้าน
        const fetchBookingStatus = async (foodId) => {
            if (!isValidToken) return false; // ถ้าไม่ได้ล็อกอิน ให้เป็น false เสมอ
            try {
                const res = await fetch(`http://localhost:8082/bookings/foods/${foodId}/check-booking`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const resData = await res.json();
                // console.log("=== JSON FROM BACKEND ===", resData);
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

                        // ใช้ Promise.all เพื่อดึงข้อมูลอาหาร (ถ้ามี foodId)
                        if (booking.foodId) {
                            try {
                                // สร้างคำสั่ง fetch เพื่อดึงข้อมูลอาหาร
                                const foodPromise = fetch(`http://localhost:8082/foods/${booking.foodId}`, {
                                    headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
                                }).then(res => res.json());

                                const [foodResult] = await Promise.all([foodPromise]);

                                // เรียกใช้ฟังก์ชันเช็คการจองซ้ำ ไม่ว่าจะมาจากหน้าไหน
                                const actualFoodData = foodResult.data || foodResult;
                                console.log("Food Data:", actualFoodData);

                                setFood(actualFoodData);

                            } catch (error) {
                                console.error("Error fetching food details:", error);
                                setFood(null);
                            }
                        } else {
                            setFood(null); // กรณีไม่มี foodId
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

            // เคสที่ 2: กดมาจากหน้า Home / Map ทั่วไป (ค่าส่งมาคือ foodId)
            fetch(`http://localhost:8082/foods/${incomingId}`)
                .then((res) => {
                    if (!res.ok) throw new Error("ไม่พบข้อมูลอาหารรายการนี้");
                    return res.json();
                })
                .then(async (resData) => {
                    if (resData.success) {
                        const actualFoodData = resData.data;

                        // เรียกใช้ฟังก์ชันเช็คการจองซ้ำ ไม่ว่าจะมาจากหน้าไหน
                        const isBooked = await fetchBookingStatus(incomingId);
                        actualFoodData.isCurrentByUserBooked = isBooked;
                        // const actualFoodData = resData.data;
                        setFood(actualFoodData);
                        console.log(actualFoodData.isCurrentByUserBooked);
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
        // ต้องตรวจสอบว่า bookingId มาหรือยังก่อนเรียก API
        const bookingId = booking?.bookingId;

        if (bookingId) {
            fetch(`http://localhost:8082/reviews/check/${bookingId}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
            })
                .then(res => res.json())
                .then(data => {
                    // ถ้า data.success เป็น true หมายความว่ารีวิวแล้ว
                    if (data.success && data.data) {
                        setExistingReview(data.data);
                    }
                });
        }
    }, [booking]); // ให้ทำงานใหม่เมื่อข้อมูลการจองโหลดเสร็จ

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

    // ฟังก์ชันฟอร์แมตวันที่ไทย
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

        // แยกเอาเฉพาะปี-เดือน-วัน (ป้องกันกรณีหลังบ้านส่งมาพร้อมตัว T หรือเวลา)
        const cleanDate = dateString.split("T")[0];
        const date = new Date(cleanDate);

        if (isNaN(date.getTime())) return dateString;

        return date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short", // ใช้ "short" จะได้ "มี.ค." ประหยัดพื้นที่ และดูมินิมอลขึ้นครับ
            year: "numeric"
        });
    };

    // ฟังก์ชันตัดเลขวินาทีของเวลา (เช่น 13:00:00 -> 13:00)
    const formatPickupTime = (timeString) => {
        if (!timeString) return "-";
        // เอาเฉพาะตำแหน่งชั่วโมงและนาที (5 ตัวแรก)
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
            // กดปุ่มลบ หรือ จุดทศนิยม จะพิมพ์ไม่ติด
            didOpen: () => {
                const input = Swal.getInput();
                if (input) {
                    input.onkeydown = (e) => {
                        // บล็อกเครื่องหมายลบ (-), เครื่องหมายบวก (+), และจุดทศนิยม (.) และตัว e/E (Exponent)
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
                                // text: resData.message || 'รายการอาหารของคุณถูกล็อกสิทธิ์เรียบร้อยแล้ว',
                                icon: 'success',
                                confirmButtonColor: '#2ecc71',
                            }).then(() => {
                                navigate('/receive');
                            });
                        } else {
                            // ถ้าหลังบ้านบอกว่าจองไม่ผ่าน (เช่น โควต้าเต็มพอดี) ให้โยนข้อความไปแสดงที่บล็อกแจ้งเตือนด้านล่าง
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

        // ดึงไอดีใบจองออกมา
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
                                // text: resData.message || 'ระบบได้คืนสิทธิ์จำนวนอาหารเข้าสู่คลังเรียบร้อยแล้ว',
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

            // ถ้าผลตอบกลับเป็น true แปลว่าเคยรายงานไปแล้ว
            if (result.data === true) {
                Swal.fire({
                    icon: "info",
                    title: "คุณได้รายงานปัญหานี้ไปแล้ว",
                    // text: "คุณได้รายงานปัญหานี้ไปแล้ว",
                    confirmButtonColor: "#3498db"
                });
                return; // หยุดทำงานทันที ไม่ต้องเปิดหน้าต่างรายงาน
            }
        } catch (error) {
            console.error("Error:", error);
        }

        Swal.fire({
            didOpen: () => {
                // ผูกฟังก์ชันเข้ากับ window เพื่อให้ HTML เรียกได้
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

                // ตรวจสอบว่าเลือกเหตุผลหรือยัง
                if (!reason) {
                    Swal.showValidationMessage('กรุณาเลือกเหตุผลในการรายงาน');
                    return false;
                }
                // ตรวจสอบว่ากรอกรายละเอียดหรือยัง
                if (!detail.trim()) {
                    Swal.showValidationMessage('กรุณาระบุรายละเอียดของปัญหา');
                    return false;
                }

                return { reason, detail, file };
            }
            // }).then((result) => {
            //     if (result.isConfirmed) {
            //         console.log("ข้อมูลที่ส่ง:", result.value);
            //         // ตรงนี้คือจุดที่คุณนำข้อมูลไปยิง API ต่อ
            //     }
            // });
        }).then(async (result) => {

            // console.log("Check Booking ID:", booking);

            if (result.isConfirmed) {
                const { reason, detail, file } = result.value;

                // 2. สร้าง FormData เพื่อส่งไฟล์และข้อมูลไปพร้อมกัน
                const formData = new FormData();
                formData.append("reason", result.value.reason);
                formData.append("description", result.value.detail);
                formData.append("bookingId", booking.bookingId);
                formData.append("recipientId", localStorage.getItem("userId"));

                if (file) {
                    formData.append("report_image", file);
                } else {
                    console.warn("ไม่มีไฟล์ถูกเลือก!");
                }

                try {
                    // 3. ยิง API ไปยังหลังบ้าน
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
                        })
                        // Swal.fire("สำเร็จ!", "ส่งรายงานปัญหาเรียบร้อยแล้ว", "success");
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
        const container = document.getElementById('preview-container'); // กล่องครอบรูป

        reader.onloadend = () => {
            preview.src = reader.result;
            container.style.display = 'block'; // แสดงกล่องที่ครอบรูป
        };

        if (file) {
            reader.readAsDataURL(file);
        }
    };

    const handleReviewSubmit = async () => {
        // 1. ตรวจสอบข้อมูลก่อนส่ง
        // if (rating === 0) {
        //     alert("กรุณาเลือกคะแนนดาว");
        //     return;
        // }

        const reviewData = {
            ratingScore: rating,
            reviewComment: reviewText,
            bookingBookingId: booking.bookingId, // ต้องตรงกับที่ส่งให้ Java
            // recipientUserId: booking.currentUserId         // ต้องตรงกับที่ส่งให้ Java
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

            const result = await response.json(); // รับค่า ApiResponse

            if (response.ok && result.success) {
                Swal.fire({
                    icon: "success",
                    title: "บันทึกรีวิวเรียบร้อยแล้ว",
                    // text: "บันทึกรีวิวเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็น",
                    confirmButtonColor: "#2ecc71"
                }).then((result) => {
                    // เมื่อผู้ใช้กดปุ่มตกลง (OK) ให้ทำคำสั่งด้านล่างนี้
                    if (result.isConfirmed) {
                        window.location.reload(); // โหลดหน้าเดิมใหม่
                    }
                });
                // รีเซ็ตค่าหลังส่งสำเร็จ
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
        // กำหนดสถานะใหม่ที่จะส่งไป
        const newStatus = food.foodStatus === 'disable' ? 'available' : 'disable';
        const actionText = food.foodStatus === 'disable' ? 'เปิดการแสดงผล' : 'ปิดการแสดงผล';

        // ถ้ากำลังจะเปิดการแสดงผล ให้เช็ควันหมดอายุก่อน
        if (newStatus === 'available' && food.expiryDate) {
            const expiryTime = new Date(food.expiryDate).getTime();
            const currentTime = new Date().getTime();

            // ถ้าเวลาหมดอายุน้อยกว่าเวลาปัจจุบัน แปลว่าหมดอายุแล้ว
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
                        // text: "บันทึกรีวิวเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็น",
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
        <div style={styles.page}>
            {/* <div>
                <div>User ID: {currentUserId}</div>
            </div> */}
            <div style={styles.headerRow}>
                {/* พื้นที่ว่างด้านซ้ายปล่อยไว้ หรือปล่อยให้ปุ่มดีดไปทางขวาสุดด้วย justifyContent */}
                <div></div>

                {/* ปุ่มรายงานตัวจริงผ่านเกณฑ์ SonarQube */}
                {shouldShowReviewAndReport && (
                    <button
                        type="button"
                        style={styles.reportBtn}
                        // onClick={() => console.log("แจ้งรายงาน")}
                        onClick={handleReport}
                    >
                        <span style={styles.reportIcon} className="material-symbols-outlined">
                            report
                        </span> รายงานเกี่ยวกับบริจาคนี้
                    </button>
                )}

            </div>
            <div style={styles.container}>

                {/* ฝั่งซ้าย: รูปภาพอาหาร และ รีวิวผู้รับบริจาค */}
                <div style={styles.leftColumn}>
                    <img
                        src={`${BASE_URL}${food.foodImage}`}
                        alt={food.foodName}
                        style={styles.foodImage}
                    />
                    <p style={styles.donorText}>
                        <span style={{ color: "#ff8c00", fontWeight: "bold", }}>บริจาคโดย</span>
                        <span> {food.donorName}</span>
                    </p>

                    {/* CONDITIONAL RENDERING: สลับการแสดงผลตรงนี้ */}
                    {isFromReceive ? (
                        <>
                            {/* กล่องที่ 1: รายละเอียดการจอง */}
                            <div style={styles.bookingDetailCard}>
                                <h3 style={styles.bookingCardTitle}>รายละเอียดการจอง</h3>

                                {!booking ? (
                                    <p style={{ fontSize: "14px", color: "#666" }}>ไม่พบรายละเอียดข้อมูลการจองนี้</p>
                                ) : (
                                    <div style={styles.bookingBody}>
                                        <p style={styles.bookingRow}>
                                            <span style={styles.bookingLabel}>จำนวนที่รับบริจาค :</span>
                                            <span style={styles.bookingValue}> {booking.bookingUnit}</span>
                                        </p>
                                        <p style={styles.bookingRow}>
                                            <span style={styles.bookingLabel}>น้ำหนักที่รับบริจาค :</span>
                                            <span style={styles.bookingValue}>
                                                {booking.bookingWeightKg} Kg
                                            </span>
                                        </p>
                                        <p style={styles.bookingRow}>
                                            <span style={styles.bookingLabel}>วันที่ทำการจอง :</span>
                                            <span style={styles.bookingValue}> {formatExpiryDate(booking.bookingDate || booking.createdAt)}</span>
                                        </p>

                                        {/* ส่วนแสดงรหัสยืนยัน: แสดงเฉพาะตอนที่สถานะยังไม่สำเร็จ */}
                                        {booking.bookingStatus !== "completed" && (
                                            <div style={styles.claimCodeContainer}>
                                                <span style={styles.claimCodeLabel}>รหัสยืนยันการจอง</span>
                                                <span style={styles.claimCodeValue}>
                                                    {booking.confirmationCode || "000000"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* กล่องที่ 2: กรอบรีวิว (แยกออกมาอยู่นอก bookingDetailCard เรียบร้อยแล้ว) */}
                            {shouldShowReviewAndReport && (
                                <div style={{ ...styles.reviewCard, marginTop: "8px" }}>
                                    {existingReview ? (
                                        // กรณีรีวิวแล้ว: แสดงรีวิวเดิมของคุณ
                                        <div>
                                            <h3 style={{ ...styles.reviewTitle, fontSize: "18px", fontWeight: "bold" }}>รีวิวของคุณ</h3>
                                            {/* <div style={styles.ratingStarsContainer}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <span key={star} style={{
                                                        fontSize: '24px',
                                                        color: star <= existingReview.ratingScore ? "#FFB800" : "#D3D3D3",
                                                        marginRight: '2px'
                                                    }}>★</span>
                                                ))}
                                            </div>
                                            <p style={{ marginTop: "10px", color: "#555" }}>{existingReview.reviewComment}</p> */}
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#328d7d" }}>
                                                    {existingReview.recipient.user.firstName + " " + existingReview.recipient.user.lastName}
                                                </span>
                                                <span style={{ color: "#888", fontSize: "14px" }}>
                                                    {new Date(existingReview.reviewDate).toLocaleDateString('th-TH')}
                                                </span>
                                            </div>

                                            {/* ดาว */}
                                            <div style={{ marginLeft: "8px" }}>
                                                <div style={styles.ratingStarsContainer}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <span key={star} style={{
                                                            fontSize: '24px',
                                                            color: star <= existingReview.ratingScore ? "#FFB800" : "#D3D3D3",
                                                            // marginRight: '2px'
                                                        }}>★</span>
                                                    ))}
                                                </div>

                                                {/* 4. ข้อความรีวิว */}
                                                <p style={{ margin: "0", color: "#737373", lineHeight: "1.5" }}>
                                                    {existingReview.reviewComment}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        // กรณีที่ยังไม่รีวิว: แสดงฟอร์มให้กรอก
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
                                                <button onClick={handleReviewSubmit} style={{ ...styles.reviewButton, marginTop: "10px" }}>ส่งรีวิว</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </>

                    ) : (
                        <div style={styles.reviewCard}>
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
                                        <div style={{ marginLeft: "8px" }}>
                                            <div style={styles.ratingStarsContainer}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <span
                                                        key={star}
                                                        style={{
                                                            fontSize: '24px',
                                                            color: star <= (item?.ratingScore) ? "#FFB800" : "#D3D3D3",
                                                            margin: '0px',
                                                            cursor: 'default' // ป้องกันไม่ให้เมาส์ชี้แล้วเปลี่ยนรูป
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

                    {/* ปุ่มยกเลิกการจอง (วางไว้นอกกล่องแต่อยู่ใต้กล่อง ตามองค์ประกอบในรูป) */}
                    {isFromReceive && booking && booking.bookingStatus === "pending" && (
                        <button
                            type="button"
                            style={styles.cancelBookingBtn}
                            onClick={handleCancelBooking}
                        >
                            ยกเลิกการจอง
                        </button>
                    )}
                </div>

                {/* รายละเอียดข้อความ และ ข้อมูลเชิงพิกัดแผนที่ */}
                <div style={styles.rightColumn}>
                    <h1 style={styles.foodName}>{food.foodName}</h1>
                    <p style={styles.foodDescription}>{food.description}</p>
                    {/* <p style={styles.foodDescription}>{food.foodDescription || "ส้มสายน้ำผึ้ง คัดพิเศษ จากสวน บริจาคเป็นถุง"}</p> */}
                    <p style={styles.categoryText}>
                        <span style={styles.labelBold}>หมวดหมู่ :</span>
                        <span style={styles.categoryBadge}> {food.foodCateName} </span>
                        {/* <span style={styles.categoryBadge}> {food.category || "ของสด / วัตถุดิบ"}</span> */}
                    </p>

                    {/* รายการข้อมูลรายละเอียดเชิงไอคอน */}
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

                    {/* แผนที่จำลอง (Google Maps Embed พิกัดร้าน) */}
                    <div style={styles.mapWrapper}>
                        <GoogleMap
                            mapContainerStyle={{ width: "100%", height: "100%" }} // ให้ขยายเต็มกรอบสี่เหลี่ยมมล
                            center={{
                                lat: Number(food.latitude),
                                lng: Number(food.longitude)
                            }}                                 // เล็งจุดศูนย์กลางไปที่ตำแหน่งอาหาร
                            zoom={17}
                            options={{
                                gestureHandling: "cooperative", // ช่วยให้เลื่อนหน้าจอระบบสัมผัสบนมือถือได้ง่าย ไม่ติดหน้าต่างแมพ
                                fullscreenControl: true,       // ปิดปุ่มขยายหน้าจอใหญ่ (เลือกเปิด/ปิดตามดีไซน์มินิมอล)
                                mapTypeControl: false           // ปิดปุ่มสลับโหมดดาวเทียม เพื่อความคลีน
                            }}
                        >
                            {/* ปักหมุดสีแดงแสดงพิกัดอาหาร (ล็อกหมุดนิ่งๆ ห้ามลากเคลื่อนย้าย) */}
                            <Marker
                                position={{
                                    lat: Number(food.latitude),
                                    lng: Number(food.longitude)
                                }}
                                draggable={false}
                            />
                        </GoogleMap>
                    </div>

                    {/* ปุ่มกดจอง */}
                    {(!isFromReceive && !isOwner && !isFromManage) && (
                        <button
                            onClick={handleReserveClick}
                            disabled={food?.isCurrentByUserBooked}
                            style={{
                                ...styles.reserveBtn,
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
                <div style={{ display: 'flex', gap: '15px', marginTop: '20px', justifyContent: 'center' }}>
                    {/* ปุ่มย้อนกลับ: พื้นหลังสีเทาอ่อน ตัวหนังสือสีเข้ม */}
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
                            width: '200px'
                        }}
                    >
                        ย้อนกลับ
                    </button>

                    <button
                        onClick={() => handleToggleStatus(food)} // ส่ง object food ไปเพื่อเช็คสถานะในฟังก์ชัน
                        style={{
                            padding: '10px 25px',
                            borderRadius: '10px',
                            // เปลี่ยนสีขอบและสีตัวหนังสือตามสถานะ
                            border: food.foodStatus === 'disable'
                                ? '2px solid #219b54'
                                : '2px solid #ff4d4d',
                            backgroundColor: 'transparent',
                            color: food.foodStatus === 'disable'
                                ? '#219b54'
                                : '#ff4d4d',
                            cursor: 'pointer',
                            fontSize: '18px',
                            width: '200px'
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
        padding: "40px 20px",
        boxSizing: "border-box"
        // fontFamily: "'Kanit', sans-serif"
    },
    container: {
        // maxWidth: "1150px",
        // margin: "0 auto",
        // backgroundColor: "#FFFFFF",
        // borderRadius: "24px",
        // padding: "40px",
        display: "flex",
        gap: "60px",
        // boxShadow: "0 8px 24px rgba(0,0,0,0.03)"
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
        height: "360px",
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
        padding: "30px",
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
        // justifyContent: "between",
        justifyContent: "space-between",
        fontSize: "13px",
        color: "#888"
    },
    reviewerName: {
        // fontWeight: "bold",
        color: "#328d7d",
        fontSize: "14px",
    },
    stars: {
        margin: "6px 0",
        fontSize: "14px"
    },
    reviewContent: {
        margin: "6px 0 0 0",
        fontSize: "14px",
        color: "#555",
        lineHeight: "1.5"
    },
    ratingStarsContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '5px'
    },
    starItem: {
        fontSize: '28px',
        cursor: 'pointer',
        transition: 'color 0.2s ease-in-out',
        userSelect: 'none'
    },
    starButton: {
        background: 'none',
        border: 'none',
        padding: '0',
        fontSize: '28px',
        cursor: 'pointer',
        // transition: 'color 0.2s ease-in-out',
        outline: 'none',
    },
    ratingText: {
        fontSize: '14px',
        color: '#d9d9d9',
        marginLeft: '10px',
        fontWeight: '500'
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
        fontSize: "30px",
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
        color: "#ff8c00"
    },
    infoLabel: {
        fontSize: "15px",
        // fontWeight: "bold",
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
    mapIframe: {
        width: "100%",
        height: "100%",
        border: "none"
    },
    reserveBtn: {
        backgroundColor: "#ff8c00",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "12px",
        padding: "14px 0",
        fontSize: "18px",
        // fontWeight: "bold",
        cursor: "pointer",
        textAlign: "center",
        width: "50%",
        boxShadow: "0 6px 16px rgba(255, 138, 0, 0.25)",
        transition: "background-color 0.2s",
        alignSelf: "center"
    },

    bookingDetailCard: {
        backgroundColor: "#ffe8cc", // สีครีมส้มพาสเทลละมุน
        borderRadius: "24px",        // ขอบมนโค้งสวยงาม
        padding: "30px",
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
        // fontWeight: "bold",
        color: "#333333",
        width: "160px"              // ล็อกความกว้างเพื่อให้เครื่องหมาย : แนวตรงกันสวยงาม
    },
    bookingValue: {
        color: "#328d7d",           // สีเขียวพาสเทลเข้มตามภาพต้นฉบับ
        fontWeight: "500",
    },
    claimCodeContainer: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "16px",
        paddingTop: "6px"
    },
    claimCodeLabel: {
        fontSize: "24px",
        fontWeight: "bold",
        color: "#328d7d"            // รหัสยืนยันการจองสีเขียวหัวเป็ดพาสเทล
    },
    claimCodeValue: {
        fontSize: "36px",           // ขนาดตัวเลขรหัสใหญ่เด่นชัด
        fontWeight: "bold",
        color: "#ff8c00",           // ตัวเลขสีส้ม
        letterSpacing: "4px"        // เว้นช่องไฟตัวเลขให้ดูง่ายขึ้น
    },
    cancelBookingBtn: {
        backgroundColor: "#FFFFFF",
        color: "#ff3131",           // ตัวหนังสือสีแดง
        border: "3px solid #ff3131", // เส้นขอบสีแดงตามรูปภาพ
        borderRadius: "14px",        // ปุ่มขอบมน
        padding: "10px 0",
        fontSize: "18px",
        fontWeight: "500",
        cursor: "pointer",
        textAlign: "center",
        width: "45%",               // ขนาดปุ่มกะทัดรัด
        alignSelf: "center",        // จัดให้อยู่กึ่งกลางหน้าจอ
        marginTop: "20px",
    },
    headerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: '15px', // ระยะห่างระหว่างปุ่มกับเนื้อหาไข่ไก่ด้านล่าง
    },

    reportBtn: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'transparent', // พื้นหลังโปร่งใสเนียนไปกับหน้าจอ
        border: '2px solid #A0A0A0', // เส้นขอบสีเทาตามภาพ
        borderRadius: '12px',           // ความมนโค้งสไตล์มินิมอล
        padding: '8px 16px',           // ช่องว่างข้างในปุ่มให้ดูไม่เบียดเกินไป
        color: '#A0A0A0',              // สีตัวอักษรเทาเข้ม อ่านง่ายแต่ไม่แย่งซีน
        fontSize: '17px',              // ขนาดตัวอักษรกำลังดี
        fontWeight: '500',
        cursor: 'pointer',
        outline: 'none',
        // WebkitTapHighlightColor: 'transparent',
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
        width: "40%",
    }
};