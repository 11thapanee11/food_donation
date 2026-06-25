import { jwtDecode } from 'jwt-decode';

export const decodeToken = (token) => {
    try {
        if (!token) return null;
        
        // เรียกบรรทัดเดียวจบ ตัว Library จะจัดการแกะโครงสร้างทั้งหมดให้เอง
        return jwtDecode(token); 
    } catch (error) {
        console.error("Invalid token format:", error);
        return null;
    }
};