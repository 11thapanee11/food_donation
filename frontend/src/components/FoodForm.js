import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
import { fromLonLat, toLonLat } from "ol/proj";
import { Style, Icon } from "ol/style";

export default function FoodForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const foodId = location.state?.id;

    const isEditMode = Boolean(foodId);
    const [isEditable, setIsEditable] = useState(!isEditMode);

    // State ควบคุมขั้นตอน (Step 1, 2, 3)
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        fileImage: null,
        foodName: "",
        description: "",
        expiryDate: "",
        quantity: "",
        unit: "ชิ้น",
        remainingQuantity: "",
        limitPerPerson: "",
        locationName: "",
        address: "",
        pickupStartTime: "",
        pickupEndTime: "",
        latitude: "18.8925",
        longitude: "99.0142",
        foodStatus: "available",
        foodCateId: "",
        donorUserId: ""
    });

    const [errors, setErrors] = useState({});

    // State สำหรับจัดการ Custom Modal Popup
    const [popup, setPopup] = useState({
        show: false,
        title: "",
        message: "",
        type: "success",
        onConfirm: null,
        inputValue: "",
        inputPlaceholder: "",
    });

    const closePopup = () => {
        setPopup({ show: false, title: "", message: "", type: "success", onConfirm: null, inputValue: "" });
    };

    const showAutoPopup = (title, message, type = "success", callback) => {
        setPopup({
            show: true,
            title,
            message,
            type: type,
            onConfirm: null
        });
        setTimeout(() => {
            setPopup(prev => ({ ...prev, show: false }));
            setTimeout(() => {
                closePopup();
                if (callback) callback();
            }, 300);
        }, 1500);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setErrors({ ...errors, fileImage: "" });
        }
    };

    const handleClickUpload = () => {
        fileInputRef.current.click();
    };

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadFoodData = () => {
        if (isEditMode) {
            fetch(`http://localhost:8082/foods/${foodId}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
            })
                .then(res => {
                    if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลอาหารรายการนี้ได้");
                    return res.json();
                })
                .then(resData => {
                    if (resData.success) {
                        const foodInfo = resData.data;
                        setFormData(prev => ({
                            ...prev,
                            ...foodInfo,
                            foodCateId: foodInfo.foodCateId,
                            fileImage: foodInfo.foodImage,
                            latitude: foodInfo.latitude !== undefined && foodInfo.latitude !== null ? foodInfo.latitude : prev.latitude,
                            longitude: foodInfo.longitude !== undefined && foodInfo.longitude !== null ? foodInfo.longitude : prev.longitude
                        }));
                    }
                })
                .catch(err => console.error("Error fetching food details:", err));
        }
    };

    const UNIT_OPTIONS = [
        { label: 'กล่อง', value: 'กล่อง' },
        { label: 'แพ็ค', value: 'แพ็ค' },
        { label: 'ถุง', value: 'ถุง' },
        { label: 'ชิ้น', value: 'ชิ้น' },
        { label: 'โหล', value: 'โหล' },
        { label: 'กิโลกรัม', value: 'กิโลกรัม' },
        { label: 'กรัม', value: 'กรัม' },
        { label: 'ลิตร', value: 'ลิตร' },
        { label: 'มิลลิลิตร', value: 'มิลลิลิตร' },
        { label: 'ขวด', value: 'ขวด' },
        { label: 'แก้ว', value: 'แก้ว' },
        { label: 'กระป๋อง', value: 'กระป๋อง' },
        { label: 'กระปุก', value: 'กระปุก' },
        { label: 'ซอง', value: 'ซอง' },
        { label: 'แผง', value: 'แผง' },
    ];

    const isExpired = formData.foodStatus === 'expired' || formData.foodStatus === 'disable';

    useEffect(() => {
        fetch("http://localhost:8082/food-categories", {
            headers: { "Content-Type": "application/json" }
        })
            .then(res => res.json())
            .then(resData => {
                if (resData.success) setCategories(resData.data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));

        loadFoodData();
    }, [foodId, isEditMode]);

    // OpenLayers Map Integration
    const mapElementRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const vectorSourceRef = useRef(null);

    useEffect(() => {
        if (!mapElementRef.current || currentStep !== 3) return;

        const lon = Number(formData.longitude) || 99.0142;
        const lat = Number(formData.latitude) || 18.8925;

        if (!mapInstanceRef.current) {
            vectorSourceRef.current = new VectorSource();
            const vectorLayer = new VectorLayer({
                source: vectorSourceRef.current
            });

            const googleLayer = new TileLayer({
                source: new XYZ({
                    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
                }),
            });

            const map = new Map({
                target: mapElementRef.current,
                layers: [googleLayer, vectorLayer],
                view: new View({
                    center: fromLonLat([lon, lat]),
                    zoom: 15
                })
            });

            map.on('click', (event) => {
                if (!isEditable) return;
                const clickedCoord = toLonLat(event.coordinate);
                setFormData(prev => ({
                    ...prev,
                    longitude: clickedCoord[0],
                    latitude: clickedCoord[1]
                }));
                setErrors(prev => ({ ...prev, location: "" }));
            });

            mapInstanceRef.current = map;
        } else {
            mapInstanceRef.current.setTarget(mapElementRef.current);
            mapInstanceRef.current.updateSize();
            mapInstanceRef.current.getView().setCenter(fromLonLat([lon, lat]));
        }

        if (vectorSourceRef.current) {
            vectorSourceRef.current.clear();
            const markerFeature = new Feature({
                geometry: new Point(fromLonLat([lon, lat]))
            });

            const pinSvg = `
                <svg xmlns="http://www.w3.org/2000/svg" height="40" viewBox="0 0 24 24" width="40" fill="#EF4444">
                    <path d="M0 0h24v24H0z" fill="none"/>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
            `;
            const encodedSvg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pinSvg);

            markerFeature.setStyle(new Style({
                image: new Icon({
                    anchor: [0.5, 1],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    src: encodedSvg,
                    scale: 1.2
                })
            }));

            vectorSourceRef.current.addFeature(markerFeature);
        }
    }, [currentStep, isEditable, formData.latitude, formData.longitude]);

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setFormData((prev) => ({
                        ...prev,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                    }));
                    setErrors((prev) => ({ ...prev, location: "" }));
                },
                () => {
                    setPopup({
                        show: true,
                        title: "ไม่สามารถเข้าถึงตำแหน่งได้",
                        message: "กรุณาเปิดสิทธิ์การใช้งานตำแหน่งในเบราว์เซอร์ของคุณ",
                        type: "error",
                        onConfirm: closePopup
                    });
                },
                { enableHighAccuracy: true }
            );
        }
    };

    const handleDeleteFood = async (targetId) => {
        setPopup({
            show: true,
            title: "ยืนยันการลบรายการบริจาค?",
            message: "คุณแน่ใจหรือไม่ที่จะลบรายการนี้ ผู้รับจะไม่สามารถมองเห็นหรือจองได้อีก",
            type: "confirm",
            onConfirm: async () => {
                closePopup();
                try {
                    const response = await fetch(`http://localhost:8082/foods/${targetId}`, {
                        method: "DELETE",
                        headers: {
                            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                            "Content-Type": "application/json"
                        }
                    });
                    const resData = await response.json();
                    if (resData.success) {
                        showAutoPopup("ลบรายการสำเร็จ", "รายการอาหารของคุณถูกลบเรียบร้อยแล้ว", "success", () => navigate("/my-foods"));
                    } else {
                        throw new Error(resData.message || "ไม่สามารถลบได้");
                    }
                } catch (err) {
                    setPopup({
                        show: true,
                        title: "เกิดข้อผิดพลาด",
                        message: err.message,
                        type: "error",
                        onConfirm: closePopup
                    });
                }
            }
        });
    };

    const handleConfirmDelivery = () => {
        const token = localStorage.getItem("accessToken");
        if (!foodId) return;

        setPopup({
            show: true,
            title: "ยืนยันการส่งมอบอาหาร",
            message: "กรุณากรอกรหัส 6 หลักที่ได้รับจากผู้รับ",
            type: "input",
            inputValue: "",
            inputPlaceholder: "กรอกรหัส 6 หลัก...",
            onConfirm: (code) => {
                if (!code || code.length !== 6 || isNaN(code)) {
                    setPopup({
                        show: true,
                        title: "ข้อมูลไม่ถูกต้อง",
                        message: "กรุณากรอกรหัสตัวเลข 6 หลักให้ครบถ้วน",
                        type: "error",
                        onConfirm: closePopup
                    });
                    return;
                }
                closePopup();
                fetch(`http://localhost:8082/foods/${foodId}/deliver`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ code })
                })
                    .then(res => res.json())
                    .then(resData => {
                        if (resData.success) {
                            showAutoPopup("ส่งมอบสำเร็จ!", "ระบบบันทึกประวัติการส่งมอบเรียบร้อยแล้ว", "success");
                        } else {
                            throw new Error(resData.message || "รหัสไม่ถูกต้อง");
                        }
                    })
                    .catch(err => setPopup({
                        show: true,
                        title: "เกิดข้อผิดพลาด",
                        message: err.message,
                        type: "error",
                        onConfirm: closePopup
                    }));
            }
        });
    };

    const renderActionButtons = () => {
        if (!foodId) {
            return (
                <button type="submit" style={styles.submitBtn}>
                    สร้างรายการอาหาร
                </button>
            );
        }

        return null;
    };

    const handleNextStep = (e) => {
        if (e) e.preventDefault();

        if (!isEditable) {
            setErrors({});
            setCurrentStep((prev) => Math.min(prev + 1, 3));
            return;
        }

        const newErrors = {};

        if (currentStep === 1) {
            if (isEditMode) {
                if (!imagePreview && !imageFile && !formData.fileImage && !formData.foodImage) {
                    newErrors.fileImage = "กรุณาเพิ่มรูปภาพ";
                }
            } else if (!imageFile) {
                newErrors.fileImage = "กรุณาเพิ่มรูปภาพ";
            }
        } else if (currentStep === 2) {
            if (!formData.foodName) newErrors.foodName = "กรุณากรอกข้อมูล";
            if (!formData.foodCateId) newErrors.foodCateId = "กรุณากรอกข้อมูล";

            if (!formData.expiryDate) {
                newErrors.expiryDate = "กรุณากรอกข้อมูล";
            } else {
                const nowPlus24H = new Date().getTime() + (24 * 60 * 60 * 1000);
                const selectedExpiry = new Date(formData.expiryDate).getTime();
                if (selectedExpiry < nowPlus24H) {
                    newErrors.expiryDate = "วันหมดอายุต้องมากกว่าเวลาปัจจุบันอย่างน้อย 24 ชั่วโมง";
                }
            }

            if (!formData.quantity) newErrors.quantity = "กรุณากรอกข้อมูล";
            if (!formData.unit) newErrors.unit = "กรุณากรอกข้อมูล";
            if (!formData.limitPerPerson) newErrors.limitPerPerson = "กรุณากรอกข้อมูล";
        } else if (currentStep === 3) {
            if (!formData.locationName) newErrors.locationName = "กรุณากรอกข้อมูล";
            if (!formData.pickupStartTime) newErrors.pickupStartTime = "กรุณากรอกข้อมูล";
            if (!formData.pickupEndTime) {
                newErrors.pickupEndTime = "กรุณากรอกข้อมูล";
            } else if (formData.pickupStartTime) {
                // ตรวจสอบเวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้นอย่างน้อย 1 ชั่วโมง
                const [startH, startM] = formData.pickupStartTime.split(':').map(Number);
                const [endH, endM] = formData.pickupEndTime.split(':').map(Number);
                const startTotalMinutes = startH * 60 + startM;
                const endTotalMinutes = endH * 60 + endM;

                if (endTotalMinutes < startTotalMinutes + 60) {
                    newErrors.pickupEndTime = "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้นอย่างน้อย 1 ชั่วโมง";
                }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setCurrentStep((prev) => Math.min(prev + 1, 3));
    };

    const handlePrevStep = () => {
        setErrors({});
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        // ตรวจสอบเวลาซ้ำอีกรอบก่อนส่งข้อมูลจริง
        if (formData.pickupStartTime && formData.pickupEndTime) {
            const [startH, startM] = formData.pickupStartTime.split(':').map(Number);
            const [endH, endM] = formData.pickupEndTime.split(':').map(Number);
            const startTotalMinutes = startH * 60 + startM;
            const endTotalMinutes = endH * 60 + endM;

            if (endTotalMinutes < startTotalMinutes + 60) {
                setErrors(prev => ({ ...prev, pickupEndTime: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้นอย่างน้อย 1 ชั่วโมง" }));
                return;
            }
        }

        const token = localStorage.getItem("accessToken");

        const data = new FormData();
        if (imageFile) data.append("fileImage", imageFile);

        data.append("foodName", formData.foodName || "");
        data.append("description", formData.description || "");
        data.append("expiryDate", formData.expiryDate || "");
        data.append("quantity", Number.parseFloat(formData.quantity) || 0);
        data.append("unit", formData.unit || "ชิ้น");
        data.append("locationName", formData.locationName || "");
        data.append("address", formData.address || "");
        data.append("pickupStartTime", formData.pickupStartTime || "");
        data.append("pickupEndTime", formData.pickupEndTime || "");
        data.append("limitPerPerson", Number.parseInt(formData.limitPerPerson, 10) || 1);
        data.append("latitude", Number.parseFloat(formData.latitude) || 0);
        data.append("longitude", Number.parseFloat(formData.longitude) || 0);
        data.append("foodCateId", Number.parseInt(formData.foodCateId, 10) || 0);
        data.append("foodStatus", formData.foodStatus || "available");

        const targetUrl = isEditMode
            ? `http://localhost:8082/foods/${foodId}`
            : "http://localhost:8082/foods";
        const targetMethod = isEditMode ? "PUT" : "POST";

        fetch(targetUrl, {
            method: targetMethod,
            headers: { "Authorization": `Bearer ${token}` },
            body: data
        })
            .then(async (res) => {
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || "ไม่สามารถบันทึกข้อมูลได้");
                }
                return res.json();
            })
            .then((result) => {
                if (result.success) {
                    const successTitle = isEditMode ? "แก้ไขรายการสำเร็จ!" : "สร้างรายการสำเร็จ!";
                    showAutoPopup(successTitle, "ระบบได้บันทึกข้อมูลรายการอาหารของคุณเรียบร้อยแล้ว", "success", () => {
                        if (isEditMode) {
                            setIsEditable(false);
                            loadFoodData();
                        } else {
                            navigate("/my-foods");
                        }
                    });
                } else {
                    throw new Error(result.message || "เกิดข้อผิดพลาด");
                }
            })
            .catch((err) => {
                setPopup({
                    show: true,
                    title: "เกิดข้อผิดพลาด",
                    message: err.message,
                    type: "error",
                    onConfirm: closePopup
                });
            });
    };

    if (loading) return <div style={styles.loading}>กำลังโหลด...</div>;

    const renderFoodImage = () => {
        const hasImage = imagePreview || formData.fileImage || formData.foodImage;

        if (!hasImage && isEditable) {
            return (
                <div style={styles.uploadCardContainer}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: "none" }}
                        ref={fileInputRef}
                    />
                    <div
                        onClick={handleClickUpload}
                        style={{
                            ...styles.dropzoneBox,
                            borderColor: errors.fileImage ? "#EF4444" : "#E9D5FF",
                            backgroundColor: errors.fileImage ? "#FEF2F2" : "#FAF5FF"
                        }}
                    >
                        <div style={styles.dropzoneIconCircle}>
                            <span className="material-symbols-outlined" style={{ fontSize: "32px", color: errors.fileImage ? "#EF4444" : "#C084FC" }}>
                                add_a_photo
                            </span>
                        </div>
                        <div style={styles.dropzoneTextGroup}>
                            <p style={{ ...styles.dropzoneTitle, color: errors.fileImage ? "#EF4444" : "#475569" }}>
                                {errors.fileImage || "คลิกเพื่ออัปโหลดรูปภาพอาหาร"}
                            </p>
                            <p style={styles.dropzoneSubtitle}>รองรับไฟล์ PNG, JPG หรือ WEBP (ขนาดไม่เกิน 5MB)</p>
                        </div>
                        <button type="button" style={{
                            ...styles.browseFileBtn,
                            borderColor: errors.fileImage ? "#EF4444" : "#E9D5FF",
                            color: errors.fileImage ? "#EF4444" : "#9333EA"
                        }}>
                            เลือกไฟล์รูปภาพ
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div style={styles.previewCardContainer}>
                <div style={styles.imagePreviewWrapper}>
                    <img
                        src={imagePreview || `http://localhost:8082${formData.fileImage || formData.foodImage}`}
                        alt="Food Preview"
                        style={styles.previewImg}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="%23ccc"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>`;
                        }}
                    />
                </div>
                {isEditable && (
                    <div style={styles.previewActionRow}>
                        <button type="button" onClick={handleClickUpload} style={styles.changeImgBtn}>
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
                            เปลี่ยนรูปภาพ
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: "none" }}
                            ref={fileInputRef}
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>

                <div style={styles.headerCenter}>
                    <div style={styles.topBadge}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>volunteer_activism</span>
                        {isEditMode ? "จัดการรายการอาหาร" : "ร่วมแบ่งปันอาหาร"}
                    </div>
                    <h1 style={styles.mainTitle}>
                        {isEditMode ? "รายละเอียดและแก้ไขรายการอาหาร" : "แบ่งปันอาหารส่วนเกินของคุณ"}
                    </h1>
                    <p style={styles.mainSubtitle}>
                        {isEditMode
                            ? "ตรวจสอบข้อมูล แก้ไข หรืออัปเดตสถานะรายการอาหารของคุณได้ที่นี่"
                            : "ร่วมมือกันลดขยะอาหารและส่งต่อให้ผู้ที่ต้องการ ทุกการแบ่งปันมีความหมาย!"
                        }
                    </p>
                </div>

                <div style={styles.stepIndicatorContainer}>
                    {[1, 2, 3].map((step) => {
                        const isCompleted = currentStep > step;
                        const isActive = currentStep === step;
                        return (
                            <React.Fragment key={step}>
                                <div style={{
                                    ...styles.stepCircle,
                                    backgroundColor: isCompleted || isActive ? "#C084FC" : "#E2E8F0",
                                    color: isCompleted || isActive ? "#FFFFFF" : "#64748B",
                                    boxShadow: isActive ? "0 0 0 4px rgba(192, 132, 252, 0.2)" : "none"
                                }}>
                                    {isCompleted ? (
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>done</span>
                                    ) : (
                                        step
                                    )}
                                </div>
                                {step < 3 && (
                                    <div style={{
                                        ...styles.stepLine,
                                        backgroundColor: currentStep > step ? "#C084FC" : "#E2E8F0"
                                    }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <form onSubmit={handleSubmit} noValidate>

                    {isEditMode && (
                        <div style={styles.step1HeaderRow}>
                            {/* ปุ่มยืนยันการส่งมอบ (ถ้ามีเงื่อนไขถึงจะแสดง) */}
                            {!isExpired && formData.foodStatus !== 'closed' && formData.foodStatus !== 'disable' ? (
                                <button
                                    type="button"
                                    style={styles.confirmDeliveryBtn}
                                    onClick={handleConfirmDelivery}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>
                                    ยืนยันการส่งมอบ
                                </button>
                            ) : (
                                <div /> /* ใส่ div เปล่าไว้จองพื้นที่เพื่อให้ฝั่งขวาดันไปอยู่ขวาโดยอัตโนมัติ */
                            )}

                            {/* ปุ่ม แก้ไข และ ลบ จะถูกดันไปชิดขวาเสมอ */}
                            <div style={{ ...styles.topRightControls, marginLeft: 'auto' }}>
                                {!isEditable ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                if (isExpired || formData.foodStatus === 'closed' || formData.foodStatus === 'disable') return;
                                                e.preventDefault();
                                                setIsEditable(true);
                                            }}
                                            style={{
                                                ...styles.editBtn,
                                                ...((isExpired || formData.foodStatus === 'closed' || formData.foodStatus === 'disable') ? {
                                                    backgroundColor: '#d1d5db',
                                                    color: '#9ca3af',
                                                    cursor: 'not-allowed',
                                                    opacity: 0.7
                                                } : {})
                                            }}
                                            disabled={isExpired || formData.foodStatus === 'closed' || formData.foodStatus === 'disable'}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                                            แก้ไข
                                        </button>
                                        <button type="button" onClick={() => handleDeleteFood(formData.id || foodId)} style={styles.deleteBtn}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                                            ลบ
                                        </button>
                                    </>
                                ) : (
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button type="button" onClick={() => setIsEditable(false)} style={styles.cancelEditCardBtn}>
                                            ยกเลิกการแก้ไข
                                        </button>
                                        <button type="submit" onClick={handleSubmit} style={{ ...styles.cancelEditCardBtn, color: '#fff', backgroundColor: '#C084FC' }}>
                                            บันทึกการแก้ไข
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Stage 1: รูปภาพอาหาร พร้อมสถานะอาหาร และปุ่มยืนยันการส่งมอบอาหาร */}
                    {currentStep === 1 && (
                        <>
                            <div style={styles.cardSection}>
                                <div style={styles.step1HeaderRow}>
                                    <h3 style={{ ...styles.cardSectionTitle, borderBottom: "none", marginBottom: 0 }}>
                                        รูปภาพอาหาร <span style={styles.requiredStar}>*</span>
                                    </h3>

                                    <div style={styles.statusSelectGroup}>
                                        <label style={styles.statusLabel}>สถานะ:</label>
                                        <select
                                            name="foodStatus"
                                            value={formData.foodStatus || "available"}
                                            onChange={handleChange}
                                            disabled={!isEditable}
                                            style={{
                                                ...styles.inputField,
                                                padding: "6px 10px",
                                                backgroundColor: isEditable ? "#FFFFFF" : "#F8FAFC",
                                                color: !isEditable ? "#94A3B8" : "#1E293B",
                                                cursor: isEditable ? "pointer" : "not-allowed",
                                                width: "140px",
                                                fontSize: "13px"
                                            }}
                                        >
                                            <option value="available">เปิดรับบริจาค</option>
                                            <option value="closed">ปิดรับบริจาค</option>
                                        </select>
                                    </div>
                                </div>
                                {renderFoodImage()}
                            </div>
                        </>
                    )}

                    {/* Stage 2: ข้อมูลรายละเอียดอาหาร */}
                    {currentStep === 2 && (
                        <div style={styles.cardSection}>
                            <h3 style={styles.cardSectionTitle}>ข้อมูลรายละเอียดอาหาร</h3>

                            <div style={styles.row}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>ชื่ออาหาร <span style={styles.requiredStar}>*</span></label>
                                    <input
                                        name="foodName"
                                        value={formData.foodName}
                                        placeholder="เช่น ข้าวกล่องกระเพราไก่"
                                        disabled={!isEditable}
                                        style={{
                                            ...styles.inputField,
                                            borderColor: errors.foodName ? "#EF4444" : "#E2E8F0",
                                            backgroundColor: errors.foodName ? "#FEF2F2" : "#F8FAFC",
                                            color: !isEditable ? "#94A3B8" : "#1E293B"
                                        }}
                                        onChange={handleChange}
                                    />
                                    {errors.foodName && <span style={styles.errorText}>{errors.foodName}</span>}
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>หมวดหมู่ <span style={styles.requiredStar}>*</span></label>
                                    <select
                                        name="foodCateId"
                                        value={String(formData.foodCateId || "")}
                                        disabled={!isEditable}
                                        style={{
                                            ...styles.inputField,
                                            borderColor: errors.foodCateId ? "#EF4444" : "#E2E8F0",
                                            backgroundColor: errors.foodCateId ? "#FEF2F2" : "#F8FAFC",
                                            color: !isEditable ? "#94A3B8" : "#1E293B"
                                        }}
                                        onChange={handleChange}
                                    >
                                        <option value="">เลือกหมวดหมู่</option>
                                        {categories.map((item) => (
                                            <option key={item.id} value={String(item.id)}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.foodCateId && <span style={styles.errorText}>{errors.foodCateId}</span>}
                                </div>
                            </div>

                            <div style={styles.inputGroupFull}>
                                <label style={styles.label}>รายละเอียดเพิ่มเติม</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    placeholder="ระบุส่วนผสม หรือข้อแนะนำเพิ่มเติม..."
                                    disabled={!isEditable}
                                    style={{
                                        ...styles.inputField,
                                        height: "80px",
                                        resize: "vertical",
                                        color: !isEditable ? "#94A3B8" : "#1E293B"
                                    }}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* แยกวันหมดอายุออกมาอยู่แถวเดี่ยวเต็มความกว้าง */}
                            {(() => {
                                const now = new Date();
                                now.setTime(now.getTime() + (24 * 60 * 60 * 1000)); // บวกเพิ่ม 24 ชั่วโมง

                                const year = now.getFullYear();
                                const month = String(now.getMonth() + 1).padStart(2, '0');
                                const day = String(now.getDate()).padStart(2, '0');
                                const hours = String(now.getHours()).padStart(2, '0');
                                const minutes = String(now.getMinutes()).padStart(2, '0');

                                const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

                                return (
                                    <div style={styles.inputGroupFull}>
                                        <label style={styles.label}>วันหมดอายุ <span style={styles.requiredStar}>*</span></label>
                                        <input
                                            type="datetime-local"
                                            name="expiryDate"
                                            value={formData.expiryDate}
                                            disabled={isEditMode}
                                            min={minDateTime}
                                            style={{
                                                ...styles.inputField,
                                                borderColor: errors.expiryDate ? "#EF4444" : "#E2E8F0",
                                                backgroundColor: errors.expiryDate ? "#FEF2F2" : "#F8FAFC",
                                                color: isEditMode ? "#94A3B8" : "#1E293B"
                                            }}
                                            onChange={handleChange}
                                        />
                                        {errors.expiryDate && <span style={styles.errorText}>{errors.expiryDate}</span>}
                                    </div>
                                );
                            })()}

                            <div style={styles.row}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>จำนวนที่บริจาค<span style={styles.requiredStar}>*</span></label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={formData.quantity}
                                            placeholder="จำนวน"
                                            disabled={!isEditable}
                                            style={{
                                                ...styles.inputField,
                                                flex: 1,
                                                borderColor: errors.quantity ? "#EF4444" : "#E2E8F0",
                                                backgroundColor: errors.quantity ? "#FEF2F2" : "#F8FAFC",
                                                color: !isEditable ? "#94A3B8" : "#1E293B"
                                            }}
                                            onChange={handleChange}
                                        />
                                        <select
                                            name="unit"
                                            value={formData.unit}
                                            onChange={(e) => {
                                                handleChange(e);
                                            }}
                                            disabled={!isEditable}
                                            style={{
                                                ...styles.inputField,
                                                width: "110px",
                                                flexShrink: 0,
                                                color: !isEditable ? "#94A3B8" : "#1E293B"
                                            }}
                                        >
                                            {UNIT_OPTIONS.map((u) => (
                                                <option key={u.value} value={u.value}>{u.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.quantity && <span style={styles.errorText}>{errors.quantity}</span>}
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>จำนวนจำกัดการรับต่อคน <span style={styles.requiredStar}>*</span></label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="number"
                                            name="limitPerPerson"
                                            value={formData.limitPerPerson}
                                            placeholder="เช่น 2"
                                            disabled={!isEditable}
                                            style={{
                                                ...styles.inputField,
                                                flex: 1,
                                                borderColor: errors.limitPerPerson ? "#EF4444" : "#E2E8F0",
                                                backgroundColor: errors.limitPerPerson ? "#FEF2F2" : "#F8FAFC",
                                                color: !isEditable ? "#94A3B8" : "#1E293B"
                                            }}
                                            onChange={handleChange}
                                        />
                                        <span style={{ fontSize: "14px", fontWeight: "600", color: !isEditable ? "#94A3B8" : "#64748B", minWidth: "40px" }}>
                                            {formData.unit || "ชิ้น"}
                                        </span>
                                    </div>
                                    {errors.limitPerPerson && <span style={styles.errorText}>{errors.limitPerPerson}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stage 3: สถานที่และเวลารับอาหาร */}
                    {currentStep === 3 && (
                        <div style={styles.cardSection}>
                            <h3 style={styles.cardSectionTitle}>สถานที่และเวลารับอาหาร</h3>

                            <div style={styles.row}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>ชื่อสถานที่นัดรับ <span style={styles.requiredStar}>*</span></label>
                                    <input
                                        name="locationName"
                                        value={formData.locationName}
                                        placeholder="เช่น หอพักโซน A หน้ามหาวิทยาลัย"
                                        disabled={!isEditable}
                                        style={{
                                            ...styles.inputField,
                                            borderColor: errors.locationName ? "#EF4444" : "#E2E8F0",
                                            backgroundColor: errors.locationName ? "#FEF2F2" : "#F8FAFC",
                                            color: !isEditable ? "#94A3B8" : "#1E293B"
                                        }}
                                        onChange={handleChange}
                                    />
                                    {errors.locationName && <span style={styles.errorText}>{errors.locationName}</span>}
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: "#fff9f5",
                                border: "1.5px solid #ffdfd5",
                                borderRadius: "14px",
                                padding: "14px 16px",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "10px",
                                marginTop: "16px",
                                marginBottom: "5px"
                            }}>
                                <span className="material-symbols-outlined" style={{ color: "#ff8851", fontSize: "20px", marginTop: "1px" }}>
                                    info
                                </span>
                                <p style={{
                                    fontSize: "13px",
                                    color: "#475569",
                                    margin: 0,
                                    lineHeight: "1.6",
                                    fontWeight: "500",
                                }}>
                                    ช่วงเวลานี้จะเปิดให้ผู้รับมารับอาหารบริจาคตามรอบประจำวัน <strong>ท่านสามารถปรับเปลี่ยนแก้ไขเวลาหรือสถานะรายการได้ภายหลังตามความสะดวก</strong>
                                </p>
                            </div>

                            <div style={styles.row}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>เวลาเริ่มการนัดรับ <span style={styles.requiredStar}>*</span></label>
                                    <input
                                        type="time"
                                        name="pickupStartTime"
                                        value={formData.pickupStartTime}
                                        disabled={!isEditable}
                                        style={{
                                            ...styles.inputField,
                                            borderColor: errors.pickupStartTime ? "#EF4444" : "#E2E8F0",
                                            backgroundColor: errors.pickupStartTime ? "#FEF2F2" : "#F8FAFC",
                                            color: !isEditable ? "#94A3B8" : "#1E293B"
                                        }}
                                        onChange={handleChange}
                                    />
                                    {errors.pickupStartTime && <span style={styles.errorText}>{errors.pickupStartTime}</span>}
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>เวลาสิ้นสุดการนัดรับ <span style={styles.requiredStar}>*</span></label>
                                    <input
                                        type="time"
                                        name="pickupEndTime"
                                        value={formData.pickupEndTime}
                                        disabled={!isEditable}
                                        style={{
                                            ...styles.inputField,
                                            borderColor: errors.pickupEndTime ? "#EF4444" : "#E2E8F0",
                                            backgroundColor: errors.pickupEndTime ? "#FEF2F2" : "#F8FAFC",
                                            color: !isEditable ? "#94A3B8" : "#1E293B"
                                        }}
                                        onChange={handleChange}
                                    />
                                    {errors.pickupEndTime && <span style={styles.errorText}>{errors.pickupEndTime}</span>}
                                </div>
                            </div>

                            <div style={styles.mapContainer}>
                                <div ref={mapElementRef} style={styles.mapCanvas} />

                                {isEditable && (
                                    <button
                                        type="button"
                                        style={styles.currentLocationBtn}
                                        onClick={handleGetCurrentLocation}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>my_location</span>
                                        ใช้ตำแหน่งปัจจุบัน
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ปุ่มควบคุมสเต็ป */}
                    <div style={styles.buttonGroup}>
                        <div style={{ display: "flex", gap: "10px" }}>
                            {currentStep > 1 && (
                                <button type="button" style={styles.cancelBtn} onClick={handlePrevStep}>
                                    ย้อนกลับ
                                </button>
                            )}
                        </div>

                        <div>
                            {currentStep < 3 ? (
                                <button type="button" style={styles.submitBtn} onClick={(e) => handleNextStep(e)}>
                                    ถัดไป
                                </button>
                            ) : (
                                renderActionButtons()
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* Custom Modal Popup */}
            {popup.show && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        <div style={styles.modalHeader}>
                            <div style={{
                                ...styles.modalHeaderIcon,
                                backgroundColor: popup.type === 'success' ? '#f0fdf4' : popup.type === 'error' ? '#fff1f2' : '#faf5ff',
                                border: popup.type === 'success' ? '1px solid #bbf7d0' : popup.type === 'error' ? '1px solid #fecdd3' : '1px solid #e9d5ff'
                            }}>
                                <span className="material-symbols-outlined" style={{
                                    fontSize: "28px",
                                    color: popup.type === 'success' ? '#10b981' : popup.type === 'error' ? '#f43f5e' : '#c084fc'
                                }}>
                                    {popup.type === 'success' ? 'check_circle' : popup.type === 'error' ? 'error_outline' : popup.type === 'input' ? 'lock' : 'info'}
                                </span>
                            </div>
                            <h3 style={styles.modalTitle}>{popup.title}</h3>
                        </div>
                        <div style={styles.modalBody}>
                            <p style={styles.modalMessage}>{popup.message}</p>
                            {popup.type === "input" && (
                                <input
                                    type="text"
                                    maxLength="6"
                                    placeholder={popup.inputPlaceholder}
                                    id="modalInputCode"
                                    style={styles.modalInput}
                                    autoFocus
                                    onInput={(e) => {
                                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                                    }}
                                />
                            )}
                        </div>
                        {(popup.type === "confirm" || popup.type === "input" || popup.type === "error") && (
                            <div style={styles.modalFooter}>
                                {popup.type !== "error" && (
                                    <button style={styles.modalCancelBtn} onClick={closePopup}>ยกเลิก</button>
                                )}
                                <button
                                    style={styles.modalConfirmBtn}
                                    onClick={() => {
                                        if (popup.type === "input") {
                                            const val = document.getElementById("modalInputCode").value;
                                            popup.onConfirm(val);
                                        } else if (popup.onConfirm) {
                                            popup.onConfirm();
                                        } else {
                                            closePopup();
                                        }
                                    }}
                                >
                                    ตกลง
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: {
        backgroundColor: "#FAF5FF",
        minHeight: "100vh",
        paddingBottom: "40px",
    },
    container: {
        maxWidth: "960px",
        margin: "0 auto",
        padding: "30px 20px",
        fontFamily: "'Prompt', 'Kanit', sans-serif",
    },
    headerCenter: {
        textAlign: "center",
        marginBottom: "24px",
    },
    topBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: "#F3E8FF",
        color: "#9333EA",
        padding: "6px 16px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
        marginBottom: "12px",
    },
    mainTitle: {
        color: "#1E293B",
        fontSize: "28px",
        fontWeight: "800",
        margin: "0 0 6px 0",
    },
    mainSubtitle: {
        color: "#64748B",
        fontSize: "14px",
        margin: 0,
    },
    stepIndicatorContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px",
        marginBottom: "30px",
    },
    stepCircle: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "15px",
        fontWeight: "700",
        transition: "all 0.3s ease",
    },
    stepLine: {
        width: "60px",
        height: "3px",
        borderRadius: "2px",
        transition: "all 0.3s ease",
    },
    step1HeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "10px",
    },
    topRightControls: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
    },
    statusSelectGroup: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    statusLabel: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#64748B",
    },
    cardSection: {
        backgroundColor: "#FFFFFF",
        border: "1.5px solid #F3E8FF",
        borderRadius: "20px",
        padding: "28px 32px",
        marginBottom: "20px",
        boxShadow: "0 4px 15px rgba(192, 132, 252, 0.04)",
    },
    cardSectionTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#1E293B",
        marginTop: 0,
        marginBottom: "20px",
        borderBottom: "1px solid #F8FAFC",
        paddingBottom: "10px",
    },
    requiredStar: {
        color: "#EF4444",
        marginLeft: "4px",
    },
    uploadCardContainer: {
        width: "100%",
    },
    dropzoneBox: {
        width: "100%",
        border: "2px dashed #E9D5FF",
        borderRadius: "16px",
        backgroundColor: "#FAF5FF",
        padding: "36px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        boxSizing: "border-box",
    },
    dropzoneIconCircle: {
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        backgroundColor: "#F3E8FF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "14px",
    },
    dropzoneTextGroup: {
        textAlign: "center",
        marginBottom: "16px",
    },
    dropzoneTitle: {
        fontSize: "15px",
        fontWeight: "700",
        color: "#475569",
        margin: "0 0 4px 0",
    },
    dropzoneSubtitle: {
        fontSize: "12px",
        color: "#94A3B8",
        margin: 0,
    },
    browseFileBtn: {
        backgroundColor: "#FFFFFF",
        color: "#9333EA",
        border: "1.5px solid #E9D5FF",
        borderRadius: "10px",
        padding: "8px 18px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        boxShadow: "0 2px 5px rgba(192, 132, 252, 0.08)",
    },
    previewCardContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "14px",
    },
    imagePreviewWrapper: {
        width: "100%",
        maxWidth: "320px",
        height: "220px",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1.5px solid #E2E8F0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    },
    previewImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    previewActionRow: {
        display: "flex",
        gap: "10px",
    },
    changeImgBtn: {
        backgroundColor: "#F3E8FF",
        border: "none",
        borderRadius: "10px",
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: "600",
        color: "#9333EA",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    row: {
        display: "flex",
        gap: "16px",
        marginBottom: "14px",
    },
    inputGroup: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    inputGroupFull: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        marginBottom: "14px",
    },
    label: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#475569",
    },
    inputField: {
        padding: "10px 14px",
        borderRadius: "12px",
        border: "1.5px solid #E2E8F0",
        backgroundColor: "#F8FAFC",
        fontSize: "14px",
        outline: "none",
        fontFamily: "inherit",
    },
    errorText: {
        color: "#EF4444",
        fontSize: "12px",
        marginTop: "2px",
    },
    mapContainer: {
        position: "relative",
        width: "100%",
        marginTop: "16px",
    },
    mapCanvas: {
        width: "100%",
        height: "320px",
        borderRadius: "16px",
        border: "1.5px solid #E2E8F0",
    },
    currentLocationBtn: {
        position: "absolute",
        bottom: "16px",
        right: "16px",
        padding: "8px 14px",
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "13px",
        fontWeight: "600",
        color: "#475569",
        zIndex: 1000,
    },
    buttonGroup: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "24px",
    },
    cancelBtn: {
        padding: "10px 20px",
        borderRadius: "12px",
        border: "1.5px solid #CBD5E1",
        backgroundColor: "#FFFFFF",
        color: "#64748B",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
    },
    submitBtn: {
        padding: "10px 28px",
        borderRadius: "12px",
        border: "none",
        backgroundColor: "#C084FC",
        color: "#FFFFFF",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(192, 132, 252, 0.25)",
    },
    editBtn: {
        padding: "6px 14px",
        borderRadius: "10px",
        border: "1.5px solid #E9D5FF",
        backgroundColor: "#FAF5FF",
        color: "#9333EA",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
    },
    deleteBtn: {
        padding: "6px 14px",
        borderRadius: "10px",
        border: "1.5px solid #FCA5A5",
        backgroundColor: "#FEF2F2",
        color: "#EF4444",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
    },
    cancelEditCardBtn: {
        padding: "6px 14px",
        borderRadius: "10px",
        border: "1.5px solid #CBD5E1",
        backgroundColor: "#FFFFFF",
        color: "#64748B",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
    },
    confirmDeliveryBtn: {
        backgroundColor: "#10B981",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "10px",
        padding: "6px 14px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)",
    },
    loading: {
        textAlign: "center",
        padding: "100px",
        color: "#C084FC",
        fontSize: "18px",
        fontWeight: "600",
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
    },
    modalCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        padding: "24px 28px",
        width: "380px",
        maxWidth: "90%",
        boxShadow: "0 10px 25px rgba(192, 132, 252, 0.2)",
        border: "1.5px solid #F3E8FF",
        textAlign: "center",
    },
    modalHeader: {
        marginBottom: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    modalHeaderIcon: {
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    },
    modalTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#1E293B",
        margin: 0,
    },
    modalBody: {
        marginBottom: "10px",
    },
    modalMessage: {
        fontSize: "14px",
        color: "#64748B",
        margin: 0,
        lineHeight: "1.5",
    },
    modalInput: {
        width: "100%",
        marginTop: "14px",
        padding: "12px",
        borderRadius: "12px",
        border: "1.5px solid #E2E8F0",
        backgroundColor: "#F8FAFC",
        fontSize: "18px",
        textAlign: "center",
        letterSpacing: "4px",
        outline: "none",
        boxSizing: "border-box",
    },
    modalFooter: {
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        marginTop: "16px",
    },
    modalCancelBtn: {
        flex: 1,
        padding: "10px",
        borderRadius: "12px",
        border: "1.5px solid #CBD5E1",
        backgroundColor: "#FFFFFF",
        color: "#64748B",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
    },
    modalConfirmBtn: {
        flex: 1,
        padding: "10px",
        borderRadius: "12px",
        border: "none",
        backgroundColor: "#C084FC",
        color: "#FFFFFF",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(192, 132, 252, 0.25)",
    },
};