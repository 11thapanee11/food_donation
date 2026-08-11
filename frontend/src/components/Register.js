import React, { useState } from "react";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import registerImg from '../assets/images/register_image.png'

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
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                    title: "สำเร็จ!",
                    text: result.message || "สมัครสมาชิกสำเร็จเรียบร้อยแล้ว",
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
        <div style={styles.container}>
            <div style={styles.formSection}>
                <h2 style={styles.title}>สร้างบัญชีใหม่</h2>
                <form onSubmit={handleSubmit} noValidate>
                    <div style={styles.row}>
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

                    <button type="submit" style={styles.button}>
                        สมัครสมาชิก
                    </button>
                </form>
            </div>

            <div style={styles.imageSection}>
                <img src={registerImg} alt="food" style={styles.image} />
            </div>
        </div>
    );
}

// ---------------- Reusable Input Component ----------------
const InputField = ({ label, name, type = "text", value, onChange, error }) => (
    <div style={{ ...styles.inputBox, flex: "none" }}>
        <p style={styles.label}>{label}</p>
        <input
            type={type}
            name={name}
            placeholder={`กรุณากรอก${label}`}
            value={value}
            onChange={onChange}
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
        alignItems: "center",
        padding: "20px",
        gap: "100px",
        fontFamily: "'Noto Sans Thai', sans-serif",
        backgroundColor: "#fffcf8",
        // minHeight: "100vh"
    },
    formSection: {
        width: "500px"
    },
    title: {
        color: "#328d7d",
        marginBottom: "5px",
        fontWeight: "bold",
        marginTop: "20px",
        fontSize: "30px"
    },
    row: {
        display: "flex",
        gap: "20px",
    },
    inputBox: {
        flex: 1,
        marginBottom: "0px"
    },
    label: {
        fontSize: "16px",
        display: "block",
        marginBottom: "5px",
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
        marginTop: "4px",
        display: "block"
    },
    button: {
        width: "250px",
        display: "block",
        margin: "25px auto 0 auto",
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
        display: "block"
    },
    image: {
        width: "390px",
        borderRadius: "15px",
        // boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        marginTop: "30px"
    }
};

