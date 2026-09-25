import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

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
        unitWeightKg: "",
        totalUnit: "",
        remainingUnit: "",
        limitPerPerson: "",
        address: "",
        pickupDateStart: "",
        pickupDateEnd: "",
        pickupStartTime: "",
        pickupEndTime: "",
        latitude: "",
        longitude: "",
        foodStatus: "",
        foodCateId: "",
        donorId: ""
    });

    const [errors, setErrors] = useState({});

    // State สำหรับจัดการ Custom Modal Popup (รองรับการปิดอัตโนมัติ)
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

    // ฟังก์ชันช่วยแสดง Popup แบบชั่วคราว (Auto-close) หรือแบบยืนยัน
    const showAutoPopup = (title, message, callback) => {
        setPopup({
            show: true,
            title,
            message,
            type: "success",
            onConfirm: null
        });
        setTimeout(() => {
            closePopup();
            if (callback) callback();
        }, 1500); // แสดงผลชั่วคราว 1.5 วินาทีแล้วปิดเอง
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setErrors((prev) => {
            const newErrors = { ...prev, [name]: "" };
            if (name === "expiryDate") {
                delete newErrors.pickupDateEnd;
                delete newErrors.pickupEndTime;
            }
            return newErrors;
        });

        if (name === "expiryDate" && value) {
            const expiryDateObj = new Date(value);
            expiryDateObj.setHours(expiryDateObj.getHours() - 4);

            const year = expiryDateObj.getFullYear();
            const month = String(expiryDateObj.getMonth() + 1).padStart(2, '0');
            const date = String(expiryDateObj.getDate()).padStart(2, '0');
            const endDateFormatted = `${year}-${month}-${date}`;

            const hours = String(expiryDateObj.getHours()).padStart(2, '0');
            const minutes = String(expiryDateObj.getMinutes()).padStart(2, '0');
            const endTimeFormatted = `${hours}:${minutes}`;

            setFormData((prev) => ({
                ...prev,
                expiryDate: value,
                pickupDateEnd: endDateFormatted,
                pickupEndTime: endTimeFormatted
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value
            }));
        }
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
            fetch(`http://localhost:8082/foods/${foodId}`)
                .then(res => {
                    if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลอาหารรายการนี้ได้");
                    return res.json();
                })
                .then(resData => {
                    if (resData.success) {
                        const foodInfo = resData.data;
                        const weightKg = Number(foodInfo.unitWeightKg) || 0;

                        let calculatedQty = weightKg;
                        let calculatedUnit = 'kg';

                        if (weightKg > 0) {
                            if (weightKg < 1) {
                                calculatedQty = Math.round(weightKg / 0.001);
                                calculatedUnit = 'g';
                            } else {
                                calculatedQty = weightKg;
                                calculatedUnit = 'kg';
                            }
                        }

                        setFormData(prev => ({
                            ...prev,
                            ...foodInfo,
                            foodCateId: foodInfo.foodCateId,
                            fileImage: foodInfo.foodImage,
                            inputQuantity: calculatedQty,
                            selectedUnit: calculatedUnit
                        }));

                        setInputQuantity(calculatedQty);
                        setSelectedUnit(calculatedUnit);
                    }
                })
                .catch(err => console.error("Error fetching food details:", err));
        }
    };

    const UNIT_OPTIONS = [
        { label: 'กิโลกรัม', value: 'kg', type: 'weight', factor: 1 },
        { label: 'กรัม', value: 'g', type: 'weight', factor: 0.001 },
        { label: 'ปอนด์', value: 'lb', type: 'weight', factor: 0.453592 },
        { label: 'ลิตร', value: 'L', type: 'volume', factor: 1 },
        { label: 'มิลลิลิตร', value: 'ml', type: 'volume', factor: 0.001 },
        { label: 'ชิ้น', value: 'piece', type: 'count', defaultWeightKg: 0.1 },
        { label: 'กล่อง / ถุง', value: 'box', type: 'count', defaultWeightKg: 0.35 },
        { label: 'ขวด / กระป๋อง', value: 'bottle', type: 'count', defaultWeightKg: 0.5 },
        { label: 'แพ็ค / โหล', value: 'pack', type: 'count', defaultWeightKg: 1.5 },
    ];
    const [selectedUnit, setSelectedUnit] = useState('kg');
    const [inputQuantity, setInputQuantity] = useState(formData.unitWeightKg || '');

    const calculateKgValue = (qty, unitValue) => {
        if (!qty || isNaN(qty) || qty <= 0) return 0;
        const unitInfo = UNIT_OPTIONS.find(u => u.value === unitValue);
        if (!unitInfo) return parseFloat(qty);

        if (unitInfo.type === 'weight' || unitInfo.type === 'volume') {
            return parseFloat(qty) * unitInfo.factor;
        } else if (unitInfo.type === 'count') {
            return parseFloat(qty) * unitInfo.defaultWeightKg;
        }
        return parseFloat(qty);
    };

    const handleQuantityChange = (e) => {
        const val = e.target.value;
        setInputQuantity(val);
        const calculatedKg = calculateKgValue(val, selectedUnit);
        handleChange({ target: { name: 'unitWeightKg', value: calculatedKg } });
    };

    const handleUnitSelectChange = (e) => {
        const newUnit = e.target.value;
        setSelectedUnit(newUnit);
        const calculatedKg = calculateKgValue(inputQuantity, newUnit);
        handleChange({ target: { name: 'unitWeightKg', value: calculatedKg } });
    };

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

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: "AIzaSyCnukRCzb4dVhy8beM7oLM0AUyf_8kuEm0"
    });

    const handleMapClick = (e) => {
        setFormData((prev) => ({
            ...prev,
            latitude: e.latLng.lat(),
            longitude: e.latLng.lng(),
        }));
        setErrors((prev) => ({ ...prev, location: "" }));
    };

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
                (error) => {
                    setPopup({
                        show: true,
                        title: "ไม่สามารถเข้าถึงตำแหน่งได้",
                        message: "กรุณาเปิดสิทธิ์การใช้งานตำแหน่งในเบราว์เซอร์ของคุณ",
                        type: "success",
                        onConfirm: closePopup
                    });
                },
                { enableHighAccuracy: true }
            );
        }
    };

    const currentPos = {
        lat: Number(formData.latitude) || 18.7883,
        lng: Number(formData.longitude) || 98.9853
    };

    // ฟังก์ชันจัดการการลบรายการอาหาร (DELETE)
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
                        showAutoPopup("ลบรายการสำเร็จ", "รายการอาหารของคุณถูกลบเรียบร้อยแล้ว", () => navigate("/my-foods"));
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
                    alert("กรุณากรอกรหัสตัวเลข 6 หลักให้ถูกต้อง");
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
                            showAutoPopup("ส่งมอบสำเร็จ!", "ระบบบันทึกประวัติการส่งมอบเรียบร้อยแล้ว");
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

        if (isEditable) {
            return (
                <button type="submit" style={styles.submitBtn}>
                    บันทึกการแก้ไข
                </button>
            );
        }

        if (!isExpired) {
            return (
                <>
                    <button type="button" onClick={() => handleDeleteFood(formData.id)} style={styles.deleteBtn}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                        ลบรายการ
                    </button>
                    <button type="button" onClick={(e) => { e.preventDefault(); setIsEditable(true); }} style={styles.editBtn}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                        แก้ไขรายการ
                    </button>
                </>
            );
        }
    };

    const handleNextStep = () => {
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
            if (!formData.expiryDate) newErrors.expiryDate = "กรุณากรอกข้อมูล";
            if (!formData.unitWeightKg) newErrors.unitWeightKg = "กรุณากรอกข้อมูล";
            if (!formData.totalUnit) newErrors.totalUnit = "กรุณากรอกข้อมูล";
            if (!formData.limitPerPerson) newErrors.limitPerPerson = "กรุณากรอกข้อมูล";
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

    // ฟังก์ชันจัดการบันทึกข้อมูล (CREATE / UPDATE)
    const handleSubmit = (e) => {
        e.preventDefault();
        const token = localStorage.getItem("accessToken");

        const newErrors = {};
        if (!formData.address) newErrors.address = "กรุณากรอกข้อมูล";
        if (!formData.pickupDateStart) newErrors.pickupDateStart = "กรุณากรอกข้อมูล";
        if (!formData.pickupDateEnd) newErrors.pickupDateEnd = "กรุณากรอกข้อมูล";
        if (!formData.pickupStartTime) newErrors.pickupStartTime = "กรุณากรอกข้อมูล";
        if (!formData.pickupEndTime) newErrors.pickupEndTime = "กรุณากรอกข้อมูล";
        if (!formData.latitude || !formData.longitude) newErrors.location = "กรุณาเลือกพิกัดตำแหน่งบนแผนที่";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const data = new FormData();
        if (imageFile) data.append("fileImage", imageFile);

        data.append("foodName", formData.foodName);
        data.append("description", formData.description);
        data.append("expiryDate", formData.expiryDate);
        data.append("unitWeightKg", Number.parseFloat(formData.unitWeightKg));
        data.append("totalUnit", Number.parseInt(formData.totalUnit, 10));
        data.append("address", formData.address);
        data.append("pickupDateStart", formData.pickupDateStart);
        data.append("pickupDateEnd", formData.pickupDateEnd);
        data.append("pickupStartTime", formData.pickupStartTime);
        data.append("pickupEndTime", formData.pickupEndTime);
        data.append("limitPerPerson", Number.parseInt(formData.limitPerPerson, 10));
        data.append("latitude", Number.parseFloat(formData.latitude));
        data.append("longitude", Number.parseFloat(formData.longitude));
        data.append("foodCateId", Number.parseInt(formData.foodCateId, 10));
        data.append("foodStatus", formData.foodStatus);

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
                    showAutoPopup(successTitle, "ระบบได้บันทึกข้อมูลรายการอาหารของคุณเรียบร้อยแล้ว", () => navigate("/my-foods"));
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

    if (loading || !isLoaded) return <div style={styles.loading}>กำลังโหลด...</div>;

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
                        ร่วมแบ่งปันอาหาร
                    </div>
                    <h1 style={styles.mainTitle}>แบ่งปันอาหารส่วนเกินของคุณ</h1>
                    <p style={styles.mainSubtitle}>ร่วมมือกันลดขยะอาหารและส่งต่อให้ผู้ที่ต้องการ ทุกการแบ่งปันมีความหมาย!</p>
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

                    {isEditMode && !isExpired && (
                        <div style={styles.topStatusRow}>
                            {formData.foodStatus !== 'closed' && (
                                <button type="button" style={styles.confirmDeliveryBtn} onClick={handleConfirmDelivery}>
                                    <span className="material-symbols-outlined">check_circle</span>
                                    ยืนยันการส่งมอบอาหาร
                                </button>
                            )}
                            <div style={styles.statusSelectGroup}>
                                <label style={styles.statusLabel}>สถานะ:</label>
                                <select
                                    name="foodStatus"
                                    value={formData.foodStatus || "available"}
                                    onChange={handleChange}
                                    disabled={!isEditable}
                                    style={{
                                        ...styles.inputField,
                                        backgroundColor: isEditable ? "#FFFFFF" : "#F8FAFC",
                                        cursor: isEditable ? "pointer" : "not-allowed",
                                        width: "160px"
                                    }}
                                >
                                    <option value="available">เปิดรับบริจาค</option>
                                    <option value="closed">ปิดรับบริจาค</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Stage 1: รูปภาพอาหาร */}
                    {currentStep === 1 && (
                        <div style={styles.cardSection}>
                            <h3 style={styles.cardSectionTitle}>
                                รูปภาพอาหาร <span style={styles.requiredStar}>*</span>
                            </h3>
                            {renderFoodImage()}
                        </div>
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
                                            backgroundColor: errors.foodName ? "#FEF2F2" : "#F8FAFC"
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
                                            backgroundColor: errors.foodCateId ? "#FEF2F2" : "#F8FAFC"
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
                                    style={{ ...styles.inputField, height: "80px", resize: "vertical" }}
                                    onChange={handleChange}
                                />
                            </div>

                            <div style={styles.row}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>วันหมดอายุ <span style={styles.requiredStar}>*</span></label>
                                    <input
                                        type="datetime-local"
                                        name="expiryDate"
                                        value={formData.expiryDate}
                                        disabled={isEditMode}
                                        style={{
                                            ...styles.inputField,
                                            borderColor: errors.expiryDate ? "#EF4444" : "#E2E8F0",
                                            backgroundColor: errors.expiryDate ? "#FEF2F2" : "#F8FAFC"
                                        }}
                                        onChange={handleChange}
                                    />
                                    {errors.expiryDate && <span style={styles.errorText}>{errors.expiryDate}</span>}
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>น้ำหนัก/ปริมาณต่อหน่วย <span style={styles.requiredStar}>*</span></label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="number"
                                            value={inputQuantity}
                                            placeholder="จำนวน"
                                            disabled={!isEditable}
                                            style={{
                                                ...styles.inputField,
                                                flex: 1,
                                                borderColor: errors.unitWeightKg ? "#EF4444" : "#E2E8F0",
                                                backgroundColor: errors.unitWeightKg ? "#FEF2F2" : "#F8FAFC"
                                            }}
                                            onChange={handleQuantityChange}
                                        />
                                        <select
                                            value={selectedUnit}
                                            onChange={handleUnitSelectChange}
                                            disabled={!isEditable}
                                            style={{ ...styles.inputField, width: "110px", flexShrink: 0 }}
                                        >
                                            {UNIT_OPTIONS.map((u) => (
                                                <option key={u.value} value={u.value}>{u.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.unitWeightKg && <span style={styles.errorText}>{errors.unitWeightKg}</span>}
                                </div>
                            </div>

                            <div style={styles.row}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>จำนวนชุดที่บริจาคทั้งหมด <span style={styles.requiredStar}>*</span></label>
                                    <input
                                        type="number"
                                        name="totalUnit"
                                        value={formData.totalUnit}
                                        placeholder="เช่น 10"
                                        disabled={!isEditable}
                                        style={{
                                            ...styles.inputField,
                                            borderColor: errors.totalUnit ? "#EF4444" : "#E2E8F0",
                                            backgroundColor: errors.totalUnit ? "#FEF2F2" : "#F8FAFC"
                                        }}
                                        onChange={handleChange}
                                    />
                                    {errors.totalUnit && <span style={styles.errorText}>{errors.totalUnit}</span>}
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>จำนวนจำกัดต่อคน <span style={styles.requiredStar}>*</span></label>
                                    <input
                                        type="number"
                                        name="limitPerPerson"
                                        value={formData.limitPerPerson}
                                        placeholder="เช่น 2"
                                        disabled={!isEditable}
                                        style={{
                                            ...styles.inputField,
                                            borderColor: errors.limitPerPerson ? "#EF4444" : "#E2E8F0",
                                            backgroundColor: errors.limitPerPerson ? "#FEF2F2" : "#F8FAFC"
                                        }}
                                        onChange={handleChange}
                                    />
                                    {errors.limitPerPerson && <span style={styles.errorText}>{errors.limitPerPerson}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stage 3: สถานที่และเวลารับอาหาร */}
                    {currentStep === 3 && (
                        <div style={styles.cardSection}>
                            <h3 style={styles.cardSectionTitle}>สถานที่และเวลารับอาหาร</h3>

                            <div style={styles.inputGroupFull}>
                                <label style={styles.label}>สถานที่รับอาหาร <span style={styles.requiredStar}>*</span></label>
                                <input
                                    name="address"
                                    value={formData.address}
                                    placeholder="ระบุสถานที่นัดรับ หรือที่อยู่"
                                    disabled={!isEditable}
                                    style={{
                                        ...styles.inputField,
                                        borderColor: errors.address ? "#EF4444" : "#E2E8F0",
                                        backgroundColor: errors.address ? "#FEF2F2" : "#F8FAFC"
                                    }}
                                    onChange={handleChange}
                                />
                                {errors.address && <span style={styles.errorText}>{errors.address}</span>}
                            </div>

                            <div style={styles.row}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>วันที่เริ่มรับได้ <span style={styles.requiredStar}>*</span></label>
                                    <input
                                        type="date"
                                        name="pickupDateStart"
                                        value={formData.pickupDateStart}
                                        disabled={!isEditable}
                                        style={{
                                            ...styles.inputField,
                                            borderColor: errors.pickupDateStart ? "#EF4444" : "#E2E8F0",
                                            backgroundColor: errors.pickupDateStart ? "#FEF2F2" : "#F8FAFC"
                                        }}
                                        onChange={handleChange}
                                    />
                                    {errors.pickupDateStart && <span style={styles.errorText}>{errors.pickupDateStart}</span>}
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>วันที่สิ้นสุดการรับ <span style={styles.requiredStar}>*</span></label>
                                    <input
                                        type="date"
                                        name="pickupDateEnd"
                                        value={formData.pickupDateEnd}
                                        disabled={!isEditable}
                                        style={{
                                            ...styles.inputField,
                                            borderColor: errors.pickupDateEnd ? "#EF4444" : "#E2E8F0",
                                            backgroundColor: errors.pickupDateEnd ? "#FEF2F2" : "#F8FAFC"
                                        }}
                                        onChange={handleChange}
                                    />
                                    {errors.pickupDateEnd && <span style={styles.errorText}>{errors.pickupDateEnd}</span>}
                                </div>
                            </div>

                            <div style={styles.row}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>เวลาเริ่มรับ <span style={styles.requiredStar}>*</span></label>
                                    <input
                                        type="time"
                                        name="pickupStartTime"
                                        value={formData.pickupStartTime}
                                        disabled={!isEditable}
                                        style={{
                                            ...styles.inputField,
                                            borderColor: errors.pickupStartTime ? "#EF4444" : "#E2E8F0",
                                            backgroundColor: errors.pickupStartTime ? "#FEF2F2" : "#F8FAFC"
                                        }}
                                        onChange={handleChange}
                                    />
                                    {errors.pickupStartTime && <span style={styles.errorText}>{errors.pickupStartTime}</span>}
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>เวลาสิ้นสุดรับ <span style={styles.requiredStar}>*</span></label>
                                    <input
                                        type="time"
                                        name="pickupEndTime"
                                        value={formData.pickupEndTime}
                                        disabled={!isEditable}
                                        style={{
                                            ...styles.inputField,
                                            borderColor: errors.pickupEndTime ? "#EF4444" : "#E2E8F0",
                                            backgroundColor: errors.pickupEndTime ? "#FEF2F2" : "#F8FAFC"
                                        }}
                                        onChange={handleChange}
                                    />
                                    {errors.pickupEndTime && <span style={styles.errorText}>{errors.pickupEndTime}</span>}
                                </div>
                            </div>

                            <div style={styles.mapContainer}>
                                <GoogleMap
                                    mapContainerStyle={styles.mapCanvas}
                                    center={currentPos}
                                    zoom={17}
                                    onClick={isEditable ? handleMapClick : null}
                                >
                                    <Marker
                                        position={currentPos}
                                        draggable={isEditable}
                                        onDragEnd={(e) => {
                                            if (!isEditable) return;
                                            setFormData((prev) => ({
                                                ...prev,
                                                latitude: e.latLng.lat(),
                                                longitude: e.latLng.lng(),
                                            }));
                                        }}
                                    />
                                </GoogleMap>

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
                            {errors.location && <span style={styles.errorText}>{errors.location}</span>}
                        </div>
                    )}

                    {/* ปุ่มควบคุมสเต็ป */}
                    <div style={styles.buttonGroup}>
                        {currentStep > 1 ? (
                            <button type="button" style={styles.cancelBtn} onClick={handlePrevStep}>
                                ย้อนกลับ
                            </button>
                        ) : (
                            <div />
                        )}

                        {currentStep < 3 ? (
                            <button type="button" style={styles.submitBtn} onClick={handleNextStep}>
                                ถัดไป
                            </button>
                        ) : (
                            renderActionButtons()
                        )}
                    </div>
                </form>
            </div>

            {/* Custom Modal Popup */}
            {popup.show && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        <div style={styles.modalHeader}>
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
                                />
                            )}
                        </div>
                        {(popup.type === "confirm" || popup.type === "input") && (
                            <div style={styles.modalFooter}>
                                <button style={styles.modalCancelBtn} onClick={closePopup}>ยกเลิก</button>
                                <button 
                                    style={styles.modalConfirmBtn} 
                                    onClick={() => {
                                        if (popup.type === "input") {
                                            const val = document.getElementById("modalInputCode").value;
                                            popup.onConfirm(val);
                                        } else {
                                            popup.onConfirm();
                                        }
                                    }}
                                >
                                    ยืนยัน
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
    topStatusRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "12px",
    },
    statusSelectGroup: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginLeft: "auto",
    },
    statusLabel: {
        fontSize: "14px",
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
        color: "#1E293B",
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
        border: "1.5px solid #E2E8F0",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "13px",
        fontWeight: "600",
        color: "#475569",
    },
    buttonGroup: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "24px",
    },
    cancelBtn: {
        padding: "10px 24px",
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
        padding: "10px 28px",
        borderRadius: "12px",
        border: "none",
        backgroundColor: "#C084FC",
        color: "#FFFFFF",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    deleteBtn: {
        padding: "10px 24px",
        borderRadius: "12px",
        border: "none",
        backgroundColor: "#EF4444",
        color: "#FFFFFF",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    confirmDeliveryBtn: {
        backgroundColor: "#10B981",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "12px",
        padding: "10px 20px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
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