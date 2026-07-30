import React, { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, OverlayView } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";

// ตั้งค่าสไตล์ขนาดกล่องแผนที่พอดีกับหน้าจอ
const mapContainerStyle = {
    width: "100%",
    height: "calc(100vh - 64px)",
    // borderRadius: "16px",
    // boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
    overflow: "hidden",       // ดักจับซ้ำเพื่อซ่อน Scrollbar ของตัวแผนที่เอง
    position: "relative"
};

const MapPage = () => {
    const navigate = useNavigate();

    const [foods, setFoods] = useState([]); // เก็บรายการอาหารทั้งหมดที่ดึงมาจากฐานข้อมูล
    const [selectedFood, setSelectedFood] = useState(null); // เก็บหมุดที่ผู้ใช้คลิกเลือกเพื่อเปิดป้ายชื่อ
    const [isPageLoading, setIsPageLoading] = useState(true);

    // เรียกใช้งาน useJsApiLoader ในการดึงสคริปต์แผนที่จากกูเกิล
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: "AIzaSyCz2II4Ff_LEqyvP03ls-0qb6-PVZWxw-0"
    });

    // พิกัดสำรองกรณีผู้ใช้ไม่ให้สิทธิ์ GPS (ม.แม่โจ้)
    const defaultCenter = { lat: 18.892, lng: 99.015 };

    // สร้าง State สำหรับคุมจุดกึ่งกลางของแผนที่
    const [centerPos, setCenterPos] = useState(defaultCenter);
    
    // ดึงพิกัดปัจจุบันจากเบราว์เซอร์ทันทีที่เปิดหน้านี้
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const currentCoords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setCenterPos(currentCoords); // อัปเดตศูนย์กลางแผนที่ตามตำแหน่งปัจจุบันจริง
                },
                (error) => {
                    console.error("Error getting geolocation: ", error);
                    // ถ้าดึงพิกัดไม่ได้ หรือผู้ใช้ปฏิเสธ ระบบจะใช้ค่า defaultCenter อัตโนมัติ ไม่แครชครับ
                },
                { enableHighAccuracy: true } // ใช้โหมดความแม่นยำสูง
            );
        }
    }, []);

    // ดึงพิกัดอาหารทั้งหมดมาจากหลังบ้าน Spring Boot
    useEffect(() => {
        setIsPageLoading(true);
        const token = localStorage.getItem("accessToken");

        fetch("http://localhost:8082/foods", {
            method: "GET",
            headers: {
                "Authorization": token ? `Bearer ${token}` : "",
                "Content-Type": "application/json"
            }
        })
            .then((res) => {
                if (!res.ok) throw new Error("ไม่พบข้อมูล");
                return res.json();
            })
            .then((resData) => {
                if (resData.success) {
                    const validFoods = resData.data.filter(item => item.latitude && item.longitude && item.foodStatus === "available");
                    setFoods(validFoods);
                } else {
                    throw new Error(resData.message || "โหลดข้อมูลพิกัดแผนที่ไม่สำเร็จ");
                }
                setIsPageLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching map coordinates:", err);
                setIsPageLoading(false);
            });
    }, []);

    // กรณีดักสเตตัส Loading หน้าจอภาพรวม (แสดงก้อน Loading นุ่มๆ ละมุนตา)
    if (isPageLoading) {
        return (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "80vh", gap: "16px" }}>
                <div style={{ width: "40px", height: "40px", border: "4px solid #fff3e0", borderTop: "4px solid #ff8c00", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <p style={{ color: "#ff8c00", fontSize: "16px", fontWeight: "bold" }}>กำลังดึงข้อมูลจุดรับบริจาคอาหาร...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (loadError) {
        return (
            <div style={{ padding: "24px", color: "#c62828", background: "#ffebee", borderRadius: "8px" }}>
                เกิดข้อผิดพลาดไม่สามารถโหลดโครงสร้างระบบแผนที่ได้ในขณะนี้
            </div>
        );
    }

    if (isLoaded === false) {
        return (
            <div style={{ ...mapContainerStyle, background: "#f5f5f5", display: "flex", justifyContent: "center", alignItems: "center", color: "#999" }}>
                กำลังเชื่อมต่อสัญญาณแผนที่ดาวเทียม...
            </div>
        );
    }

    return (
        <div style={{}}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={17}
                // center={
                //     foods.length > 0 && foods[0].latitude && foods[0].longitude
                //         ? { lat: Number(foods[0].latitude), lng: Number(foods[0].longitude) } // 1. ยึดพิกัดอาหารในระบบก่อน
                //         : centerPos // 2. ถ้าไม่มีอาหาร ให้วิ่งไปที่พิกัดปัจจุบัน (ที่เพิ่งขออนุญาตมา) หรือค่า Default สำรอง
                // }
                center={centerPos}
            >
                {/* วนลูปสร้างหมุดปัก Marker ตามพิกัดในฐานข้อมูล */}
                {foods.map((food) => (

                    <Marker
                        key={food.id}
                        position={{
                            lat: Number(food.latitude),
                            lng: Number(food.longitude)
                        }}
                        // เมื่อเมาส์ชี้ Mouse Over ให้เก็บข้อมูลเพื่อเปิดป้าย InfoWindow
                        onMouseOver={() => setSelectedFood(food)}

                        // เมื่อเมาส์เลื่อนออก Mouse Out ให้ปิดป้าย InfoWindow ทันที
                        onMouseOut={() => setSelectedFood(null)}

                        // เมื่อกดคลิก Click ให้เปลี่ยนหน้าไปยังหน้ารายละเอียดอาหารชิ้นนั้น
                        onClick={() => navigate('/food-detail', { state: { id: food.id, fromPage: '/map' } })}
                        icon={{
                            // แต่งไอคอนหมุดเป็นจุดกลมๆ
                            url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><circle cx='8' cy='8' r='6' fill='%23ff8c00' stroke='white' stroke-width='2'/></svg>",
                            scaledSize: { width: 18, height: 18 }
                        }}
                    />
                ))}

                {/* เปิดหน้าต่างป้ายชื่อขนาดเล็ก (InfoWindow) เมื่อผู้ใช้กดคลิกที่หมุด */}
                {selectedFood && (
                    <OverlayView
                        position={{
                            lat: Number(selectedFood.latitude),
                            lng: Number(selectedFood.longitude)
                        }}
                        // เลือกโหมดการแปะวัตถุลงบนแผนที่ (OVERLAY_MOUSE_TARGET จะลอยอยู่เหนือกราฟิกปกติ)
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                        <div style={{
                            position: "absolute",
                            transform: "translate(-50%, -130%)", // จัดตำแหน่งให้ป้ายลอยอยู่กึ่งกลางขยับขึ้นเหนือหัวหมุดพอดี
                            backgroundColor: "white",
                            padding: "10px 16px",
                            borderRadius: "8px", // ขอบมนพาสเทลน่ารักๆ
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)", // ใส่เงานุ่มๆ
                            whiteSpace: "nowrap", // ป้องกันข้อความตัดบรรทัด
                            pointerEvents: "none", // กุญแจสำคัญ: ห้ามตัวป้ายรับ Event เมาส์เด็ดขาด ขจัดบั๊กกะพริบ 100%
                            border: "1px solid #ffe8d6"
                        }}>
                            <strong style={{ color: "#ff8c00", fontSize: "16px" }}>
                                {selectedFood.foodName}
                            </strong>
                        </div>
                    </OverlayView>
                )}
            </GoogleMap>
        </div>
    );
};

export default MapPage;