import React from 'react';

// สมมติข้อมูลที่ดึงมาจาก API หลังบ้าน (เรียงลำดับจากมากไปน้อย)
const leaderboardData = [
    { id: 1, name: "น้ำผึ้ง ฮันนี่", totalCo2: 450.0 },
    { id: 2, name: "ดาว เสาร์", totalCo2: 380.2 },
    { id: 3, name: "ถั่ว แดง", totalCo2: 295.8 },
    { id: 4, name: "แกง ส้ม", totalCo2: 150.0 },
    { id: 5, name: "ส้ม ออเรนจ์", totalCo2: 120.4 },
    { id: 6, name: "เพิ่ม พูน", totalCo2: 105.4 },
];

export default function Leaderboard() {
    const top1 = leaderboardData[0];
    const top2 = leaderboardData[1];
    const top3 = leaderboardData[2];
    const remainingUsers = leaderboardData.slice(3);

    return (
        <div style={styles.container}>

            {/* Header ส่วนหัว */}
            <div style={styles.headerTag}>
                <span className="material-symbols-outlined" style={{ color: "#328d7d" }}>
                    military_tech
                </span>
                <span style={{ fontSize: '18px', color: "#328d7d" }}></span> IMPACT LEADERBOARD
            </div>
            <h1 style={styles.mainTitle}>อันดับผู้บริจาค</h1>

            {/* ส่วนที่ 1: โพเดียมอันดับ 1-3 (2 -> 1 -> 3) */}
            <div style={styles.podiumContainer}>

                {/* --- อันดับ 2 --- */}
                {top2 && (
                    <div style={{ ...styles.podiumCard, ...styles.podiumRank2 }}>
                        <div style={{ ...styles.badge, backgroundColor: '#aab4c2' }}>2</div>
                        <div style={styles.podiumContent}>
                            <span className="material-symbols-outlined" style={{ ...styles.podiumEmoji, color: "#9da3ad" }}>
                                social_leaderboard
                            </span>
                            <h2 style={{ ...styles.podiumName }}>{top2.name}</h2>
                        </div>
                        <div style={{ ...styles.podiumResult, color: '#ff8c00', fontSize: '20px', fontWeight: '900' }}>
                            <p style={styles.podiumSubText}>ผลรวมของก๊าซเรือนกระจกที่ช่วยลด</p>
                            <div style={{ marginTop: '4px' }}>
                                {top2.totalCo2.toFixed(1)} <span style={styles.unitText}>kgCO2e</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- อันดับ 1 --- */}
                {top1 && (
                    <div style={{ ...styles.podiumCard, ...styles.podiumRank1 }}>
                        <div style={{ ...styles.badge, backgroundColor: '#f4d13d', width: '36px', height: '36px', marginTop: '-28px' }}>1</div>
                        <div style={styles.podiumContent}>
                            <span className="material-symbols-outlined" style={{ ...styles.podiumEmoji, color: "#ebb512" }}>
                                social_leaderboard
                            </span>
                            <h2 style={{ ...styles.podiumName }}>{top1.name}</h2>
                        </div>
                        <div style={{ ...styles.podiumResult, color: '#ff8c00', fontSize: '20px', fontWeight: '900' }}>
                            <p style={{ ...styles.podiumSubText }}>ผลรวมของก๊าซเรือนกระจกที่ช่วยลด</p>
                            <div style={{ marginTop: '4px' }}>
                                {top1.totalCo2.toFixed(1)} <span style={styles.unitText}>kgCO2e</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- อันดับ 3 --- */}
                {top3 && (
                    <div style={{ ...styles.podiumCard, ...styles.podiumRank3 }}>
                        <div style={{ ...styles.badge, backgroundColor: '#a15b41' }}>3</div>
                        <div style={styles.podiumContent}>
                            <span className="material-symbols-outlined" style={{ ...styles.podiumEmoji, color: "#954b35" }}>
                                social_leaderboard
                            </span>
                            <h2 style={{ ...styles.podiumName }}>{top3.name}</h2>
                        </div>
                        <div style={{ ...styles.podiumResult, color: '#ff8c00', fontSize: '20px', fontWeight: '900' }}>
                            <p style={styles.podiumSubText}>ผลรวมของก๊าซเรือนกระจกที่ช่วยลด</p>
                            <div style={{ marginTop: '4px' }}>
                                {top3.totalCo2.toFixed(1)} <span style={styles.unitText}>kgCO2e</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* 📊 ส่วนที่ 2: ตารางแสดงอันดับรองลงมา */}
            <div style={styles.tableBox}>
                {/* หัวตาราง */}
                <div style={{...styles.tableHeaderRow }}>
                    <div style={{ flex: 2, textAlign: 'center', }}>อันดับ</div>
                    <div style={{ flex: 5 }}>ผู้บริจาค</div>
                    <div style={{ flex: 5, textAlign: 'right', color: '#328d7d' }}>ผลรวมของก๊าซเรือนกระจกที่ช่วยลด</div>
                </div>

                {/* รายการอันดับย่อย */}
                <div style={styles.tableBody}>
                    {remainingUsers.map((user, index) => (
                        <div key={user.id} style={styles.tableRow}>
                            <div style={{ flex: 2, textAlign: 'center' }}>
                                {index + 4}
                            </div>
                            <div style={{ flex: 5 }}>
                                {user.name}
                            </div>
                            <div style={{ flex: 5, textAlign: 'right', color: '#ff8c00', fontWeight: 'bold', fontSize: '16px' }}>
                                {user.totalCo2.toFixed(1)} <span style={{ fontSize: '16px', color: '#328d7d', fontWeight: 'normal' }}>kgCO2e</span>
                            </div>
                        </div>
                    ))}
                </div>
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
    headerTag: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#328d7d',
        fontWeight: 'bold',
        fontSize: '14px',
        letterSpacing: '0.05em',
        marginBottom: '4px',
    },
    mainTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#328d7d',
        marginTop: '0',
        marginBottom: '32px',
    },
    podiumContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: '16px',
        maxWidth: '700px',
        margin: '0 auto 32px auto',
    },
    podiumCard: {
        flex: 1,
        borderRadius: '16px 16px 0 0',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    podiumRank1: {
        backgroundColor: '#f8eec5',
        borderBottom: '8px solid #f4d13d',
        height: '280px',
        zIndex: 2,
        transform: 'scale(1.03)',
    },
    podiumRank2: {
        backgroundColor: '#dbe0e6',
        borderBottom: '8px solid #aab4c2',
        height: '240px',
    },
    podiumRank3: {
        backgroundColor: '#e8d1c9',
        borderBottom: '8px solid #a15b41',
        height: '220px',
    },
    badge: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '18px',
        marginTop: '-24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    podiumContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: 'auto 0',
        textAlign: 'center',
    },
    podiumEmoji: {
        fontSize: '70px',
        marginBottom: '15px',
        marginTop: "5px"
    },
    podiumName: {
        fontSize: '22px',
        fontWeight: 'bold',
        color: '#1f2937',
        margin: '0',
    },
    podiumSubText: {
        fontSize: '12px',
        color: '#328d7d',
        margin: '4px 0 0 0',
        fontWeight: '500'
    },
    podiumResult: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: 'auto 0',
        textAlign: 'center',
        fontSize: '18px',
        fontWeight: 'bold',
    },
    unitText: {
        fontSize: '20px',
        fontWeight: '900',
        color: "#328d7d"
    },
    tableBox: {
        backgroundColor: '#e4ece9',
        borderRadius: '16px',
        padding: '24px',
    },
    tableHeaderRow: {
        display: 'flex',
        paddingBottom: '12px',
        // borderBottom: '1px solid #cbdad5',
        fontSize: '16px',
        color: '#ff8c00',
    },
    tableBody: {
        marginTop: '4px',
    },
    tableRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '14px 4px',
        fontSize: '16px',
    },
};