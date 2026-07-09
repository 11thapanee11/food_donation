import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Navbar from './components/Navbar'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register';
import Profile from './components/Profile';
import MyFoods from './components/MyFoods';
import FoodForm from './components/FoodForm';
import FoodDetail from './components/FoodDetail';
import MapPage from './components/MapPage';
import RankingPage from './components/RankingPage';
import FoodReceive from './components/FoodReceive';
import ImpactDashboard from './components/ImpactDashboard';
import AdminDashboard from './components/AdminDashboard';
import ListFood from './components/ListFood';
import ManageUsers from './components/ManageUser';
import ListReport from './components/ListReport';
import ReportDetail from './components/ReportDetail';
import { decodeToken } from './utils/jwt';

const AdminRoute = () => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    // ถ้าไม่มี Token ดีดไปหน้า Login
    return <Navigate to="/login" replace />;
  }

  const userData = decodeToken(token);

  // มี Token ดีดไปหน้าหลักของผู้ใช้
  if (!userData || userData.isAdmin !== true) {
    return <Navigate to="/" replace />;
  }

  // ถ้าผ่านเงื่อนไขทั้งหมด ให้เข้าหน้าแอดมินได้ปกติ
  return <Outlet />;
};

// ยูสเซอร์ทั่วไปเท่านั้น
const UserRoute = () => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const userData = decodeToken(token);

  // ถ้ามี Token แต่ดันเป็น Admin แอบพิมพ์มาเข้าหน้ายูสเซอร์ -> ดีดกลับไปหน้าแดชบอร์ดแอดมิน
  if (userData && userData.isAdmin === true) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return <Outlet />;
};

// หน้า Login (คนล็อกอินแล้วห้ามเข้าซ้ำ)
const PublicOnlyRoute = () => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    const userData = decodeToken(token);
    if (userData) {
      return userData.isAdmin === true
        ? <Navigate to="/admin-dashboard" replace />
        : <Navigate to="/" replace />;
    }
  }
  return <Outlet />;
};

function App() {
  useEffect(() => {
    const handlePageShow = (event) => {
      // event.persisted จะเป็น true ก็ต่อเมื่อหน้านี้ถูกดึงมาจากความจำเก่า (BFcache/Back Button)
      if (event.persisted) {
        // สั่งให้หน้าเว็บรีเฟรชตัวเองด่วน เพื่อดึงข้อมูลล่าสุดและเช็ค Token ใหม่
        window.location.reload();
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path='/map' element={<MapPage />} />
        <Route path='/ranking' element={<RankingPage />} />
        <Route path='/food-detail' element={<FoodDetail />} />

        {/* กลุ่มหน้าสำหรับคนยังไม่ได้ล็อกอิน (ถ้าล็อกอินแล้ว พิมพ์มาหน้าล็อกอินจะโดนดีดออก) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* กลุ่มหน้าสำหรับ ยูสเซอร์ทั่วไปเท่านั้น (แอดมินพิมพ์มาจะโดนบล็อก) */}
        <Route element={<UserRoute />}>
          <Route path='/profile' element={<Profile />} />
          <Route path='/my-foods' element={<MyFoods />} />
          <Route path='/food-form' element={<FoodForm />} />
          <Route path='/food-detail' element={<FoodDetail />} />
          <Route path='/receive' element={<FoodReceive />} />
          <Route path='/impact-dashboard' element={<ImpactDashboard />} />
        </Route>

        {/* กลุ่มหน้าสำหรับ แอดมินเท่านั้น (ยูสเซอร์ทั่วไปแอบพิมพ์มาจะโดนดีดไปหน้าแรก) */}
        <Route element={<AdminRoute />}>
          <Route path='/admin-dashboard' element={<AdminDashboard />} />
          <Route path='/manage-foods' element={<ListFood />} />
          <Route path='/manage-users' element={<ManageUsers />} />
          <Route path='/manage-report' element={<ListReport />} />
          <Route path='/report-detail' element={<ReportDetail />} />
        </Route>

        {/* หน้าดักกรณีพิมพ์ URL มั่วซั่วแล้วไม่เจอหน้าเว็บ */}
        <Route path="*" element={<Navigate to="/" replace />} />


        {/* <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/my-foods' element={<MyFoods />} />
        <Route path='/food-form' element={<FoodForm />} />
        <Route path='/food-detail' element={<FoodDetail />} />
        <Route path='/map' element={<MapPage />} />
        <Route path='/ranking' element={<RankingPage />} />
        <Route path='/receive' element={<FoodReceive />} />
        <Route path='/impact-dashboard' element={<ImpactDashboard />} />
        <Route path='/admin-dashboard' element={<AdminDashboard />} />
        <Route path='/manage-foods' element={<ListFood />} />
        <Route path='/manage-users' element={<ManageUsers />} />
        <Route path='/manage-report' element={<ListReport />} />
        <Route path='/report-detail' element={<ReportDetail />} /> */}
      </Routes>
    </Router>
  );
}

export default App;


