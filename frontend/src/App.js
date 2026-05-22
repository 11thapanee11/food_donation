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


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path='/profile' element={<Profile/>} />
        <Route path='/my-foods' element={<MyFoods/>} />
        <Route path='/food-form' element={<FoodForm/>} />
        <Route path='/food-form/:id' element={<FoodForm/>} />
        <Route path='/food-detail/:id' element={<FoodDetail/>} />
      </Routes>
    </Router>
  );
}

export default App;
