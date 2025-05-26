import React from 'react';
import logo from './assets/images/SnB_leaf_icon.png';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import Home from './pages/auth/Home';
import FoodListing from './pages/auth/FoodListings';
// import CreateListing from './pages/auth/CreateListing';
import Cart from './pages/auth/YourCart';
import OrderHistory from './pages/auth/OrderHistory';
import FoodItem from './pages/auth/FoodItem';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
         <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route path="/food-listing" element = {<FoodListing/>}/>
          <Route path="/food-item" element={<FoodItem />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/cart" element={<Cart />} />



      </Routes>
    </Router>
  );
}

export default App;

