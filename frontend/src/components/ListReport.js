import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";

export default function ListReport() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const PROBLEM_MAP = {
        "EXPIRED": "อาหารหมดอายุ",
        "NOT_MATCH": "ข้อมูลไม่ตรงปก",
        "SPOILED": "อาหารมีกลิ่นหรือสภาพผิดปกติ",
        "OTHER": "อื่นๆ"
    };

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
            <p style={styles.mainTitle}>รายงานปัญหาทั้งหมด</p>

            {reports.map((report) => (
                <div key={report.reportId} style={{...styles.reportRow, opacity: report.status === 'checked' ? 0.7 : 1}}>
                    {/* คอลัมน์ต่างๆ ตามภาพ */}
                    <span style={{ flex: 1.8, color: report.reportStatus === 'checked' ? '#999' : '#333'}}>{PROBLEM_MAP[report.reason] || report.reason}</span>
                    <span style={{ flex: 1.5, color: report.reportStatus === 'checked' ? '#999' : '#333' }}>รายงาน {report.foodName}</span>
                    <span style={{ flex: 1.5, color: report.reportStatus === 'checked' ? '#999' : '#333' }}>รายงานโดย {report.reporterName}</span>
                    <span style={{ flex: 1.2, color: '#999' }}>{new Date(report.reportDate).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}</span>
                    <button
                        style={{...styles.detailBtn, color: report.reportStatus === 'checked' ? '#777' : '#333'}}
                        onClick={() => navigate('/report-detail', { state: { id: report.reportId, fromPage: '/manage-report' } })}
                    >
                        ดูรายละเอียด
                    </button>
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
        // color: "#328d7d",
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
        borderRadius: '15px',
        marginBottom: '10px',
        fontSize: '17px'
    },
    detailBtn: {
        flex: 0.8,
        border: 'none',
        background: 'none',
        color: '#ff8c00',
        cursor: 'pointer',
        fontSize: '17px'
    },
    loading: {
        textAlign: "center",
        padding: "100px",
        color: "#ff8c00",
        fontSize: "20px"
    },
};
