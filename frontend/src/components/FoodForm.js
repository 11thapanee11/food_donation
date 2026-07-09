/* global globalThis */
import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
// import { useParams } from "react-router-dom";

export default function FoodForm() {
    // const token = localStorage.getItem("accessToken");

    const navigate = useNavigate();

    const location = useLocation();
    const foodId = location.state?.id;

    // const { id } = useParams(); // ดึง id จาก URL (ถ้ามาจากการกด Edit จะมี id ติดมา)
    const isEditMode = Boolean(foodId); // ถ้ามี id แปลว่าเป็นโหมดแก้ไข (true) ถ้าไม่มีแปลว่าสร้างใหม่ (false)
    const [isEditable, setIsEditable] = useState(!isEditMode);

    const [formData, setFormData] = useState({
        fileImage: null,
        foodName: "",
        description: "",
        expiryDate: "",
        unitWeightKg: "",
        totalUnit: "",
        remainingUnit: "",
        peopleCountPerMeal: "",
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

    // ฟังก์ชันจัดการการเปลี่ยนแปลงค่าใน Input
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "expiryDate" && value) {

            // นำค่าวันที่หมดอายุที่เลือกมาสร้างเป็นอ็อบเจกต์ Date
            const expiryDateObj = new Date(value);

            // ลบออก 4 ชั่วโมงตามที่วางแผนไว้
            expiryDateObj.setHours(expiryDateObj.getHours() - 4);

            // จัดฟอร์แมต วันที่ (ให้กลายเป็น YYYY-MM-DD)
            const year = expiryDateObj.getFullYear();
            const month = String(expiryDateObj.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มจาก 0 เลยต้อง +1
            const date = String(expiryDateObj.getDate()).padStart(2, '0');
            const endDateFormatted = `${year}-${month}-${date}`; // ได้ฟอร์แมต "2026-07-05" ที่อินพุตต้องการพอดี

            // จัดฟอร์แมต เวลา (ให้กลายเป็น HH:mm)
            const hours = String(expiryDateObj.getHours()).padStart(2, '0');
            const minutes = String(expiryDateObj.getMinutes()).padStart(2, '0');
            const endTimeFormatted = `${hours}:${minutes}`; // ได้ฟอร์แมต "11:12"

            // อัปเดตลงสเตตพร้อมกัน
            setFormData((prev) => ({
                ...prev,
                expiryDate: value,
                pickupDateEnd: endDateFormatted,
                pickupEndTime: endTimeFormatted
            }));

        } else {
            // ถ้าเป็นฟิลด์อื่นๆ (ชื่ออาหาร, จำนวน ฯลฯ) ให้ทำงานตามปกติของคุณ
            setFormData((prev) => ({
                ...prev,
                [name]: value
            }));
        }
        // setFormData({ ...formData, [name]: value });
        // setErrors({ ...errors, [name]: "" }); // เคลียร์ error เมื่อมีการกรอก
    };

    // ฟังก์ชันจัดการรูปภาพ
    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // setFormData({ ...formData, foodImage: file });
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
    const [fetchError, setFetchError] = useState("");

    const loadFoodData = () => {
        if (isEditMode) {
            fetch(`http://localhost:8082/foods/${foodId}`)
                .then(res => {
                    if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลอาหารรายการนี้ได้");
                    return res.json();
                })
                .then(resData => {
                    if (resData.success) {
                        console.log("=== ข้อมูลอาหารจาก API ===", resData.data);

                        // แงะข้อมูลก้อนวัตถุอาหารออกมาจาก resData.data
                        const foodInfo = resData.data;

                        console.log("เช็คข้อมูลอาหาร (foodInfo):", foodInfo);

                        setFormData({
                            ...foodInfo, // กระจายข้อมูลอาหารเดิมลงฟอร์ม
                            // ดึง ID หมวดหมู่เดิมออกมากดเลือกให้ตรงกับ Select Dropdown ในหน้าเว็บ
                            foodCateId: foodInfo.foodCateId,
                            fileImage: foodInfo.foodImage
                            // foodCateId: foodInfo.foodCateId ?? foodInfo.foodCategory?.id ?? ""
                        });

                    } else {
                        setFetchError(resData.message || "ไม่พบข้อมูลอาหารรายการนี้");
                    }
                })
                .catch(err => {
                    console.error("Error fetching single food details:", err);
                });
        }
    }

    const isExpired = formData.foodStatus === 'expired' || formData.foodStatus === 'disable';

    useEffect(() => {
        // ดึงข้อมูลหมวดหมู่มาใส่ใน Dropdown Select
        fetch("http://localhost:8082/food-categories", {
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(res => {
                if (!res.ok) throw new Error("โหลดข้อมูลหมวดหมู่ไม่สำเร็จ");
                return res.json();
            })
            .then(resData => { // ปรับเป็น resData
                if (resData.success) {
                    // แงะเอา Array ของหมวดหมู่ที่อยู่ใน .data ไปใช้งาน
                    setCategories(resData.data);
                } else {
                    throw new Error(resData.message || "โหลดข้อมูลหมวดหมู่ไม่สำเร็จ");
                }
            })
            .catch(err => {
                setFetchError(err.message);
            })
            .finally(() => setLoading(false));

        // โหมดแก้ไข: ดึงข้อมูลอาหารเดิมมาหยอดใส่ฟอร์ม
        loadFoodData();

    }, [foodId, isEditMode]);

    // map ใหม่
    // const [markerPos, setMarkerPos] = useState({ lat: 18.7883, lng: 98.9853 }); // ค่าเริ่มต้น (เชียงใหม่)

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: "AIzaSyCz2II4Ff_LEqyvP03ls-0qb6-PVZWxw-0"
    });
    // เมื่อคลิกบนแผนที่ → ย้าย marker
    // เมื่อคลิกบนแผนที่ → อัปเดตพิกัดใน formData
    const handleMapClick = (e) => {
        setFormData((prev) => ({
            ...prev,
            latitude: e.latLng.lat(),
            longitude: e.latLng.lng(),
        }));
        setErrors((prev) => ({ ...prev, location: "" }));
    };

    // เมื่อใช้ตำแหน่งปัจจุบัน
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
                    alert("ไม่สามารถเข้าถึงตำแหน่งได้");
                    console.error(error);
                },
                { enableHighAccuracy: true }
            );
        }
    };

    // เตรียมตัวแปร position เพื่อส่งให้ GoogleMap/Marker
    // ป้องกัน error 'bq' โดยการเช็คว่าเป็นตัวเลขหรือไม่
    const currentPos = {
        lat: Number(formData.latitude) || 18.7883,
        lng: Number(formData.longitude) || 98.9853
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // console.log("Check: คลิก Submit แล้ว!");
        console.log("ปุ่ม Submit ถูกกดแล้ว! ข้อมูลปัจจุบัน:", formData);

        // 1. ประกาศดึง token มาสแตนด์บายไว้ใช้กับ header ตอนส่ง fetch ด้านล่างครับ
        const token = localStorage.getItem("accessToken");

        const skipFields = new Set([
            "fileImage",
            "description",
            "peopleCountPerMeal",
            "remainingUnit",
            "donorId",
            "foodStatus",
            "latitude",
            "longitude"
        ]);

        const newErrors = {};
        Object.keys(formData).forEach((key) => {
            if (!skipFields.has(key)) {
                const value = formData[key];

                if (value === "" || value === null || value === undefined) {
                    newErrors[key] = "กรุณากรอกข้อมูล";
                }
                // if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
                //     newErrors[key] = "กรุณาเลือกวันที่/เวลาให้ครบถ้วน";
                // }
                else if (typeof value === "number" && value <= 0 && key !== "remainingUnit") {
                    // ถ้าฟิลด์ตัวเลขอื่นๆ ห้ามเป็น 0 ให้เช็คตรงนี้เพิ่มเติมได้ครับ
                }
                // else {
                //     newErrors[key] = "กรุณากรอกข้อมูล";
                // }
                else if (value instanceof Date) {
                    if (Number.isNaN(value.getTime())) {
                        newErrors[key] = "กรุณาเลือกวันที่/เวลา";
                    }
                }
            }
        });

        if (isEditMode) {
            if (!imagePreview && !imageFile && !formData.fileImage) {
                newErrors.fileImage = "กรุณาเพิ่มรูปภาพ";
            }
        } else if (!imageFile) {
            newErrors.fileImage = "กรุณาเพิ่มรูปภาพ";
        }

        // ตรวจสอบวันที่
        const today = new Date();
        const expiryDate = new Date(formData.expiryDate);
        const pickupStartDate = new Date(formData.pickupDateStart);
        const pickupEndDate = new Date(formData.pickupDateEnd);

        if (expiryDate <= today && !isEditMode) {
            newErrors.expiryDate = "วันหมดอายุต้องเป็นวันที่ในอนาคต";
        }

        if (formData.pickupDateStart && pickupStartDate.toDateString() < today.toDateString()) {
            newErrors.pickupDateStart = "วันที่เริ่มรับต้องไม่ใช่วันที่ในอดีต";
        }

        // วันที่สิ้นสุดต้อง >= วันที่เริ่มรับ
        if (pickupEndDate < pickupStartDate) {
            newErrors.pickupDateEnd = "วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มรับ";
        }

        // วันรับต้องไม่ตรงกับวันหมดอายุ
        if (expiryDate) {
            // if (pickupStartDate.toDateString() === expiryDate.toDateString()) {
            //     newErrors.pickupDateStart = "วันเริ่มรับต้องไม่ตรงกับวันหมดอายุ";
            // }
            if (pickupEndDate > expiryDate) {
                newErrors.pickupDateEnd = "วันสิ้นสุดรับต้องไม่เกินวันหมดอายุ";
            }
            //     // if (pickupEndDate.toDateString() === expiryDate.toDateString()) {
            //     //     newErrors.pickupDateEnd = "วันสิ้นสุดรับต้องไม่ตรงกับวันหมดอายุ";
            //     // }
        }

        // วันหมดอายุจริง
        const expiryDateActual = new Date(formData.expiryDate);

        // วันหมดอายุลบออก 4 ชั่วโมง
        const maxPickupDeadline = new Date(formData.expiryDate);
        maxPickupDeadline.setHours(maxPickupDeadline.getHours() - 4);

        // วันที่สิ้นสุดรับ + เวลาสิ้นสุดรับ
        // (สมมติว่าผู้ใช้กรอก pickupDateEnd เป็น "2026-07-05" และ pickupEndTime เป็น "11:12")
        const currentPickupEndCombined = new Date(`${formData.pickupDateEnd}T${formData.pickupEndTime}`);

        //  ตรวจสอบเงื่อนไขความปลอดภัย
        if (currentPickupEndCombined > expiryDateActual) {
            // เลือกเวลาเกินวันหมดอายุจริงไปแล้ว
            newErrors.pickupEndTime = "เวลาสิ้นสุดการรับ ต้องไม่เกินวันหมดอายุ";
        }
        else if (currentPickupEndCombined > maxPickupDeadline) {
            // ถ้าผู้ใช้พยายามจะขยับเวลาให้รับได้ช้ากว่าเส้นตาย 4 ชั่วโมง จะพ่น Error ทันที
            // newErrors.pickupDateEnd = "เวลาสิ้นสุดการรับ ต้องล่วงหน้าอย่างน้อย 4 ชั่วโมงก่อนวันหมดอายุ";

            // หรือถ้าอยากแยกฟิลด์แสดงเออเร่อตรงเวลาด้วย:
            // newErrors.pickupEndTime = "เวลาสิ้นสุดการรับเกินกำหนด";
            newErrors.pickupEndTime = "เวลาสิ้นสุดการรับ ต้องล่วงหน้าอย่างน้อย 4 ชั่วโมงก่อนวันหมดอายุ";
        }

        if (!formData.latitude || !formData.longitude) {
            newErrors.location = "กรุณาเลือกพิกัดตำแหน่งบนแผนที่";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);

            const firstErrorField = Object.keys(newErrors)[0];
            // console.log("คีย์แรกที่ระบบจะวิ่งไปหาคือ:", firstErrorField);

            // เพิ่ม setTimeout ครอบตรงนี้ เพื่อรอให้ React Render หน้าจอเสร็จก่อน 50ms
            setTimeout(() => {
                // ค้นหาด้วย name attribute
                const errorElement = document.querySelector(`[name="${firstErrorField}"]`);

                if (errorElement) {
                    console.log("เจอ Element แล้ว! กำลังเลื่อนหน้าจอไปที่:", errorElement);
                    errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
                } else {
                    console.error(
                        `หาไม่เจอ! บราวเซอร์มองไม่เห็นแท็กที่มี name="${firstErrorField}" บนหน้าจอ \n`
                    );
                }
            }, 50); // หน่วงเวลาสั้นๆ 50 มิลลิวินาที

            return;
        }

        // ผ่าน validation
        console.log("ส่งข้อมูล:", formData);

        // สร้าง FormData สำหรับส่งไป backend (เนื่องจากมีไฟล์รูปภาพ)
        const data = new FormData();
        if (imageFile) {
            data.append("fileImage", imageFile);
        }



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

        if (formData.peopleCountPerMeal !== "" && formData.peopleCountPerMeal != null) {
            data.append("peopleCountPerMeal", Number.parseInt(formData.peopleCountPerMeal, 10));
        }

        const targetUrl = isEditMode
            ? `http://localhost:8082/foods/${foodId}`
            : "http://localhost:8082/foods";

        const targetMethod = isEditMode ? "PUT" : "POST";

        fetch(targetUrl, {
            method: targetMethod,
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: data
        })
            .then(async (res) => {
                if (!res.ok) {
                    try {
                        const errorData = await res.json();
                        throw new Error(errorData.message || "ไม่สามารถบันทึกข้อมูลได้");
                    }
                    catch (jsonError) {
                        throw new Error(jsonError.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
                    }
                }
                return res.json();
            })
            .then((result) => {
                if (result.success) {
                    console.log("บันทึกสำเร็จ:", result);
                    setErrors({});

                    Swal.fire({
                        title: isEditMode ? "อัปเดตข้อมูลเรียบร้อย!" : "บันทึกข้อมูลเรียบร้อย!",
                        icon: "success",
                        confirmButtonColor: "#2ecc71"
                    }).then(() => {
                        navigate("/my-foods");
                    });
                } else {
                    // ถ้าหลังบ้านประมวลผลแล้วติด Error เงื่อนไข (success: false) ให้ส่งสารไปหา catch
                    throw new Error(result.message || "เกิดข้อผิดพลาดบางประการในการประมวลผลข้อมูล");
                }
            })
            .catch((err) => {
                console.error("ผิดพลาด:", err);
                Swal.fire({
                    title: "เกิดข้อผิดพลาด",
                    text: err.message,
                    icon: "error"
                });
            });
    };

    if (loading || !isLoaded) return <div style={styles.loading}>กำลังโหลด...</div>;

    const renderFoodImage = () => {
        // เคสแรก: มีการเลือกรูปภาพใหม่เข้ามา (โชว์รูป Preview ใหม่ทันที)
        if (imagePreview) {
            return (
                <img
                    src={imagePreview}
                    alt="New Preview"
                    style={styles.previewImg}
                />
            );
        }

        // เคสสอง: ไม่มีรูปใหม่ แต่มีรูปเดิมที่ดึงมาจากฐานข้อมูล (แสดงผลใน View Mode และ Edit Mode)
        if (formData.foodImage) {
            return (
                <img
                    src={`http://localhost:8082${formData.foodImage}`}
                    alt="Food From Database"
                    style={styles.previewImg}
                    onError={(e) => {
                        e.target.onerror = null; // ป้องกัน Loop พังกรณีรูปพังซ้ำซ้อน
                        // เปลี่ยนมาใช้ภาพ SVG สำรองในเครื่องแทนการเรียกเว็บนอกตามที่เราตกลงกันไว้ครับ
                        e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="%23ccc"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>`;
                    }}
                />
            );
        }

        // เคสสุดท้าย: ไม่มีทั้งรูปใหม่และรูปเก่าในฐานข้อมูล (ให้คืนค่าว่างไม่แสดงอะไรเลย)
        return null;
    };

    const handleDeleteFood = async (foodId) => {
        // แสดง confirm ก่อนลบ
        const result = await Swal.fire({
            title: "ยืนยันการลบรายการบริจาค?",
            html: 'คุณแน่ใจหรือไม่ที่จะลบรายการนี้ <br /> ผู้รับไม่สามารถมองเห็นหรือจองรายการนี้ได้อีก <br /> และจะไม่สามารถกู้ข้อมูลคืนได้',
            showCancelButton: true,
            cancelButtonColor: "#a0a0a0",
            confirmButtonColor: "#ff3131",
            cancelButtonText: "ยกเลิก",
            confirmButtonText: "ยืนยันการลบ",
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            try {
                // แสดงป๊อปอัพ Loading รอระหว่างประมวลผลการลบ
                Swal.fire({
                    title: 'กำลังลบข้อมูล...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const response = await fetch(`http://localhost:8082/foods/${foodId}`, {
                    method: "DELETE",
                    headers: {
                        // แก้ไขจุดที่ 1: เปลี่ยนชื่อคีย์จาก "token" เป็น "accessToken" ให้ตรงกับหน้า Login
                        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                        "Content-Type": "application/json"
                    }
                });

                if (!response.ok) {
                    throw new Error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อลบข้อมูลได้");
                }

                const resData = await response.json(); // แกะโครงสร้าง ApiResponse ออกมา

                // แก้ไขจุดที่ 2: ตรวจสอบความสำเร็จผ่านตัวแปร .success จากหลังบ้าน
                if (resData.success) {
                    Swal.fire({
                        title: "ลบสำเร็จ!",
                        text: resData.message || "รายการอาหารถูกลบเรียบร้อยแล้ว",
                        icon: "success",
                        confirmButtonColor: "#2ecc71"
                    }).then(() => {
                        // เคลียร์หน้า หรือพาไปหน้าประวัติอาหารทั้งหมด
                        navigate("/my-foods");
                    });
                } else {
                    // กรณีหลังบ้านมีเงื่อนไขห้ามลบ (เช่น มีคนจองค้างอยู่) ให้โยนข้อความไปที่บล็อก catch
                    throw new Error(resData.message || "ไม่สามารถลบรายการอาหารนี้ได้");
                }

            } catch (err) {
                console.error("Delete Error:", err);
                Swal.fire({
                    title: "เกิดข้อผิดพลาด",
                    text: err.message,
                    icon: "error",
                    confirmButtonColor: "#ff3131"
                });
            }
        }
    };

    const renderActionButtons = () => {
        // เคสแรก: อยู่ในโหมดสร้างรายการอาหารใหม่ (ไม่มี id บน URL)
        if (!foodId) {
            return (
                <>
                    <button type="button" style={styles.cancelBtn}
                        onClick={() => {
                            navigate("/my-foods")
                        }}>
                        ยกเลิก
                    </button>
                    <button type="submit" style={styles.submitBtn}>
                        สร้างรายการอาหาร
                    </button>
                </>
            );
        }

        // เคสสอง: เข้ามาแก้ไขข้อมูล แต่เลือกที่จะเปิดรับข้อมูลแก้ไขแล้ว (Edit Mode - isEditable เป็น true)
        if (isEditable) {
            return (
                <>
                    {/* ปุ่มยกเลิก */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditable(false);
                            loadFoodData();
                            setErrors({});
                        }}
                        style={styles.cancelBtn}
                    >
                        ยกเลิก
                    </button>

                    {/* ปุ่มบันทึก */}
                    <button
                        type="submit"
                        style={styles.submitBtn}
                    >
                        บันทึกรายการอาหาร
                    </button>
                </>
            );
        }

        // เคสสุดท้าย: เข้ามาดูข้อมูลเดิมเฉย ๆ และยังไม่ได้กดแก้ไข (View Mode - isEditable เป็น false)
        if (!isExpired) {
            return (
                <>
                    {/* ปุ่มลบ */}
                    <button
                        type="button"
                        onClick={() => handleDeleteFood(formData.id)}
                        style={{
                            ...styles.cancelBtn,
                            backgroundColor: "#ff3333",
                            color: "#fff",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer"
                        }}
                    >
                        <span className="material-icons-outlined" style={{ fontSize: "18px" }}>delete</span>{" "}
                        ลบรายการอาหาร
                    </button>

                    {/* ปุ่มแก้ไข */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();  // หยุดการทำงานเริ่มต้นของฟอร์ม
                            e.stopPropagation(); // ป้องกันไม่ให้ Event ลอยขึ้นไปหาแท็กฟอร์มด้านบน
                            setIsEditable(true); // เปลี่ยนโหมดอย่างเดียวตามที่ต้องการ
                            window.scrollTo({
                                top: 0,
                                behavior: "smooth" // "smooth" จะเลื่อนแบบสมูทละมุนตา / ถ้าอยากให้วาปไปทันทีให้ใช้ "auto" ครับ
                            });
                        }}
                        style={{
                            ...styles.submitBtn,
                            backgroundColor: "#ff8c00",
                            color: "#fff",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer"
                        }}
                    >
                        <span className="material-icons-outlined" style={{ fontSize: "18px" }}>edit</span>{" "}
                        แก้ไขรายการอาหาร
                    </button>
                </>

            );
        }
    };

    const handleConfirmDelivery = () => {
        const token = localStorage.getItem("accessToken");

        if (!foodId) {
            Swal.fire({
                title: "ไม่พบข้อมูลอาหาร",
                text: "ระบบไม่พบรหัสอาหารรายการนี้ กรุณาตรวจสอบอีกครั้ง",
                icon: "warning",
                confirmButtonColor: "#ff8c00"
            });
            return;
        }

        Swal.fire({
            title: 'ยืนยันการส่งมอบอาหาร',
            text: 'กรุณากรอกรหัส 6 หลักที่ได้รับจากผู้รับ',
            input: 'text',
            inputPlaceholder: 'กรอกรหัส 6 หลักที่นี่...',
            showCancelButton: true,
            confirmButtonColor: '#328d7d',
            cancelButtonColor: '#c2c0c0',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            inputAttributes: {
                maxlength: '6',
                autocapitalize: 'off',
                autocorrect: 'off',
                style: 'text-align: center; font-size: 22px; letter-spacing: 4px; border-radius: 12px; border: 1px solid #ccc; width: 80%; margin: 15px auto;'
            },
            preConfirm: (code) => {
                if (!code) {
                    Swal.showValidationMessage('กรุณากรอกรหัสยืนยันการส่งมอบอาหาร');
                    return false;
                }
                if (code.length !== 6 || isNaN(code)) {
                    Swal.showValidationMessage('รหัสต้องเป็นตัวเลข 6 หลักเท่านั้น');
                    return false;
                }
                return code;
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const verificationCode = result.value;

                Swal.fire({
                    title: 'กำลังตรวจสอบรหัส...',
                    allowOutsideClick: false,
                    didOpen: () => { Swal.showLoading(); }
                });

                fetch(`http://localhost:8082/foods/${foodId}/deliver`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` // ใช้งานตัวแปร token ได้อย่างปลอดภัยแล้ว
                    },
                    body: JSON.stringify({ code: verificationCode })
                })
                    .then(async (res) => {
                        const resData = await res.json().catch(() => ({}));
                        if (!res.ok || resData.success === false) {
                            throw new Error(resData.message || "รหัสยืนยันไม่ถูกต้อง หรือเกิดข้อผิดพลาดในระบบ");
                        }
                        return resData;
                    })
                    .then((resData) => {
                        Swal.fire({
                            title: 'ส่งมอบอาหารสำเร็จ!',
                            text: resData.message || 'ระบบบันทึกประวัติและตรวจสอบรหัสเรียบร้อยแล้ว',
                            icon: 'success',
                            confirmButtonColor: '#2ecc71'
                        }).then(() => {
                            fetch(`http://localhost:8082/foods/${foodId}`)
                                .then(res => res.json())
                                .then(updatedResData => {
                                    if (updatedResData.success) {
                                        const foodInfo = updatedResData.data; // แงะข้อมูลออกมาจาก .data
                                        setFormData({
                                            ...foodInfo,
                                            foodCateId: foodInfo.foodCateId?.foodCateId || ""
                                        });
                                    }
                                })
                                .catch(fetchErr => console.error("Error refreshing food data:", fetchErr));
                        });
                    })
                    .catch((err) => {
                        Swal.fire({
                            title: 'เกิดข้อผิดพลาด',
                            text: err.message,
                            icon: 'error',
                            confirmButtonColor: '#e53935'
                        });
                    });
            }
        });
    };

    console.log("หมวดหมู่ที่ถูกเลือก (formData):", formData.foodCateId);

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <h1 style={styles.mainTitle}>
                    {isEditMode ? "แก้ไขรายการอาหารบริจาค" : "สร้างรายการอาหารบริจาค"}
                </h1>
                {/* <h1 style={styles.mainTitle}>สร้างรายการอาหารบริจาค</h1> */}
                {/* แสดง Dropdown สถานะเฉพาะตอน Edit Mode เท่านั้น ตามภาพต้นแบบ */}

                <form onSubmit={handleSubmit}>

                    {isEditMode && !isExpired && (
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            // justifyContent: "flex-end",
                            alignItems: "flex-end",
                            width: "100%",
                            marginBottom: "10px"
                        }}>
                            {formData.foodStatus !== 'closed' && (
                                <button
                                    type="button"
                                    style={styles.confirmDeliveryBtn}
                                    onClick={handleConfirmDelivery}
                                >
                                    {/* SVG ไอคอนเครื่องหมายถูกวงกลม (ตามรูปภาพเป๊ะๆ) */}
                                    <span className="material-symbols-outlined">
                                        check_circle
                                    </span>{""}
                                    ยืนยันการส่งมอบอาหาร
                                </button>
                            )}

                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px"
                            }}>
                                <p style={{ ...styles.label, margin: 0, whiteSpace: "nowrap", fontSize: "18px", color: "#b4b4b4" }}>สถานะบริจาค :</p>
                                <select
                                    id="foodStatus"
                                    name="foodStatus"
                                    value={formData.foodStatus || "available"}
                                    onChange={handleChange}
                                    // style={{ ...styles.input, width: "160px", marginBottom: 0 }}
                                    disabled={!isEditable}
                                    style={{
                                        ...styles.input, width: "160px", marginBottom: 0, borderRadius: "12px",
                                        backgroundColor: isEditable ? "#fffcf8" : "#fff",
                                        border: isEditable ? "2px solid #00796b" : "2px solid #d9d9d9",
                                        padding: "8px 16px",
                                        color: isEditable ? "#00796b" : "#a6a6a6",
                                        cursor: isEditable ? "pointer" : "not-allowed",
                                    }}
                                >
                                    <option value="available">เปิดให้รับบริจาค</option>
                                    <option value="closed">ปิดให้รับบริจาค</option>
                                </select>
                            </div>
                        </div>
                    )}


                    {/* Section 1: รูปภาพ */}
                    <div style={styles.sectionTitle}>
                        <i className="material-icons-outlined" style={styles.iconHeader}>image</i>
                        <p style={styles.textHeader}>รูปภาพ</p>
                    </div>
                    <div style={styles.imageUploadContainer}>
                        <button
                            type="button"
                            name="fileImage"
                            onClick={handleClickUpload}
                            // style={{
                            //     ...styles.uploadBox,
                            //     background: "none",
                            //     cursor: "pointer",
                            // }}
                            disabled={!isEditable} // ล็อกไม่ให้คลิกเลือกรูปใหม่
                            style={{
                                ...styles.uploadBox,
                                background: "none",
                                cursor: isEditable ? "pointer" : "not-allowed",
                            }}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: "none" }}
                                ref={fileInputRef}
                            />
                            <div style={styles.uploadContent}>
                                <i
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "40px", color: "#ff8c00" }}
                                >
                                    upload
                                </i>
                                <p style={{ color: "#999", margin: "5px 0" }}>เพิ่มรูปภาพ</p>
                            </div>
                        </button>

                        {/* {imagePreview && (
                            <img src={imagePreview} alt="Preview" style={styles.previewImg} />
                        )} */}


                        {renderFoodImage()}

                    </div>
                    {errors.fileImage && (
                        <div style={{ color: "red", marginBottom: "10px" }}>{errors.fileImage}</div>
                    )}

                    {/* Section 2: ข้อมูลอาหาร */}
                    <div style={styles.sectionTitle}>
                        <i className="material-icons-outlined" style={styles.iconHeader}>article</i>
                        <p style={styles.textHeader}> ข้อมูลอาหาร </p>
                    </div>
                    <div style={styles.row}>
                        <div style={styles.inputGroup}>
                            <p style={styles.label}>ชื่ออาหาร</p>
                            <input
                                name="foodName"
                                value={formData.foodName}
                                placeholder="กรอกชื่ออาหาร"
                                disabled={!isEditable} // ล็อกถ้ายังไม่กดปุ่มแก้ไข
                                style={{
                                    ...styles.input,
                                    color: isEditable ? "#000" : "#a6a6a6",
                                    cursor: isEditable ? "text" : "not-allowed"
                                }}
                                onChange={handleChange}
                            />
                            {errors.foodName && <span style={{ color: "red" }}>{errors.foodName}</span>}
                        </div>
                        <div style={styles.inputGroup}>
                            <p style={styles.label}>หมวดหมู่</p>
                            <select
                                name="foodCateId" // เปลี่ยนชื่อให้ตรงกับ state
                                value={String(formData.foodCateId || "")}
                                disabled={!isEditable}
                                style={{
                                    ...styles.input,
                                    color: isEditable ? "#000" : "#a6a6a6",
                                    cursor: isEditable ? "pointer" : "not-allowed"
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
                            {errors.foodCateId && <span style={{ color: "red" }}>{errors.foodCateId}</span>}
                        </div>
                    </div>

                    <div style={styles.inputGroupFull}>
                        <p style={styles.label}>รายละเอียด</p>
                        <textarea
                            name="description"
                            value={formData.description}
                            placeholder="กรอกรายละเอียด"
                            // style={{ ...styles.input, height: "80px", paddingTop: "10px", resize: "none" }}
                            disabled={!isEditable} ฏโ
                            style={{
                                ...styles.input,
                                color: isEditable ? "#000" : "#a6a6a6",
                                cursor: isEditable ? "text" : "not-allowed"
                            }}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={styles.row}>
                        <div style={styles.inputGroup}>
                            <p style={styles.label}>วันหมดอายุ</p>
                            <input
                                type="datetime-local"
                                name="expiryDate"
                                value={formData.expiryDate}
                                disabled={isEditMode}
                                style={{
                                    ...styles.input,
                                    // color: "#a6a6a6",
                                    // cursor: "not-allowed",
                                    color: isEditMode ? "#a6a6a6" : "#000",
                                    cursor: isEditMode ? "not-allowed" : "pointer"
                                }}
                                onChange={handleChange}
                            />
                            {errors.expiryDate && <span style={{ color: "red" }}>{errors.expiryDate}</span>}
                        </div>
                        <div style={styles.inputGroup}>
                            <p style={styles.label}>น้ำหนักต่อหน่วยที่บริจาค (Kg)</p>
                            <input
                                type="number"
                                name="unitWeightKg"
                                value={formData.unitWeightKg}
                                placeholder="กรอกน้ำหนัก"
                                disabled={!isEditable}
                                style={{
                                    ...styles.input,
                                    color: isEditable ? "#000" : "#a6a6a6",
                                    cursor: isEditable ? "text" : "not-allowed"
                                }}
                                // บังคับที่คีย์บอร์ด ถ้าผู้ใช้พยายามพิมพ์เครื่องหมายลบ (-) หรือตัว e ให้ดีดออกทันที
                                onKeyDown={(e) => {
                                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={handleChange}
                            />
                            {errors.unitWeightKg && <span style={{ color: "red" }}>{errors.unitWeightKg}</span>}
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div style={styles.inputGroup}>
                            <p style={styles.label}>จำนวนที่บริจาค</p>
                            <input
                                type="number"
                                name="totalUnit"
                                value={formData.totalUnit}
                                placeholder="กรอกจำนวน"
                                disabled={!isEditable}
                                style={{
                                    ...styles.input,
                                    color: isEditable ? "#000" : "#a6a6a6",
                                    cursor: isEditable ? "text" : "not-allowed"
                                }}
                                min="0"
                                onKeyDown={(e) => {
                                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={handleChange}
                            />
                            {errors.totalUnit && <span style={{ color: "red" }}>{errors.totalUnit}</span>}
                        </div>
                        <div style={styles.inputGroup}>
                            <p style={styles.label}>จำนวนคนที่เหมาะสมต่อมื้อ</p>
                            <input
                                type="number"
                                name="peopleCountPerMeal"
                                value={formData.peopleCountPerMeal}
                                placeholder="กรอกจำนวนคน"
                                disabled={!isEditable}
                                style={{
                                    ...styles.input,
                                    color: isEditable ? "#000" : "#a6a6a6",
                                    cursor: isEditable ? "text" : "not-allowed"
                                }}
                                min="0"
                                onKeyDown={(e) => {
                                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div style={{ ...styles.inputGroup, width: "48%" }}>
                        <p style={styles.label}>จำนวนจำกัดบริจาคต่อคน</p>
                        <input
                            type="number"
                            name="limitPerPerson"
                            value={formData.limitPerPerson}
                            placeholder="กรอกจำนวน"
                            disabled={!isEditable}
                            style={{
                                ...styles.input,
                                color: isEditable ? "#000" : "#a6a6a6",
                                cursor: isEditable ? "text" : "not-allowed"
                            }}
                            min="0"
                            onKeyDown={(e) => {
                                if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                    e.preventDefault();
                                }
                            }}
                            onChange={handleChange}
                        />
                        {errors.limitPerPerson && <span style={{ color: "red" }}>{errors.limitPerPerson}</span>}
                    </div>

                    {/* Section 3: สถานที่และเวลา */}
                    <div style={{ ...styles.sectionTitle, marginTop: "20px" }}>
                        <i className="material-icons-outlined" style={styles.iconHeader}>location_on</i>
                        <p style={styles.textHeader}> สถานที่และเวลารับอาหาร </p>
                    </div>
                    <div style={styles.inputGroupFull}>
                        <p style={styles.label}> สถานที่รับ </p>
                        <input
                            name="address"
                            value={formData.address}
                            placeholder="กรอกสถานที่รับ"
                            disabled={!isEditable}
                            style={{
                                ...styles.input,
                                color: isEditable ? "#000" : "#a6a6a6",
                                cursor: isEditable ? "text" : "not-allowed"
                            }}
                            onChange={handleChange}
                        />
                        {errors.address && <span style={{ color: "red" }}>{errors.address}</span>}
                    </div>

                    <div style={styles.row}>
                        <div style={styles.inputGroup}>
                            <p style={styles.label}>วันที่เริ่มรับได้</p>
                            <input
                                type="date"
                                name="pickupDateStart"
                                value={formData.pickupDateStart}
                                disabled={!isEditable}
                                style={{
                                    ...styles.input,
                                    color: isEditable ? "#000" : "#a6a6a6",
                                    cursor: isEditable ? "pointer" : "not-allowed"
                                }}
                                onChange={handleChange}
                            />
                            {errors.pickupDateStart && <span style={{ color: "red" }}>{errors.pickupDateStart}</span>}
                        </div>
                        <div style={styles.inputGroup}>
                            <p style={styles.label}>วันที่สิ้นสุดการรับ</p>
                            <input
                                type="date"
                                name="pickupDateEnd"
                                value={formData.pickupDateEnd}
                                disabled={!isEditable}
                                style={{
                                    ...styles.input,
                                    color: isEditable ? "#000" : "#a6a6a6",
                                    cursor: isEditable ? "pointer" : "not-allowed"
                                }}
                                onChange={handleChange}
                            />
                            {errors.pickupDateEnd && <span style={{ color: "red" }}>{errors.pickupDateEnd}</span>}
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div style={styles.inputGroup}>
                            <p style={styles.label}>เวลาที่เริ่มรับได้</p>
                            <input
                                type="time"
                                name="pickupStartTime"
                                value={formData.pickupStartTime}
                                disabled={!isEditable}
                                style={{
                                    ...styles.input,
                                    color: isEditable ? "#000" : "#a6a6a6",
                                    cursor: isEditable ? "pointer" : "not-allowed"
                                }}
                                onChange={handleChange}
                            />
                            {errors.pickupStartTime && <span style={{ color: "red" }}>{errors.pickupStartTime}</span>}
                        </div>
                        <div style={styles.inputGroup}>
                            <p style={styles.label}>เวลาสิ้นสุดการรับ</p>
                            <input
                                type="time"
                                name="pickupEndTime"
                                value={formData.pickupEndTime}
                                disabled={!isEditable}
                                style={{
                                    ...styles.input,
                                    color: isEditable ? "#000" : "#a6a6a6",
                                    cursor: isEditable ? "pointer" : "not-allowed"
                                }}
                                onChange={handleChange}
                            />
                            {errors.pickupEndTime && <span style={{ color: "red" }}>{errors.pickupEndTime}</span>}
                        </div>
                    </div>

                    {/* Map Placeholder */}
                    <div style={styles.mapContainer}>
                        {/* ส่วนของ Google Map */}

                        <GoogleMap
                            mapContainerStyle={styles.mapCanvas} // ใช้ style จากเครื่อง
                            center={currentPos}
                            zoom={17}
                            // onClick={handleMapClick}
                            // ห้ามคลิกแผนที่ถ้าไม่ได้อยู่ในโหมดแก้ไข (ถ้า !isEditable ให้ค่าเป็น null)
                            onClick={isEditable ? handleMapClick : null}
                        >
                            <Marker
                                position={currentPos}
                                // draggable={true}
                                // onDragEnd={(e) =>
                                //     setFormData((prev) => ({
                                //         ...prev,
                                //         latitude: e.latLng.lat(),
                                //         longitude: e.latLng.lng(),
                                //     }))
                                // }
                                // ห้ามลากหมุดถ้าไม่ได้อยู่ในโหมดแก้ไข
                                draggable={isEditable}
                                // ห้ามอัปเดตพิกัดจากการลากหมุด
                                onDragEnd={(e) => {
                                    if (!isEditable) return; // ดักจับเผื่อไว้เพื่อความปลอดภัย
                                    setFormData((prev) => ({
                                        ...prev,
                                        latitude: e.latLng.lat(),
                                        longitude: e.latLng.lng(),
                                    }));
                                    setErrors((prev) => ({ ...prev, location: "" }));
                                }}
                            />
                        </GoogleMap>

                        {/* ปุ่มใช้ตำแหน่งปัจจุบัน (ย้ายมาไว้ข้างใน Container เพื่อให้ลอยทับ) */}
                        {isEditable && (
                            <button
                                type="button"
                                style={styles.currentLocationBtn}
                                onClick={handleGetCurrentLocation}
                            >
                                <span className="material-icons-outlined" style={{
                                    fontSize: "20px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    verticalAlign: "middle",
                                    lineHeight: "1",
                                }}>my_location</span>{" "}
                                ใช้ตำแหน่งปัจจุบัน
                            </button>
                        )}

                        {/* ค่าพิกัดแฝงสำหรับส่งฟอร์ม */}
                        <input type="hidden" name="latitude" value={formData.latitude} />
                        <input type="hidden" name="longitude" value={formData.longitude} />
                    </div>

                    {errors.location && (
                        <p style={{
                            color: "red",
                            fontSize: "16px",
                            marginTop: "8px",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                        }}>
                            <span className="material-icons-outlined" style={{ fontSize: "18px", verticalAlign: "middle" }}>
                                error_outline
                            </span>
                            {errors.location}
                        </p>
                    )}

                    {/* Action Buttons */}
                    <div style={styles.buttonGroup}>
                        {renderActionButtons()}
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "20px 20px"
    },
    mainTitle: {
        color: "#328d7d",
        fontSize: "30px",
        fontWeight: "bold",
        marginBottom: "10px"
    },
    sectionTitle: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "0px",
        fontSize: "18px"
    },
    iconHeader: {
        color: "#ff8c00",
    },
    textHeader: {
        fontSize: "18px",
        fontWeight: "500",
        margin: "10px",
    },
    imageUploadContainer: {
        display: "flex",
        gap: "20px",
        marginBottom: "10px"
    },
    uploadBox: {
        width: "180px",
        height: "180px",
        border: "2px dashed #999",
        borderRadius: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        backgroundColor: "none"
    },
    uploadContent: {
        textAlign: "center"
    },
    previewImg: {
        width: "180px",
        height: "180px",
        borderRadius: "20px",
        objectFit: "cover",
    },
    row: {
        display: "flex",
        gap: "20px",
        marginBottom: "0px",
        marginTop: "0px"
    },
    inputGroup: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    },
    inputGroupFull: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    label: {
        fontSize: "16px",
        fontWeight: "400",
        color: "#333",
        marginBottom: "0px"
    },
    input: {
        padding: "12px 18px",
        borderRadius: "15px",
        border: "none",
        backgroundColor: "#FFEEDD",
        fontSize: "15px",
        outline: "none",
        fontFamily: "inherit"
    },
    mapPlaceholder: {
        position: "relative",
        marginTop: "20px",
        borderRadius: "20px",
        overflow: "hidden"
    },
    mapImg: {
        width: "100%",
        height: "250px",
        objectFit: "cover"
    },
    currentLocationBtn: {
        position: "absolute",
        bottom: "20px",
        right: "20px",
        padding: "10px 15px",
        backgroundColor: "#fff",
        border: "none",
        borderRadius: "10px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        cursor: "pointer"
    },
    mapContainer: {
        position: "relative",
        width: "100%",
        marginTop: "15px",
    },
    mapCanvas: {
        width: "100%",
        height: "420px",
        borderRadius: "20px",
        border: "1px solid #ddd",
    },
    // currentLocationBtn: {
    //     position: "absolute",
    //     bottom: "20px",
    //     right: "20px",
    //     padding: "10px 15px",
    //     backgroundColor: "#fff",
    //     border: "none",
    //     borderRadius: "10px",
    //     boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    //     cursor: "pointer",
    //     zIndex: 5,
    //     fontFamily: "inherit"
    // },
    buttonGroup: {
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        marginTop: "40px"
    },
    cancelBtn: {
        padding: "12px 60px",
        borderRadius: "12px",
        border: "2px solid #328d7d",
        backgroundColor: "#fffcf8",
        color: "#328d7d",
        fontSize: "17px",
        cursor: "pointer"
    },
    submitBtn: {
        padding: "12px 60px",
        borderRadius: "15px",
        border: "none",
        backgroundColor: "#ff8c00",
        color: "#fff",
        fontSize: "17px",
        cursor: "pointer"
    },
    loading: {
        textAlign: "center",
        padding: "100px",
        color: "#ff8c00",
        fontSize: "20px"
    },
    // สไตล์ปุ่มยืนยันการส่งมอบอาหารสีส้มสดพร้อมไอคอน
    confirmDeliveryBtn: {
        backgroundColor: "#ff8c00", // สีส้มสดใสพาสเทลตามรูป
        color: "#FFFFFF",           // ตัวอักษรสีขาว
        border: "none",
        borderRadius: "14px",        // ขอบมนกลมสวยงามสไตล์มินิมอล
        padding: "10px 30px",
        fontSize: "17px",
        fontWeight: "500",
        cursor: "pointer",
        display: "flex",            // จัดเรียงไอคอนกับตัวหนังสือขนานกัน
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",                // เว้นระยะห่างระหว่างเครื่องหมายถูกกับข้อความ
        width: "fit-content",        // ขนาดกะทัดรัดพอดีคำตามข้อความ
        marginBottom: "8px"
    },
};