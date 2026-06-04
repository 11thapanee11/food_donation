import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const [categories, setCategories] = useState([]);
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
    const navigate = useNavigate();

    // // โหลดหมวดหมู่จาก Database
    // useEffect(() => {
    //     fetch("http://localhost:8082/food-categories")
    //         .then(res => {
    //             if (!res.ok) throw new Error("โหลดข้อมูลหมวดหมู่ไม่สำเร็จ");
    //             return res.json();
    //         })
    //         .then(resData => {
    //             if (resData.success) {
    //                 const allOption = { id: 0, name: "ทั้งหมด" };
    //                 setCategories([allOption, ...resData.data]);
    //             } else {
    //                 throw new Error(resData.message || "โหลดข้อมูลหมวดหมู่ไม่สำเร็จ");
    //             }
    //         })
    //         .catch(err => setError(err.message))
    //         .finally(() => setLoading(false));
    // }, []);
    // // useEffect(() => {
    // //     fetch("http://localhost:8082/food-categories")
    // //         .then(res => {
    // //             if (!res.ok) throw new Error("โหลดข้อมูลหมวดหมู่ไม่สำเร็จ");
    // //             return res.json();
    // //         })
    // //         .then(data => {
    // //             const allOption = { id: 0, name: "ทั้งหมด" };
    // //             setCategories([allOption, ...data]);
    // //         })
    // //         .catch(err => setError(err.message))
    // //         .finally(() => setLoading(false));
    // // }, []);

    // // โหลดอาหารตามหมวดหมู่ที่เลือก
    // useEffect(() => {
    //     const token = localStorage.getItem("accessToken");

    //     let url = "http://localhost:8082/foods";
    //     if (selectedCategory !== "ทั้งหมด") {
    //         const category = categories.find(c => c.name === selectedCategory);
    //         if (category) {
    //             url = `http://localhost:8082/foods/category/${category.id}`;
    //         }
    //     }

    //     fetch(url, {
    //         method: "GET",
    //         headers: {
    //             "Authorization": token ? `Bearer ${token}` : "",
    //             "Content-Type": "application/json"
    //         }
    //     })
    //         .then(res => {
    //             if (!res.ok) throw new Error("โหลดข้อมูลอาหารไม่สำเร็จ");
    //             return res.json();
    //         })
    //         .then(resData => {
    //             if (resData.success) {
    //                 setFoods(resData.data);
    //             } else {
    //                 throw new Error(resData.message || "โหลดข้อมูลอาหารไม่สำเร็จ");
    //             }
    //         })
    //         .catch(err => setError(err.message));
    // }, [selectedCategory, categories]);
    // useEffect(() => {
    //     const token = localStorage.getItem("accessToken");

    //     let url = "http://localhost:8082/foods";
    //     if (selectedCategory !== "ทั้งหมด") {
    //         const category = categories.find(c => c.name === selectedCategory);
    //         if (category) {
    //             url = `http://localhost:8082/foods/category/${category.id}`;
    //         }
    //     }

    //     fetch(url, {
    //         method: "GET",
    //         headers: {
    //             "Authorization": token ? `Bearer ${token}` : "", // ถ้ามี Token ให้แปะไปด้วย ถ้าไม่มีส่งว่าง (สิทธิ์คนนอก)
    //             "Content-Type": "application/json"
    //         }
    //     })
    //         .then(res => {
    //             if (!res.ok) throw new Error("โหลดข้อมูลอาหารไม่สำเร็จ");
    //             return res.json();
    //         })
    //         .then(data => setFoods(data))
    //         .catch(err => setError(err.message));
    // }, [selectedCategory, categories]);

    const BASE_URL = "http://localhost:8082";

    // 1. โหลดหมวดหมู่จาก Database (ทำงานครั้งเดียวตอนเปิดหน้าเว็บ)
    useEffect(() => {
        fetch(`${BASE_URL}/food-categories`)
            .then(res => {
                if (!res.ok) throw new Error("โหลดข้อมูลหมวดหมู่ไม่สำเร็จ");
                return res.json();
            })
            .then(resData => {
                if (resData.success) {
                    const allOption = { id: 0, name: "ทั้งหมด" };
                    setCategories([allOption, ...resData.data]);
                } else {
                    throw new Error(resData.message || "โหลดข้อมูลหมวดหมู่ไม่สำเร็จ");
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    // 2. โหลดอาหารตามหมวดหมู่ที่เลือก
    useEffect(() => {
        // ดักจับ: ถ้า categories ยังโหลดไม่เสร็จ (มีความยาวแค่ 0) ให้แตกแถวออกไปก่อน ไม่ต้องยิง API
        if (categories.length === 0) return;

        const token = localStorage.getItem("accessToken");
        let url = `${BASE_URL}/foods`;

        if (selectedCategory !== "ทั้งหมด") {
            const category = categories.find(c => c.name === selectedCategory);
            if (category) {
                url = `${BASE_URL}/foods/category/${category.id}`;
            }
        }

        fetch(url, {
            method: "GET",
            headers: {
                "Authorization": token ? `Bearer ${token}` : "",
                "Content-Type": "application/json"
            }
        })
            .then(res => {
                if (!res.ok) throw new Error("โหลดข้อมูลอาหารไม่สำเร็จ");
                return res.json();
            })
            .then(resData => {
                if (resData.success) {
                    setFoods(resData.data);
                } else {
                    throw new Error(resData.message || "โหลดข้อมูลอาหารไม่สำเร็จ");
                }
            })
            .catch(err => setError(err.message));
            
    }, [selectedCategory, categories]);

    const filteredFoods = foods.filter(f =>
        f.foodName.toLowerCase().includes(search.toLowerCase())
    );

    // const showDetail = (food) => {
    //     Swal.fire({
    //         title: food.foodName,
    //         html: `
    //             <div style="text-align:left;">
    //                 <img src="${food.foodImage}" style="width:100%; border-radius:15px; margin-bottom:15px" />
    //                 <p style="color:#4A7C72"><b>รายละเอียด:</b> ${food.description ?? "-"}</p>
    //                 <p><b>วันหมดอายุ:</b> ${food.expiryDate}</p>
    //                 <p><b>คงเหลือ:</b> ${food.remainingUnit} หน่วย</p>
    //             </div>
    //         `,
    //         confirmButtonText: "ปิด",
    //         confirmButtonColor: "#F97316",
    //         customClass: {
    //             popup: 'my-swal-font' // คุณสามารถไปตั้งค่าฟอนต์ใน index.css ให้คลาสนี้ได้
    //         }
    //     });
    // };

    if (loading) return <div style={styles.loading}>กำลังโหลด...</div>;
    if (error) return <div style={styles.error}>เกิดข้อผิดพลาด: {error}</div>;

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);

        // 1. แยกส่วนวันที่ (เช่น 25 มีนาคม 2569)
        const formattedDate = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
            day: 'numeric',      // ใช้ 'numeric' จะตัดเลข 0 นำหน้าออก เช่น "25" หรือ "5" (ดูเป็นธรรมชาติกว่า)
            month: 'long',
            year: 'numeric'
        }).format(date);

        // 2. แยกส่วนเวลา (เช่น 16:43)
        const formattedTime = new Intl.DateTimeFormat('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false        // ใช้รูปแบบ 24 ชั่วโมง (00:00 - 23:59)
        }).format(date);

        // 3. นำมาร้อยเรียงเข้าด้วยกันพร้อมใส่คำว่า "เวลา" และ "น."
        return `${formattedDate} ${formattedTime} น.`;
    };

    return (
        <div style={styles.pageBackground}>
            <div style={styles.container}>
                <h1 style={styles.mainTitle}>รายการอาหารบริจาค</h1>

                {/* Search Bar */}
                <div style={styles.searchWrapper}>
                    <i className="material-icons-outlined" style={styles.searchIcon}>search</i>
                    <input
                        type="text"
                        placeholder="ค้นหารายการอาหารบริจาค"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>

                {/* Category Buttons */}
                <div style={styles.categoryContainer}>
                    {categories.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedCategory(c.name)}
                            style={{
                                ...styles.categoryBtn,
                                ...(selectedCategory === c.name ? styles.categoryBtnActive : {})
                            }}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>

                {/* Food Grid */}
                <div style={styles.foodGrid}>
                    {filteredFoods.length > 0 ? (
                        filteredFoods.map(food => (
                            <div key={food.foodId} style={styles.foodCard}>
                                <img
                                    src={`${BASE_URL}${food.foodImage}`}
                                    alt={food.foodName}
                                    style={styles.cardImage}
                                    // แถม: ดักจับกรณีถ้ารูปภาพต้นทางเสียหาย ให้สลับมาแสดงรูปภาพ Default แทน
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://placehold.co/600x400?text=No+Image";
                                    }}
                                />
                                <div style={styles.cardContent}>
                                    <h3 style={styles.foodNameText}>{food.foodName}</h3>
                                    <div style={styles.infoLine}>
                                        <span className="material-symbols-outlined" style={{ color: "#ff8c00" }}>
                                            calendar_clock
                                        </span>
                                        <span>
                                            <span style={{ color: "black", fontSize: "15px" }}>หมดอายุ : </span>
                                            <span style={{ color: "#328d7d", fontSize: "15px" }}>{formatDate(food.expiryDate)}</span>
                                        </span>
                                    </div>
                                    <div style={styles.infoLine}>
                                        <span className="material-symbols-outlined" style={{ color: "#ff8c00" }}>
                                            package_2
                                        </span>
                                        <span style={{ color: "black", fontSize: "15px" }}>จำนวนที่บริจาค และ คงเหลือ : </span>
                                        <span style={{ color: "#328d7d", fontSize: "15px" }}>{food.totalUnit} / {food.remainingUnit}</span>
                                    </div>
                                    <div style={styles.infoLine}>
                                        <span className="material-symbols-outlined" style={{ color: "#ff8c00" }}>
                                            hand_package
                                        </span>
                                        <span style={{ color: "black", fontSize: "15px" }}>จำนวนจำกัดต่อคน : </span>
                                        <span style={{ color: "#328d7d", fontSize: "15px" }}>{food.limitPerPerson}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // window.scrollTo({
                                            //     top: 0,
                                            //     // behavior: "smooth"
                                            // });
                                            navigate('/food-detail', { state: { id: food.foodId, fromPage: '/' } });
                                        }}
                                        style={styles.detailBtn}
                                    >
                                        ดูรายละเอียด
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={styles.noData}>ไม่พบผลลัพธ์ที่ตรงกับเงื่อนไขการค้นหา</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Styles ประกาศเป็น Constant ---
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
        marginBottom: "20px"
    },
    searchWrapper: {
        position: "relative",
        marginBottom: "30px"
    },
    searchIcon: {
        position: "absolute",
        left: "20px",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "20px",
        opacity: 0.5
    },
    searchInput: {
        width: "60%",
        padding: "14px 30px 14px 55px",
        borderRadius: "50px",
        border: "none",
        backgroundColor: "#ffe8cc",
        fontSize: "16px",
        color: "#4A7C72",
        outline: "none",
        boxSizing: "border-box",
    },
    categoryContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "40px"
    },
    categoryBtn: {
        padding: "8px 22px",
        borderRadius: "10px",
        border: "2px solid #328d7d",
        backgroundColor: "#fffcf8",
        color: "#328d7d",
        cursor: "pointer",
        fontSize: "15px",
        outline: "none",
    },
    categoryBtnActive: {
        backgroundColor: "#ff8c00",
        borderColor: "#ff8c00",
        color: "#fff",
    },
    foodGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "30px"
    },
    foodCard: {
        backgroundColor: "#fff",
        borderRadius: "30px",
        overflow: "hidden",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
        border: "1px solid #FFF2E2"
    },
    cardImage: {
        width: "100%",
        height: "220px",
        objectFit: "cover",
        display: "block",
        verticalAlign: "bottom",
    },
    cardContent: {
        padding: "20px",
        backgroundColor: "#ffe8cc"
        // backgroundColor: "#fff2e2"
    },
    foodNameText: {
        color: "#328d7d",
        fontSize: "18px",
        fontWeight: "bold",
        marginBottom: "12px",
        marginTop: "5px"
    },
    infoLine: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: "#4B5563",
        fontSize: "14px",
        marginBottom: "10px"
    },
    detailBtn: {
        width: "100%",
        marginTop: "8px",
        padding: "0px",
        border: "none",
        background: "transparent",
        color: "#ff8c00",
        fontWeight: "500",
        cursor: "pointer",
        fontSize: "18px",
    },
    loading: {
        textAlign: "center",
        padding: "100px",
        color: "#ff8c00",
        fontSize: "20px"
    },
    error: {
        textAlign: "center",
        padding: "100px",
        color: "red"
    },
    noData: {
        textAlign: "center",
        color: "#9CA3AF",
        gridColumn: "1 / -1",
        padding: "50px"
    }
};