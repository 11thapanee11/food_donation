import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate, Link } from "react-router-dom";
import { decodeToken } from '../utils/jwt.js';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState("");

    const navigate = useNavigate();

    const toggleShowPassword = () => {
        setShowPassword(prev => !prev);
    };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            const userData = decodeToken(token);
            if (userData) {
                if (userData.isAdmin === true) {
                    navigate('/admin-dashboard', { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            } else {
                localStorage.removeItem('accessToken');
            }
        }
    }, [navigate]);

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
    };

    const validateForm = () => {
        let valid = true;
        let newErrors = { email: "", password: "" };

        if (!email || !email.trim()) {
            newErrors.email = "กรุณากรอกอีเมล";
            valid = false;
        } else {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
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

        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:8082/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const resData = await response.json();

            if (resData.success) {
                localStorage.setItem("accessToken", resData.data.accessToken);

                Swal.fire({
                    icon: 'success',
                    title: 'เข้าสู่ระบบสำเร็จ',
                    confirmButtonColor: '#328d7d',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    if (resData.data.isAdmin) {
                        navigate('/admin-dashboard');
                    } else {
                        navigate('/');
                    }
                });
            } else {
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
        } finally {
            setIsLoading(false);
        }
    };

    const getInputBoxStyle = (fieldName) => {
        const isError = Boolean(errors[fieldName]);
        const isFocused = focusedInput === fieldName;

        let borderColor = "#eaeaea";
        let bgColor = "#ffff";
        let boxShadow = "none";

        if (isError) {
            borderColor = "#ff4d4f";
            bgColor = "#fff1f0";
        } else if (isFocused) {
            borderColor = "#ff8c00";
            bgColor = "#ffffff";
            boxShadow = "0 0 0 4px rgba(255, 140, 0, 0.12)";
        }

        return {
            ...styles.inputBox,
            border: `1.5px solid ${borderColor}`,
            backgroundColor: bgColor,
            boxShadow: boxShadow
        };
    };

    return (
        <div style={styles.pageBackground}>
            <div style={styles.card}>
                {/* Modern Brand Badge */}
                <div style={styles.iconWrapper}>
                    <i className="material-icons-outlined" style={styles.icon}>volunteer_activism</i>
                </div>
                
                <h2 style={styles.title}>ยินดีต้อนรับ</h2>
                <p style={styles.subtitle}>กรุณากรอกบัญชีของคุณเพื่อเข้าสู่ระบบ</p>

                <form style={styles.form} onSubmit={handleSubmit} noValidate>
                    {/* Email Input */}
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>อีเมล</label>
                        <div style={getInputBoxStyle("email")}>
                            <i className="material-icons" style={{
                                ...styles.inputIcon,
                                color: errors.email ? "#ff4d4f" : (focusedInput === "email" ? "#ff8c00" : "#94a3b8")
                            }}>mail_outline</i>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={handleEmailChange}
                                onFocus={() => setFocusedInput("email")}
                                onBlur={() => setFocusedInput("")}
                                style={styles.input}
                            />
                        </div>
                        {errors.email && (
                            <div style={styles.errorContainer}>
                                <span style={styles.errorText}>{errors.email}</span>
                            </div>
                        )}
                    </div>

                    {/* Password Input */}
                    <div style={styles.fieldGroup}>
                        <div style={styles.labelRow}>
                            <label style={styles.label}>รหัสผ่าน</label>
                        </div>
                        <div style={getInputBoxStyle("password")}>
                            <i className="material-icons" style={{
                                ...styles.inputIcon,
                                color: errors.password ? "#ff4d4f" : (focusedInput === "password" ? "#ff8c00" : "#94a3b8")
                            }}>lock_open</i>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={handlePasswordChange}
                                onFocus={() => setFocusedInput("password")}
                                onBlur={() => setFocusedInput("")}
                                style={styles.input}
                            />
                            <i
                                className="material-icons"
                                onClick={toggleShowPassword}
                                style={{
                                    ...styles.eyeIcon,
                                    color: errors.password ? "#ff4d4f" : "#94a3b8"
                                }}
                            >
                                {showPassword ? "visibility" : "visibility_off"}
                            </i>
                        </div>
                        {errors.password && (
                            <div style={styles.errorContainer}>
                                <span style={styles.errorText}>{errors.password}</span>
                            </div>
                        )}
                    </div>

                    {/* Modern Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            ...styles.button,
                            opacity: isLoading ? 0.8 : 1,
                            cursor: isLoading ? "not-allowed" : "pointer"
                        }}
                    >
                        {isLoading ? (
                            <span style={styles.loadingFlex}>
                                <span style={styles.spinner}></span>
                                กำลังเข้าสู่ระบบ...
                            </span>
                        ) : (
                            "เข้าสู่ระบบ"
                        )}
                    </button>
                </form>

                <div style={styles.divider}>
                    <span style={styles.dividerText}>หรือ</span>
                </div>

                <p style={styles.registerText}>
                    ยังไม่มีบัญชีสมาชิก? <Link to="/register" style={styles.registerLink}>สร้างบัญชีใหม่</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    pageBackground: {
        minHeight: "calc(100vh - 70px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #ffff 0%, #fffefc 100%)",
        padding: "16px", 
        boxSizing: "border-box",
    },
    card: {
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: "20px",
        padding: "28px 32px", // ลดระยะ padding จาก 44px เหลือ 28px
        border: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "0 20px 40px rgba(255, 246, 229, 0.25), 0 8px 16px rgba(180, 180, 180, 0.42)",
        textAlign: "center"
    },
    iconWrapper: {
        width: "68px",
        height: "68px",
        borderRadius: "20px",
        background: "linear-gradient(135deg, #fff0df 0%, #ffe4c4 100%)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "20px",
        boxShadow: "0 8px 16px -4px rgba(255, 140, 0, 0.15)"
    },
    icon: {
        fontSize: "36px",
        color: "#ff7a00"
    },
    title: {
        color: "#1e293b",
        fontSize: "28px",
        fontWeight: "700",
        margin: "0 0 8px 0",
        letterSpacing: "-0.5px"
    },
    subtitle: {
        color: "#64748b",
        fontSize: "14px",
        margin: "0 0 32px 0",
        fontWeight: "400"
    },
    form: {
        textAlign: "left"
    },
    fieldGroup: {
        marginBottom: "20px"
    },
    labelRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },
    label: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#334155",
        display: "block",
        marginBottom: "8px",
        letterSpacing: "0.2px"
    },
    inputBox: {
        display: "flex",
        alignItems: "center",
        borderRadius: "14px",
        padding: "13px 16px",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
    },
    inputIcon: {
        marginRight: "12px",
        fontSize: "20px",
        fontFamily: "'Material Icons'",
        flexShrink: 0,
        transition: "color 0.2s ease"
    },
    eyeIcon: {
        cursor: "pointer",
        userSelect: "none",
        fontSize: "20px",
        marginLeft: "12px",
        fontFamily: "'Material Icons'",
        flexShrink: 0,
        transition: "color 0.2s ease"
    },
    input: {
        border: "none",
        outline: "none",
        background: "transparent",
        width: "100%",
        fontFamily: "inherit",
        fontSize: "14px",
        color: "#0f172a",
        padding: 0,
        fontWeight: "400"
    },
    errorContainer: {
        marginTop: "6px",
        paddingLeft: "4px"
    },
    errorText: {
        color: "#ff4d4f",
        fontSize: "12px",
        fontWeight: "500"
    },
    button: {
        width: "100%",
        padding: "14px",
        marginTop: "10px",
        background: "linear-gradient(135deg, #ff8c00 0%, #ff7a00 100%)",
        color: "#ffffff",
        border: "none",
        borderRadius: "14px",
        fontSize: "15px",
        fontWeight: "600",
        transition: "all 0.25s ease",
        boxShadow: "0 8px 20px -4px rgba(255, 140, 0, 0.35)",
        letterSpacing: "0.3px"
    },
    loadingFlex: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px"
    },
    divider: {
        margin: "28px 0 20px 0",
        position: "relative",
        borderTop: "1px solid #e2e8f0"
    },
    dividerText: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "#ffffff",
        padding: "0 12px",
        color: "#94a3b8",
        fontSize: "12px"
    },
    registerText: {
        textAlign: "center",
        fontSize: "14px",
        color: "#64748b",
        margin: 0
    },
    registerLink: {
        color: "#328d7d",
        textDecoration: "none",
        fontWeight: "600",
        marginLeft: "4px"
    }
};