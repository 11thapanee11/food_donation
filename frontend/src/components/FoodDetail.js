import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import Swal from "sweetalert2";

export default function FoodDetail() {
    // const { id } = useParams();
    const location = useLocation();
    // const foodId = location.state?.id;

    // ดึงค่าหน้าต้นทางมาตรวจสอบบริบทการแสดงผล
    const fromPage = location.state?.fromPage;
    const incomingId = location.state?.id; // อาจจะเป็น foodId หรือ bookingId ขึ้นอยู่กับหน้าต้นทาง
    const navigate = useNavigate();

    const [food, setFood] = useState(null);
    const [booking, setBooking] = useState(null);
    // const [bookingHistory, setBookingHistory] = useState([]); // สร้าง State เก็บประวัติผู้จองอาหาร
    const [loading, setLoading] = useState(true);

    const BASE_URL = "http://localhost:8082";

    // เช็กเงื่อนไขว่ามาจากหน้าจัดการรับบริจาคหรือไม่
    const isFromReceive = fromPage === "/receive";

    // useEffect(() => {
    //     window.scrollTo(0, 0);
    //     if (!incomingId) return;

    //     if (isFromReceive) {
    //         // เคสที่ 1: กดมาจากหน้ารับบริจาค (ค่าส่งมาคือ bookingId)
    //         fetch(`http://localhost:8082/bookings/${incomingId}`, {
    //             headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
    //         })
    //             .then((res) => {
    //                 if (!res.ok) throw new Error("ไม่พบรายละเอียดข้อมูลการจองนี้");
    //                 return res.json();
    //             })
    //             .then((bookingData) => {
    //                 setBooking(bookingData);      // เก็บ Object ใบจอง
    //                 setFood(bookingData.food);    // ดึง food ออกมาจากก้อน booking ได้เลย ไม่ต้องยิง API food ซ้ำให้ซ้อนกัน
    //             })
    //             .catch((err) => {
    //                 console.error("Error fetching booking:", err);
    //                 setFood(null);
    //             })
    //             .finally(() => setLoading(false));

    //     } else {
    //         // เคสที่ 2: กดมาจากหน้า Home / Map ทั่วไป (ค่าส่งมาคือ foodId)
    //         fetch(`http://localhost:8082/foods/${incomingId}`)
    //             .then((res) => {
    //                 if (!res.ok) throw new Error("ไม่พบข้อมูลอาหารรายการนี้");
    //                 return res.json();
    //             })
    //             .then((foodData) => {
    //                 setFood(foodData);
    //                 setBooking(null); // หน้าทั่วไปไม่ต้องมีข้อมูลการจอง
    //             })
    //             .catch((err) => console.error("Error fetching food:", err))
    //             .finally(() => setLoading(false));
    //     }
    // }, [incomingId, isFromReceive]);
    useEffect(() => {
        window.scrollTo(0, 0);
        if (!incomingId) return;

        if (isFromReceive) {
            // เคสที่ 1: กดมาจากหน้ารับบริจาค (ค่าส่งมาคือ bookingId)
            fetch(`http://localhost:8082/bookings/${incomingId}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
            })
                .then((res) => {
                    if (!res.ok) throw new Error("ไม่พบรายละเอียดข้อมูลการจองนี้");
                    return res.json();
                })
                .then((resData) => {
                    if (resData.success) {
                        setBooking(resData.data);
                        setFood(resData.data.food);
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
                .then((resData) => {
                    if (resData.success) {
                        setFood(resData.data);
                        setBooking(null);
                    } else {
                        throw new Error(resData.message || "ไม่พบข้อมูลอาหารรายการนี้");
                    }
                })
                .catch((err) => console.error("Error fetching food:", err))
                .finally(() => setLoading(false));
        }
    }, [incomingId, isFromReceive]);

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

    // const handleReserveClick = () => {
    //     Swal.fire({
    //         title: 'จองรายการอาหารบริจาาค',
    //         // text: 'กรุณากรอกจำนวนที่ต้องการจอง (ชิ้น/กล่อง):',
    //         html: `กรุณากรอกจำนวนที่ต้องการ จำกัดไม่เกิน ${food.limitPerPerson} <br />สามารถดูรหัสยืนยันได้รับที่รายการรับบริจาค`,
    //         input: 'number',
    //         inputAttributes: {
    //             min: '1',
    //             step: '1'
    //         },
    //         showCancelButton: true,
    //         confirmButtonText: 'ยืนยัน',
    //         cancelButtonText: 'ยกเลิก',
    //         confirmButtonColor: '#328d7d',
    //         cancelButtonColor: '#a0a0a0',
    //         buttonsStyling: true,
    //         reverseButtons: true,
    //         inputValidator: (value) => {
    //             // เขียนฟังก์ชันดักจับค่าว่างหรือเลข 0 ด้านในได้เลย
    //             if (!value || Number.parseInt(value) <= 0) {
    //                 return 'กรุณากรอกจำนวนเป็นตัวเลขที่มากกว่า 0';
    //             }

    //             const quantity = Number.parseInt(value);

    //             // ดักจับ: ห้ามกรอกเกิน Limit ที่กำหนดต่อคน
    //             if (food.limitPerPerson && quantity > food.limitPerPerson) {
    //                 return `ขออภัยครับ รายการนี้จำกัดสิทธิ์การจองไม่เกิน ${food.limitPerPerson} ชิ้นต่อคน`;
    //             }

    //             // ดักจับแถมให้อีกชั้น: ห้ามกรอกเกินยอดของที่มีอยู่จริงในคลังอาหารตอนนี้
    //             if (quantity > food.remainingUnit) {
    //                 return `ขออภัยครับ อาหารรายการนี้เหลือให้จองได้อีกเพียง ${food.remainingUnit} ชิ้นเท่านั้น`;
    //             }
    //         }
    //     }).then((result) => {
    //         // ถ้าผู้ใช้กรอกผ่านและกด "ยืนยัน"
    //         if (result.isConfirmed) {
    //             const quantity = Number.parseInt(result.value);

    //             // ดึง Token มาเพื่อระบุตัวตนคนจอง (ถ้าหลังบ้านระบบระบุตัวตนต้องการตรวจสอบสิทธิ์)
    //             const token = localStorage.getItem("accessToken");

    //             // แสดง Loading ป๊อปอัพหมุน ๆ ระหว่างส่งข้อมูลไปหลังบ้าน
    //             Swal.fire({
    //                 title: 'กำลังบันทึกการจอง...',
    //                 allowOutsideClick: false,
    //                 didOpen: () => {
    //                     Swal.showLoading();
    //                 }
    //             });

    //             // ยิง API ไปหา Spring Boot หลังบ้านโดยตรง
    //             fetch(`http://localhost:8082/bookings`, { // เปลี่ยน URL เส้นทางของ API จองให้ตรงกับหลังบ้านของคุณนะครับ
    //                 method: "POST",
    //                 headers: {
    //                     "Content-Type": "application/json",
    //                     "Authorization": token ? `Bearer ${token}` : "" // แนบพาสปอร์ตยืนยันตัวตนคนกดจอง
    //                 },
    //                 body: JSON.stringify({
    //                     foodId: food.foodId,       // ไอดีอาหารที่จอง
    //                     quantity: quantity         // จำนวนอาหารที่กรอกเข้ามาจากป๊อปอัพ
    //                 })
    //             })
    //                 .then(async (res) => {
    //                     if (!res.ok) {
    //                         throw new Error("ไม่สามารถบันทึกข้อมูลการจองได้ กรุณาลองใหม่อีกครั้ง");
    //                     }
    //                     return res.json();
    //                 })
    //                 .then((data) => {
    //                     // แจ้งเตือนเมื่อจองอาหารสำเร็จ สไตล์พาสเทลน่ารัก
    //                     Swal.fire({
    //                         title: 'จองสำเร็จเรียบร้อย!',
    //                         text: 'รายการอาหารของคุณถูกล็อกสิทธิ์เรียบร้อยแล้ว',
    //                         icon: 'success',
    //                         confirmButtonColor: '#328d7d', // สีเขียวพาสเทลคู่ใจ
    //                     }).then(() => {
    //                         // หลังกดรับทราบ สามารถเลือกสั่งรีเฟรชหน้าจอ หรือเปลี่ยนหน้าไปดูประวัติการจองได้ครับ
    //                         // window.location.reload(); // ตัวอย่าง: รีเฟรชข้อมูลอาหารใหม่
    //                         navigate('/receive')
    //                     });
    //                 })
    //                 .catch((err) => {
    //                     // แจ้งเตือนเมื่อเกิดข้อผิดพลาด (เช่น ของหมด หรือระบบหลังบ้านขัดข้อง)
    //                     Swal.fire({
    //                         title: 'เกิดข้อผิดพลาด',
    //                         text: err.message,
    //                         icon: 'error',
    //                         confirmButtonColor: '#e57373', // สีแดงพาสเทลซอฟต์ ๆ
    //                     });
    //                 });
    //         }
    //     });
    // }
    const handleReserveClick = () => {
        Swal.fire({
            title: 'จองรายการอาหารบริจาค',
            html: `กรุณากรอกจำนวนที่ต้องการ จำกัดไม่เกิน ${food.limitPerPerson} <br />สามารถดูรหัสยืนยันได้รับที่รายการรับบริจาค`,
            input: 'number',
            inputAttributes: {
                min: '1',
                step: '1'
            },
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#328d7d',
            cancelButtonColor: '#a0a0a0',
            buttonsStyling: true,
            reverseButtons: true,
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
                        foodId: food.foodId,
                        quantity: quantity
                    })
                })
                    .then((res) => {
                        if (!res.ok) {
                            throw new Error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
                        }
                        return res.json();
                    })
                    .then((resData) => { // 💡 1. ปรับเป็นชื่อ resData ให้ตรงจริตชุดข้อมูลห่อหุ้ม API
                        // 💡 2. ตรวจสอบเงื่อนไขตัวแปร success จากหลังบ้านจริง ๆ
                        if (resData.success) {
                            Swal.fire({
                                title: 'จองสำเร็จเรียบร้อย!',
                                text: resData.message || 'รายการอาหารของคุณถูกล็อกสิทธิ์เรียบร้อยแล้ว',
                                icon: 'success',
                                confirmButtonColor: '#328d7d',
                            }).then(() => {
                                navigate('/receive');
                            });
                        } else {
                            // 💡 3. ถ้าหลังบ้านบอกว่าจองไม่ผ่าน (เช่น โควต้าเต็มพอดี) ให้โยนข้อความไปแสดงที่บล็อกแจ้งเตือนด้านล่าง
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

    // const handleCancelBooking = () => {
    //     if (!booking) return;

    //     // ดึงไอดีใบจองออกมาใช้ (เช็กตามชื่อคีย์ที่หลังบ้านส่งมา เช่น bookingId หรือ id)
    //     const bookingId = booking.bookingId || booking.id;

    //     Swal.fire({
    //         title: 'ยืนยันการยกเลิกการจอง?',
    //         // text: "คุณต้องการยกเลิกสิทธิ์การจองอาหารรายการนี้ใช่หรือไม่",
    //         html: 'คุณต้องการยกเลิกการจองใช่หรือไม่? </br>หากยกเลิก การจองของคุณจะถูกลบออกจากระบบ',
    //         showCancelButton: true,
    //         confirmButtonColor: '#ff3131',
    //         cancelButtonColor: '#a0a0a0',
    //         confirmButtonText: 'ยืนยันการยกเลิก',
    //         cancelButtonText: 'ยกเลิก',
    //         reverseButtons: true,
    //     }).then((result) => {
    //         if (result.isConfirmed) {
    //             // แสดง Loading ระหว่างลบข้อมูล
    //             Swal.fire({
    //                 title: 'กำลังดำเนินการยกเลิก...',
    //                 allowOutsideClick: false,
    //                 didOpen: () => {
    //                     Swal.showLoading();
    //                 }
    //             });

    //             // ยิง API เส้น DELETE ไปที่หลังบ้าน (หรือปรับ URL ตาม Controller หลังบ้านของคุณนะครับ)
    //             fetch(`http://localhost:8082/bookings/${bookingId}/cancel`, {
    //                 method: "PUT", // ✨ เปลี่ยนจาก DELETE เป็น PUT
    //                 headers: {
    //                     "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
    //                 }
    //             })
    //                 .then((res) => {
    //                     if (!res.ok) throw new Error("ไม่สามารถยกเลิกการจองได้ กรุณาลองใหม่อีกครั้ง");
    //                     // หลังบ้านบางที่ส่งกลับมาเป็นข้อความธรรมดา หรือ JSON ว่าง ให้เช็กตามความเหมาะสมครับ
    //                     return res.text();
    //                 })
    //                 .then(() => {
    //                     Swal.fire({
    //                         title: 'ยกเลิกการจองสำเร็จ!',
    //                         text: 'ระบบได้คืนสิทธิ์จำนวนอาหารเข้าสู่คลังเรียบร้อยแล้ว',
    //                         icon: 'success',
    //                         confirmButtonColor: '#2d7d71'
    //                     }).then(() => {
    //                         // วาร์ปกลับไปหน้าประวัติการรับบริจาค หรือหน้า /receive ของคุณ
    //                         navigate('/receive');
    //                     });
    //                 })
    //                 .catch((err) => {
    //                     Swal.fire({
    //                         title: 'เกิดข้อผิดพลาด',
    //                         text: err.message,
    //                         icon: 'error',
    //                         confirmButtonColor: '#ff4d4d'
    //                     });
    //                 });
    //         }
    //     });
    // };
    const handleCancelBooking = () => {
        if (!booking) return;

        // ดึงไอดีใบจองออกมาใช้
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

                // ยิง API เส้น PUT เพื่อยกเลิกรายการ
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
                                text: resData.message || 'ระบบได้คืนสิทธิ์จำนวนอาหารเข้าสู่คลังเรียบร้อยแล้ว',
                                icon: 'success',
                                confirmButtonColor: '#2d7d71'
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

    return (
        <div style={styles.page}>
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
                        <span> {food.donor.firstName} {food.donor.lastName}</span>
                    </p>

                    {/* กล่องรีวิวจากผู้รับบริจาค (ตามดีไซน์สีพาสเทล) */}
                    {/* <div style={styles.reviewCard}>
                        <h4 style={styles.reviewTitle}>รีวิวจากผู้รับบริจาค</h4>
                        <div style={styles.reviewHeader}>
                            <span style={styles.reviewerName}>เพิ่มพูน</span>
                            <span style={styles.reviewDate}>20/03/2569</span>
                        </div>
                        <div style={styles.stars}>⭐⭐⭐⭐⭐</div>
                        <p style={styles.reviewContent}>
                            ส้มอร่อยมากก! ขอบคุณผู้บริจาคใจดีที่แบ่งปันความสดชื่นให้นะคะ ได้ทั้งทานอร่อยและรักษ์โลกด้วย
                        </p>
                    </div> */}

                    {/* CONDITIONAL RENDERING: สลับการแสดงผลตรงนี้ */}
                    {isFromReceive ? (
                        /* บล็อกประวัติการจอง (สำหรับผู้ตั้งรับบริจาคที่กดเข้ามาดู) */
                        <div style={styles.bookingDetailCard}>
                            <h3 style={styles.bookingCardTitle}>รายละเอียดการจอง</h3>

                            {!booking ? (
                                <p style={{ fontSize: "14px", color: "#666" }}>📦 ไม่พบรายละเอียดข้อมูลการจองนี้</p>
                            ) : (
                                <div style={styles.bookingBody}>
                                    <p style={styles.bookingRow}>
                                        <span style={styles.bookingLabel}>จำนวนที่รับบริจาค :</span>
                                        <span style={styles.bookingValue}> {booking.bookingUnit}</span>
                                    </p>
                                    <p style={styles.bookingRow}>
                                        <span style={styles.bookingLabel}>น้ำหนักที่รับบริจาค :</span>
                                        {/* คำนวณน้ำหนักรวม: เอาจำนวนที่จอง x น้ำหนักต่อหน่วยของอาหาร */}
                                        <span style={styles.bookingValue}>
                                            {booking.bookingWeightKg} Kg
                                        </span>
                                    </p>
                                    <p style={styles.bookingRow}>
                                        <span style={styles.bookingLabel}>วันที่ทำการจอง :</span>
                                        {/* ใช้ฟังก์ชันฟอร์แมตวันที่ที่มีอยู่แล้วในหน้าจอ */}
                                        <span style={styles.bookingValue}> {formatExpiryDate(booking.bookingDate || booking.createdAt)}</span>
                                    </p>

                                    {/* ส่วนแสดงรหัสยืนยันตัวใหญ่เด่นชัด */}
                                    <div style={styles.claimCodeContainer}>
                                        <span style={styles.claimCodeLabel}>รหัสยืนยันการจอง</span>
                                        <span style={styles.claimCodeValue}>
                                            {booking.confirmationCode || "000000"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* กล่องรีวิวส้มพาสเทลเดิม (สำหรับผู้ใช้ทั่วไปเปิดดูจาก Home/Map) */
                        <div style={styles.reviewCard}>
                            <h4 style={styles.reviewTitle}>รีวิวจากผู้รับบริจาค</h4>
                            <div style={styles.reviewHeader}>
                                <span style={styles.reviewerName}>เพิ่มพูน</span>
                                <span style={styles.reviewDate}>20/03/2569</span>
                            </div>
                            <div style={styles.stars}>⭐⭐⭐⭐⭐</div>
                            <p style={styles.reviewContent}>
                                ส้มอร่อยมากก! ขอบคุณผู้บริจาคใจดีที่แบ่งปันความสดชื่นให้นะคะ ได้ทั้งทานอร่อยและรักษ์โลกด้วย
                            </p>
                        </div>
                    )}

                    {/* ปุ่มยกเลิกการจอง (วางไว้นอกกล่องแต่อยู่ใต้กล่อง ตามองค์ประกอบในรูป) */}
                    {isFromReceive && booking && booking.bookingStatus === "PENDING" && (
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
                        <span style={styles.categoryBadge}> {food.category || "ของสด / วัตถุดิบ"}</span>
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
                                <div style={styles.infoValue}>{food.peopleCountPerMeal === 0 ? "-" : food.peopleCountPerMeal} คน</div>
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
                    {!isFromReceive && (
                        <button type="button" style={styles.reserveBtn} onClick={handleReserveClick}>
                            จองรายการอาหาร
                        </button>
                    )}
                    {/* <button
                        style={styles.reserveBtn}
                        onClick={handleReserveClick} // เรียกใช้ฟังก์ชันด้านบน
                    >
                        จองรายการอาหาร
                    </button> */}
                </div>

            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        padding: "40px 20px",
        // fontFamily: "'Kanit', sans-serif"
    },
    container: {
        maxWidth: "1150px",
        margin: "0 auto",
        // backgroundColor: "#FFFFFF",
        borderRadius: "24px",
        // padding: "40px",
        display: "flex",
        gap: "60px",
        // boxShadow: "0 8px 24px rgba(0,0,0,0.03)"
    },
    centerPage: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        fontSize: "18px",
        color: "#666"
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
        fontSize: "16px",
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

    // ส่วนที่เพิ่มขึ้นมาใหม่สำหรับตารางรายชื่อจองอาหารแบบคลีน ๆ พาสเทลเขียวมิ้นต์
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
        fontSize: "20px",
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
    }
};