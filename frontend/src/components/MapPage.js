import React, { useState, useEffect, useRef, useMemo } from "react";
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

// คำนวณระยะทางระหว่าง 2 พิกัด (หน่วย: กิโลเมตร)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Custom SVG Marker สีพาสเทล
const smallPastelMarkerSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" fill="#c084fc" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="12" cy="12" r="3.5" fill="#ffffff"/>
    </svg>
`)}`;

const markerStyle = new Style({
    image: new Icon({
        src: smallPastelMarkerSvg,
        anchor: [0.8, 0.8],
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
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [hoveredFood, setHoveredFood] = useState(null);

    const defaultCenter = [99.015, 18.892];
    const [userCoords, setUserCoords] = useState(null);

    // Filter States
    const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
    const [maxDistance, setMaxDistance] = useState("all");
    const [timeRangeFilter, setTimeRangeFilter] = useState("all");

    const categories = ["ทั้งหมด", "อาหารคาว", "อาหารหวาน", "เครื่องดื่ม", "ผลไม้/ผัก", "เบเกอรี่"];

    // คำนวณหาพิกัดและข้อมูลของจุดที่มีการบริจาคหนาแน่นที่สุด
    const topHotspot = useMemo(() => {
        if (!foods || foods.length === 0) return null;

        const areaMap = {};
        foods.forEach(item => {
            const name = item.locationName || item.address || "จุดรับบริจาคหลัก";
            if (!areaMap[name]) {
                areaMap[name] = { name, count: 0, lat: Number(item.latitude), lng: Number(item.longitude) };
            }
            areaMap[name].count += 1;
        });

        let best = null;
        let maxC = 0;
        for (const val of Object.values(areaMap)) {
            if (val.count > maxC) {
                maxC = val.count;
                best = val;
            }
        }
        return best;
    }, [foods]);

    // ฟังก์ชันเลื่อนแผนที่ไปที่ตำแหน่งต่างๆ
    const panToLocation = (type) => {
        if (!mapInstanceRef.current) return;
        const view = mapInstanceRef.current.getView();

        if (type === "user" && userCoords) {
            view.animate({
                center: fromLonLat([userCoords.lng, userCoords.lat]),
                zoom: 16,
                duration: 800,
            });
        } else if (type === "hotspot" && topHotspot) {
            view.animate({
                center: fromLonLat([topHotspot.lng, topHotspot.lat]),
                zoom: 16,
                duration: 800,
            });
        }
    };

    // 1. Geolocation
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setUserCoords(coords);

                    if (mapInstanceRef.current) {
                        mapInstanceRef.current
                            .getView()
                            .setCenter(fromLonLat([coords.lng, coords.lat]));
                        mapInstanceRef.current.getView().setZoom(16);
                    }
                },
                (error) => console.error("Error getting geolocation: ", error),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    // 2. Fetch Foods API
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
                }
                setIsPageLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching foods:", err);
                setIsPageLoading(false);
            });
    }, []);

    // 3. Init OpenLayers Map
    useEffect(() => {
        if (isPageLoading || !mapElement.current || mapInstanceRef.current) return;

        const googleLayer = new TileLayer({
            source: new XYZ({
                url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
            }),
        });

        const vectorLayer = new VectorLayer({
            source: vectorSourceRef.current,
        });

        const overlay = new Overlay({
            element: tooltipContainerRef.current,
            offset: [0, -12],
            positioning: "bottom-center",
        });
        overlayRef.current = overlay;

        const initialCenter = userCoords
            ? [userCoords.lng, userCoords.lat]
            : defaultCenter;

        const map = new Map({
            target: mapElement.current,
            layers: [googleLayer, vectorLayer],
            overlays: [overlay],
            view: new View({
                center: fromLonLat(initialCenter),
                zoom: 16,
            }),
        });

        mapInstanceRef.current = map;

        map.on("pointermove", (e) => {
            const pixel = map.getEventPixel(e.originalEvent);
            const hit = map.hasFeatureAtPixel(pixel);

            map.getTargetElement().style.cursor = hit ? "pointer" : "";

            if (hit) {
                const feature = map.forEachFeatureAtPixel(pixel, (feat) => feat);
                if (feature) {
                    const foodData = feature.get("foodData");
                    setHoveredFood(foodData);
                    overlay.setPosition(e.coordinate);
                }
            } else {
                setHoveredFood(null);
                overlay.setPosition(undefined);
            }
        });

        map.on("click", (e) => {
            const feature = map.forEachFeatureAtPixel(e.pixel, (feat) => feat);
            if (feature) {
                const foodData = feature.get("foodData");
                if (foodData && foodData.id) {
                    navigate(`/food-detail/${foodData.id}`, {
                        state: { id: foodData.id, fromPage: "/map" },
                    });
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

    // 4. Filtering Logic
    useEffect(() => {
        let result = [...foods];

        if (selectedCategory !== "ทั้งหมด") {
            result = result.filter(
                (item) => item.category === selectedCategory || item.foodType === selectedCategory
            );
        }

        if (maxDistance !== "all" && userCoords) {
            const limitKm = parseFloat(maxDistance);
            result = result.filter((item) => {
                const dist = calculateDistance(
                    userCoords.lat,
                    userCoords.lng,
                    Number(item.latitude),
                    Number(item.longitude)
                );
                item.calculatedDistance = dist;
                return dist <= limitKm;
            });
        } else if (userCoords) {
            result.forEach((item) => {
                item.calculatedDistance = calculateDistance(
                    userCoords.lat,
                    userCoords.lng,
                    Number(item.latitude),
                    Number(item.longitude)
                );
            });
        }

        if (timeRangeFilter !== "all") {
            result = result.filter((item) => {
                if (!item.pickupTime) return true;

                let hour = -1;
                if (item.pickupTime.includes("T")) {
                    hour = new Date(item.pickupTime).getHours();
                } else if (item.pickupTime.includes(":")) {
                    hour = parseInt(item.pickupTime.split(":")[0], 10);
                }

                if (isNaN(hour) || hour === -1) return true;

                switch (timeRangeFilter) {
                    case "08-10":
                        return hour >= 8 && hour < 10;
                    case "10-12":
                        return hour >= 10 && hour < 12;
                    case "13-15":
                        return hour >= 13 && hour < 15;
                    case "15-18":
                        return hour >= 15 && hour < 18;
                    case "18-21":
                        return hour >= 18;
                    default:
                        return true;
                }
            });
        }

        setFilteredFoods(result);
    }, [foods, selectedCategory, maxDistance, timeRangeFilter, userCoords]);

    // 5. Render Markers
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

    if (isPageLoading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>กำลังโหลดแผนที่...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={styles.pageContainer}>
            {/* Control Panel ด้านบน */}
            <div style={styles.filterControlPanel}>

                {/* ปุ่มสลับมุมมองด่วน (ตำแหน่งปัจจุบัน vs จุดบริจาคหนาแน่นสุด) */}
                <div style={styles.quickFocusRow}>
                    <button
                        style={styles.focusBtn}
                        onClick={() => panToLocation("user")}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#0284c7" }}>my_location</span>
                        ตำแหน่งของฉัน
                    </button>
                    {topHotspot && (
                        <button
                            style={styles.focusBtn}
                            onClick={() => panToLocation("hotspot")}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#9333ea" }}>local_fire_department</span>
                            จุดหนาแน่นสูงสุด ({topHotspot.count} รายการ)
                        </button>
                    )}
                </div>

                <div style={styles.dropdownRow}>
                    {/* ตัวกรองระยะทาง */}
                    <div style={styles.selectGroup}>
                        <label style={styles.selectLabel}>📍 ระยะทาง:</label>
                        <select
                            value={maxDistance}
                            onChange={(e) => setMaxDistance(e.target.value)}
                            style={styles.selectInput}
                        >
                            <option value="all">ทุกระยะทาง</option>
                            <option value="1">ไม่เกิน 1 กม.</option>
                            <option value="3">ไม่เกิน 3 กม.</option>
                            <option value="5">ไม่เกิน 5 กม.</option>
                            <option value="10">ไม่เกิน 10 กม.</option>
                        </select>
                    </div>

                    {/* ตัวกรองช่วงชั่วโมงรับของ */}
                    <div style={styles.selectGroup}>
                        <label style={styles.selectLabel}>⏰ ช่วงเวลารับ:</label>
                        <select
                            value={timeRangeFilter}
                            onChange={(e) => setTimeRangeFilter(e.target.value)}
                            style={styles.selectInput}
                        >
                            <option value="all">ทุกช่วงเวลา</option>
                            <option value="08-10">08:00 - 10:00 น.</option>
                            <option value="10-12">10:00 - 12:00 น.</option>
                            <option value="13-15">13:00 - 15:00 น.</option>
                            <option value="15-18">15:00 - 18:00 น.</option>
                            <option value="18-21">18:00 น. เป็นต้นไป</option>
                        </select>
                    </div>
                </div>

                {/* แถบหมวดหมู่อาหาร */}
                <div style={styles.categoryChipsGroup}>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                ...styles.chipBtn,
                                backgroundColor: selectedCategory === cat ? "#c084fc" : "#ffffff",
                                color: selectedCategory === cat ? "#ffffff" : "#64748b",
                                border: selectedCategory === cat ? "1px solid #c084fc" : "1px solid #e2e8f0",
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* แผนที่ */}
            <div ref={mapElement} style={styles.mapCanvas} />

            {/* Hover Tooltip Card */}
            <div ref={tooltipContainerRef} style={{ display: hoveredFood ? "block" : "none" }}>
                {hoveredFood && (
                    <div style={styles.hoverCard}>
                        {hoveredFood.imageUrl && (
                            <img
                                src={hoveredFood.imageUrl}
                                alt={hoveredFood.foodName}
                                style={styles.cardImg}
                            />
                        )}
                        <div style={styles.cardContent}>
                            <h4 style={styles.cardTitle}>{hoveredFood.foodName}</h4>

                            {hoveredFood.expiryDate && (
                                <p style={styles.cardExpiryText}>
                                    ⏳ หมดอายุ: {hoveredFood.expiryDate}
                                </p>
                            )}

                            {hoveredFood.pickupTime && (
                                <p style={styles.cardTimeText}>
                                    ⏰ เวลารับ: {hoveredFood.pickupTime}
                                </p>
                            )}

                            {hoveredFood.locationName && (
                                <p style={styles.cardSubText}>📍 {hoveredFood.locationName}</p>
                            )}
                            {hoveredFood.calculatedDistance !== undefined && (
                                <p style={styles.cardDistText}>
                                    📏 {hoveredFood.calculatedDistance.toFixed(1)} กม. จากคุณ
                                </p>
                            )}

                            <div style={styles.cardFooter}>
                                <span style={styles.cardQuantityBadge}>
                                    📦 เหลือ {hoveredFood.quantity || 1} รายการ
                                </span>
                                <span style={styles.clickHint}>แตะเพื่อจอง ➔</span>
                            </div>
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
        fontFamily: "'Prompt', sans-serif",
    },
    filterControlPanel: {
        position: "absolute",
        top: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        padding: "12px 18px",
        borderRadius: "20px",
        boxShadow: "0 8px 24px rgba(192, 132, 252, 0.18)",
        border: "1px solid rgba(241, 245, 249, 0.9)",
        maxWidth: "92%",
        width: "fit-content",
    },
    quickFocusRow: {
        display: "flex",
        gap: "8px",
        justifyContent: "center",
    },
    focusBtn: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "600",
        color: "#475569",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    dropdownRow: {
        display: "flex",
        gap: "12px",
        justifyContent: "center",
        flexWrap: "wrap",
    },
    selectGroup: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    selectLabel: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#475569",
        whiteSpace: "nowrap",
    },
    selectInput: {
        padding: "5px 10px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        fontSize: "12px",
        color: "#334155",
        outline: "none",
        cursor: "pointer",
    },
    categoryChipsGroup: {
        display: "flex",
        gap: "6px",
        overflowX: "auto",
        paddingBottom: "2px",
    },
    chipBtn: {
        padding: "4px 12px",
        borderRadius: "14px",
        fontSize: "12px",
        fontWeight: "500",
        cursor: "pointer",
        whiteSpace: "nowrap",
        outline: "none",
        transition: "all 0.2s ease",
    },
    mapCanvas: {
        width: "100%",
        height: "100%",
        zIndex: 1,
    },
    hoverCard: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "10px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
        width: "210px",
        pointerEvents: "none",
        border: "1px solid #f1f5f9",
    },
    cardImg: {
        width: "100%",
        height: "100px",
        objectFit: "cover",
        borderRadius: "10px",
        marginBottom: "8px",
    },
    cardContent: {
        display: "flex",
        flexDirection: "column",
        gap: "3px",
    },
    cardTitle: {
        margin: 0,
        fontSize: "14px",
        fontWeight: "700",
        color: "#1e293b",
    },
    cardExpiryText: {
        margin: 0,
        fontSize: "11px",
        fontWeight: "600",
        color: "#e11d48",
    },
    cardTimeText: {
        margin: 0,
        fontSize: "11px",
        color: "#059669",
        fontWeight: "500",
    },
    cardSubText: {
        margin: 0,
        fontSize: "11px",
        color: "#64748b",
    },
    cardDistText: {
        margin: 0,
        fontSize: "11px",
        fontWeight: "600",
        color: "#c084fc",
    },
    cardFooter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "6px",
        paddingTop: "6px",
        borderTop: "1px solid #f1f5f9",
    },
    cardQuantityBadge: {
        backgroundColor: "#f3e8ff",
        color: "#7e22ce",
        fontSize: "10px",
        fontWeight: "600",
        padding: "2px 8px",
        borderRadius: "10px",
    },
    clickHint: {
        fontSize: "10px",
        color: "#94a3b8",
        fontWeight: "500",
    },
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
        gap: "16px",
    },
    spinner: {
        width: "36px",
        height: "36px",
        border: "4px solid #f3e8ff",
        borderTop: "4px solid #c084fc",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    },
    loadingText: {
        color: "#c084fc",
        fontSize: "15px",
        fontWeight: "600",
    },
};