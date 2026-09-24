import React, { useEffect, useState } from "react";
import Swal from 'sweetalert2';
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

            Swal.fire({
                title: "กำลังโหลดข้อมูลสมาชิก...",
                allowOutsideClick: false,
                showConfirmButton: false,
                customClass: {
                    popup: 'rounded-2xl shadow-xl border border-emerald-100',
                    title: 'text-gray-800 text-lg font-medium'
                },
                didOpen: () => {
                    Swal.showLoading();
                }
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
                    Swal.close();
                } else {
                    throw new Error(result.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
                }
            } catch (err) {
                console.error("Fetch Error:", err);
                Swal.fire({
                    icon: "error",
                    title: "ข้อผิดพลาด",
                    text: err.message,
                    confirmButtonText: "ตกลง",
                    confirmButtonColor: "#328d7d",
                    customClass: {
                        popup: 'rounded-2xl shadow-xl border border-red-100',
                        title: 'text-gray-800 font-bold',
                        confirmButton: 'px-5 py-2.5 rounded-xl font-medium shadow-md'
                    }
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

        // เพิ่ม Loading แจ้งเตือนขณะกำลังบันทึกข้อมูล
        Swal.fire({
            title: "กำลังบันทึกข้อมูล...",
            allowOutsideClick: false,
            showConfirmButton: false,
            customClass: {
                popup: 'rounded-2xl shadow-xl border border-emerald-100',
                title: 'text-gray-800 text-lg font-medium'
            },
            didOpen: () => {
                Swal.showLoading();
            }
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

                    Swal.fire({
                        icon: "success",
                        title: "บันทึกข้อมูลสำเร็จ",
                        text: response.message || "แก้ไขข้อมูลส่วนตัวเรียบร้อยแล้ว",
                        confirmButtonText: "ตกลง",
                        confirmButtonColor: "#328d7d",
                        customClass: {
                            popup: '!rounded-[28px] !p-6 shadow-2xl',
                            confirmButton: '!rounded-xl px-6 py-2.5 font-medium'
                        }
                    });
                } else {
                    throw new Error(response.message || "ไม่สามารถแก้ไขข้อมูลได้");
                }
            })
            .catch(err => {
                Swal.fire({
                    icon: "error",
                    title: "เกิดข้อผิดพลาด",
                    text: err.message || "มีบางอย่างผิดพลาด โปรดลองใหม่อีกครั้ง",
                    confirmButtonText: "ลองอีกครั้ง",
                    confirmButtonColor: "#e74c3c",
                    customClass: {
                        popup: 'rounded-2xl shadow-xl border border-red-100',
                        title: 'text-gray-800 font-bold',
                        confirmButton: 'px-5 py-2.5 rounded-xl font-medium shadow-md'
                    }
                });
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
                        <div style={styles.avatarGlow}>
                            <div style={styles.avatarWrapper}>
                                <img
                                    src={profileMember}
                                    alt="Profile"
                                    style={styles.avatarImg}
                                />
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

                                {!isEditing ? (
                                    <div style={styles.buttonWrapper}>
                                        <button
                                            key="btn-edit"
                                            type="button"
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
                                ) : (
                                    <div style={{ ...styles.buttonWrapper, gap: "16px" }}>
                                        <button
                                            key="btn-cancel"
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
                                            key="btn-save"
                                            type="button"
                                            style={styles.primaryBtn}
                                            onClick={handleSave}
                                        >
                                            บันทึกข้อมูล
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '30px 20px 60px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
        background: "linear-gradient(135deg, #ffff 0%, #fffefc 100%)",
        fontFamily: "'Prompt', sans-serif",
    },
    wrapper: {
        width: '100%',
        maxWidth: '760px',

    },
    headerBox: {
        marginBottom: '18px',
        textAlign: 'left',
    },
    title: {
        color: '#1e293b',
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
        boxShadow: "0 20px 40px rgba(255, 246, 229, 0.25), 0 8px 16px rgba(180, 180, 180, 0.42)",
        overflow: 'hidden',
        border: '1px solid rgba(226, 232, 240, 0.8)',
    },
    banner: {
        background: 'linear-gradient(135deg, #328d7d 0%, #277265 100%)',
        padding: '36px 20px 30px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
    },
    avatarGlow: {
        padding: '6px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(8px)',
        marginBottom: '12px',
    },
    avatarWrapper: {
        width: '104px',
        height: '104px',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '3px solid #ffffff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    userName: {
        color: '#ffffff',
        fontSize: '22px',
        fontWeight: '600',
        margin: '0 0 6px 0',
        letterSpacing: '0.2px',
    },
    userRoleTag: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: '#ffffff',
        padding: '4px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
        backdropFilter: 'blur(4px)',
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
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    fieldIcon: {
        fontSize: '18px',
        color: '#328d7d',
    },
    displayBox: {
        backgroundColor: '#f8fafc',
        padding: '12px 16px',
        borderRadius: '12px',
        color: '#1e293b',
        fontSize: '15px',
        fontWeight: '500',
        border: '1px solid #e2e8f0',
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
        borderRadius: '12px',
        color: '#1e293b',
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
        borderRadius: '12px',
        color: '#1e293b',
        fontSize: '15px',
        border: '1.5px solid #ef4444',
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
        backgroundColor: '#ff7b00',
        color: '#ffffff',
        border: 'none',
        padding: '12px 28px',
        borderRadius: '12px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(255, 145, 0, 0.25)',
    },
    cancelBtn: {
        backgroundColor: '#ffffff',
        color: '#64748b',
        border: '1.5px solid #cbd5e1',
        padding: '12px 24px',
        borderRadius: '12px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    loading: {
        textAlign: "center",
        padding: "100px",
        color: "#328d7d",
        fontSize: "18px",
        fontWeight: "500"
    },
    errorText: {
        color: "#ef4444",
        fontSize: "13px",
        marginTop: "2px",
        marginBottom: "0px",
        textAlign: "left"
    },
};