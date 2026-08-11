import React, { useEffect, useState } from "react";
import Swal from 'sweetalert2';
import profileMember from '../assets/images/member_profile.jpg'

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
    const [loading, setLoading] = useState(true); // state สำหรับโหลด

    const validateForm = () => {
        const newErrors = {};

        // Helper function สำหรับเช็คชื่อ-นามสกุล
        const validateName = (value, fieldName) => {
            if (!value.trim()) return `กรุณากรอก${fieldName}`;
            if (value.length < 2 || value.length > 155) return `${fieldName}ต้องมี 2-155 ตัวอักษร`;
            if (!/^[ก-๙a-zA-Z]+$/.test(value)) return `${fieldName}ต้องเป็นภาษาไทยหรืออังกฤษเท่านั้น`;
            return null;
        };

        // ชื่อ & นามสกุล
        const fNameErr = validateName(formData.firstName, "ชื่อ");
        if (fNameErr) newErrors.firstName = fNameErr;

        const lNameErr = validateName(formData.lastName, "นามสกุล");
        if (lNameErr) newErrors.lastName = lNameErr;

        // เบอร์โทรศัพท์
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

            // แสดง Loading Popup
            Swal.fire({
                title: "กำลังโหลดข้อมูลสมาชิก...",
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
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
                    text: err.message
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
    };

    const handleSave = () => {
        if (!validateForm()) return;

        fetch("http://localhost:8082/profile", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })
            .then(res => {
                // เช็คสถานะ HTTP ปกติ
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
                        text: response.message || "แก้ไขข้อมูลสำเร็จ",
                        confirmButtonColor: "#2ecc71"
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
                    confirmButtonColor: "#e74c3c"
                });
            });
    };

    if (loading) {
        // ไม่ render อะไรเลยตอนโหลด ให้ SweetAlert2 จัดการ
        return null;
    }

    if (!profile) {
        return <div style={styles.loading}>ไม่พบข้อมูลสมาชิก</div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>
                <h1 style={styles.title}>ข้อมูลส่วนตัวสมาชิก</h1>

                {/* ส่วนแบนเนอร์สีเขียว */}
                <div style={styles.banner}>
                    <div style={styles.avatarWrapper}>
                        <img
                            src={profileMember}
                            alt="Profile"
                            style={styles.avatarImg}
                        />
                    </div>
                    <h2 style={styles.userName}>{profile.firstName} {profile.lastName}</h2>
                </div>

                {!isEditing ? (
                    <>
                        {/* ส่วนฟอร์มข้อมูล */}
                        <div style={styles.formGrid}>
                            <div style={styles.fieldGroup}>
                                <p style={styles.p}>ชื่อ</p>
                                <div style={styles.inputBox}>{profile.firstName}</div>
                            </div>

                            <div style={styles.fieldGroup}>
                                <p style={styles.p}>นามสกุล</p>
                                <div style={styles.inputBox}>{profile.lastName}</div>
                            </div>

                            <div style={styles.fieldGroup}>
                                <p style={styles.p}>อีเมล</p>
                                <div style={styles.inputBox}>{profile.email}</div>
                            </div>

                            <div style={styles.fieldGroup}>
                                <p style={styles.p}>เบอร์โทรศัพท์</p>
                                <div style={styles.inputBox}>{profile.phoneNumber}</div>
                            </div>
                        </div>

                        {/* ปุ่มแก้ไขข้อมูล */}
                        <div style={styles.buttonWrapper}>
                            <button
                                style={styles.editBtn}
                                onClick={() => {
                                    setFormData({
                                        firstName: profile.firstName || "",
                                        lastName: profile.lastName || "",
                                        phoneNumber: profile.phoneNumber || ""
                                    });
                                    setIsEditing(true);
                                }}
                            >
                                <i className='material-icons'>edit</i>แก้ไขข้อมูล
                            </button>
                        </div>
                    </>) : (
                    <>
                        <div style={styles.formGrid}>
                            <div style={styles.fieldGroup}>
                                <p style={styles.p}>ชื่อ</p>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    style={{ ...styles.inputBox, color: "#000" }}
                                    onFocus={(e) => { e.target.style.outline = "none"; }}
                                    onChange={handleChange}
                                />
                                {errors.firstName && <p style={styles.errorText}>{errors.firstName}</p>}
                            </div>

                            <div style={styles.fieldGroup}>
                                <p style={styles.p}>นามสกุล</p>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    style={{ ...styles.inputBox, color: "#000" }}
                                    onFocus={(e) => { e.target.style.outline = "none"; }}
                                    onChange={handleChange}
                                />
                                {errors.lastName && <p style={styles.errorText}>{errors.lastName}</p>}
                            </div>

                            <div style={styles.fieldGroup}>
                                <p style={styles.p}>อีเมล</p>
                                <div style={styles.inputBox}>{profile.email}</div>
                            </div>

                            <div style={styles.fieldGroup}>
                                <p style={styles.p}>เบอร์โทรศัพท์</p>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    style={{ ...styles.inputBox, color: "#000" }}
                                    onFocus={(e) => { e.target.style.outline = "none"; }}
                                    onChange={handleChange}
                                />
                                {errors.phoneNumber && <p style={styles.errorText}>{errors.phoneNumber}</p>}
                            </div>
                        </div>

                        <div style={{ ...styles.buttonWrapper, gap: "20px" }}>
                            <button
                                style={{
                                    ...styles.editBtn,
                                    backgroundColor: "#fffcf8",
                                    color: "#328d7d",
                                    border: "2px solid #328d7d"
                                }}
                                onClick={() => setIsEditing(false)}
                            >
                                ยกเลิก
                            </button>

                            <button
                                style={styles.editBtn}
                                onClick={handleSave}
                            >
                                บันทึกข้อมูล
                            </button>

                        </div>
                    </>
                )}


            </div>
        </div>
    );
};

const styles = {
    container: {
        // minHeight: '100vh',
        padding: '20px 20px',
        display: 'flex',
        justifyContent: 'center',
    },
    wrapper: {
        width: '100%',
        maxWidth: '800px',
    },
    title: {
        color: '#328d7d',
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px',
        marginTop: '20px'
    },
    banner: {
        backgroundColor: '#328d7d',
        borderRadius: '15px',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '30px',
    },
    avatarWrapper: {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        overflow: 'hidden',
        marginBottom: '15px',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    userName: {
        color: '#fffcf8',
        fontSize: '22px',
        fontWeight: 'bold',
        margin: 0,
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px 40px',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    p: {
        fontSize: '16px',
        fontWeight: '500',
        color: '#333',
        margin: 0,
    },
    inputBox: {
        backgroundColor: '#ffe8cc',
        padding: '15px',
        borderRadius: '15px',
        color: '#737373',
        fontSize: '14px',
        border: 'none'
    },
    buttonWrapper: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '40px',
    },
    editBtn: {
        backgroundColor: '#ff9100',
        color: '#fff',
        border: 'none',
        padding: '12px 30px',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '180px'
        // boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    loading: {
        textAlign: "center",
        padding: "100px",
        color: "#ff8c00",
        fontSize: "20px"
    },
    errorText: {
        color: "red",
        fontSize: "14px",
        marginTop: "5px",
        marginBottom: "0px",
        display: "block",
        textAlign: "left"
    },
};