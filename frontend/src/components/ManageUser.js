import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

export default function ManageUsers() {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);

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

        if (!id) {
            console.error("หา userId ไม่พบใน Object:", donor);
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
                        body: JSON.stringify({ status: nextStatus }) // ส่ง status ใหม่ไป
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        // อัปเดต State ให้ตรงกับสถานะใหม่
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
            <p style={styles.mainTitle}>จัดการบัญชีผู้ใช้งาน</p>
            <div style={styles.headerRow}>
                <span style={{ flex: 2 }}>ชื่อผู้ใช้งาน</span>
                <span style={{ flex: 2 }}>Email</span>
                <span style={{ flex: 1 }}>สถานะ</span>
                <span style={{ flex: 0.5 }}>จัดการ</span>
            </div>

            {donors.map((donor, index) => (
                <div key={index} style={styles.userRow}>
                    <span style={{ flex: 2, }}>{donor.name}</span>
                    <span style={{ flex: 2 }}>{donor.email}</span>
                    <span style={{
                        flex: 1,
                        color: donor.status === 'active' ? '#689f38' : '#757575',
                    }}>
                        {donor.status.toUpperCase()}
                    </span>
                    <button
                        style={{
                            ...styles.actionBtn,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px', // เพิ่มระยะห่างระหว่างไอคอนกับข้อความ
                            color: donor.status === 'active' ? '#d32f2f' : '#388e3c', // สีแดงเมื่อ active, สีเขียวเมื่อ deactivate
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                        }}
                        onClick={() => handleToggleStatus(donor)}
                    >
                        <span className="material-symbols-outlined">
                            {donor.status === 'active' ? 'block' : 'refresh'}
                        </span>
                        {donor.status === 'active' ? 'ระงับบัญชี' : 'เปิดใช้งาน'}
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
    headerRow: {
        display: 'flex',
        padding: '0 20px',
        marginBottom: '10px',
        color: '#666',
        fontSize: "17px",
    },
    userRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '15px 20px',
        border: '1px solid #ddd',
        borderRadius: '20px',
        marginBottom: '10px',
        // backgroundColor: '#fff'
    },
    actionBtn: {
        // flex: 1,
        alignItems: 'center',
        border: 'none',
        background: 'none',
        color: '#d32f2f',
        cursor: 'pointer',
        fontSize: '16px',
    },
    loading: {
        textAlign: "center",
        padding: "100px",
        color: "#ff8c00",
        fontSize: "20px"
    },
};
