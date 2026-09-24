import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { decodeToken } from '../utils/jwt.js';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState("");

    // State สำหรับควบคุม Custom Popup กลางจอ
    const [popup, setPopup] = useState({ show: false, type: '', title: '', message: '' });

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

                // แสดง Popup สำเร็จ
                setPopup({
                    show: true,
                    type: 'success',
                    title: 'เข้าสู่ระบบสำเร็จ',
                    message: 'กำลังพาคุณไปยังหน้าหลัก...'
                });

                setTimeout(() => {
                    if (resData.data.isAdmin) {
                        navigate('/admin-dashboard');
                    } else {
                        navigate('/');
                    }
                }, 1500);
            } else {
                // แสดง Popup เมื่อข้อมูลไม่ถูกต้อง
                setPopup({
                    show: true,
                    type: 'error',
                    title: 'เข้าสู่ระบบไม่สำเร็จ',
                    message: resData.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
                });
            }
        } catch (error) {
            console.error("Login Error:", error);
            setPopup({
                show: true,
                type: 'error',
                title: 'เกิดข้อผิดพลาด',
                message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const closePopup = () => {
        setPopup(prev => ({ ...prev, show: false }));
    };

    const getInputBoxStyle = (fieldName) => {
        const isError = Boolean(errors[fieldName]);
        const isFocused = focusedInput === fieldName;

        let borderColor = "#E2E8F0";
        let bgColor = "#FAFAFA";
        let boxShadow = "none";

        if (isError) {
            borderColor = "#FCA5A5";
            bgColor = "#FEF2F2";
        } else if (isFocused) {
            borderColor = "#93C5FD";
            bgColor = "#FFFFFF";
            boxShadow = "0 0 0 4px rgba(147, 197, 253, 0.25)";
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
            {/* แทรก Style ป้องกันสี AutoFill ซ้อนทับให้โปร่งใส */}
            <style>{`
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
                    transition: background-color 99999s ease-in-out 0s;
                    -webkit-text-fill-color: #334155 !important;
                }
            `}</style>

            <div style={styles.card}>
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
                                color: errors.email ? "#F87171" : (focusedInput === "email" ? "#60A5FA" : "#94A3B8")
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
                                color: errors.password ? "#F87171" : (focusedInput === "password" ? "#60A5FA" : "#94A3B8")
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
                                    color: errors.password ? "#F87171" : "#94A3B8"
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

                    {/* Submit Button */}
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

            {/* Custom Pastel Popup Modal กลางจอ */}
            {popup.show && (
                <div style={styles.overlay}>
                    <div style={styles.popupCard}>
                        <div style={{
                            ...styles.popupIconWrapper,
                            backgroundColor: popup.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                            color: popup.type === 'success' ? '#10B981' : '#F87171'
                        }}>
                            <i className="material-icons" style={{ fontSize: '36px' }}>
                                {popup.type === 'success' ? 'check_circle_outline' : 'error_outline'}
                            </i>
                        </div>

                        <h3 style={styles.popupTitle}>{popup.title}</h3>
                        <p style={styles.popupMessage}>{popup.message}</p>

                        {popup.type !== 'success' && (
                            <button
                                onClick={closePopup}
                                style={{
                                    ...styles.popupButton,
                                    backgroundColor: '#FECDD3',
                                    color: '#991B1B'
                                }}
                            >
                                ตกลง
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    pageBackground: {
        minHeight: "calc(100vh - 70px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #F3E8FF 100%)",
        padding: "16px",
        boxSizing: "border-box",
    },
    card: {
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: "24px",
        padding: "32px 32px",
        border: "1px solid rgba(255, 255, 255, 0.8)",
        boxShadow: "0 20px 40px rgba(199, 210, 254, 0.35)",
        textAlign: "center"
    },
    iconWrapper: {
        width: "64px",
        height: "64px",
        borderRadius: "20px",
        background: "linear-gradient(135deg, #E0F2FE 0%, #DDD6FE 100%)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "18px",
        boxShadow: "0 8px 16px -4px rgba(167, 139, 250, 0.25)"
    },
    icon: {
        fontSize: "32px",
        color: "#818CF8"
    },
    title: {
        color: "#334155",
        fontSize: "26px",
        fontWeight: "700",
        margin: "0 0 6px 0",
        letterSpacing: "-0.3px"
    },
    subtitle: {
        color: "#64748B",
        fontSize: "14px",
        margin: "0 0 28px 0",
        fontWeight: "400"
    },
    form: {
        textAlign: "left"
    },
    fieldGroup: {
        marginBottom: "18px"
    },
    labelRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },
    label: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#475569",
        display: "block",
        marginBottom: "6px",
        letterSpacing: "0.2px"
    },
    inputBox: {
        display: "flex",
        alignItems: "center",
        borderRadius: "14px",
        padding: "12px 16px",
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
        color: "#334155",
        padding: 0,
        fontWeight: "400"
    },
    errorContainer: {
        marginTop: "6px",
        paddingLeft: "4px"
    },
    errorText: {
        color: "#F87171",
        fontSize: "12px",
        fontWeight: "500"
    },
    button: {
        width: "100%",
        padding: "13px",
        marginTop: "8px",
        background: "linear-gradient(135deg, #93C5FD 0%, #A5B4FC 100%)",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "14px",
        fontSize: "15px",
        fontWeight: "600",
        transition: "all 0.25s ease",
        boxShadow: "0 8px 20px -4px rgba(165, 180, 252, 0.5)",
        letterSpacing: "0.3px"
    },
    loadingFlex: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px"
    },
    divider: {
        margin: "24px 0 18px 0",
        position: "relative",
        borderTop: "1px solid #E2E8F0"
    },
    dividerText: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "#FFFFFF",
        padding: "0 12px",
        color: "#94A3B8",
        fontSize: "12px"
    },
    registerText: {
        textAlign: "center",
        fontSize: "14px",
        color: "#64748B",
        margin: 0
    },
    registerLink: {
        color: "#818CF8",
        textDecoration: "none",
        fontWeight: "600",
        marginLeft: "4px"
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
    }
};