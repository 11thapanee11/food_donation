import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isBtnHovered, setIsBtnHovered] = useState(false);

    // State สำหรับเปิด-ปิดการมองเห็นรหัสผ่าน
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // State สำหรับควบคุม Custom Popup Modal กลางจอ
    const [popup, setPopup] = useState({ show: false, type: '', title: '', message: '', showBtn: true });

    // ---------------- Helper Functions ----------------
    const validateName = (value, fieldName) => {
        if (!value.trim()) return `กรุณากรอก${fieldName}`;
        if (value.length < 2 || value.length > 155) return `${fieldName}ต้องมี 2-155 ตัวอักษร`;
        if (!/^[ก-๙a-zA-Z]+$/.test(value)) return `${fieldName}ต้องเป็นภาษาไทยหรืออังกฤษเท่านั้น`;
        return null;
    };

    const getPasswordStrength = (pass) => {
        if (!pass) return 0;
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[!#_.]/.test(pass)) score++;
        return score;
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

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [name]: null,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);

        // แสดง Popup กำลังลงทะเบียน
        setPopup({
            show: true,
            type: 'loading',
            title: 'กำลังลงทะเบียน...',
            message: 'กรุณารอสักครู่ระบบกำลังสร้างบัญชีของคุณ',
            showBtn: false
        });

        try {
            const response = await fetch("http://localhost:8082/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                setPopup({
                    show: true,
                    type: 'success',
                    title: 'สมัครสมาชิกสำเร็จ',
                    message: result.message || "สร้างบัญชีเรียบร้อยแล้ว กำลังนำคุณไปยังหน้าเข้าสู่ระบบ",
                    showBtn: true
                });
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setPopup({
                    show: true,
                    type: 'error',
                    title: 'สมัครสมาชิกไม่สำเร็จ',
                    message: result.message || "เกิดข้อผิดพลาดภายในระบบ",
                    showBtn: true
                });
            }
        } catch (error) {
            console.error("Error:", error);
            setPopup({
                show: true,
                type: 'error',
                title: 'เกิดข้อผิดพลาด',
                message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",
                showBtn: true
            });
        } finally {
            setIsLoading(false);
        }
    };

    const closePopup = () => {
        setPopup(prev => ({ ...prev, show: false }));
    };

    const passStrength = getPasswordStrength(formData.password);

    return (
        <div style={styles.pageWrapper}>
            <div style={styles.card}>
                <div style={styles.formSection}>
                    <div style={styles.headerGroup}>
                        <h2 style={styles.title}>สร้างบัญชีใหม่</h2>
                        <p style={styles.subtitle}>กรอกข้อมูลด้านล่างเพื่อเริ่มใช้งานแพลตฟอร์ม</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate autoComplete="off">
                        <div style={styles.row}>
                            <InputField
                                label="ชื่อ"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                error={errors.firstName}
                                required={true}
                            />
                            <InputField
                                label="นามสกุล"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                error={errors.lastName}
                                required={true}
                            />
                        </div>

                        <InputField
                            label="อีเมล"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            required={true}
                        />

                        <InputField
                            label="เบอร์โทรศัพท์"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            error={errors.phoneNumber}
                            required={true}
                        />

                        <InputField
                            label="รหัสผ่าน"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password}
                            required={true}
                            isPassword={true}
                            showPassword={showPassword}
                            onTogglePassword={() => setShowPassword((prev) => !prev)}
                        />

                        {/* Password Strength Indicator */}
                        {formData.password.length > 0 && (
                            <div style={styles.strengthContainer}>
                                <div style={styles.strengthBarBg}>
                                    <div
                                        style={{
                                            ...styles.strengthBarFill,
                                            width: `${(passStrength / 4) * 100}%`,
                                            backgroundColor:
                                                passStrength <= 1
                                                    ? "#f43f5e"
                                                    : passStrength <= 3
                                                        ? "#fbbf24"
                                                        : "#34d399",
                                        }}
                                    />
                                </div>
                                <span style={styles.strengthText}>
                                    {passStrength <= 1 ? "อ่อน" : passStrength <= 3 ? "ปานกลาง" : "ปลอดภัยสูง"}
                                </span>
                            </div>
                        )}

                        <InputField
                            label="ยืนยันรหัสผ่าน"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            error={errors.confirmPassword}
                            required={true}
                            isPassword={true}
                            showPassword={showConfirmPassword}
                            onTogglePassword={() => setShowConfirmPassword((prev) => !prev)}
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            onMouseEnter={() => setIsBtnHovered(true)}
                            onMouseLeave={() => setIsBtnHovered(false)}
                            style={{
                                ...styles.button,
                                transform: isBtnHovered && !isLoading ? "translateY(-2px)" : "translateY(0)",
                                opacity: isLoading ? 0.7 : 1,
                                cursor: isLoading ? "not-allowed" : "pointer",
                            }}
                        >
                            {isLoading ? "กำลังลงทะเบียน..." : "สมัครสมาชิก"}
                        </button>
                    </form>

                    <p style={styles.loginPrompt}>
                        มีบัญชีอยู่แล้ว?{" "}
                        <span style={styles.loginLink} onClick={() => navigate("/login")}>
                            เข้าสู่ระบบ
                        </span>
                    </p>
                </div>

                <div style={styles.pastelGraphicsSection}>
                    <div style={styles.decorCircle1}></div>
                    <div style={styles.decorCircle2}></div>
                    <div style={styles.graphicsCardContent}>
                        <div style={styles.iconGroup}>
                            <i className="material-icons" style={{ fontSize: '48px', color: '#ffffff' }}>restaurant</i>
                            <i className="material-icons" style={{ fontSize: '32px', color: 'rgba(255,255,255,0.8)' }}>favorite</i>
                        </div>
                        <h3 style={styles.graphicsTitle}>ยินดีต้อนรับสู่สังคมอาหารคุณภาพ</h3>
                        <p style={styles.graphicsSubtitle}>จัดการและเข้าถึงเมนูที่คุณชื่นชอบ พร้อมแบ่งปันความสุขได้ทันที</p>
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
                                backgroundColor: popup.type === 'success' ? '#f0fdf4' : '#fef2f2',
                                color: popup.type === 'success' ? '#10b981' : '#f87171'
                            }}>
                                <i className="material-icons" style={{ fontSize: '36px' }}>
                                    {popup.type === 'success' ? 'check_circle_outline' : 'error_outline'}
                                </i>
                            </div>
                        )}

                        <h3 style={styles.popupTitle}>{popup.title}</h3>
                        <p style={styles.popupMessage}>{popup.message}</p>

                        {popup.showBtn && (
                            <button
                                onClick={closePopup}
                                style={{
                                    ...styles.popupButton,
                                    backgroundColor: popup.type === 'success' ? '#c084fc' : '#fecdd3',
                                    color: popup.type === 'success' ? '#ffffff' : '#991b1b'
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

// ---------------- Reusable Input Component ----------------
const InputField = ({
    label,
    name,
    type = "text",
    value,
    onChange,
    error,
    required = false,
    isPassword = false,
    showPassword = false,
    onTogglePassword,
}) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div style={styles.fieldGroup}>
            <label style={styles.label}>
                {label}
                {required && <span style={styles.requiredMark}> *</span>}
            </label>
            <div
                style={{
                    ...styles.inputBox,
                    border: error
                        ? "1.5px solid #f43f5e"
                        : isFocused
                            ? "1.5px solid #c084fc"
                            : "1.5px solid #e2e8f0",
                    backgroundColor: error ? "#fff5f5" : "#ffffff",
                    boxShadow: isFocused && !error
                        ? "0 0 0 4px rgba(192, 132, 252, 0.15)"
                        : "none",
                }}
            >
                <input
                    type={type}
                    name={name}
                    placeholder={`กรุณากรอก${label}`}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoComplete={isPassword ? "new-password" : "off"}
                    style={styles.input}
                />
                {isPassword && (
                    <i
                        onClick={onTogglePassword}
                        style={{
                            ...styles.eyeIcon,
                            color: error ? "#f43f5e" : "#94a3b8",
                        }}
                    >
                        {showPassword ? "visibility" : "visibility_off"}
                    </i>
                )}
            </div>
            {error && <span style={styles.errorText}>{error}</span>}
        </div>
    );
};

export default Register;

// ---------------- Inline Styles Object (Pastel Theme) ----------------
const styles = {
    pageWrapper: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "40px 20px",
        fontFamily: "'Prompt', sans-serif",
        background: "linear-gradient(135deg, #faf5ff 0%, #f0f9ff 50%, #f0fdf4 100%)",
        boxSizing: "border-box",
    },
    card: {
        display: "flex",
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "36px 40px",
        gap: "40px",
        width: "100%",
        maxWidth: "1100px",
        boxSizing: "border-box",
        boxShadow: "0 20px 40px rgba(192, 132, 252, 0.08), 0 8px 16px rgba(148, 163, 184, 0.08)",
        border: "1px solid rgba(241, 245, 249, 0.9)",
    },
    formSection: {
        flex: 1.1,
        width: "100%",
    },
    headerGroup: {
        marginBottom: "20px",
        textAlign: "left",
    },
    title: {
        color: "#334155",
        fontWeight: "700",
        margin: "0 0 6px 0",
        fontSize: "26px",
        letterSpacing: "-0.3px",
    },
    subtitle: {
        margin: 0,
        fontSize: "14px",
        color: "#64748b",
    },
    row: {
        display: "flex",
        gap: "16px",
        width: "100%",
    },
    fieldGroup: {
        flex: 1,
        width: "100%",
        marginBottom: "14px",
    },
    label: {
        fontSize: "14px",
        fontWeight: "600",
        display: "block",
        marginBottom: "6px",
        color: "#334155",
        textAlign: "left",
    },
    inputBox: {
        display: "flex",
        alignItems: "center",
        borderRadius: "14px",
        padding: "12px 16px",
        boxSizing: "border-box",
        transition: "all 0.2s ease-in-out",
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
    },
    eyeIcon: {
        cursor: "pointer",
        userSelect: "none",
        fontSize: "20px",
        marginLeft: "10px",
        lineHeight: 1,
        fontFamily: "'Material Icons'",
        flexShrink: 0,
    },
    errorText: {
        color: "#f43f5e",
        fontSize: "12px",
        marginTop: "4px",
        display: "block",
        textAlign: "left",
    },
    strengthContainer: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginTop: "-6px",
        marginBottom: "14px",
    },
    strengthBarBg: {
        flex: 1,
        height: "6px",
        backgroundColor: "#f1f5f9",
        borderRadius: "3px",
        overflow: "hidden",
    },
    strengthBarFill: {
        height: "100%",
        transition: "width 0.3s ease, background-color 0.3s ease",
    },
    strengthText: {
        fontSize: "12px",
        color: "#64748b",
        width: "75px",
        textAlign: "right",
        fontWeight: "500",
    },
    button: {
        width: "100%",
        padding: "13px",
        backgroundColor: "#c084fc",
        color: "#ffffff",
        border: "none",
        borderRadius: "14px",
        fontSize: "15px",
        fontWeight: "600",
        marginTop: "10px",
        transition: "all 0.2s ease",
        boxShadow: "0 4px 14px rgba(192, 132, 252, 0.35)",
    },
    loginPrompt: {
        textAlign: "center",
        marginTop: "18px",
        fontSize: "14px",
        color: "#64748b",
    },
    loginLink: {
        color: "#c084fc",
        fontWeight: "600",
        cursor: "pointer",
        textDecoration: "none",
        marginLeft: "4px",
    },
    imageSection: {
        flex: 0.9,
        display: "flex",
        alignItems: "stretch",
    },
    imageWrapper: {
        position: "relative",
        width: "100%",
        borderRadius: "20px",
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    imageOverlayText: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "28px",
        background: "linear-gradient(to top, rgba(15, 23, 42, 0.75), transparent)",
        color: "#ffffff",
        textAlign: "left",
    },
    imageOverlayTitle: {
        margin: "0 0 4px 0",
        fontSize: "18px",
        fontWeight: "600",
    },
    imageOverlaySubtitle: {
        margin: 0,
        fontSize: "13px",
        opacity: 0.9,
    },
    requiredMark: {
        color: "#f43f5e",
        marginLeft: "4px",
        fontWeight: "bold",
    },
    // Modal / Popup Styles
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
        backgroundColor: '#ffffff',
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
        color: '#64748b',
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
        border: '4px solid #f3e8ff',
        borderTop: '4px solid #c084fc',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    pastelGraphicsSection: {
        flex: 0.9,
        background: "linear-gradient(135deg, #c084fc 0%, #38bdf8 100%)",
        borderRadius: "20px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 30px",
        boxSizing: "border-box",
    },
    decorCircle1: {
        position: "absolute",
        width: "200px",
        height: "200px",
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.15)",
        top: "-50px",
        right: "-50px",
        backdropFilter: "blur(10px)",
    },
    decorCircle2: {
        position: "absolute",
        width: "150px",
        height: "150px",
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.12)",
        bottom: "-30px",
        left: "-30px",
    },
    graphicsCardContent: {
        position: "relative",
        zIndex: 2,
        textAlign: "center",
        color: "#ffffff",
    },
    iconGroup: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px",
        marginBottom: "20px",
    },
    graphicsTitle: {
        fontSize: "22px",
        fontWeight: "700",
        margin: "0 0 10px 0",
        letterSpacing: "-0.3px",
    },
    graphicsSubtitle: {
        fontSize: "14px",
        opacity: 0.9,
        margin: 0,
        lineHeight: "1.6",
    },
};