import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

// const PublicOnlyRoute = () => {
//   const token = localStorage.getItem('accessToken');

//   if (token) {
//     const userData = decodeToken(token);
//     if (userData) {
//       // ถ้ามี Token และเป็น Admin ให้ดีดไปหน้า Admin แต่อย่าเพิ่มหน้า Login เข้าไปในประวัติ
//       return userData.isAdmin === true
//         ? <Navigate to="/admin-dashboard" replace />
//         : <Navigate to="/" replace />;
//     }
//   }
//   // ถ้าไม่มี Token ให้เปิดหน้า Login ได้ปกติ
//   return <Outlet />;
// };

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        {/* <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
        </Route> */}
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
        <Route path='/report-detail' element={<ReportDetail />} />
      </Routes>
    </Router>
  );
}

export default App;


