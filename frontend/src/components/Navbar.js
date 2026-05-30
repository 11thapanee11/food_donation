import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [openDropdown, setOpenDropdown] = useState(false);
    const [openNotifications, setOpenNotifications] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdown(false);
                setOpenNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isLoggedIn = !!localStorage.getItem("accessToken");

    const handleIconClick = () => {
        if (!isLoggedIn) {
            navigate("/login");
        } else {
            setOpenDropdown(!openDropdown);
            setOpenNotifications(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        setOpenDropdown(false);
        navigate("/login");
    };

    const handleBellClick = () => {
        setOpenNotifications(!openNotifications);
        setOpenDropdown(false);
    };

    // ดึงข้อมูลต้นทางจากสถานะหน้าก่อนหน้า (เพื่อใช้จัดการตอนเปิดดูหน้ารายละเอียดอาหาร)
    const currentPath = location.pathname;
    const originPath = location.state?.fromPage || '';

    // ดึงลอจิกเช็กสถานะเมนูสว่าง (Active) ออกมาด้านบน (เคลียร์เกณฑ์ SonarQube S6766)
    const isHomeActive = currentPath === "/home" || (currentPath === "/food-detail" && originPath === "/home");
    const isRankingActive = currentPath === "/ranking";
    const isMapActive = currentPath === "/map" || (currentPath === "/food-detail" && originPath === "/map");
    const isReceiveActive = currentPath === "/receive" || (currentPath === "/food-detail" && originPath === "/receive");
    const isMyFoodsActive = currentPath === "/my-foods" || currentPath === "/food-form";
    const isDashboardActive = currentPath === "/impact-dashboard";
    // const isAuthActive = currentPath === "/login" || currentPath === "/register";

    return (
        <nav style={styles.loginHeader}>
            {/* ฝั่งซ้าย: Logo */}
            <div style={styles.logoSection}>
                <i className="material-icons-outlined" style={{ fontSize: "28px" }}>volunteer_activism</i>
                <span style={{ fontSize: "18px" }}>แพลตฟอร์มบริหารจัดการการบริจาคอาหาร</span>
            </div>

            {/* ตรงกลาง: Menu Links */}
            <div style={styles.menuSection}>
                <Link to="/home" style={isHomeActive ? styles.activeMenu : styles.inactiveMenu}>หน้าหลัก</Link>
                <Link to="/ranking" style={isRankingActive ? styles.activeMenu : styles.inactiveMenu}>อันดับ</Link>
                <Link to="/map" style={isMapActive ? styles.activeMenu : styles.inactiveMenu}>แผนที่</Link>
                {isLoggedIn && (
                    <>
                        <Link to="/receive" style={isReceiveActive ? styles.activeMenu : styles.inactiveMenu}>รับบริจาค</Link>
                        <Link to="/my-foods" style={isMyFoodsActive ? styles.activeMenu : styles.inactiveMenu}>บริจาคของฉัน</Link>
                        <Link to="/impact-dashboard" style={isDashboardActive ? styles.activeMenu : styles.inactiveMenu}>Impact Dashboard</Link>
                    </>
                )}
            </div>
            {/* <div style={styles.menuSection}>
                <Link to="/home" style={location.pathname === "/home" ? styles.activeMenu : styles.inactiveMenu}>หน้าหลัก</Link>
                <Link to="/ranking" style={location.pathname === "/ranking" ? styles.activeMenu : styles.inactiveMenu}>อันดับ</Link>
                <Link to="/map" style={location.pathname === "/map" ? styles.activeMenu : styles.inactiveMenu}>แผนที่</Link>
                {isLoggedIn && (
                    <>
                        <Link to="/receive" style={location.pathname === "/receive" ? styles.activeMenu : styles.inactiveMenu}>รับบริจาค</Link>
                        <Link to="/my-foods" style={location.pathname === "/my-foods" || location.pathname === "/food-form" ? styles.activeMenu : styles.inactiveMenu}>บริจาคของฉัน</Link>
                        <Link to="/impact-dashboard" style={location.pathname === "/impact-dashboard" ? styles.activeMenu : styles.inactiveMenu}>Impact Dashboard</Link>
                    </>
                )}
            </div> */}

            {/* ฝั่งขวา: Icons & Dropdowns */}
            <div ref={dropdownRef} style={{ position: "relative", display: "flex", alignItems: "center", gap: "20px" }}>

                {isLoggedIn && (
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <button style={styles.iconBase} onClick={handleBellClick}>
                            <span className="material-icons" style={{
                                fontSize: "26px",
                                color: openNotifications ? "#ff8c00" : "#737373"
                            }}>
                                notifications
                            </span>
                        </button>

                        {openNotifications && (
                            <div style={styles.notificationBadge}>
                                <p style={{ margin: 0, fontSize: "14px", color: "#333" }}>
                                    🔔 ยังไม่มีการแจ้งเตือนใหม่
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <button onClick={handleIconClick} style={styles.iconBase}>
                        {isLoggedIn ? (
                            <img
                                src="/images/profile_member.jpg"
                                alt="user avatar"
                                style={styles.profileImg(openDropdown)}
                            />
                        ) : (
                            <i className="material-icons" style={{
                                fontSize: "28px",
                                color: (location.pathname === "/login" || location.pathname === "/register") ? "#ff8c00" : "#737373"
                            }}>
                                account_circle
                            </i>
                        )}
                    </button>

                    {isLoggedIn && openDropdown && (
                        <div style={styles.profileDropdown}>
                            <Link
                                to="/profile"
                                style={styles.dropdownItem}
                                onClick={() => setOpenDropdown(false)}
                            >
                                ดูโปรไฟล์
                            </Link>
                            <button
                                onClick={handleLogout}
                                style={{ ...styles.dropdownItem, ...styles.logoutItem }}
                            >
                                ล็อกเอ้าท์
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

const styles = {
    loginHeader: {
        backgroundColor: "#fffcf8",
        padding: "15px 30px",
        fontWeight: "bold",
        color: "#ff8c00",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        boxShadow: "0 3px 10px rgba(0, 0, 0, 0.1)",
        fontFamily: "'Noto Sans Thai', sans-serif"
    },
    logoSection: {
        display: "flex",
        alignItems: "center",
        gap: "20px",
        color: "#ff8c00"
    },
    menuSection: {
        display: "flex",
        gap: "40px",
        cursor: "pointer",
        fontWeight: "500"
    },
    activeMenu: {
        color: "#ff8c00",
        textDecoration: "none",
        paddingBottom: "1px",
        boxShadow: "0 3px 0 #ff8c00"
    },
    inactiveMenu: {
        color: "#737373",
        textDecoration: "none",
        paddingBottom: "1px"
    },
    iconBase: {
        fontSize: "28px",
        cursor: "pointer",
        background: "none",
        border: "none",
        padding: 0,
        display: "flex",
        alignItems: "center"
    },
    notificationBadge: {
        position: "absolute",
        right: 0,
        top: "40px",
        backgroundColor: "#fff",
        boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
        borderRadius: "5px",
        width: "250px",
        zIndex: 1000,
        padding: "10px"
    },
    profileDropdown: {
        position: "absolute",
        right: 0,
        top: "40px",
        backgroundColor: "#fff",
        boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
        borderRadius: "5px",
        width: "150px",
        zIndex: 1000,
        overflow: "hidden"
    },
    dropdownItem: {
        display: "block",
        padding: "10px",
        width: "100%",
        textAlign: "left",
        fontSize: "14px",
        fontWeight: "normal",
        color: "#333",
        textDecoration: "none",
        background: "none",
        border: "none",
        cursor: "pointer",
        transition: "0.2s"
    },
    logoutItem: {
        color: "#e74c3c",
        borderTop: "1px solid #eee"
    },
    profileImg: (isActive) => ({
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        objectFit: "cover",
        border: isActive ? "2px solid #ff8c00" : "2px solid transparent",
        transition: "0.2s"
    })
};