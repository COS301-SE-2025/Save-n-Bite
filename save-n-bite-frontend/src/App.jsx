import React from 'react';
import logo from './assets/images/SnB_leaf_icon.png';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import Home from './pages/auth/Home';
import FoodListing from './pages/auth/FoodListings';
import Cart from './pages/auth/YourCart';
import OrderHistory from './pages/auth/OrderHistory';
import FoodItem from './pages/auth/FoodItem';
import CreateListing from './pages/foodProvider/CreateListing';
import ListingOverview from './pages/foodProvider/ListingsOverview';
import Notification from './pages/auth/NotificationPage';
import DonationRequest from './pages/auth/DonationRequest';
import DonationConfirmation from './pages/auth/DonationConfirmationPage';
import Pickup from './pages/auth/PickupPage';
import Reviews from './pages/auth/ReviewPage';
import Dashboard from './pages/foodProvider/Dashboard';
import OrdersAndFeedback from './pages/foodProvider/OrdersAndFeedback';
import PickupCoordination from './pages/foodProvider/PickupCoordination';


function App() {
  return (
    
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
         <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route path="/food-listing" element = {<FoodListing/>}/>
          <Route path="/item/:id" element={<FoodItem />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/listings-overview" element={<ListingOverview />} />

          <Route path="/notifications" element={<Notification />} />

          <Route path="/donation-request/:id" element={<DonationRequest />} />
          <Route path="/donation-confirmation/:id" element={<DonationConfirmation />} />
          <Route path="/notifications" element={<OrderHistory />} />
          <Route path="/pickup" element={<Pickup />} />
          <Route path="/reviews/:orderId" element={<Reviews />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/dashboard" element={<Dashboard />} />
           <Route path="/orders-and-feedback" element={<OrdersAndFeedback />} />
    <Route path="/pickup-coordination" element={<PickupCoordination />} />

      </Routes>
    </Router>
  );
}

export default App;

