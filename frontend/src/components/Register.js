import React, { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import registerImg from "../assets/images/image_side.jpg";

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

        try {
            const response = await fetch("http://localhost:8082/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                Swal.fire({
                    icon: "success",
                    title: result.message || "สมัครสมาชิกเรียบร้อยแล้ว",
                    confirmButtonColor: "#328d7d",
                    timer: 2000,
                    showConfirmButton: false,
                }).then(() => navigate("/login"));
            } else {
                Swal.fire({
                    icon: "error",
                    title: "สมัครสมาชิกไม่สำเร็จ",
                    text: result.message || "เกิดข้อผิดพลาดภายในระบบ",
                    confirmButtonColor: "#d63031",
                });
            }
        } catch (error) {
            console.error("Error:", error);
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",
                confirmButtonColor: "#d63031",
            });
        } finally {
            setIsLoading(false);
        }
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
                                                    ? "#ff4d4f"
                                                    : passStrength <= 3
                                                        ? "#faad14"
                                                        : "#52c41a",
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
                                backgroundColor: isBtnHovered && !isLoading ? "#ff8c00" : "#ff8c00",
                                transform: isBtnHovered && !isLoading ? "translateY(-2px)" : "translateY(0)",
                                boxShadow: isBtnHovered && !isLoading
                                    ? "0 8px 20px rgba(255, 140, 0, 0.35)"
                                    : "0 4px 12px rgba(255, 140, 0, 0.25)",
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

                <div style={styles.imageSection}>
                    <div style={styles.imageWrapper}>
                        <img src={registerImg} alt="register visual" style={styles.image} />
                        <div style={styles.imageOverlayText}>
                            <h3 style={styles.imageOverlayTitle}>ยินดีต้อนรับสู่สังคมอาหารคุณภาพ</h3>
                            <p style={styles.imageOverlaySubtitle}>จัดการและเข้าถึงเมนูที่คุณชื่นชอบได้ทันที</p>
                        </div>
                    </div>
                </div>
            </div>
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
    required = false, // เพิ่ม prop ตัวนี้
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
                        ? "1.5px solid #ff4d4f"
                        : isFocused
                            ? "1.5px solid #328d7d"
                            : "1.5px solid #eaeaea",
                    backgroundColor: error ? "#fff2f0" : "#ffffff",
                    boxShadow: isFocused && !error
                        ? "0 0 0 4px rgba(50, 141, 125, 0.12)"
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
                            color: error ? "#ff4d4f" : "#8c8c8c",
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

// ---------------- Inline Styles Object ----------------
const styles = {
    pageWrapper: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "'Prompt', 'Noto Sans Thai', sans-serif",
        background: "linear-gradient(135deg, #ffff 0%, #fffefc 100%)",
        boxSizing: "border-box",
    },
    card: {
        display: "flex",
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        padding: "25px 40px",
        gap: "48px",
        width: "1200px",
        boxSizing: "border-box",
        boxShadow: "0 20px 40px rgba(255, 246, 229, 0.25), 0 8px 16px rgba(180, 180, 180, 0.42)",
    },
    formSection: {
        flex: 1,
        width: "100%",
    },
    headerGroup: {
        marginBottom: "24px",
    },
    title: {
        color: "#328d7d",
        fontWeight: "700",
        margin: "0 0 6px 0",
        fontSize: "28px",
        letterSpacing: "-0.5px",
    },
    subtitle: {
        margin: 0,
        fontSize: "14px",
        color: "#666666",
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
        fontWeight: "500",
        display: "block",
        marginBottom: "6px",
        color: "#262626",
        textAlign: "left",
    },
    inputBox: {
        display: "flex",
        alignItems: "center",
        borderRadius: "10px",
        padding: "12px 14px",
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
        color: "#1f1f1f",
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
        color: "#ff4d4f",
        fontSize: "12px",
        marginTop: "4px",
        display: "block",
        textAlign: "left",
    },
    strengthContainer: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginTop: "-10px",
        marginBottom: "16px",
    },
    strengthBarBg: {
        flex: 1,
        height: "5px",
        backgroundColor: "#f0f0f0",
        borderRadius: "3px",
        overflow: "hidden",
    },
    strengthBarFill: {
        height: "100%",
        transition: "width 0.3s ease, background-color 0.3s ease",
    },
    strengthText: {
        fontSize: "12px",
        color: "#8c8c8c",
        width: "70px",
        textAlign: "right",
    },
    button: {
        width: "100%",
        padding: "14px",
        color: "white",
        border: "none",
        borderRadius: "10px",
        fontSize: "16px",
        fontWeight: "600",
        marginTop: "12px",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    loginPrompt: {
        textAlign: "center",
        marginTop: "20px",
        fontSize: "14px",
        color: "#666666",
    },
    loginLink: {
        color: "#328d7d",
        fontWeight: "600",
        cursor: "pointer",
        textDecoration: "underline",
    },
    imageSection: {
        flex: 1,
        display: "flex",
        alignItems: "stretch",
    },
    imageWrapper: {
        position: "relative",
        width: "100%",
        borderRadius: "16px",
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
        padding: "24px",
        background: "linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent)",
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
        color: "#ff4d4f",
        marginLeft: "4px",
        fontWeight: "bold",
    },
};