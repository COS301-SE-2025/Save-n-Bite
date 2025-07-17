// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoutes';
import { USER_TYPES } from './config/routes';

// Import your components
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
import ManageDonations from './pages/foodProvider/Donations';
import ForgotPassword from './pages/auth/ForgotPassword';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes - no authentication required */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<Home />} />

          {/* Customer and NGO routes */}
          <Route 
            path="/food-listing" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.CUSTOMER, USER_TYPES.NGO]}>
                <FoodListing />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/item/:id" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.CUSTOMER, USER_TYPES.NGO]}>
                <FoodItem />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cart" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.CUSTOMER, USER_TYPES.NGO]}>
                <Cart />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.CUSTOMER, USER_TYPES.NGO]}>
                <OrderHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/donation-request/:id" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.NGO]}>
                <DonationRequest />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/donation-confirmation/:id" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.NGO]}>
                <DonationConfirmation />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pickup" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.CUSTOMER, USER_TYPES.NGO]}>
                <Pickup />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reviews/:orderId" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.CUSTOMER, USER_TYPES.NGO]}>
                <Reviews />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reviews" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.CUSTOMER, USER_TYPES.NGO]}>
                <Reviews />
              </ProtectedRoute>
            } 
          />

          {/* Provider-only routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.PROVIDER]}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-listing" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.PROVIDER]}>
                <CreateListing />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/listings-overview" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.PROVIDER]}>
                <ListingOverview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders-and-feedback" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.PROVIDER]}>
                <OrdersAndFeedback />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pickup-coordination" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.PROVIDER]}>
                <PickupCoordination />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/donations" 
            element={
              <ProtectedRoute requiredRoles={[USER_TYPES.PROVIDER]}>
                <ManageDonations />
              </ProtectedRoute>
            } 
          />

          {/* Routes accessible by all authenticated users */}
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Notification />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;