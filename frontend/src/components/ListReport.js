import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";

export default function ListReport() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // State สำหรับตรวจจับหน้าจอมือถือ
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );

    const PROBLEM_MAP = {
        "EXPIRED": "อาหารหมดอายุ",
        "NOT_MATCH": "ข้อมูลไม่ตรงปก",
        "SPOILED": "อาหารมีกลิ่นหรือสภาพผิดปกติ",
        "OTHER": "อื่นๆ"
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetch('http://localhost:8082/report', {
            headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
        })
            .then(res => res.json())
            .then(resData => {
                if (resData.success) {
                    setReports(resData.data);
                }
                setLoading(false);
            })
            .catch(err => console.error("Error:", err));
    }, []);

    if (loading) return <div style={styles.loading}>กำลังโหลด...</div>;

    return (
        <div style={styles.container}>
            <p style={{ ...styles.mainTitle, fontSize: isMobile ? "22px" : "30px" }}>รายงานปัญหาทั้งหมด</p>

            {reports.map((report) => (
                <div 
                    key={report.reportId} 
                    style={{
                        ...styles.reportRow, 
                        opacity: report.status === 'checked' ? 0.7 : 1,
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        gap: isMobile ? '10px' : '0'
                    }}
                >
                    <div style={{ flex: isMobile ? 'none' : 1.8, width: isMobile ? '100%' : 'auto' }}>
                        <span style={{ 
                            fontWeight: 'bold', 
                            color: report.reportStatus === 'checked' ? '#999' : '#333',
                            whiteSpace: 'nowrap'
                        }}>
                            {PROBLEM_MAP[report.reason] || report.reason}
                        </span>
                    </div>

                    <div style={{ flex: isMobile ? 'none' : 1.5, width: isMobile ? '100%' : 'auto' }}>
                        <span style={{ 
                            color: report.reportStatus === 'checked' ? '#999' : '#333',
                            whiteSpace: 'nowrap'
                        }}>
                            รายงาน {report.foodName}
                        </span>
                    </div>

                    <div style={{ flex: isMobile ? 'none' : 1.5, width: isMobile ? '100%' : 'auto' }}>
                        <span style={{ 
                            color: report.reportStatus === 'checked' ? '#999' : '#333',
                            whiteSpace: 'nowrap'
                        }}>
                            รายงานโดย {report.reporterName}
                        </span>
                    </div>

                    <div style={{ flex: isMobile ? 'none' : 1.2, width: isMobile ? '100%' : 'auto' }}>
                        <span style={{ 
                            color: '#999', 
                            fontSize: isMobile ? '14px' : '17px',
                            whiteSpace: 'nowrap'
                        }}>
                            {new Date(report.reportDate).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </span>
                    </div>

                    <div style={{ 
                        flex: isMobile ? 'none' : 0.8, 
                        width: isMobile ? '100%' : 'auto',
                        display: 'flex',
                        justifyContent: isMobile ? 'flex-end' : 'flex-start',
                        borderTop: isMobile ? '1px solid #eee' : 'none',
                        paddingTop: isMobile ? '10px' : '0',
                        marginTop: isMobile ? '5px' : '0'
                    }}>
                        <button
                            style={{
                                ...styles.detailBtn, 
                                color: report.reportStatus === 'checked' ? '#777' : '#ff8c00',
                                whiteSpace: 'nowrap'
                            }}
                            onClick={() => navigate('/report-detail', { state: { id: report.reportId, fromPage: '/manage-report' } })}
                        >
                            ดูรายละเอียด
                        </button>
                    </div>
                </div>
            ))}
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
    reportRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '20px',
        marginBottom: '10px',
        fontSize: '17px',
        overflowX: 'auto'
    },
    detailBtn: {
        border: 'none',
        background: 'none',
        color: '#ff8c00',
        cursor: 'pointer',
        fontSize: '17px',
        whiteSpace: 'nowrap',
        padding: 0
    },
    loading: {
        textAlign: "center",
        padding: "100px",
        color: "#ff8c00",
        fontSize: "20px"
    },
};