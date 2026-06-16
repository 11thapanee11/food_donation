import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import profileMember from '../assets/images/member_profile.jpg'
import profileAdmin from '../assets/images/admin_profile.jpg'
import foodIcon from '../assets/images/new.png';
import bookingIcon from '../assets/images/received.png';
import cancelIcon from '../assets/images/cancel.png';

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [openDropdown, setOpenDropdown] = useState(false);
    const [openNotifications, setOpenNotifications] = useState(false);
    const dropdownRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);



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

    useEffect(() => {
        // ตรวจสอบทั้งสถานะ isLoggedIn และมี Token หรือไม่
        if (isLoggedIn) {
            fetchNotifications();
        }
    }, [isLoggedIn]);

    const fetchNotifications = () => {
        setLoading(true);

        if (!navigator.geolocation) {
            console.warn("Browser ไม่รองรับ Geolocation");
            return;
        }

        const token = localStorage.getItem("accessToken");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const response = await fetch(
                        `http://localhost:8082/notifications/food?lat=${latitude}&lng=${longitude}&radius=5`,
                        {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json",
                                // 2. ส่ง Token เพื่อระบุตัวตนและกรองรายการ "อาหารของคนอื่น"
                                "Authorization": `Bearer ${token}`
                            }
                        }
                    );

                    if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");

                    const resData = await response.json(); // เปลี่ยนชื่อให้ชัดเจน

                    // ตรวจสอบว่า success เป็น true และ data เป็น array
                    if (resData.success && Array.isArray(resData.data)) {
                        setNotifications(resData.data);
                    } else {
                        console.warn("ข้อมูลว่างเปล่าหรือเกิดข้อผิดพลาด:", resData.message);
                        setNotifications([]); // กำหนดเป็น Array ว่างเพื่อกัน Error
                    }
                } catch (err) {
                    console.error("API Error:", err);
                } finally {
                    // 3. ปิดสถานะ Loading เสมอ ไม่ว่าจะสำเร็จหรือผิดพลาด
                    setLoading(false);
                }
            },
            (error) => {
                console.error("User ปฏิเสธการเข้าถึงตำแหน่ง:", error);
                setLoading(false);
                // กรณีปฏิเสธ อาจจะเรียก API ดึงเฉพาะแจ้งเตือนทั่วไปแทน
            }
        );
    };

    const [readIds, setReadIds] = useState(() => {
        return JSON.parse(localStorage.getItem('readNotifications') || '[]');
    });

    const handleNotificationClick = async (n) => {

        let targetId = null;

        targetId = n.food?.foodId; // ดึงจาก n.food.foodId

        console.log("Target ID identified:", targetId);

        if (!targetId) {
            console.error("ไม่พบ ID สำหรับการนำทาง!");
            return;
        }

        const userId = localStorage.getItem("userId");

        // 1. ดึง Object ทั้งหมดออกมา (ถ้าไม่มีให้เริ่มเป็น {})
        const allReadStatus = JSON.parse(localStorage.getItem('readNotifications') || '{}');

        // 2. ดึง Array ของ User คนนี้ (ถ้ายังไม่มีให้เริ่มเป็น [])
        const userReadIds = allReadStatus[userId] || [];

        // 3. ถ้ายังไม่อ่านในลิสต์ของคนนี้ ให้เพิ่มเข้าไป
        if (!userReadIds.includes(n.notificationId)) {
            const newUserReadIds = [...userReadIds, n.notificationId];

            // อัปเดต Object รวม
            allReadStatus[userId] = newUserReadIds;

            // บันทึกกลับลง localStorage
            localStorage.setItem('readNotifications', JSON.stringify(allReadStatus));

            // อัปเดต State (ถ้ามี)
            setReadIds(newUserReadIds);
        }

        setOpenNotifications(false);

        // 2. อัปเดต Local State เพื่อให้จุดสีแดงหายไปทันทีโดยไม่ต้องรอโหลดหน้าใหม่
        setNotifications(prev => prev.map(item =>
            item.notificationId === n.notificationId ? { ...item, isRead: true } : item
        ));

        // ไปยังหน้าเป้าหมาย
        // navigate(`/food-detail/${targetId}`, {
        //     state: {
        //         id: targetId,
        //         fromPage: '/'
        //     }
        // });
        navigate('/food-detail', { state: { id: targetId, fromPage: '/' } });
    };

    const isRead = (notificationId) => {
        const userId = localStorage.getItem("userId");
        const allReadStatus = JSON.parse(localStorage.getItem('readNotifications') || '{}');
        const userReadIds = allReadStatus[userId] || [];
        return userReadIds.includes(notificationId);
    };

    // const isRead = (notificationId) => {
    //     const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    //     return readNotifications.includes(notificationId);
    // };

    // const unreadCount = notifications.filter(n => !n.isRead).length;

    // const toggleNotifications = () => {
    //     if (!openNotifications) {
    //         // ก่อนจะเปิดกล่อง ให้ไปดึงข้อมูลใหม่มาก่อน
    //         fetchNotifications();
    //     }
    //     setOpenNotifications(!openNotifications);
    // };



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
        navigate("/login");
    };

    const iconMap = {
        food: foodIcon,
        booking: bookingIcon,
        booking_cancel: cancelIcon
    };
    const headerMap = {
        food: 'มีอาหารใหม่ใกล้คุณ!',
        booking: 'มีผู้จองอาหาร!',
        booking_cancel: 'รายการจองถูกยกเลิก!',
    };

    const handleBellClick = () => {
        setOpenNotifications(!openNotifications);
        setOpenDropdown(false);
    };

    // ดึงข้อมูลต้นทางจากสถานะหน้าก่อนหน้า (เพื่อใช้จัดการตอนเปิดดูหน้ารายละเอียดอาหาร)
    const currentPath = location.pathname;
    const originPath = location.state?.fromPage || '';

    // ดึงลอจิกเช็กสถานะเมนูสว่าง (Active) ออกมาด้านบน (เคลียร์เกณฑ์ SonarQube S6766)
    const isHomeActive = currentPath === "/" || (currentPath === "/food-detail" && originPath === "/");
    const isRankingActive = currentPath === "/ranking";
    const isMapActive = currentPath === "/map" || (currentPath === "/food-detail" && originPath === "/map");
    const isReceiveActive = currentPath === "/receive" || (currentPath === "/food-detail" && originPath === "/receive");
    const isMyFoodsActive = currentPath === "/my-foods" || currentPath === "/food-form";
    const isDashboardActive = currentPath === "/impact-dashboard";
    // const isAuthActive = currentPath === "/login" || currentPath === "/register";
    const isAdminDashboardActive = currentPath === "/admin-dashboard";
    const isManageFoodsActive = currentPath === "/manage-foods" || (currentPath === "/food-detail" && originPath === "/manage-foods");
    const isManageUsersActive = currentPath === "/manage-users";
    const isReportActive = currentPath === "/manage-report";

    return (
        <nav style={styles.loginHeader}>
            {/* ฝั่งซ้าย: Logo */}
            <div style={styles.logoSection}>
                <i className="material-icons-outlined" style={{ fontSize: "28px" }}>volunteer_activism</i>
                <span style={{ fontSize: "18px" }}>แพลตฟอร์มบริหารจัดการการบริจาคอาหาร</span>
            </div>

            {/* ตรงกลาง: Menu Links */}
            <div style={styles.menuSection}>
                {localStorage.getItem("isAdmin") !== "true" && (
                    <>
                        <Link to="/" style={isHomeActive ? styles.activeMenu : styles.inactiveMenu}>หน้าหลัก</Link>
                        <Link to="/ranking" style={isRankingActive ? styles.activeMenu : styles.inactiveMenu}>อันดับ</Link>
                        <Link to="/map" style={isMapActive ? styles.activeMenu : styles.inactiveMenu}>แผนที่</Link>
                    </>
                )}
                {isLoggedIn && (
                    <>
                        {localStorage.getItem("isAdmin") === "true" ? (
                            // --- กรณีเป็นแอดมิน: แสดงเมนู Admin เท่านั้น ---
                            <>
                                <Link to="/admin-dashboard" style={isAdminDashboardActive ? styles.activeMenu : styles.inactiveMenu}>Dashboard</Link>
                                <Link to="/manage-foods" style={isManageFoodsActive ? styles.activeMenu : styles.inactiveMenu}>รายการอาหาร</Link>
                                <Link to="/manage-users" style={isManageUsersActive ? styles.activeMenu : styles.inactiveMenu}>จัดการผู้ใช้</Link>
                                <Link to="/manage-report" style={isReportActive ? styles.activeMenu : styles.inactiveMenu}>รายงานปัญหา</Link>
                            </>
                        ) : (
                            // --- กรณีเป็น User ปกติ: แสดงเมนู User ---
                            <>
                                <Link to="/receive" style={isReceiveActive ? styles.activeMenu : styles.inactiveMenu}>รับบริจาค</Link>
                                <Link to="/my-foods" style={isMyFoodsActive ? styles.activeMenu : styles.inactiveMenu}>บริจาคของฉัน</Link>
                                <Link to="/impact-dashboard" style={isDashboardActive ? styles.activeMenu : styles.inactiveMenu}>Impact Dashboard</Link>
                            </>
                        )}

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

                {isLoggedIn && localStorage.getItem("isAdmin") !== "true" && (
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <button style={styles.iconBase}
                            onClick={handleBellClick}
                        // onClick={toggleNotifications}
                        >
                            <span className="material-icons" style={{
                                fontSize: "26px",
                                color: openNotifications ? "#ff8c00" : "#737373"
                            }}>
                                notifications
                            </span>
                            {notifications.filter(n => !isRead(n.notificationId)).length > 0 && (
                                <span style={{
                                    position: "absolute",
                                    top: "0px",
                                    right: "2px",
                                    width: "10px",
                                    height: "10px",
                                    backgroundColor: "red",
                                    borderRadius: "50%",
                                    border: "2px solid white" // ช่วยให้จุดดูเด่นขึ้นเมื่อวางบน background
                                }}></span>
                            )}
                        </button>


                        {openNotifications && (
                            <div style={styles.notificationBadge}>
                                <p style={styles.notificationTitle}>การแจ้งเตือน</p>
                                {loading && (
                                    <div style={{ padding: '15px', textAlign: 'center', color: '#ff8c00' }}>
                                        <p style={{ fontSize: '14px' }}>กำลังโหลดข้อมูล...</p>
                                    </div>
                                )}

                                {!loading && (
                                    notifications.length > 0 ? (
                                        notifications.map((n) => {
                                            // เรียกใช้ฟังก์ชันตรวจสอบสถานะอ่าน
                                            const readStatus = isRead(n.notificationId);

                                            return (
                                                <button
                                                    key={n.notificationId}
                                                    type="button"
                                                    onClick={() => handleNotificationClick(n)}
                                                    style={{
                                                        ...styles.notificationItem,
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        padding: '0 22px 12px',
                                                        cursor: 'pointer',
                                                        width: '100%',
                                                        background: 'none',
                                                        border: 'none',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <div style={{ marginRight: '10px', marginTop: '2px' }}>
                                                        <img src={iconMap[n.notificationType]} alt={n.notificationType} style={{ width: '30px', height: '30px' }} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        {/* เปลี่ยนจาก n.isRead เป็น readStatus */}
                                                        <p style={{ margin: 0, fontSize: '16px', fontWeight: readStatus ? '500' : 'bold', color: '#ff8c00' }}>
                                                            {headerMap[n.notificationType]}
                                                        </p>
                                                        <p style={{ margin: '4px 0', fontSize: '14px', color: '#555', fontWeight: readStatus ? '500' : 'bold' }}>
                                                            {n.notificationMessage}
                                                        </p>
                                                        <p style={{ margin: 0, color: '#aaa', fontSize: '11px', fontWeight: readStatus ? '500' : 'bold' }}>
                                                            {new Date(n.notificationDate).toLocaleString('th-TH', {
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
                                            ยังไม่มีการแจ้งเตือนใหม่
                                        </p>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <button onClick={handleIconClick} style={styles.iconBase}>
                        {isLoggedIn ? (
                            <img
                                src={localStorage.getItem("isAdmin") === "true" ? profileAdmin : profileMember}
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
    // notificationBadge: {
    //     position: "absolute",
    //     right: 0,
    //     top: "40px",
    //     backgroundColor: "#fff",
    //     boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
    //     borderRadius: "5px",
    //     width: "250px",
    //     zIndex: 1000,
    //     padding: "10px"
    // },

    notificationBadge: {
        position: "absolute",
        top: "40px",
        right: "0px",
        width: "380px",
        maxHeight: "500px",
        overflowY: "auto",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        padding: "10px",
        zIndex: 1000
    },
    notificationTitle: {
        padding: "10px 20px 5px 20px",
        color: "#328d7d",
        fontSize: "22px",
        fontWeight: "700",
        margin: "10px 0px"
    },
    notificationItem: {
        padding: "0px 20px 10px 20px",
        // borderBottom: "1px solid #f0f0f0",
        cursor: "pointer"
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
        fontSize: "16px",
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