import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// นำเข้าโมดูลหลักของ OpenLayers
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import XYZ from "ol/source/XYZ";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";
import { Style, Icon } from "ol/style";
import Overlay from "ol/Overlay";

// Custom SVG Marker สีพาสเทล
const pastelMarkerSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" fill="#c084fc" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="12" cy="12" r="4" fill="#ffffff"/>
    </svg>
`)}`;

const markerStyle = new Style({
    image: new Icon({
        src: pastelMarkerSvg,
        anchor: [0.5, 0.5],
    }),
});

const MapPage = () => {
    const navigate = useNavigate();
    const mapElement = useRef(null);
    const mapInstanceRef = useRef(null);
    const vectorSourceRef = useRef(new VectorSource());
    const overlayRef = useRef(null);
    const tooltipContainerRef = useRef(null);

    const [foods, setFoods] = useState([]);
    const [filteredFoods, setFilteredFoods] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [tooltipData, setTooltipData] = useState(null);

    const defaultCenter = [99.015, 18.892]; // [Longitude, Latitude] ใน OpenLayers
    const [centerPos, setCenterPos] = useState(defaultCenter);

    const categories = ["ทั้งหมด", "อาหารคาว", "อาหารหวาน", "เครื่องดื่ม", "ผลไม้/ผัก", "เบเกอรี่"];

    // 1. ดึงตำแหน่งผู้ใช้ (Geolocation)
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const currentCoords = [position.coords.longitude, position.coords.latitude];
                    setCenterPos(currentCoords);
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.getView().setCenter(fromLonLat(currentCoords));
                        mapInstanceRef.current.getView().setZoom(16);
                    }
                },
                (error) => console.error("Error getting geolocation: ", error),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    // 2. ดึงข้อมูลอาหารจาก Backend API
    useEffect(() => {
        setIsPageLoading(true);
        const token = localStorage.getItem("accessToken");

        fetch("http://localhost:8082/foods", {
            method: "GET",
            headers: {
                Authorization: token ? `Bearer ${token}` : "",
                "Content-Type": "application/json",
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error("ไม่พบข้อมูล");
                return res.json();
            })
            .then((resData) => {
                if (resData.success) {
                    const validFoods = resData.data.filter(
                        (item) => item.latitude && item.longitude && item.foodStatus === "available"
                    );
                    setFoods(validFoods);
                    setFilteredFoods(validFoods);
                }
                setIsPageLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching map coordinates:", err);
                setIsPageLoading(false);
            });
    }, []);

    // 3. เริ่มต้นสร้างแผนที่ Google Maps โดยใช้ OpenLayers
    useEffect(() => {
        if (isPageLoading || !mapElement.current || mapInstanceRef.current) return;

        // Layer: Google Maps Tile (Roadmap)
        const googleLayer = new TileLayer({
            source: new XYZ({
                url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
            }),
        });

        // Vector Layer สำหรับเก็บหมุด
        const vectorLayer = new VectorLayer({
            source: vectorSourceRef.current,
        });

        // Overlay สำหรับ Tooltip
        const overlay = new Overlay({
            element: tooltipContainerRef.current,
            offset: [0, -15],
            positioning: "bottom-center",
        });
        overlayRef.current = overlay;

        // สร้าง Instance แผนที่
        const map = new Map({
            target: mapElement.current,
            layers: [googleLayer, vectorLayer],
            overlays: [overlay],
            view: new View({
                center: fromLonLat(centerPos),
                zoom: 16,
            }),
        });

        mapInstanceRef.current = map;

        // Event Pointer Move สำหรับแสดง Hover Tooltip
        map.on("pointermove", (e) => {
            const pixel = map.getEventPixel(e.originalEvent);
            const hit = map.hasFeatureAtPixel(pixel);

            map.getTargetElement().style.cursor = hit ? "pointer" : "";

            if (hit) {
                const feature = map.forEachFeatureAtPixel(pixel, (feat) => feat);
                if (feature) {
                    const foodData = feature.get("foodData");
                    setTooltipData(foodData);
                    overlay.setPosition(e.coordinate);
                }
            } else {
                setTooltipData(null);
                overlay.setPosition(undefined);
            }
        });

        // Event Click หมุดปัก ไปยังหน้ารายละเอียดอาหาร
        map.on("click", (e) => {
            const feature = map.forEachFeatureAtPixel(e.pixel, (feat) => feat);
            if (feature) {
                const foodData = feature.get("foodData");
                if (foodData) {
                    navigate("/food-detail", { state: { id: foodData.id, fromPage: "/map" } });
                }
            }
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.setTarget(null);
                mapInstanceRef.current = null;
            }
        };
    }, [isPageLoading]);

    // 4. วาดหมุดอาหารลงแผนที่
    useEffect(() => {
        if (!vectorSourceRef.current) return;

        vectorSourceRef.current.clear();

        filteredFoods.forEach((food) => {
            const lat = Number(food.latitude);
            const lng = Number(food.longitude);

            if (isNaN(lat) || isNaN(lng)) return;

            const markerFeature = new Feature({
                geometry: new Point(fromLonLat([lng, lat])),
                foodData: food,
            });

            markerFeature.setStyle(markerStyle);
            vectorSourceRef.current.addFeature(markerFeature);
        });
    }, [filteredFoods]);

    // 5. กรองหมวดหมู่อาหาร
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        if (category === "ทั้งหมด") {
            setFilteredFoods(foods);
        } else {
            const filtered = foods.filter(
                (item) => item.category === category || item.foodType === category
            );
            setFilteredFoods(filtered);
        }
    };

    if (isPageLoading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>กำลังดึงข้อมูลแผนที่ Google Maps...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={styles.pageContainer}>
            {/* Filter Bar หมวดหมู่อาหาร */}
            <div style={styles.filterContainer}>
                <span style={styles.filterTitle}>
                    <i className="material-icons" style={{ fontSize: "18px" }}>filter_list</i>
                    หมวดหมู่:
                </span>
                <div style={styles.filterButtonsGroup}>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryChange(cat)}
                            style={{
                                ...styles.filterChip,
                                backgroundColor: selectedCategory === cat ? "#c084fc" : "#ffffff",
                                color: selectedCategory === cat ? "#ffffff" : "#64748b",
                                border: selectedCategory === cat ? "1px solid #c084fc" : "1px solid #e2e8f0",
                                boxShadow: selectedCategory === cat ? "0 4px 12px rgba(192, 132, 252, 0.3)" : "none",
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* กล่องแสดงแผนที่ Google Maps */}
            <div ref={mapElement} style={styles.mapCanvas} />

            {/* Hidden DOM Element สำหรับ Tooltip */}
            <div ref={tooltipContainerRef} style={{ display: tooltipData ? "block" : "none" }}>
                {tooltipData && (
                    <div style={styles.tooltipBox}>
                        {tooltipData.imageUrl && (
                            <img
                                src={tooltipData.imageUrl}
                                alt={tooltipData.foodName}
                                style={styles.tooltipImg}
                            />
                        )}
                        <div style={styles.tooltipContent}>
                            <h4 style={styles.tooltipTitle}>{tooltipData.foodName}</h4>
                            {tooltipData.locationName && (
                                <p style={styles.tooltipSub}>📍 {tooltipData.locationName}</p>
                            )}
                            {tooltipData.quantity && (
                                <span style={styles.tooltipTag}>จำนวน: {tooltipData.quantity}</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapPage;

// ---------------- Inline Styles (Pastel Theme) ----------------
const styles = {
    pageContainer: {
        position: "relative",
        width: "100%",
        height: "calc(100vh - 64px)",
        overflow: "hidden",
        backgroundColor: "#faf5ff",
    },
    filterContainer: {
        position: "absolute",
        top: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(8px)",
        padding: "8px 16px",
        borderRadius: "30px",
        boxShadow: "0 8px 20px rgba(192, 132, 252, 0.15)",
        border: "1px solid rgba(241, 245, 249, 0.9)",
        maxWidth: "90%",
        overflowX: "auto",
    },
    filterTitle: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "13px",
        fontWeight: "600",
        color: "#475569",
        whiteSpace: "nowrap",
    },
    filterButtonsGroup: {
        display: "flex",
        gap: "8px",
    },
    filterChip: {
        padding: "6px 14px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        whiteSpace: "nowrap",
        outline: "none",
    },
    mapCanvas: {
        width: "100%",
        height: "100%",
        zIndex: 1,
    },
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
        gap: "16px",
        fontFamily: "'Prompt', sans-serif",
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid #f3e8ff",
        borderTop: "4px solid #c084fc",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    },
    loadingText: {
        color: "#c084fc",
        fontSize: "16px",
        fontWeight: "600",
    },
    tooltipBox: {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "8px",
        boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
        width: "170px",
        pointerEvents: "none",
        fontFamily: "'Prompt', sans-serif",
        border: "1px solid #f1f5f9",
    },
    tooltipImg: {
        width: "100%",
        height: "85px",
        objectFit: "cover",
        borderRadius: "8px",
        marginBottom: "6px",
    },
    tooltipContent: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    tooltipTitle: {
        margin: 0,
        fontSize: "13px",
        fontWeight: "700",
        color: "#334155",
    },
    tooltipSub: {
        margin: 0,
        fontSize: "11px",
        color: "#64748b",
    },
    tooltipTag: {
        alignSelf: "flex-start",
        backgroundColor: "#f3e8ff",
        color: "#7e22ce",
        fontSize: "10px",
        fontWeight: "600",
        padding: "2px 8px",
        borderRadius: "10px",
        marginTop: "2px",
    },
};