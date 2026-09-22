import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

export default function ManageUsers() {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetch('http://localhost:8082/donor', {
            headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
        })
            .then(res => res.json())
            .then(resData => {
                if (resData.success) {
                    setDonors(resData.data);
                }
                setLoading(false);
            })
            .catch(err => console.error("Error:", err));
    }, []);

    const STATUS_MAP = {
        active: {
            text: 'ใช้งานได้',
            color: '#689f38',
            bgColor: '#f1f8e9'
        },
        deactivate: {
            text: 'ถูกปิดใช้งาน',
            color: '#777575',
            bgColor: '#f5f5f5'
        }
    };

    const handleToggleStatus = (donor) => {
        const isActive = donor.status === 'active';
        const nextStatus = isActive ? 'deactivate' : 'active';
        const actionLabel = isActive ? 'ระงับบัญชี' : 'เปิดใช้งาน';
        const color = isActive ? '#ff4d4d' : '#2ecc71';

        const id = donor.id;
        if (!id) {
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่พบรหัสผู้ใช้งาน', 'error');
            return;
        }

        Swal.fire({
            title: `ยืนยันการ${actionLabel}`,
            text: `คุณต้องการ${actionLabel}ของ ${donor.name} ใช่หรือไม่`,
            showCancelButton: true,
            confirmButtonColor: color,
            confirmButtonText: actionLabel,
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`http://localhost:8082/donor/${id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: nextStatus })
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        setDonors(prev => prev.map(d => d.id === id ? { ...d, status: nextStatus } : d));

                        Swal.fire({
                            icon: 'success',
                            title: `${actionLabel}สำเร็จ`,
                            confirmButtonColor: '#2ecc71'
                        });
                    } else {
                        throw new Error(data.message || 'ไม่สามารถทำรายการได้');
                    }
                } catch (error) {
                    console.error("Error:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาด',
                        text: error.message || 'ไม่สามารถติดต่อ Server ได้',
                        confirmButtonColor: '#d33'
                    });
                }
            }
        });
    };

    if (loading) return <div style={styles.loading}>กำลังโหลด...</div>;

    return (
        <div style={styles.container}>
            <p style={{ ...styles.mainTitle, fontSize: isMobile ? "22px" : "30px" }}>จัดการบัญชีผู้ใช้งาน</p>

            {/* กรอบใหญ่ 1 กรอบครอบส่วนตารางและรายการทั้งหมด */}
            <div style={styles.tableWrapper}>
                {!isMobile && (
                    <div style={styles.headerRow}>
                        <span style={{ flex: 2 }}>ชื่อผู้ใช้งาน</span>
                        <span style={{ flex: 2 }}>Email</span>
                        <span style={{ flex: 1 }}>สถานะ</span>
                        <span style={{ flex: 1, minWidth: '130px' }}>จัดการ</span>
                    </div>
                )}

                {donors.map((donor, index) => {
                    const isLastItem = index === donors.length - 1;

                    return (
                        <div
                            key={donor.id || index}
                            style={{
                                ...styles.userRow,
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: isMobile ? 'flex-start' : 'center',
                                gap: isMobile ? '12px' : '0',
                                borderBottom: isLastItem ? 'none' : '1px solid #ddd',
                            }}
                        >
                            <div style={{ flex: isMobile ? 'none' : 2, width: isMobile ? '100%' : 'auto' }}>
                                {isMobile && <span style={styles.mobileLabel}>ชื่อผู้ใช้งาน: </span>}
                                <span style={{ color: '#333', fontWeight: isMobile ? 'bold' : 'normal' }}>{donor.name}</span>
                            </div>

                            <div style={{ flex: isMobile ? 'none' : 2, width: isMobile ? '100%' : 'auto' }}>
                                {isMobile && <span style={styles.mobileLabel}>Email: </span>}
                                <span style={{ color: '#666' }}>{donor.email}</span>
                            </div>

                            <div style={{ flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : 'auto' }}>
                                {isMobile && <span style={styles.mobileLabel}>สถานะ: </span>}
                                <span style={{
                                    color: STATUS_MAP[donor.status?.toLowerCase()]?.color || '#777575',
                                    backgroundColor: STATUS_MAP[donor.status?.toLowerCase()]?.bgColor || '#f5f5f5',
                                    // border: `1px solid ${STATUS_MAP[donor.status?.toLowerCase()]?.color || '#777575'}`,
                                    padding: '4px 12px',
                                    borderRadius: '13px',
                                    fontSize: '14px',
                                    display: 'inline-block'
                                }}>
                                    {STATUS_MAP[donor.status?.toLowerCase()]?.text || donor.status || ''}
                                </span>
                            </div>

                            <div style={{
                                flex: isMobile ? 'none' : 1,
                                minWidth: isMobile ? 'auto' : '130px',
                                width: isMobile ? '100%' : 'auto',
                                display: 'flex',
                                justifyContent: isMobile ? 'flex-end' : 'flex-start',
                                borderTop: isMobile ? '1px solid #eee' : 'none',
                                paddingTop: isMobile ? '10px' : '0',
                                marginTop: isMobile ? '4px' : '0'
                            }}>
                                <button
                                    style={{
                                        ...styles.actionBtn,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: donor.status === 'active' ? '#d32f2f' : '#2e7d32',
                                        border: `1.5px solid ${donor.status === 'active' ? '#d32f2f' : '#2e7d32'}`,
                                        backgroundColor: donor.status === 'active' ? '#fdc5c5' : '#cbe4cd',
                                        padding: '5px 14px',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => handleToggleStatus(donor)}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                        {donor.status === 'active' ? 'block' : 'refresh'}
                                    </span>
                                    {donor.status === 'active' ? 'ระงับบัญชี' : 'เปิดใช้งาน'}
                                </button>
                            </div>
                        </div>
                    );
                })}
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
    tableWrapper: {
        border: '1px solid #ddd',
        borderRadius: '20px',
        overflow: 'hidden',
        padding: '10px 0',
        backgroundColor: '#fdfcf9'
    },
    headerRow: {
        display: 'flex',
        padding: '10px 20px',
        color: '#666',
        fontSize: "17px",
        fontWeight: "bold",
        borderBottom: '1px solid #ddd',
    },
    userRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '15px 20px',
    },
    actionBtn: {
        alignItems: 'center',
        border: 'none',
        background: 'none',
        // color: '#080808',
        cursor: 'pointer',
        fontSize: '16px',
        whiteSpace: 'nowrap'
    },
    loading: {
        textAlign: "center",
        padding: "100px",
        color: "#ff8c00",
        fontSize: "20px"
    },
    mobileLabel: {
        fontSize: '14px',
        color: '#888',
        marginRight: '8px',
        display: 'inline-block',
        minWidth: '85px'
    }
};