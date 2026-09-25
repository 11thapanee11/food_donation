import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import profileMember from "../assets/images/member_profile.jpg";
import profileAdmin from "../assets/images/admin_profile.jpg";
import logoImg from "../assets/images/ppw_logo.png"; // นำเข้าโลโก้ PNG

import foodIcon from "../assets/images/new.png";
import bookingIcon from "../assets/images/received.png";
import cancelIcon from "../assets/images/cancel.png";
import expiredIcon from "../assets/images/exp.png";
import timeIcon from "../assets/images/time.png";

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const [openDropdown, setOpenDropdown] = useState(false);
    const [openNotifications, setOpenNotifications] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);

    const [userId, setUserId] = useState(null);
    const [displayName, setDisplayName] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [myReadIds, setMyReadIds] = useState([]);

    // Pastel Theme Color Palette (อ้างอิงจากตารางสีโลโก้)
    const theme = {
        primary: "#c084fc",        // ม่วงลาเวนเดอร์พาสเทล
        primaryHover: "#a855f7",
        primaryBg: "#f5f3ff",       // พื้นหลังม่วงอ่อนพาสเทล
        skyBlue: "#38bdf8",         // ฟ้าพาสเทล
        skyBlueBg: "#f0f9ff",
        mint: "#34d399",            // เขียวมิ้นต์
        magenta: "#e879f9",         // ชมพูอมม่วง accent
        textMain: "#334155",        // เทาสเลทเข้ม
        textMuted: "#64748b",       // เทาสเลทกลาง
        borderSoft: "#f1f5f9",
        bgLight: "#f8fafc",
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdown(false);
                setOpenNotifications(false);
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close mobile menu on page change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Handle Token & Authentication State
    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (token && token !== "undefined" && token !== "null") {
            try {
                const decoded = jwtDecode(token);
                setUserId(decoded?.sub);
                setDisplayName(decoded?.displayName || "ผู้ใช้งาน");
                setIsAdmin(decoded?.isAdmin === true);
                setIsLoggedIn(true);

                fetchNotifications();
                fetchMyReadList();
            } catch (error) {
                console.error("Token Decode Error:", error);
                handleLogoutState();
            }
        } else {
            handleLogoutState();
        }
        setLoading(false);
    }, [location.pathname]);

    const handleLogoutState = () => {
        setUserId(null);
        setIsAdmin(false);
        setIsLoggedIn(false);
    };

    const fetchNotifications = () => {
        setLoading(true);

        if (!navigator.geolocation) {
            console.warn("Browser ไม่รองรับ Geolocation");
            setLoading(false);
            return;
        }

        const token = localStorage.getItem("accessToken");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const response = await fetch(
                        `http://localhost:8082/notifications?lat=${latitude}&lng=${longitude}&radius=5`,
                        {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );

                    if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");

                    const resData = await response.json();

                    if (resData.success && Array.isArray(resData.data)) {
                        setNotifications(resData.data);
                        localStorage.setItem("notifications", JSON.stringify(resData.data));
                    } else {
                        setNotifications([]);
                    }
                } catch (err) {
                    console.error("API Error:", err);
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                console.error("User ปฏิเสธการเข้าถึงตำแหน่ง:", error);
                setLoading(false);
            }
        );
    };

    const fetchMyReadList = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        try {
            const response = await fetch("http://localhost:8082/notifications/my-read-list", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const resData = await response.json();
            if (resData.success) {
                setMyReadIds(resData.data);
            }
        } catch (error) {
            console.error("ดึงสถานะการอ่านล้มเหลว:", error);
        }
    };

    const handleNotificationClick = async (n) => {
        let targetId = n.foodId || (n.data ? n.data.foodId : null);
        if (!targetId) return;

        const token = localStorage.getItem("accessToken");

        try {
            const response = await fetch(`http://localhost:8082/notifications/read/${n.id}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            const resData = await response.json();
            if (resData.success) {
                setMyReadIds((prev) => [...prev, n.id]);
            }
        } catch (error) {
            console.error(error);
        }

        setOpenNotifications(false);

        if (n.type === "food") {
            navigate("/food-detail", { state: { id: targetId, fromPage: "/" } });
        } else {
            navigate("/food-form", { state: { id: targetId, fromPage: "/food-form" } });
        }
    };

    const isRead = (notificationId) => myReadIds.includes(notificationId);

    const handleIconClick = () => {
        if (!isLoggedIn) {
            navigate("/login");
        } else {
            setOpenDropdown(!openDropdown);
            setOpenNotifications(false);
        }
    };

    const handleBellClick = () => {
        setOpenNotifications(!openNotifications);
        setOpenDropdown(false);
        if (!openNotifications) {
            fetchNotifications();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("userId");
        setOpenDropdown(false);
        setIsMobileMenuOpen(false);
        setIsLoggedIn(false);
        navigate("/login");
    };

    const iconMap = {
        food: foodIcon,
        booking: bookingIcon,
        booking_cancel: cancelIcon,
        warning: expiredIcon,
        info: timeIcon,
    };

    const headerMap = {
        food: "มีอาหารใหม่ใกล้คุณ!",
        booking: "มีผู้จองอาหาร!",
        booking_cancel: "รายการจองถูกยกเลิก!",
        warning: "รายการอาหารหมดอายุ!",
        info: "รายการอาหารใกล้หมดอายุ!",
    };

    const currentPath = location.pathname;
    const originPath = location.state?.fromPage || "";

    // Checking Active States
    const isHomeActive = currentPath === "/" || (currentPath === "/food-detail" && originPath === "/");
    const isRankingActive = currentPath === "/ranking";
    const isMapActive = currentPath === "/map" || (currentPath === "/food-detail" && originPath === "/map");
    const isReceiveActive = currentPath === "/receive" || (currentPath === "/food-detail" && originPath === "/receive");
    const isMyFoodsActive = currentPath === "/my-foods" || currentPath === "/food-form";
    const isDashboardActive = currentPath === "/impact-dashboard";
    const isAdminDashboardActive = currentPath === "/admin-dashboard";
    const isReportActive = currentPath === "/manage-report" || (currentPath === "/report-detail" && originPath === "/manage-report");
    const isLoginActive =
        currentPath === "/login" ||
        currentPath === "/register" ||
        (currentPath === "/register" && originPath === "/login");

    const unreadCount = notifications.filter((n) => !isRead(n.id)).length;

    // Helper Style for Navigation Chips (Pastel Soft Lavender Active)
    const getChipStyle = (isActive) => ({
        textDecoration: "none",
        padding: "8px 18px",
        borderRadius: "99px",
        fontSize: "0.92rem",
        fontWeight: isActive ? "600" : "500",
        color: isActive ? theme.primary : theme.textMuted,
        backgroundColor: isActive ? "#ffffff" : "transparent",
        boxShadow: isActive ? "0 2px 10px rgba(192, 132, 252, 0.15)" : "none",
        whiteSpace: "nowrap",
        transition: "all 0.25s ease",
    });

    // Helper Style for Login Button / Icon
    const getLoginButtonStyle = (isActive) => ({
        width: "42px",
        height: "42px",
        borderRadius: "50%",
        border: isActive ? `1px solid ${theme.primaryBg}` : `1px solid ${theme.borderSoft}`,
        background: isActive ? theme.primaryBg : "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: isActive ? theme.primary : theme.textMuted,
        boxShadow: isActive ? "0 2px 10px rgba(192, 132, 252, 0.2)" : "none",
        transition: "all 0.25s ease",
    });

    return (
        <nav
            ref={dropdownRef}
            style={{
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                position: "sticky",
                top: 0,
                zIndex: 1000,
                boxShadow: "0 4px 20px -2px rgba(148, 163, 184, 0.08)",
                borderBottom: "1px solid rgba(241, 245, 249, 0.9)",
                transition: "all 0.3s ease",
            }}
        >
            <div
                style={{
                    maxWidth: "1280px",
                    margin: "0 auto",
                    padding: "10px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                {/* Brand Logo & Name (Pan-Plate-Waste) */}
                <Link
                    to="/"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        textDecoration: "none",
                        transition: "transform 0.2s ease",
                    }}
                >
                    <img
                        src={logoImg}
                        alt="Pan-Plate-Waste Logo"
                        style={{
                            height: "42px",
                            width: "auto",
                            objectFit: "contain",
                            filter: "drop-shadow(0 2px 8px rgba(192, 132, 252, 0.25))",
                        }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <span
                            style={{
                                fontFamily: "'Fredoka', sans-serif",
                                fontSize: "1.4rem",
                                fontWeight: "700",
                                letterSpacing: "0.5px",
                                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.skyBlue} 50%, ${theme.mint} 100%)`,
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                lineHeight: "1.2",
                            }}
                        >
                            Pan · Plate · Waste
                        </span>
                        <span style={{ fontSize: "0.72rem", color: theme.textMuted, fontWeight: "500" }}>
                            ระบบจัดการและบริจาคอาหารส่วนเกิน
                        </span>
                    </div>
                </Link>

                {/* Navigation Links */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: theme.bgLight,
                        padding: "4px 6px",
                        borderRadius: "99px",
                        border: `1px solid ${theme.borderSoft}`,
                    }}
                >
                    {!isAdmin && (
                        <>
                            <Link to="/" style={getChipStyle(isHomeActive)}>
                                หน้าหลัก
                            </Link>
                            <Link to="/ranking" style={getChipStyle(isRankingActive)}>
                                ผลลัพธ์ชุมชน
                            </Link>
                            <Link to="/map" style={getChipStyle(isMapActive)}>
                                แผนที่
                            </Link>
                        </>
                    )}

                    {isLoggedIn && (
                        <>
                            {isAdmin ? (
                                <>
                                    <Link to="/admin-dashboard" style={getChipStyle(isAdminDashboardActive)}>
                                        สถิติและภาพรวม
                                    </Link>
                                    <Link to="/manage-report" style={getChipStyle(isReportActive)}>
                                        รายงานปัญหา
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/receive" style={getChipStyle(isReceiveActive)}>
                                        รับบริจาค
                                    </Link>
                                    <Link to="/my-foods" style={getChipStyle(isMyFoodsActive)}>
                                        บริจาคของฉัน
                                    </Link>
                                    <Link to="/impact-dashboard" style={getChipStyle(isDashboardActive)}>
                                        สถิติการแบ่งปัน
                                    </Link>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Right Action Menu */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {/* Notification Bell */}
                    {isLoggedIn && !isAdmin && (
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={handleBellClick}
                                aria-label="Notifications"
                                style={{
                                    position: "relative",
                                    width: "42px",
                                    height: "42px",
                                    borderRadius: "50%",
                                    border: openNotifications ? `1px solid ${theme.primaryBg}` : `1px solid ${theme.borderSoft}`,
                                    background: openNotifications ? theme.primaryBg : "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    color: openNotifications ? theme.primary : theme.textMuted,
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <span className="material-icons-outlined" style={{ fontSize: "22px" }}>
                                    notifications
                                </span>
                                {unreadCount > 0 && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: "3px",
                                            right: "3px",
                                            width: "10px",
                                            height: "10px",
                                            backgroundColor: theme.magenta, // ชมพูอมม่วง สื่อถึงความสดใสและสะดุดตา
                                            borderRadius: "50%",
                                            border: "2px solid #ffffff",
                                        }}
                                    />
                                )}
                            </button>

                            {/* Notifications Card */}
                            {openNotifications && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "calc(100% + 12px)",
                                        right: 0,
                                        width: "360px",
                                        background: "#ffffff",
                                        borderRadius: "20px",
                                        boxShadow: "0 12px 36px -4px rgba(100, 116, 139, 0.15)",
                                        border: `1px solid ${theme.borderSoft}`,
                                        overflow: "hidden",
                                        zIndex: 1001,
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: "16px 20px",
                                            borderBottom: `1px solid ${theme.borderSoft}`,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            background: "#fafafa",
                                        }}
                                    >
                                        <span style={{ fontWeight: "700", color: theme.textMain, fontSize: "0.95rem" }}>
                                            การแจ้งเตือน
                                        </span>
                                        {unreadCount > 0 && (
                                            <span
                                                style={{
                                                    fontSize: "0.75rem",
                                                    padding: "3px 10px",
                                                    borderRadius: "99px",
                                                    background: theme.primaryBg,
                                                    color: theme.primary,
                                                    fontWeight: "600",
                                                }}
                                            >
                                                ใหม่ {unreadCount}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ maxHeight: "380px", overflowY: "auto" }}>
                                        {loading ? (
                                            <div style={{ padding: "32px", textAlign: "center", color: theme.textMuted }}>
                                                <span style={{ fontSize: "0.88rem" }}>กำลังโหลดการแจ้งเตือน...</span>
                                            </div>
                                        ) : notifications.length > 0 ? (
                                            notifications.map((n) => {
                                                const readStatus = isRead(n.id);
                                                return (
                                                    <button
                                                        key={n.id}
                                                        onClick={() => handleNotificationClick(n)}
                                                        style={{
                                                            display: "flex",
                                                            gap: "12px",
                                                            width: "100%",
                                                            padding: "14px 16px",
                                                            border: "none",
                                                            background: !readStatus ? theme.primaryBg : "#ffffff", // ไฮไลท์ยังไม่อ่านด้วยสีม่วงอ่อนพาสเทล
                                                            textAlign: "left",
                                                            cursor: "pointer",
                                                            borderBottom: `1px solid ${theme.borderSoft}`,
                                                            transition: "background 0.2s ease",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: "38px",
                                                                height: "38px",
                                                                borderRadius: "12px",
                                                                background: "#ffffff",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                flexShrink: 0,
                                                                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                                                            }}
                                                        >
                                                            <img src={iconMap[n.type]} alt={n.type} style={{ width: "22px", height: "22px" }} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <p
                                                                style={{
                                                                    margin: 0,
                                                                    fontSize: "0.88rem",
                                                                    fontWeight: readStatus ? "500" : "700",
                                                                    color: readStatus ? theme.textMuted : theme.primary,
                                                                }}
                                                            >
                                                                {headerMap[n.type]}
                                                            </p>
                                                            <p style={{ margin: "4px 0", fontSize: "0.82rem", color: theme.textMuted, lineHeight: "1.4" }}>
                                                                {n.message}
                                                            </p>
                                                            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                                                                {new Date(n.date).toLocaleString("th-TH", {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}{" "}
                                                                น.
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div style={{ padding: "40px 20px", textAlign: "center", color: theme.textMuted }}>
                                                <span className="material-icons-outlined" style={{ fontSize: "36px", color: "#cbd5e1", display: "block", marginBottom: "8px" }}>
                                                    notifications_none
                                                </span>
                                                <span style={{ fontSize: "0.88rem" }}>ไม่มีการแจ้งเตือนในขณะนี้</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* User Profile / Auth Area */}
                    <div style={{ position: "relative" }}>
                        <div
                            onClick={handleIconClick}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                cursor: "pointer",
                                padding: "4px 10px 4px 4px",
                                borderRadius: "99px",
                                transition: "background 0.2s ease",
                                background: openDropdown ? theme.bgLight : "transparent",
                            }}
                        >
                            {isLoggedIn ? (
                                <div style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "50%",
                                    backgroundColor: isAdmin ? "#e0f2fe" : "#f0e0fe", // พื้นหลังพาสเทลอ่อน (ม่วงสำหรับแอดมิน / ฟ้าสำหรับสมาชิก)
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: `2px solid ${theme.primaryBg}`,
                                    boxShadow: "0 2px 8px rgba(192, 132, 252, 0.2)",
                                }}>
                                    <span className="material-symbols-outlined" style={{
                                        fontSize: "22px",
                                        color: isAdmin ? "#0284c7" : "rgb(186, 88, 243)" // สีไอคอนตามสถานะ
                                    }}>
                                        {isAdmin ? "admin_panel_settings" : "person"}
                                    </span>
                                </div>
                            ) : (
                                <button
                                    aria-label="Login"
                                    style={getLoginButtonStyle(isLoginActive)}
                                >
                                    <span className="material-icons-outlined" style={{ fontSize: "22px" }}>
                                        person
                                    </span>
                                </button>
                            )}

                            {isLoggedIn && (
                                <span
                                    style={{
                                        fontWeight: "600",
                                        fontSize: "0.9rem",
                                        color: theme.textMain,
                                        maxWidth: "110px",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {displayName}
                                </span>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        {isLoggedIn && openDropdown && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "calc(100% + 12px)",
                                    right: 0,
                                    width: "180px",
                                    background: "#ffffff",
                                    borderRadius: "16px",
                                    boxShadow: "0 12px 32px -4px rgba(100, 116, 139, 0.15)",
                                    border: `1px solid ${theme.borderSoft}`,
                                    overflow: "hidden",
                                    zIndex: 1001,
                                }}
                            >
                                <div style={{ padding: "6px" }}>
                                    {!isAdmin && (
                                        <Link
                                            to="/profile"
                                            onClick={() => setOpenDropdown(false)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px",
                                                padding: "10px 12px",
                                                fontSize: "0.88rem",
                                                color: theme.textMain,
                                                textDecoration: "none",
                                                borderRadius: "10px",
                                                transition: "background 0.15s ease",
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = theme.bgLight)}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                        >
                                            <span className="material-icons-outlined" style={{ fontSize: "18px", color: theme.textMuted }}>
                                                account_circle
                                            </span>
                                            โปรไฟล์ของฉัน
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            width: "100%",
                                            padding: "10px 12px",
                                            fontSize: "0.88rem",
                                            color: "#f43f5e",
                                            border: "none",
                                            background: "transparent",
                                            cursor: "pointer",
                                            borderRadius: "10px",
                                            textAlign: "left",
                                            transition: "background 0.15s ease",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fff1f2")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <span className="material-icons-outlined" style={{ fontSize: "18px" }}>
                                            logout
                                        </span>
                                        ออกจากระบบ
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}