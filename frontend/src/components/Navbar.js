import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import profileMember from '../assets/images/member_profile.jpg';
import profileAdmin from '../assets/images/admin_profile.jpg';
import foodIcon from '../assets/images/new.png';
import bookingIcon from '../assets/images/received.png';
import cancelIcon from '../assets/images/cancel.png';
import expiredIcon from '../assets/images/exp.png';
import timeIcon from '../assets/images/time.png';

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [openDropdown, setOpenDropdown] = useState(false);
    const [openNotifications, setOpenNotifications] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);

    const [userId, setUserId] = useState(null);
    const [displayName, setDisplayName] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [myReadIds, setMyReadIds] = useState([]);

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

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (isLoggedIn) {
            fetchNotifications();
        }
    }, [isLoggedIn]);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (token && token !== "undefined" && token !== "null") {
            try {
                const decoded = jwtDecode(token);
                setUserId(decoded?.sub);
                setDisplayName(decoded?.displayName);
                setIsAdmin(decoded?.isAdmin === true);
                setIsLoggedIn(true);

                fetchNotifications();
                fetchMyReadList();
            } catch (error) {
                console.error("Token Decode Error:", error);
                setUserId(null);
                setIsAdmin(false);
                setIsLoggedIn(false);
            }
        } else {
            setUserId(null);
            setIsAdmin(false);
            setIsLoggedIn(false);
        }
        setLoading(false);
    }, [location.pathname]);

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
                                "Authorization": `Bearer ${token}`
                            }
                        }
                    );

                    if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");

                    const resData = await response.json();

                    if (resData.success && Array.isArray(resData.data)) {
                        setNotifications(resData.data);
                        localStorage.setItem("notifications", JSON.stringify(resData.data));
                    } else {
                        console.warn("ข้อมูลว่างเปล่าหรือเกิดข้อผิดพลาด:", resData.message);
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
                headers: { "Authorization": `Bearer ${token}` }
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
                headers: { "Authorization": `Bearer ${token}` }
            });

            const resData = await response.json();
            if (resData.success) {
                setMyReadIds(prev => [...prev, n.id]);
            }
        } catch (error) {
            console.error(error);
        }

        setOpenNotifications(false);

        if (n.type === "food") {
            navigate('/food-detail', { state: { id: targetId, fromPage: '/' } });
        } else {
            navigate('/food-form', { state: { id: targetId, fromPage: '/food-form' } });
        }
    };

    const isRead = (notificationId) => {
        return myReadIds.includes(notificationId);
    };

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
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("userId");
        setOpenDropdown(false);
        setIsMobileMenuOpen(false);
        navigate("/login");
    };

    const iconMap = {
        food: foodIcon,
        booking: bookingIcon,
        booking_cancel: cancelIcon,
        warning: expiredIcon,
        info: timeIcon
    };

    const headerMap = {
        food: 'มีอาหารใหม่ใกล้คุณ!',
        booking: 'มีผู้จองอาหาร!',
        booking_cancel: 'รายการจองถูกยกเลิก!',
        warning: 'รายการอาหารหมดอายุ!',
        info: 'รายการอาหารใกล้หมดอายุ!'
    };

    const handleBellClick = () => {
        setOpenNotifications(!openNotifications);
        setOpenDropdown(false);
        if (!openNotifications) {
            fetchNotifications();
        }
    };

    const currentPath = location.pathname;
    const originPath = location.state?.fromPage || '';

    const isProfileActive = currentPath === "/profile";
    const isHomeActive = currentPath === "/" || (currentPath === "/food-detail" && originPath === "/");
    const isRankingActive = currentPath === "/ranking";
    const isMapActive = currentPath === "/map" || (currentPath === "/food-detail" && originPath === "/map");
    const isReceiveActive = currentPath === "/receive" || (currentPath === "/food-detail" && originPath === "/receive");
    const isMyFoodsActive = currentPath === "/my-foods" || currentPath === "/food-form";
    const isDashboardActive = currentPath === "/impact-dashboard";
    const isAdminDashboardActive = currentPath === "/admin-dashboard";
    const isManageFoodsActive = currentPath === "/manage-foods" || (currentPath === "/food-detail" && originPath === "/manage-foods");
    const isManageUsersActive = currentPath === "/manage-users";
    const isReportActive = currentPath === "/manage-report" || (currentPath === "/report-detail" && originPath === "/manage-report");

    return (
        <>
            <style>
                {`
                    .nav-menu-container {
                        display: flex;
                        gap: 24px;
                        align-items: center;
                    }

                    .mobile-toggle-btn {
                        display: none;
                        background: none;
                        border: none;
                        color: #ff8c00;
                        cursor: pointer;
                        padding: 0;
                    }

                    /* สไตล์สำหรับปุ่มเมนู เพื่อไม่ให้ขึ้นบรรทัดใหม่ */
                    .nav-link-item {
                        white-space: nowrap;
                        display: inline-flex;
                        align-items: center;
                        height: 100%;
                        font-weight: normal;
                    }

                    @media (max-width: 1000px) {
                        .mobile-toggle-btn {
                            display: flex;
                            align-items: center;
                        }

                        /* ขยายขนาดและยกเลิกการตัดคำสำหรับ Mobile */
                        .nav-logo-text {
                            font-size: 16px !important;
                            max-width: none !important;
                            white-space: normal !important;
                        }

                        .nav-menu-container {
                            display: ${isMobileMenuOpen ? "flex" : "none"};
                            flex-direction: column;
                            position: absolute;
                            top: 100%;
                            left: 0;
                            right: 0;
                            background-color: #fffcf8;
                            padding: 20px;
                            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                            gap: 15px !important;
                            align-items: flex-start !important;
                            z-index: 999;
                        }

                        .notification-dropdown {
                            width: 290px !important;
                            right: -60px !important;
                        }

                        .user-display-name {
                            display: none !important;
                        }
                    }
                `}
            </style>

            <nav ref={dropdownRef} style={styles.loginHeader}>
                {/* ฝั่งซ้าย: Logo & Title */}
                <div style={styles.logoSection}>
                    <i className="material-icons-outlined" style={{ fontSize: "28px" }}>volunteer_activism</i>
                    <span className="nav-logo-text" style={styles.logoText}>
                        แพลตฟอร์มบริหารจัดการการบริจาคอาหาร
                    </span>
                </div>

                {/* ตรงกลาง: Menu Links */}
                <div className="nav-menu-container">
                    {!isAdmin && (
                        <>
                            <Link to="/" className="nav-link-item" style={isHomeActive ? styles.activeMenu : styles.inactiveMenu}>หน้าหลัก</Link>
                            <Link to="/ranking" className="nav-link-item" style={isRankingActive ? styles.activeMenu : styles.inactiveMenu}>อันดับ</Link>
                            <Link to="/map" className="nav-link-item" style={isMapActive ? styles.activeMenu : styles.inactiveMenu}>แผนที่</Link>
                        </>
                    )}
                    {isLoggedIn && (
                        <>
                            {isAdmin ? (
                                <>
                                    <Link to="/admin-dashboard" className="nav-link-item" style={isAdminDashboardActive ? styles.activeMenu : styles.inactiveMenu}>Dashboard</Link>
                                    <Link to="/manage-foods" className="nav-link-item" style={isManageFoodsActive ? styles.activeMenu : styles.inactiveMenu}>รายการอาหาร</Link>
                                    <Link to="/manage-users" className="nav-link-item" style={isManageUsersActive ? styles.activeMenu : styles.inactiveMenu}>จัดการผู้ใช้</Link>
                                    <Link to="/manage-report" className="nav-link-item" style={isReportActive ? styles.activeMenu : styles.inactiveMenu}>รายงานปัญหา</Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/receive" className="nav-link-item" style={isReceiveActive ? styles.activeMenu : styles.inactiveMenu}>รับบริจาค</Link>
                                    <Link to="/my-foods" className="nav-link-item" style={isMyFoodsActive ? styles.activeMenu : styles.inactiveMenu}>บริจาคของฉัน</Link>
                                    <Link to="/impact-dashboard" className="nav-link-item" style={isDashboardActive ? styles.activeMenu : styles.inactiveMenu}>Impact Dashboard</Link>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* ฝั่งขวา: Notification, Profile, Hamburger Menu */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

                    {isLoggedIn && !isAdmin && (
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <button style={styles.iconBase} onClick={handleBellClick}>
                                <span className="material-icons" style={{
                                    fontSize: "26px",
                                    color: openNotifications ? "#ff8c00" : "#737373"
                                }}>
                                    notifications
                                </span>
                                {notifications.filter(n => !isRead(n.id)).length > 0 && (
                                    <span style={styles.redDot}></span>
                                )}
                            </button>

                            {openNotifications && (
                                <div className="notification-dropdown" style={styles.notificationBadge}>
                                    <p style={styles.notificationTitle}>การแจ้งเตือน</p>
                                    {loading && (
                                        <div style={{ padding: '15px', textAlign: 'center', color: '#ff8c00' }}>
                                            <p style={{ fontSize: '14px' }}>กำลังโหลดข้อมูล...</p>
                                        </div>
                                    )}

                                    {!loading && (
                                        notifications.length > 0 ? (
                                            notifications.map((n) => {
                                                const readStatus = isRead(n.id);
                                                return (
                                                    <button
                                                        key={n.id}
                                                        type="button"
                                                        onClick={() => handleNotificationClick(n)}
                                                        style={styles.notificationItem}
                                                    >
                                                        <div style={{ marginRight: '10px', marginTop: '2px' }}>
                                                            <img src={iconMap[n.type]} alt={n.type} style={{ width: '30px', height: '30px' }} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ margin: 0, fontSize: '15px', fontWeight: readStatus ? '500' : 'bold', color: '#ff8c00' }}>
                                                                {headerMap[n.type]}
                                                            </p>
                                                            <p style={{ margin: '4px 0', fontSize: '13px', color: '#555', fontWeight: readStatus ? '500' : 'bold' }}>
                                                                {n.message}
                                                            </p>
                                                            <p style={{ margin: 0, color: '#aaa', fontSize: '11px', fontWeight: readStatus ? '500' : 'bold' }}>
                                                                {new Date(n.date).toLocaleString('th-TH', {
                                                                    year: 'numeric', month: 'long', day: 'numeric',
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })} น.
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", color: "#888", textAlign: "center", padding: '20px' }}>
                                                ยังไม่มีการแจ้งเตือน
                                            </p>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Profile Button */}
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <button onClick={handleIconClick} style={styles.iconBase}>
                            {isLoggedIn ? (
                                <img
                                    src={isAdmin ? profileAdmin : profileMember}
                                    alt="user avatar"
                                    style={styles.profileImg(openDropdown || isProfileActive)}
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

                        {isLoggedIn && (
                            <span
                                onClick={handleIconClick}
                                className="user-display-name"
                                style={{
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "15px",
                                    color: "#333",
                                    padding: "6px 0px 4px 6px",
                                    maxWidth: "120px",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "inline-block",
                                    verticalAlign: "middle"
                                }}
                                title={displayName}
                            >
                                {displayName}
                            </span>
                        )}

                        {isLoggedIn && openDropdown && (
                            <div style={styles.profileDropdown}>
                                {!isAdmin && (
                                    <Link
                                        to="/profile"
                                        style={styles.dropdownItem}
                                        onClick={() => setOpenDropdown(false)}
                                    >
                                        ดูโปรไฟล์
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    style={{ ...styles.dropdownItem, ...styles.logoutItem }}
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Hamburger Button */}
                    <button
                        className="mobile-toggle-btn"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle navigation"
                    >
                        <i className="material-icons" style={{ fontSize: "30px" }}>
                            {isMobileMenuOpen ? "close" : "menu"}
                        </i>
                    </button>
                </div>
            </nav>
        </>
    );
}

const styles = {
    loginHeader: {
        backgroundColor: "#fffcf8",
        padding: "12px 20px",
        fontWeight: "bold",
        color: "#ff8c00",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 3px 10px #0000001a",
        position: "relative",
        zIndex: 1000,

    },
    logoSection: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: "#ff8c00",
        flexShrink: 0
    },
    logoText: {
        fontSize: "18px",
        whiteSpace: "nowrap"
    },
    activeMenu: {
        color: "#ff8c00",
        textDecoration: "none",
        paddingBottom: "2px",
        borderBottom: "3px solid #ff8c00",
        fontWeight: "normal"
    },
    inactiveMenu: {
        color: "#737373",
        textDecoration: "none",
        paddingBottom: "2px",
        fontWeight: "500",
        borderBottom: "3px solid transparent", // เพิ่มเส้นใต้ล่องหนกันข้อความขยับ
        fontWeight: "normal"
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
    redDot: {
        position: "absolute",
        top: "0px",
        right: "2px",
        width: "10px",
        height: "10px",
        backgroundColor: "red",
        borderRadius: "50%",
        border: "2px solid white"
    },
    notificationBadge: {
        position: "absolute",
        top: "40px",
        right: "0px",
        width: "350px",
        maxHeight: "450px",
        overflowY: "auto",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        padding: "10px",
        zIndex: 1001
    },
    notificationTitle: {
        padding: "5px 15px",
        color: "#328d7d",
        fontSize: "18px",
        fontWeight: "700",
        margin: "5px 0"
    },
    notificationItem: {
        display: 'flex',
        alignItems: 'flex-start',
        padding: '8px 15px',
        cursor: 'pointer',
        width: '100%',
        background: 'none',
        border: 'none',
        textAlign: 'left'
    },
    profileDropdown: {
        position: "absolute",
        right: 0,
        top: "40px",
        backgroundColor: "#fff",
        boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
        borderRadius: "5px",
        width: "140px",
        zIndex: 9999,
        overflow: "hidden",
        boxSizing: "border-box"
    },
    dropdownItem: {
        display: "block",
        padding: "10px",
        width: "100%",
        textAlign: "left",
        fontSize: "15px",
        fontWeight: "normal",
        color: "#333",
        textDecoration: "none",
        background: "none",
        border: "none",
        cursor: "pointer",
        transition: "0.2s",
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
        boxShadow: isActive ? "0 0 0 2px #ff8c00" : "none",
        transition: "0.2s"
    })
};