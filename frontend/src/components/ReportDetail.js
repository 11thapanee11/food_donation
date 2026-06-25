import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

export default function ReportDetail() {
    const { state } = useLocation();
    const location = useLocation();
    const { id } = location.state || {};

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        if (!id) return;

        const loadDataAndUpdateStatus = async () => {
            setLoading(true);
            try {
                // 1. ดึงข้อมูลรายงานก่อน
                const reportRes = await fetch(`http://localhost:8082/report/${id}`);
                const reportResponse = await reportRes.json();
                let reportData = reportResponse.data;

                // 2. ถ้าสถานะยังเป็น WAITING ให้สั่งเปลี่ยนเป็น CHECKED ก่อนแสดงผล
                if (reportData.status === 'pending') {
                    const updateRes = await fetch(`http://localhost:8082/report/${id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: "checked" })
                    });
                    const updateResult = await updateRes.json();

                    if (updateResult.success) {
                        reportData = updateResult.data; // อัปเดตข้อมูลเป็นชุดล่าสุดที่มีสถานะ CHECKED แล้ว
                    }
                }

                // 3. ดึงข้อมูล Food/Booking ต่อ
                if (reportData.foodId || reportData.bookingId) {
                    const fetchFood = reportData.foodId ? fetch(`http://localhost:8082/foods/${reportData.foodId}`).then(r => r.json()) : Promise.resolve(null);
                    const fetchBooking = reportData.bookingId ? fetch(`http://localhost:8082/bookings/${reportData.bookingId}`).then(r => r.json()) : Promise.resolve(null);

                    const [foodRes, bookingRes] = await Promise.all([fetchFood, fetchBooking]);

                    reportData = {
                        ...reportData,
                        foodDetail: foodRes?.data || foodRes,
                        bookingDetail: bookingRes?.data || bookingRes
                    };
                }

                setReport(reportData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadDataAndUpdateStatus();
    }, [id]);

    const handleAction = async (actionType) => {
        const isFood = actionType === 'food';
        const actionLabel = isFood ? "ปิดการแสดงอาหาร" : "ระงับบัญชีผู้ใช้";

        if (isFood && report.foodDetail.foodStatus === 'disable') {
            Swal.fire('อาหารรายการนี้ถูกปิดการแสดงผลไปแล้ว', '', 'info');
            return;
        }
        if (!isFood && report.donorStatus === 'deactivate') {
            Swal.fire('บัญชีผู้ใช้งานนี้ถูกระงับไปแล้ว', '', 'info');
            return;
        }

        // 1. ใช้ Swal.fire แทน window.confirm
        const result = await Swal.fire({
            title: `ยืนยันการ${actionLabel}?`,
            // text: `รายการ: ${targetName || 'ไม่ระบุชื่อ'}`,
            icon: 'warning',
            iconColor: '#d33',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#a0a0a0',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return; // ถ้ากดยกเลิก ให้จบฟังก์ชัน

        try {
            const token = localStorage.getItem("accessToken");
            const endpoint = isFood
                ? `http://localhost:8082/foods/${report.foodDetail.id}/status`
                : `http://localhost:8082/donor/${report.foodDetail.donorId}/status`;

            const statusToSend = isFood ? 'disable' : 'deactivate';

            const res = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: statusToSend
                })
            });

            if (res.ok) {
                await Swal.fire({
                    title: `${actionLabel}เรียบร้อยแล้ว`,
                    icon: 'success',
                    showCancelButton: false,
                    confirmButtonColor: '#2ecc71',
                    confirmButtonText: 'ยืนยัน',
                });
                navigate('/manage-report');
            } else {
                throw new Error("เกิดข้อผิดพลาดจากฝั่ง Server");
            }
        } catch (err) {
            // 3. ใช้ Swal.fire แทน alert แจ้งเตือนข้อผิดพลาด
            Swal.fire({
                title: 'ผิดพลาด!',
                text: err.message,
                icon: 'error'
            });
        }
    };

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

    const REASON_MAP = {
        "EXPIRED": "อาหารหมดอายุ",
        "NOT_MATCH": "ข้อมูลไม่ตรงปก",
        "SPOILED": "อาหารมีกลิ่นหรือสภาพผิดปกติ",
        "OTHER": "อื่นๆ"
    };

    if (loading) return <div style={styles.loading}>กำลังโหลด...</div>;
    if (error) return <div style={styles.error}>เกิดข้อผิดพลาด: {error}</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.mainTitle}>รายละเอียดรายงานปัญหา</h2>

            <div style={styles.contentWrapper}>
                {/* ส่วนรูปภาพ */}
                <div style={styles.imageSection}>
                    <img
                        src={`http://localhost:8082${report.foodDetail?.foodImage}`}
                        alt="Problem"
                        style={styles.mainImage}
                    />
                    {/* <div style={styles.donorInfo}>
                        <p>บริจาคโดย: {report.foodDetail?.donorName}</p>
                        <h3>{report.foodDetail?.foodName}</h3>
                        <p>{report.foodDescription}</p>
                    </div> */}
                    <div style={styles.infoList}>
                        <p style={{ fontSize: "18px", marginTop: "16px", marginBottom: "0", color: "#333" }}>
                            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>บริจาคโดย</span>
                            <span> {report.foodDetail?.donorName}</span>
                            {/* <span> {getDonorName()}</span> */}
                        </p>
                        <span style={{ fontSize: "22px", fontWeight: "bold", color: "#333", margin: "0" }}>
                            {report.foodDetail?.foodName}
                        </span>
                        <span style={{ fontSize: "17px", color: "#7c7c7c", margin: "0" }}>
                            {report.foodDetail?.description}
                        </span>
                        <p style={{ fontSize: "18px", margin: "0px", marginBottom: "0", color: "#333" }}>
                            <span style={{ color: "#ff8c00", fontWeight: "bold" }}>หมวดหมู่ : </span>
                            <span> {report.foodDetail?.foodCateName}</span>
                        </p>
                        <div style={styles.infoRow}>
                            <span className="material-symbols-outlined" style={styles.icon}>
                                calendar_clock
                            </span>
                            <div>
                                <div style={styles.infoLabel}>วันหมดอายุ</div>
                                <div style={styles.infoValue}>{formatExpiryDate(report.foodDetail?.expiryDate)} น.</div>
                            </div>
                        </div>

                        <div style={styles.infoRow}>
                            <span className="material-symbols-outlined" style={styles.icon}>
                                scale
                            </span>
                            <div>
                                <div style={styles.infoLabel}>น้ำหนักต่อหน่วยที่บริจาค</div>
                                <div style={styles.infoValue}>{report.foodDetail?.unitWeightKg} Kg</div>
                            </div>
                        </div>

                        <div style={styles.infoRow}>
                            <span className="material-symbols-outlined" style={styles.icon}>
                                package_2
                            </span>
                            <div>
                                <div style={styles.infoLabel}>จำนวนที่บริจาค และ คงเหลือ</div>
                                <div style={styles.infoValue}>{report.foodDetail?.totalUnit} : {report.foodDetail?.remainingUnit}</div>
                            </div>
                        </div>

                        <div style={styles.infoRow}>
                            <span className="material-icons" style={styles.icon}>
                                person
                            </span>
                            <div>
                                <div style={styles.infoLabel}>จำนวนคนที่เหมาะต่อการบริโภค</div>
                                <div style={styles.infoValue}>{report.foodDetail?.peopleCountPerMeal === null ? "ไม่ระบุ" : report.foodDetail?.peopleCountPerMeal} คน</div>
                            </div>
                        </div>

                        <div style={styles.infoRow}>
                            <span className="material-icons" style={styles.icon}>
                                location_on
                            </span>
                            <div>
                                <div style={styles.infoLabel}>ที่อยู่</div>
                                <div style={styles.infoValue}>{report.foodDetail?.address}</div>
                            </div>
                        </div>

                        <div style={styles.infoRow}>
                            <span className="material-icons-outlined" style={styles.icon}>
                                access_time
                            </span>
                            <div>
                                <div style={styles.infoLabel}>วันและเวลาที่สามารถรับได้</div>
                                <div style={styles.infoValue}>
                                    {formatPickupDate(report.foodDetail?.pickupDateStart)} - {formatPickupDate(report.foodDetail?.pickupDateEnd)}
                                    <br />
                                    {formatPickupTime(report.foodDetail?.pickupStartTime)} น. - {formatPickupTime(report.foodDetail?.pickupEndTime)} น.
                                </div>
                            </div>
                        </div>

                        <div style={styles.infoRow}>
                            <span className="material-symbols-outlined" style={styles.icon}>
                                hand_package
                            </span>
                            <div>
                                <div style={styles.infoLabel}>จำนวนจำกัดต่อคน</div>
                                <div style={styles.infoValue}>{report.foodDetail?.limitPerPerson} </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ส่วนรายละเอียดและการจัดการ */}
                <div style={styles.actionSection}>
                    <div style={styles.bookingDetailCard}>
                        <h3 style={styles.bookingCardTitle}>รายละเอียดการจอง</h3>
                        <div style={styles.bookingBody}>
                            <p style={styles.bookingRow}>
                                <span style={styles.bookingLabel}>จำนวนที่รับบริจาค :</span>
                                <span style={styles.bookingValue}> {report.bookingDetail?.bookingUnit}</span>
                            </p>
                            <p style={styles.bookingRow}>
                                <span style={styles.bookingLabel}>น้ำหนักที่รับบริจาค :</span>
                                <span style={styles.bookingValue}>
                                    {report.bookingDetail?.bookingWeightKg} Kg
                                </span>
                            </p>
                            <p style={styles.bookingRow}>
                                <span style={styles.bookingLabel}>วันที่ทำการจอง :</span>
                                <span style={styles.bookingValue}> {formatExpiryDate(report.bookingDetail?.bookingDate)} น.</span>
                            </p>

                        </div>
                    </div>

                    <div style={styles.reportSection}>
                        <div style={styles.reportContent}>
                            <p style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '0' }}>รายงานปัญหาเกี่ยวกับบริจาคนี้</p>
                            <p><strong>เหตุผลในการรายงาน</strong></p>
                            <p style={{ marginLeft: '10px' }}>{REASON_MAP[report.reason]}</p>
                            <p><strong>รายละเอียดเพิ่มเติม</strong></p>
                            <p style={{ marginLeft: '10px', marginBottom: '0' }}>{report.description}</p>
                            <p><strong>รูปภาพหลักฐาน (ถ้ามี)</strong></p>
                            <div>{report.reportImage ? <img
                                src={`http://localhost:8082${report.reportImage}`}
                                alt="Problem"
                                style={styles.reportImage}
                            /> : <p style={{ marginLeft: '10px' }}>-</p>}</div>
                        </div>

                        {/* ปุ่มจัดการ */}
                        <div style={styles.buttonGroup}>
                            <button
                                style={styles.btnDeactivate}
                                onClick={() => handleAction('food')}
                            >
                                ปิดการแสดงอาหารบริจาค
                            </button>
                            <button
                                style={styles.btnSuspend}
                                onClick={() => handleAction('user')}
                            >
                                ระงับบัญชีผู้ใช้งาน
                            </button>
                            <button
                                style={styles.btnCancel}
                                onClick={() => navigate(-1)}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "20px 20px"
    },
    mainTitle: {
        color: "#333",
        fontSize: "30px",
        fontWeight: "bold",
        marginBottom: "20px"
    },
    contentWrapper: {
        display: 'flex',
        gap: '40px',
        padding: '0 20px',
    },
    imageSection: { flex: 1 },
    actionSection: {
        flex: 1,
    },
    reportSection: {
        border: "3px solid #ddd",
        borderRadius: "15px",
        padding: "30px",
    },
    mainImage: { width: '100%', borderRadius: '15px' },
    reportImage: { width: '100%', borderRadius: '15px', },
    buttonGroup: {
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',

    },
    btnDeactivate: {
        width: '60%',
        padding: '12px',
        backgroundColor: '#000', // ปุ่มสีดำให้ดูเป็นทางการ
        color: '#fff',
        borderRadius: '8px',
        border: 'none',
        marginBottom: '10px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    btnSuspend: {
        width: '60%',
        padding: '12px',
        backgroundColor: '#ff4d4f', // สีแดงเตือน
        color: '#fff',
        borderRadius: '8px',
        border: 'none',
        marginBottom: '10px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    btnCancel: {
        width: '60%',
        padding: '12px',
        backgroundColor: '#d9d9d9',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px'
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
    bookingDetailCard: {
        backgroundColor: "#ffe8cc", // สีครีมส้มพาสเทลละมุน
        borderRadius: "15px",        // ขอบมนโค้งสวยงาม
        padding: "30px",
        marginBottom: "20px",
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
};