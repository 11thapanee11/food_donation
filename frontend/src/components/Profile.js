import React, { useEffect, useState } from "react";
import profileMember from '../assets/images/member_profile.jpg';

export default function Profile() {
    const token = localStorage.getItem("accessToken");

    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: ""
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);

    // State สำหรับควบคุม Custom Popup Modal กลางจอ
    const [popup, setPopup] = useState({ show: false, type: '', title: '', message: '', showBtn: true });

    const validateForm = () => {
        const newErrors = {};

        const validateName = (value, fieldName) => {
            if (!value.trim()) return `กรุณากรอก${fieldName}`;
            if (value.length < 2 || value.length > 155) return `${fieldName}ต้องมี 2-155 ตัวอักษร`;
            if (!/^[ก-๙a-zA-Z]+$/.test(value)) return `${fieldName}ต้องเป็นภาษาไทยหรืออังกฤษเท่านั้น`;
            return null;
        };

        const fNameErr = validateName(formData.firstName, "ชื่อ");
        if (fNameErr) newErrors.firstName = fNameErr;

        const lNameErr = validateName(formData.lastName, "นามสกุล");
        if (lNameErr) newErrors.lastName = lNameErr;

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = "กรุณากรอกเบอร์โทรศัพท์";
        } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = "ต้องเป็นตัวเลข 10 หลัก";
        } else if (!/^(06|08|09)/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = "ต้องขึ้นต้นด้วย 06, 08 หรือ 09";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            setLoading(true);

            // แสดง Popup กำลังโหลด
            setPopup({
                show: true,
                type: 'loading',
                title: 'กำลังโหลดข้อมูล...',
                message: 'กรุณารอสักครู่',
                showBtn: false
            });

            try {
                const response = await fetch("http://localhost:8082/profile", {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || "ไม่สามารถโหลดข้อมูลสมาชิกได้");
                }

                if (result.success) {
                    setProfile(result.data);
                    setFormData({
                        firstName: result.data.firstName || "",
                        lastName: result.data.lastName || "",
                        phoneNumber: result.data.phoneNumber || ""
                    });
                    // ปิด Popup เมื่อโหลดเสร็จ
                    setPopup(prev => ({ ...prev, show: false }));
                } else {
                    throw new Error(result.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
                }
            } catch (err) {
                console.error("Fetch Error:", err);
                setPopup({
                    show: true,
                    type: 'error',
                    title: 'ข้อผิดพลาด',
                    message: err.message,
                    showBtn: true
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const handleSave = () => {
        if (!validateForm()) return;

        // แสดง Popup กำลังบันทึก (ค้างไว้จนกว่าจะ fetch เสร็จ)
        setPopup({
            show: true,
            type: 'loading',
            title: 'กำลังบันทึกข้อมูล...',
            message: 'กรุณารอสักครู่ ระบบกำลังอัปเดตข้อมูล',
            showBtn: false
        });

        fetch("http://localhost:8082/profile", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })
            .then(res => {
                if (!res.ok) throw new Error("ไม่สามารถเชื่อมต่อกับ Server ได้");
                return res.json();
            })
            .then(response => {
                if (response.success) {
                    setProfile({
                        ...profile,
                        ...formData
                    });
                    setIsEditing(false);

                    // แสดง Popup สำเร็จ และตั้งเวลาให้หายไปเองใน 3 วินาที
                    setPopup({
                        show: true,
                        type: 'success',
                        title: 'บันทึกข้อมูลสำเร็จ',
                        message: response.message || "แก้ไขข้อมูลส่วนตัวเรียบร้อยแล้ว",
                        showBtn: false
                    });

                    setTimeout(() => {
                        setPopup(prev => ({ ...prev, show: false }));
                    }, 3000);

                } else {
                    throw new Error(response.message || "ไม่สามารถแก้ไขข้อมูลได้");
                }
            })
            .catch(err => {
                // แสดง Popup Error และตั้งเวลาให้หายไปเองใน 3 วินาทีเช่นกัน
                setPopup({
                    show: true,
                    type: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    message: err.message || "มีบางอย่างผิดพลาด โปรดลองใหม่อีกครั้ง",
                    showBtn: false
                });

                setTimeout(() => {
                    setPopup(prev => ({ ...prev, show: false }));
                }, 3000);
            });
    };

    if (loading) return null;

    if (!profile) {
        return <div style={styles.loading}>ไม่พบข้อมูลสมาชิก</div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>
                {/* Header */}
                <div style={styles.headerBox}>
                    <h1 style={styles.title}>โปรไฟล์ของฉัน</h1>
                    <p style={styles.subtitle}>จัดการข้อมูลส่วนตัวและรายละเอียดบัญชีผู้ใช้</p>
                </div>

                {/* Main Card Wrapper */}
                <div style={styles.card}>
                    {/* Banner Section */}
                    <div style={styles.banner}>

                        <div style={styles.avatarWrapper}>
                            <div style={styles.avatarIconBox}>
                                <span className="material-symbols-outlined" style={styles.avatarIcon}>
                                    person
                                </span>
                            </div>
                        </div>

                        <h2 style={styles.userName}>{profile.firstName} {profile.lastName}</h2>
                        <span style={styles.userRoleTag}>สมาชิก</span>
                    </div>

                    {/* Form Section */}
                    <div style={styles.contentBody}>
                        {!isEditing ? (
                            <>
                                <div style={styles.formGrid}>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>
                                            <i className="material-icons" style={styles.fieldIcon}>person</i>
                                            ชื่อ
                                        </label>
                                        <div style={styles.displayBox}>{profile.firstName}</div>
                                    </div>

                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>
                                            <i className="material-icons" style={styles.fieldIcon}>person_outline</i>
                                            นามสกุล
                                        </label>
                                        <div style={styles.displayBox}>{profile.lastName}</div>
                                    </div>

                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>
                                            <i className="material-icons" style={styles.fieldIcon}>email</i>
                                            อีเมล
                                        </label>
                                        <div style={{ ...styles.displayBox, ...styles.disabledBox }}>
                                            {profile.email}
                                        </div>
                                    </div>

                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>
                                            <i className="material-icons" style={styles.fieldIcon}>phone</i>
                                            เบอร์โทรศัพท์
                                        </label>
                                        <div style={styles.displayBox}>{profile.phoneNumber}</div>
                                    </div>
                                </div>

                                <div style={styles.buttonWrapper}>
                                    <button
                                        style={styles.primaryBtn}
                                        onClick={() => {
                                            setFormData({
                                                firstName: profile.firstName || "",
                                                lastName: profile.lastName || "",
                                                phoneNumber: profile.phoneNumber || ""
                                            });
                                            setIsEditing(true);
                                        }}
                                    >
                                        <i className='material-icons' style={{ fontSize: '18px' }}>edit</i>
                                        แก้ไขข้อมูล
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={styles.formGrid}>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>
                                            <i className="material-icons" style={styles.fieldIcon}>person</i>
                                            ชื่อ
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            style={errors.firstName ? styles.inputError : styles.inputBox}
                                            onChange={handleChange}
                                            placeholder="กรอกชื่อ"
                                        />
                                        {errors.firstName && <p style={styles.errorText}>{errors.firstName}</p>}
                                    </div>

                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>
                                            <i className="material-icons" style={styles.fieldIcon}>person_outline</i>
                                            นามสกุล
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            style={errors.lastName ? styles.inputError : styles.inputBox}
                                            onChange={handleChange}
                                            placeholder="กรอกนามสกุล"
                                        />
                                        {errors.lastName && <p style={styles.errorText}>{errors.lastName}</p>}
                                    </div>

                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>
                                            <i className="material-icons" style={styles.fieldIcon}>email</i>
                                            อีเมล (ไม่สามารถแก้ไขได้)
                                        </label>
                                        <div style={{ ...styles.displayBox, ...styles.disabledBox }}>
                                            {profile.email}
                                        </div>
                                    </div>

                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>
                                            <i className="material-icons" style={styles.fieldIcon}>phone</i>
                                            เบอร์โทรศัพท์
                                        </label>
                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            style={errors.phoneNumber ? styles.inputError : styles.inputBox}
                                            onChange={handleChange}
                                            placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
                                        />
                                        {errors.phoneNumber && <p style={styles.errorText}>{errors.phoneNumber}</p>}
                                    </div>
                                </div>

                                <div style={{ ...styles.buttonWrapper, gap: "16px" }}>
                                    <button
                                        type="button"
                                        style={styles.cancelBtn}
                                        onClick={() => {
                                            setIsEditing(false);
                                            setErrors({});
                                        }}
                                    >
                                        ยกเลิก
                                    </button>

                                    <button
                                        type="button"
                                        style={styles.primaryBtn}
                                        onClick={handleSave}
                                    >
                                        บันทึกข้อมูล
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Pastel Popup Modal กลางจอ */}
            {popup.show && (
                <div style={styles.overlay}>
                    <div style={styles.popupCard}>
                        {popup.type === 'loading' ? (
                            <div style={styles.loadingSpinnerWrapper}>
                                <div style={styles.spinner}></div>
                            </div>
                        ) : (
                            <div style={{
                                ...styles.popupIconWrapper,
                                backgroundColor: popup.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                                color: popup.type === 'success' ? '#10B981' : '#F87171'
                            }}>
                                <i className="material-icons" style={{ fontSize: '36px' }}>
                                    {popup.type === 'success' ? 'check_circle_outline' : 'error_outline'}
                                </i>
                            </div>
                        )}

                        <h3 style={styles.popupTitle}>{popup.title}</h3>
                        <p style={styles.popupMessage}>{popup.message}</p>

                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: '40px 20px 60px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
        background: "linear-gradient(135deg, #faf5ff 0%, #f0f9ff 50%, #f0fdf4 100%)",
        fontFamily: "'Prompt', sans-serif",
    },
    wrapper: {
        width: '100%',
        maxWidth: '760px',
    },
    headerBox: {
        marginBottom: '20px',
        textAlign: 'left',
    },
    title: {
        color: '#334155',
        fontSize: '26px',
        fontWeight: '700',
        margin: '0 0 6px 0',
        letterSpacing: '-0.3px',
    },
    subtitle: {
        color: '#64748b',
        fontSize: '14px',
        margin: 0,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: "0 20px 40px rgba(192, 132, 252, 0.08), 0 8px 16px rgba(148, 163, 184, 0.08)",
        overflow: 'hidden',
        border: '1px solid rgba(241, 245, 249, 0.9)',
    },
    banner: {
        background: "linear-gradient(135deg, #dfbfff 0%, #bfe5fd 100%)",
        padding: '36px 20px 30px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
    },
    avatarGlow: {
        padding: '6px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(8px)',
        marginBottom: '12px',
    },
    avatarWrapper: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "16px",
        width: "104px",
        height: "104px",
        borderRadius: "50%",
        // เอาเงาและขอบวงนอกมารวมไว้ที่ชั้นนี้ชั้นเดียว เพื่อไม่ให้เกิดรอยซ้อน
        boxShadow: "0 6px 16px rgba(192, 132, 252, 0.15)",
        backgroundColor: "#f5f3ff",
        border: "4px solid #e4deff",
    },
    avatarIconBox: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        overflow: "hidden",
    },
    avatarIcon: {
        fontSize: "48px",
        color: "#b17ff1",
        transform: "translateY(-1px)",
    },
    userName: {
        color: '#ffffff',
        fontSize: '22px',
        fontWeight: '600',
        margin: '0 0 6px 0',
        letterSpacing: '0.2px',
        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
    },
    userRoleTag: {
        backgroundColor: '#fcfcfc3b',
        color: '#ffffff',
        padding: '4px 16px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        backdropFilter: 'blur(4px)',
        letterSpacing: '0.5px',
    },
    contentBody: {
        padding: '36px 32px',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px 28px',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#334155',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    fieldIcon: {
        fontSize: '18px',
        color: '#c084fc',
    },
    displayBox: {
        backgroundColor: '#f8fafc',
        padding: '12px 16px',
        borderRadius: '14px',
        color: '#334155',
        fontSize: '15px',
        fontWeight: '500',
        border: '1px solid #f1f5f9',
        minHeight: '22px',
        display: 'flex',
        alignItems: 'center',
    },
    disabledBox: {
        backgroundColor: '#f1f5f9',
        color: '#94a3b8',
        borderColor: '#e2e8f0',
    },
    inputBox: {
        backgroundColor: '#ffffff',
        padding: '12px 16px',
        borderRadius: '14px',
        color: '#334155',
        fontSize: '15px',
        border: '1.5px solid #cbd5e1',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        width: '100%',
    },
    inputError: {
        backgroundColor: '#fff5f5',
        padding: '12px 16px',
        borderRadius: '14px',
        color: '#334155',
        fontSize: '15px',
        border: '1.5px solid #f43f5e',
        outline: 'none',
        boxSizing: 'border-box',
        width: '100%',
    },
    buttonWrapper: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '32px',
    },
    primaryBtn: {
        backgroundColor: '#c084fc',
        color: '#ffffff',
        border: 'none',
        padding: '12px 28px',
        borderRadius: '14px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 14px rgba(192, 132, 252, 0.35)',
    },
    cancelBtn: {
        backgroundColor: '#ffffff',
        color: '#64748b',
        border: '1.5px solid #cbd5e1',
        padding: '12px 24px',
        borderRadius: '14px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    loading: {
        textAlign: "center",
        padding: "100px",
        color: "#c084fc",
        fontSize: "18px",
        fontWeight: "500"
    },
    errorText: {
        color: "#f43f5e",
        fontSize: "13px",
        marginTop: "2px",
        marginBottom: "0px",
        textAlign: "left"
    },
    // Styles สำหรับ Custom Modal Popup
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    popupCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: '32px 28px',
        width: '90%',
        maxWidth: '320px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
    },
    popupIconWrapper: {
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
    },
    popupTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#334155',
        margin: '0 0 8px 0'
    },
    popupMessage: {
        fontSize: '14px',
        color: '#64748B',
        margin: '0 0 20px 0',
        lineHeight: '1.5'
    },
    popupButton: {
        width: '100%',
        padding: '10px 16px',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    loadingSpinnerWrapper: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '16px'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #F3E8FF',
        borderTop: '4px solid #C084FC',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    }
};