import React, { useState } from "react";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import registerImg from '../assets/images/register_image.png';

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: ""
    });

    const [errors, setErrors] = useState({});

    // ---------------- Helper Functions ----------------
    const validateName = (value, fieldName) => {
        if (!value.trim()) return `กรุณากรอก${fieldName}`;
        if (value.length < 2 || value.length > 155) return `${fieldName}ต้องมี 2-155 ตัวอักษร`;
        if (!/^[ก-๙a-zA-Z]+$/.test(value)) return `${fieldName}ต้องเป็นภาษาไทยหรืออังกฤษเท่านั้น`;
        return null;
    };

    const validateForm = () => {
        const newErrors = {};

        // ชื่อ & นามสกุล
        const fNameErr = validateName(formData.firstName, "ชื่อ");
        if (fNameErr) newErrors.firstName = fNameErr;

        const lNameErr = validateName(formData.lastName, "นามสกุล");
        if (lNameErr) newErrors.lastName = lNameErr;

        // อีเมล
        if (!formData.email.trim()) {
            newErrors.email = "กรุณากรอกอีเมล";
        } else if (formData.email.length > 155) {
            newErrors.email = "อีเมลยาวเกินกำหนด";
        } else if (!/^[A-Za-z0-9]+([._-][A-Za-z0-9]+)*@[A-Za-z0-9-]+\.[A-Za-z]{2,}$/.test(formData.email)) {
            newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
        }

        // เบอร์โทรศัพท์
        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = "กรุณากรอกเบอร์โทรศัพท์";
        } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = "ต้องเป็นตัวเลข 10 หลัก";
        } else if (!/^(06|08|09)/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = "ต้องขึ้นต้นด้วย 06, 08 หรือ 09";
        }

        // รหัสผ่าน
        if (!formData.password.trim()) {
            newErrors.password = "กรุณากรอกรหัสผ่าน";
        } else if (formData.password.length < 8 || formData.password.length > 16) {
            newErrors.password = "ต้องมีความยาว 8-16 ตัวอักษร";
        } else if (!/^[A-Za-z0-9!#_.]+$/.test(formData.password)) {
            newErrors.password = "ใช้ได้เฉพาะ A-Z, 0-9 และ ! # _ .";
        }

        // ยืนยันรหัสผ่าน
        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ---------------- Event Handlers ----------------
    const handleChange = (e) => {
        const { name, value } = e.target;

        // อัปเดตค่าใน formData ตามปกติ
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));

        // ถ้ามีการพิมพ์ข้อมูลแล้วให้ลบ Error
        if (value.trim() !== "") {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [name]: null
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const response = await fetch("http://localhost:8082/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                Swal.fire({
                    icon: "success",
                    title: result.message || "สมัครสมาชิกเรียบร้อยแล้ว",
                    // text: result.message || "สมัครสมาชิกสำเร็จเรียบร้อยแล้ว",
                    confirmButtonColor: "#2ecc71"
                }).then(() => navigate("/login"));
            } else {
                Swal.fire({
                    icon: "error",
                    title: "สมัครสมาชิกไม่สำเร็จ",
                    text: result.message || "เกิดข้อผิดพลาดภายในระบบ",
                    confirmButtonColor: "#d63031"
                });
            }
        } catch (error) {
            console.error("Error:", error);
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",
                confirmButtonColor: "#d63031"
            });
        }
    };

    // ---------------- Render ----------------
    return (
        <div style={styles.container} className="register-container">
            {/* CSS สำหรับ Responsive Media Queries */}
            <style>{`
                @media (max-width: 868px) {
                    .register-container {
                        flex-direction: column !important;
                        gap: 10px !important;
                        padding: 30px !important;
                    }
                    .register-form-section {
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    .register-image-section {
                        display: none !important; /* ซ่อนรูปเมื่อหน้าจอเล็ก */
                    }
                }

                @media (max-width: 480px) {
                    .register-row {
                        flex-direction: column !important;
                        gap: 0px !important;
                    }
                    .register-title {
                        font-size: 24px !important;
                        text-align: center;
                    }
                    .register-button {
                        width: 100% !important;
                    }
                }
            `}</style>

            <div style={styles.formSection} className="register-form-section">
                <h2 style={styles.title} className="register-title">สร้างบัญชีใหม่</h2>
                <form onSubmit={handleSubmit} noValidate autoComplete="off">
                    <div style={styles.row} className="register-row">
                        <InputField
                            label="ชื่อ"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            error={errors.firstName}
                        />
                        <InputField
                            label="นามสกุล"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            error={errors.lastName}
                        />
                    </div>

                    <InputField
                        label="อีเมล"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                    />

                    <InputField
                        label="เบอร์โทรศัพท์"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        error={errors.phoneNumber}
                    />

                    <InputField
                        label="รหัสผ่าน"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                    />

                    <InputField
                        label="ยืนยันรหัสผ่าน"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                    />

                    <button type="submit" style={styles.button} className="register-button">
                        สมัครสมาชิก
                    </button>
                </form>
            </div>

            <div style={styles.imageSection} className="register-image-section">
                <img src={registerImg} alt="food" style={styles.image} />
            </div>
        </div>
    );
}

// ---------------- Reusable Input Component ----------------
const InputField = ({ label, name, type = "text", value, onChange, error, style, autoComplete = "off" }) => (
    <div style={{ ...styles.inputBox, ...style }}>
        <p style={styles.label}>{label}</p>
        <input
            type={type}
            name={name}
            placeholder={`กรุณากรอก${label}`}
            value={value}
            onChange={onChange}
            autoComplete={type === "password" ? "new-password" : autoComplete}
            style={styles.input}
        />
        {error && <span style={styles.errorText}>{error}</span>}
    </div>
);

export default Register;

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        padding: "30px",
        gap: "30px",
        fontFamily: "'Noto Sans Thai', sans-serif",
        backgroundColor: "#fffcf8",
        minHeight: "auto",
        boxSizing: "border-box"
    },
    formSection: {
        alignItems: "flex-start",
        width: "100%",
        maxWidth: "450px"
    },
    title: {
        color: "#328d7d",
        fontWeight: "bold",
        marginTop: "0px",
        fontSize: "30px"
    },
    row: {
        display: "flex",
        gap: "15px",
        width: "100%",
        marginBottom: 0
    },
    inputBox: {
        flex: 1,
        marginBottom: "25px",
        position: "relative"
    },
    label: {
        fontSize: "16px",
        display: "block",
        marginTop: 0,
        marginBottom: "5px",
        lineHeight: "1.2",
        color: "#333"
    },
    input: {
        width: "100%",
        padding: "12px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#ffe8cc",
        outline: "none",
        boxSizing: "border-box",
        fontSize: "14px"
    },
    errorText: {
        color: "red",
        fontSize: "13px",
        position: "absolute",
        bottom: "-22px",
        left: "0"
    },
    button: {
        width: "250px",
        display: "block",
        margin: "30px auto 0 auto",
        padding: "12px",
        backgroundColor: "#ff8c00",
        color: "white",
        border: "none",
        borderRadius: "10px",
        fontSize: "16px",
        cursor: "pointer",
        transition: "0.3s"
    },
    imageSection: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    image: {
        width: "100%",
        maxWidth: "380px",
        borderRadius: "15px",
        objectFit: "cover"
    }
};