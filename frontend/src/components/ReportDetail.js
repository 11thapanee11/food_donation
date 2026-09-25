import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from "react-router-dom";

export default function ReportDetail() {
    const location = useLocation();
    const { id } = location.state || {};

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "warning",
        onConfirm: null
    });

    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchReport = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const reportRes = await fetch(`http://localhost:8082/report/${id}`);
            const reportResponse = await reportRes.json();
            let reportData = reportResponse.data;

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
    }, [id]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const isFoodDisabled = report?.foodDetail?.foodStatus === 'disable';
    const isChecked = report?.reportStatus === 'checked';

    // ฟังก์ชันจัดการปิดการแสดงผลอาหาร (ปิดแล้วปิดเลย เปิดใหม่ไม่ได้)
    const handleDisableFood = () => {
        if (isFoodDisabled) return;

        setModalConfig({
            isOpen: true,
            title: "ยืนยันการปิดการแสดงรายการอาหาร?",
            message: "คำเตือน: หากปิดการแสดงผลรายการอาหารนี้แล้ว จะไม่สามารถเปิดกลับมาแสดงใหม่อีกได้ คุณต้องการดำเนินการต่อหรือไม่",
            type: "warning",
            onConfirm: () => executeFoodStatusUpdate("disable")
        });
    };

    const executeFoodStatusUpdate = async (nextStatus) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`http://localhost:8082/foods/${report.foodDetail.id}/status`, {
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: nextStatus })
            });

            if (res.ok) {
                setModalConfig({
                    isOpen: true,
                    title: "สำเร็จ!",
                    message: "ปิดการแสดงรายการอาหารเรียบร้อยแล้ว (ไม่สามารถเปิดใช้งานซ้ำได้)",
                    type: "success",
                    onConfirm: () => {
                        setModalConfig({ isOpen: false });
                        fetchReport();
                    }
                });
            } else {
                throw new Error("เกิดข้อผิดพลาดจากฝั่ง Server");
            }
        } catch (err) {
            setModalConfig({
                isOpen: true,
                title: "เกิดข้อผิดพลาด!",
                message: err.message,
                type: "error",
                onConfirm: () => setModalConfig({ isOpen: false })
            });
        }
    };

    // ฟังก์ชันกดทำเครื่องหมายว่าตรวจสอบแล้ว (ล็อกสถานะไม่ให้เปลี่ยนกลับ)
    const handleMarkAsChecked = () => {
        if (isChecked) return;

        setModalConfig({
            isOpen: true,
            title: "ยืนยันการเปลี่ยนสถานะ?",
            message: "คุณต้องการทำเครื่องหมายเคสนี้ว่า 'ตรวจสอบแล้ว' ใช่หรือไม่ (ไม่สามารถเปลี่ยนกลับเป็นรอดำเนินการได้)",
            type: "warning",
            onConfirm: () => executeReportStatusUpdate("checked")
        });
    };

    const executeReportStatusUpdate = async (nextStatus) => {
        try {
            const res = await fetch(`http://localhost:8082/report/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus })
            });

            if (res.ok) {
                setModalConfig({
                    isOpen: true,
                    title: "สำเร็จ!",
                    message: "บันทึกสถานะการตรวจสอบเรียบร้อยแล้ว",
                    type: "success",
                    onConfirm: () => {
                        setModalConfig({ isOpen: false });
                        fetchReport();
                    }
                });
            } else {
                throw new Error("ไม่สามารถอัปเดตสถานะรายงานได้");
            }
        } catch (err) {
            setModalConfig({
                isOpen: true,
                title: "เกิดข้อผิดพลาด!",
                message: err.message,
                type: "error",
                onConfirm: () => setModalConfig({ isOpen: false })
            });
        }
    };

    const formatExpiryDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
        const formattedTime = date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });
        return `${formattedDate} ${formattedTime}`;
    };

    const formatPickupDate = (dateString) => {
        if (!dateString) return "-";
        const cleanDate = dateString.split("T")[0];
        const date = new Date(cleanDate);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
    };

    const formatPickupTime = (timeString) => {
        if (!timeString) return "-";
        return timeString.substring(0, 5);
    };

    const REASON_MAP = {
        "EXPIRED": "อาหารหมดอายุ",
        "SPOILED": "อาหารมีกลิ่นและสภาพผิดปกติ",
        "NOT_MATCH": "รายละเอียดอาหารไม่ตรงกับความเป็นจริง",
        "HYGIENE_ISSUE": "ปัญหาด้านความสะอาดหรือบรรจุภัณฑ์ชำรุดเสียหาย",
        "OTHER": "ปัญหาอื่นๆ ทั่วไป"
    };

    if (loading) return (
        <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>กำลังโหลดรายละเอียดรายงาน...</p>
        </div>
    );
    if (error) return <div style={styles.error}>เกิดข้อผิดพลาด: {error}</div>;
    if (!report) return null;

    const reporterName = report.reporterName || report.userName || "คุณสมชาย ใจดี";
    const reportDate = report.reportDate ? formatExpiryDate(report.reportDate) : "26 กันยายน 2569 - 14:30 น.";

    return (
        <div style={styles.fullWidthBackground}>
            <div style={styles.contentContainer}>
                {/* ส่วนหัว */}
                <div style={styles.headerContainer}>
                    <div style={styles.topBadge}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>report_problem</span>
                        การจัดการระบบ
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            <h2 style={{ ...styles.mainTitle, fontSize: isMobile ? "22px" : "26px" }}>รายละเอียดรายงานปัญหา</h2>
                            <p style={styles.subHeaderDesc}>ตรวจสอบข้อมูลเชิงลึกของปัญหา รายการอาหาร และดำเนินการบริหารจัดการเคส</p>
                        </div>
                        <span style={{
                            ...styles.statusHeaderBadge,
                            backgroundColor: isChecked ? '#F1F5F9' : '#FEF3C7',
                            color: isChecked ? '#64748B' : '#D97706'
                        }}>
                            {isChecked ? 'ตรวจสอบแล้ว' : 'รอดำเนินการ'}
                        </span>
                    </div>
                </div>

                {/* แบนเนอร์ข้อมูลผู้รายงาน */}
                <div style={styles.reporterBannerCard}>
                    <div style={styles.reporterInfoItem}>
                        <span className="material-symbols-outlined" style={styles.bannerIcon}>person</span>
                        <div>
                            <span style={styles.bannerLabel}>ผู้แจ้งรายงานปัญหา</span>
                            <div style={styles.bannerValue}>{reporterName}</div>
                        </div>
                    </div>
                    <div style={styles.reporterDivider}></div>
                    <div style={styles.reporterInfoItem}>
                        <span className="material-symbols-outlined" style={styles.bannerIcon}>calendar_month</span>
                        <div>
                            <span style={styles.bannerLabel}>วันและเวลาที่รายงาน</span>
                            <div style={styles.bannerValue}>{reportDate}</div>
                        </div>
                    </div>
                </div>

                {/* โครงสร้างเลย์เอ้าต์หลัก 2 คอลัมน์ */}
                <div style={{ ...styles.contentWrapper, flexDirection: isMobile ? "column" : "row", gap: "24px" }}>
                    
                    {/* คอลัมน์ซ้าย: รายละเอียดปัญหาที่แจ้ง + ข้อมูลการขอรับบริจาค */}
                    <div style={styles.columnSection}>
                        {/* การ์ดรายละเอียดปัญหา */}
                        <div style={styles.cardBox}>
                            <h3 style={styles.cardSectionTitle}>
                                <span className="material-symbols-outlined" style={styles.sectionTitleIcon}>error</span>
                                รายละเอียดปัญหาที่แจ้ง
                            </h3>
                            <div style={styles.reportContent}>
                                <div style={styles.reportItemBlock}>
                                    <span style={styles.reportLabelTitle}>หัวข้อปัญหา:</span>
                                    <span style={styles.reportHighlightText}>{REASON_MAP[report.reason] || report.reason}</span>
                                </div>
                                <div style={styles.reportItemBlock}>
                                    <span style={styles.reportLabelTitle}>คำอธิบายเพิ่มเติมจากผู้แจ้ง:</span>
                                    <p style={styles.reportDescText}>{report.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
                                </div>
                                <div style={styles.reportItemBlock}>
                                    <span style={styles.reportLabelTitle}>รูปภาพหลักฐานปัญหา:</span>
                                    <div style={{ marginTop: '8px' }}>
                                        {report.reportImage ? (
                                            <img
                                                src={`http://localhost:8082${report.reportImage}`}
                                                alt="Evidence"
                                                style={styles.reportImage}
                                            />
                                        ) : (
                                            <span style={{ color: '#94A3B8', fontSize: '13px' }}>- ไม่มีรูปภาพหลักฐาน -</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* การ์ดข้อมูลการขอรับบริจาค */}
                        <div style={styles.cardBox}>
                            <h3 style={styles.cardSectionTitle}>
                                <span className="material-symbols-outlined" style={styles.sectionTitleIcon}>bookmark_added</span>
                                ข้อมูลการขอรับบริจาค
                            </h3>
                            <div style={styles.metaBody}>
                                <div style={styles.metaRow}>
                                    <span style={styles.metaLabel}>จำนวนที่ขอรับ :</span>
                                    <span style={styles.metaValue}>{report.bookingDetail?.bookingUnit || 0} หน่วย</span>
                                </div>
                                <div style={styles.metaRow}>
                                    <span style={styles.metaLabel}>น้ำหนักที่ขอรับ :</span>
                                    <span style={styles.metaValue}>
                                        {report.bookingDetail?.bookingWeightKg ? Number(report.bookingDetail.bookingWeightKg).toFixed(2) : '0.00'} กิโลกรัม
                                    </span>
                                </div>
                                <div style={styles.metaRow}>
                                    <span style={styles.metaLabel}>วันที่ทำการขอรับ :</span>
                                    <span style={styles.metaValue}>{formatExpiryDate(report.bookingDetail?.bookingDate)} น.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* คอลัมน์ขวา: ข้อมูลรายการอาหารที่มีปัญหา */}
                    <div style={styles.columnSection}>
                        <div style={styles.cardBox}>
                            <h3 style={styles.cardSectionTitle}>
                                <span className="material-symbols-outlined" style={styles.sectionTitleIcon}>fastfood</span>
                                ข้อมูลรายการอาหาร
                            </h3>
                            <img
                                src={`http://localhost:8082${report.foodDetail?.foodImage}`}
                                alt="Food"
                                style={styles.mainImage}
                            />
                            <div style={styles.infoList}>
                                <div>
                                    <span style={{ fontSize: "11px", color: "#9333EA", fontWeight: "600", backgroundColor: "#F3E8FF", padding: "3px 10px", borderRadius: "6px" }}>
                                        {report.foodDetail?.foodCateName || 'หมวดหมู่อาหาร'}
                                    </span>
                                    <h3 style={{ fontSize: "17px", fontWeight: "bold", color: "#1E293B", margin: "8px 0 2px 0" }}>
                                        {report.foodDetail?.foodName}
                                    </h3>
                                    <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
                                        ผู้แบ่งปัน: <strong style={{ color: "#1E293B" }}>{report.foodDetail?.donorName}</strong>
                                    </p>
                                </div>

                                <p style={{ fontSize: "13px", color: "#475569", margin: "0", backgroundColor: "#FAF5FF", padding: "10px", borderRadius: "10px", border: "1px solid #F3E8FF" }}>
                                    {report.foodDetail?.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                                </p>

                                <div style={styles.infoRow}>
                                    <span className="material-symbols-outlined" style={styles.icon}>package_2</span>
                                    <div>
                                        <div style={styles.infoLabel}>จำนวนหน่วย (คงเหลือ / ทั้งหมด)</div>
                                        <div style={styles.infoValue}>
                                            <span style={{ color: '#9333EA', fontWeight: 'bold' }}>{report.foodDetail?.remainingUnit}</span> / {report.foodDetail?.totalUnit} หน่วย
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.infoRow}>
                                    <span className="material-symbols-outlined" style={styles.icon}>scale</span>
                                    <div>
                                        <div style={styles.infoLabel}>น้ำหนักต่อหน่วย</div>
                                        <div style={styles.infoValue}>{report.foodDetail?.unitWeightKg} กิโลกรัม</div>
                                    </div>
                                </div>

                                <div style={styles.infoRow}>
                                    <span className="material-symbols-outlined" style={styles.icon}>calendar_clock</span>
                                    <div>
                                        <div style={styles.infoLabel}>วันหมดอายุ</div>
                                        <div style={styles.infoValue}>{formatExpiryDate(report.foodDetail?.expiryDate)} น.</div>
                                    </div>
                                </div>

                                <div style={styles.infoRow}>
                                    <span className="material-symbols-outlined" style={styles.icon}>location_on</span>
                                    <div>
                                        <div style={styles.infoLabel}>สถานที่รับอาหาร</div>
                                        <div style={styles.infoValue}>{report.foodDetail?.address}</div>
                                    </div>
                                </div>

                                <div style={styles.infoRow}>
                                    <span className="material-symbols-outlined" style={styles.icon}>access_time</span>
                                    <div>
                                        <div style={styles.infoLabel}>ช่วงเวลารับอาหาร</div>
                                        <div style={styles.infoValue}>
                                            {formatPickupDate(report.foodDetail?.pickupDateStart)} - {formatPickupDate(report.foodDetail?.pickupDateEnd)} <br />
                                            เวลา {formatPickupTime(report.foodDetail?.pickupStartTime)} - {formatPickupTime(report.foodDetail?.pickupEndTime)} น.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* แผงควบคุมการจัดการสำหรับแอดมิน (ด้านล่างสุด) */}
                <div style={styles.bottomActionBarCard}>
                    <div style={styles.bottomActionContent}>
                        <div>
                            <h4 style={styles.bottomActionTitle}>ส่วนจัดการสำหรับผู้ดูแลระบบ</h4>
                            <p style={styles.bottomActionDesc}>ตรวจสอบข้อมูลทั้งหมดเรียบร้อยแล้ว สามารถดำเนินการเปลี่ยนสถานะหรือปิดการแสดงผลรายการอาหารได้จากที่นี่</p>
                        </div>
                        <div style={styles.buttonGroup}>
                            <button
                                onClick={handleMarkAsChecked}
                                disabled={isChecked}
                                style={{
                                    ...styles.btnAction,
                                    backgroundColor: isChecked ? '#E2E8F0' : '#10B981',
                                    color: isChecked ? '#64748B' : '#FFFFFF',
                                    cursor: isChecked ? 'not-allowed' : 'pointer',
                                    boxShadow: isChecked ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.25)'
                                }}
                            >
                                {isChecked ? '✓ ตรวจสอบเรียบร้อยแล้ว' : 'ทำเครื่องหมายว่า: ตรวจสอบแล้ว'}
                            </button>
                            <button
                                onClick={handleDisableFood}
                                disabled={isFoodDisabled}
                                style={{
                                    ...styles.btnAction,
                                    backgroundColor: isFoodDisabled ? '#CBD5E1' : '#EF4444',
                                    color: isFoodDisabled ? '#64748B' : '#FFFFFF',
                                    cursor: isFoodDisabled ? 'not-allowed' : 'pointer',
                                    boxShadow: isFoodDisabled ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.25)'
                                }}
                            >
                                {isFoodDisabled ? '✕ ปิดการแสดงผลแล้ว (ถาวร)' : 'ปิดการแสดงรายการอาหาร'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Custom Modal Popup */}
            {modalConfig.isOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        <h3 style={styles.modalTitle}>{modalConfig.title}</h3>
                        <p style={styles.modalMessage}>{modalConfig.message}</p>
                        <div style={styles.modalButtonContainer}>
                            {modalConfig.type === 'warning' ? (
                                <>
                                    <button
                                        style={styles.modalConfirmBtn}
                                        onClick={modalConfig.onConfirm}
                                    >
                                        ยืนยัน
                                    </button>
                                    <button
                                        style={styles.modalCancelBtn}
                                        onClick={() => setModalConfig({ isOpen: false })}
                                    >
                                        ยกเลิก
                                    </button>
                                </>
                            ) : (
                                <button
                                    style={styles.modalConfirmBtn}
                                    onClick={modalConfig.onConfirm || (() => setModalConfig({ isOpen: false }))}
                                >
                                    ตกลง
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    fullWidthBackground: {
        width: "100%",
        backgroundColor: "#FAF5FF",
        minHeight: "100vh",
        padding: "30px 0",
        fontFamily: "'Prompt', sans-serif"
    },
    contentContainer: {
        maxWidth: "1080px",
        margin: "0 auto",
        padding: "0 20px",
        boxSizing: "border-box"
    },
    headerContainer: {
        marginBottom: "20px",
    },
    topBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: "#F3E8FF",
        color: "#9333EA",
        padding: "6px 16px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
        marginBottom: "10px",
    },
    statusHeaderBadge: {
        fontSize: "13px",
        fontWeight: "600",
        padding: "6px 14px",
        borderRadius: "10px",
        border: "1.5px solid #F3E8FF"
    },
    mainTitle: {
        color: "#1E293B",
        fontWeight: "bold",
        margin: 0
    },
    subHeaderDesc: {
        fontSize: "14px",
        color: "#64748B",
        margin: "4px 0 0 0"
    },
    reporterBannerCard: {
        backgroundColor: "#FFFFFF",
        border: "1.5px solid #F3E8FF",
        borderRadius: "16px",
        padding: "16px 20px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 15px rgba(192, 132, 252, 0.04)",
        flexWrap: "wrap",
        gap: "15px"
    },
    reporterInfoItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flex: 1,
        minWidth: "220px"
    },
    bannerIcon: {
        fontSize: "26px",
        color: "#9333EA",
        backgroundColor: "#F3E8FF",
        padding: "8px",
        borderRadius: "12px"
    },
    bannerLabel: {
        fontSize: "12px",
        color: "#64748B",
        display: "block"
    },
    bannerValue: {
        fontSize: "14px",
        fontWeight: "bold",
        color: "#1E293B"
    },
    reporterDivider: {
        width: "1px",
        height: "35px",
        backgroundColor: "#F3E8FF",
    },
    contentWrapper: {
        display: 'flex',
        marginBottom: '20px'
    },
    columnSection: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    cardBox: {
        backgroundColor: "#FFFFFF",
        border: "1.5px solid #F3E8FF",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 4px 15px rgba(192, 132, 252, 0.04)",
        height: "100%",
        boxSizing: "border-box"
    },
    mainImage: { 
        width: '100%', 
        height: '180px', 
        objectFit: 'cover', 
        borderRadius: '14px',
        marginBottom: '16px'
    },
    reportImage: { 
        width: '100%', 
        maxHeight: '180px', 
        objectFit: 'cover', 
        borderRadius: '12px',
        border: '1px solid #F1F5F9'
    },
    infoList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    infoRow: {
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
    },
    icon: {
        fontSize: "20px",
        marginTop: "2px",
        color: "#9333EA",
        flexShrink: 0
    },
    infoLabel: {
        fontSize: "12px",
        color: "#64748B",
        marginBottom: "1px"
    },
    infoValue: {
        fontSize: "13px",
        color: "#1E293B",
        fontWeight: "500"
    },
    cardSectionTitle: {
        margin: "0 0 14px 0",
        color: "#1E293B",
        fontSize: "15px",
        fontWeight: "bold",
        borderBottom: "1.5px solid #F8FAFC",
        paddingBottom: "10px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    sectionTitleIcon: {
        fontSize: "18px",
        color: "#9333EA"
    },
    metaBody: {
        display: "flex",
        flexDirection: "column",
        gap: "10px"
    },
    metaRow: {
        margin: 0,
        fontSize: "13px",
        display: "flex",
        justifyContent: "space-between"
    },
    metaLabel: {
        color: "#64748B",
    },
    metaValue: {
        color: "#1E293B",
        fontWeight: "600",
    },
    reportContent: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    reportItemBlock: {
        fontSize: "13px",
    },
    reportLabelTitle: {
        color: "#64748B",
        fontWeight: "500",
        display: "block",
        marginBottom: "2px"
    },
    reportHighlightText: {
        color: "#DC2626",
        fontWeight: "bold",
        fontSize: "14px"
    },
    reportDescText: {
        color: "#1E293B",
        backgroundColor: "#FAF5FF",
        padding: "10px",
        borderRadius: "10px",
        border: "1.5px solid #F3E8FF",
        margin: 0
    },
    bottomActionBarCard: {
        backgroundColor: "#FFFFFF",
        border: "1.5px solid #E9D5FF",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 6px 20px rgba(192, 132, 252, 0.08)",
        background: "linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 100%)"
    },
    bottomActionContent: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "20px"
    },
    bottomActionTitle: {
        fontSize: "16px",
        fontWeight: "bold",
        color: "#1E293B",
        margin: "0 0 4px 0"
    },
    bottomActionDesc: {
        fontSize: "13px",
        color: "#64748B",
        margin: 0
    },
    buttonGroup: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
    },
    btnAction: {
        padding: '12px 20px',
        borderRadius: '12px',
        border: 'none',
        fontSize: '13px',
        fontWeight: '600',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)'
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        padding: '24px',
        borderRadius: '20px',
        width: '90%',
        maxWidth: '380px',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(192, 132, 252, 0.2)',
        border: '1.5px solid #F3E8FF'
    },
    modalTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1E293B',
        margin: '0 0 8px 0'
    },
    modalMessage: {
        fontSize: '13px',
        color: '#64748B',
        margin: '0 0 20px 0'
    },
    modalButtonContainer: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'center'
    },
    modalConfirmBtn: {
        flex: 1,
        padding: '10px',
        backgroundColor: '#9333EA',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    modalCancelBtn: {
        flex: 1,
        padding: '10px',
        backgroundColor: '#F1F5F9',
        color: '#64748B',
        border: 'none',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    loadingContainer: {
        textAlign: "center",
        padding: "120px 20px",
        color: "#9333EA",
        fontSize: "15px",
        fontWeight: "600",
        fontFamily: "'Prompt', sans-serif"
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid #E2E8F0",
        borderTop: "4px solid #9333EA",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "0 auto 16px auto"
    },
    error: {
        textAlign: "center",
        padding: "100px",
        color: "#EF4444",
        fontFamily: "'Prompt', sans-serif"
    },
};