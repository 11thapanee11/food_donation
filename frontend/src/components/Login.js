import React, { useState, useEffect } from 'react';
// import '../css/login.css';
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import { decodeToken } from '../utils/jwt.js';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({ email: "", password: "" });
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');

        if (token) {
            const userData = decodeToken(token);

            if (userData) {
                // ดักเช็คจากคีย์ "isAdmin" ที่หลังบ้านส่งมาได้ตรงๆ เลยครับ!
                if (userData.isAdmin === true) {
                    navigate('/admin-dashboard', { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            } else {
                // ถ้าตั๋วหมดอายุหรือปลอมแปลงจนแกะไม่ได้ ให้ล้างทิ้ง
                localStorage.removeItem('accessToken');
            }
        }
    }, [navigate]);

    const validateForm = () => {
        let valid = true;
        let newErrors = { email: "", password: "" };

        if (!email || !email.trim()) {
            newErrors.email = "กรุณากรอกอีเมล";
            valid = false;
        } else {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                newErrors.email = "กรุณากรอกข้อมูลให้ถูกต้อง";
                valid = false;
            }
        }
        if (!password.trim()) {
            newErrors.password = "กรุณากรอกรหัสผ่าน";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const response = await fetch("http://localhost:8082/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const resData = await response.json(); // เปลี่ยนชื่อเป็น resData เพื่อให้เห็นภาพโครงสร้างชัดเจน

            if (resData.success) {

                // accessToken ออกมาจากชั้น resData.data
                localStorage.setItem("accessToken", resData.data.accessToken);

                Swal.fire({
                    icon: 'success',
                    title: 'เข้าสู่ระบบสำเร็จ',
                    // text: resData.message,
                    confirmButtonColor: '#2ecc71'
                }).then(() => {
                    if (resData.data.isAdmin) {
                        navigate('/admin-dashboard');
                    } else {
                        navigate('/');
                    }
                });
            } else {
                // กรณีอีเมลหรือรหัสผ่านผิดพลาด
                Swal.fire({
                    icon: 'error',
                    title: 'เข้าสู่ระบบไม่สำเร็จ',
                    text: resData.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
                    confirmButtonColor: '#e74c3c'
                });
            }
        } catch (error) {
            console.error("Login Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
                confirmButtonColor: '#e74c3c'
            });
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.iconWrapper}>
                <i className="material-icons-outlined" style={styles.icon}>volunteer_activism</i>
            </div>
            <h2 style={styles.title}>เข้าสู่ระบบ</h2>
            <form style={styles.form} onSubmit={handleSubmit} noValidate>
                <p style={styles.label}>อีเมล</p>
                <div style={styles.inputBox}>
                    <i className="material-icons" style={styles.inputIcon}>person</i>
                    <input
                        type="email"
                        placeholder="กรอกอีเมล"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={styles.input}
                    />
                </div>
                {errors.email && <p style={styles.errorText}>{errors.email}</p>}

                <p style={styles.label}>รหัสผ่าน</p>
                <div style={styles.inputBox}>
                    <i className="material-icons" style={styles.inputIcon}>lock</i>
                    <input
                        type="password"
                        placeholder="กรอกรหัสผ่าน"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                    />
                </div>
                {errors.password && <p style={styles.errorText}>{errors.password}</p>}

                <button
                    type="submit"
                    style={styles.button}
                // onMouseOver={(e) => e.target.style.backgroundColor = "#e67e00"}
                // onMouseOut={(e) => e.target.style.backgroundColor = "#ff8c00"}
                >
                    เข้าสู่ระบบ
                </button>
            </form>

            <p style={styles.registerText}>
                ยังไม่มีบัญชี? <a href="/register" style={styles.registerLink}>ลงทะเบียนเลย</a>
            </p>
        </div>
    );
}

//ประกาศตัวแปร Styles
const styles = {
    container: {
        width: "350px",
        margin: "80px auto",
        textAlign: "center",
        fontFamily: "'Noto Sans Thai', sans-serif"
    },
    iconWrapper: {
        color: "#ff8c00",
        marginBottom: "10px"
    },
    icon: {
        fontSize: "60px"
    },
    title: {
        color: "#328d7d",
        marginBottom: "25px",
        fontSize: "30px",
        fontWeight: "bold",
        marginTop: "10px"
    },
    form: {
        textAtign: "left"
    },
    label: {
        fontSize: "16px",
        display: "block",
        marginBottom: "5px",
        textAlign: "left"
    },
    inputBox: {
        display: "flex",
        alignItems: "center",
        background: "#ffe8cc",
        borderRadius: "8px",
        padding: "10px",
        marginBottom: "15px"
    },
    inputIcon: {
        color: "#ff8c00",
        marginRight: "10px"
    },
    input: {
        border: "none",
        outline: "none",
        background: "transparent",
        width: "100%",
        fontFamily: "inherit"
    },
    errorText: {
        color: "red",
        fontSize: "13px",
        marginTop: "-10px",
        marginBottom: "10px",
        display: "block",
        textAlign: "left"
    },
    button: {
        width: "200px",
        display: "block",
        margin: "30px auto 0 auto",
        padding: "10px",
        backgroundColor: "#ff8c00",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "16px",
        transition: "0.3s"
    },
    registerText: {
        textAlign: "center",
        marginTop: "20px",
        fontSize: "14px"
    },
    registerLink: {
        color: "#328d7d",
        textDecoration: "none",
        fontWeight: "bold"
    }
};
