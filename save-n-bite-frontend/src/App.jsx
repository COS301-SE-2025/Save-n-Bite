// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoutes';
import { ThemeProvider } from "./context/ThemeContext";


import { USER_TYPES } from './config/routes';

// Import your components
import EditListing from './pages/foodProvider/EditListing';
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
import CustomerSettings from './pages/auth/CustomerSettings';
//FoodProvider
import FoodProvidersPage from './pages/auth/AllFoodproviders';
import SpecificFoodProvider from './pages/auth/SpecificFoodProvider';
import ProfilePage from './components/auth/Profile';
import FoodproviderProfile from './pages/foodProvider/Profile'
import FoodproviderSettings from './pages/foodProvider/Settings'
//System Admin
import Layout from './components/SystemAdmin/Layout/Layout'
import AdminLogin from './pages/SystemAdmin/AdminLogin'
import AdminDashboard from './pages/SystemAdmin/AdminDashboard'
import Users from './pages/SystemAdmin/Users'
import Verifications from './pages/SystemAdmin/Verifications'
import Listings from './pages/SystemAdmin/Listings'
import AdminReviews from './pages/SystemAdmin/Reviews'
import Transactions from './pages/SystemAdmin/Transactions';
import AdminNotifications from './pages/SystemAdmin/Notifications';
import AdminAnalytics from './pages/SystemAdmin/Analytics';
import AuditLogs from './pages/SystemAdmin/AuditLogs'
import SystemLogs from './pages/SystemAdmin/SystemLogs'
import AdminSettings from './pages/SystemAdmin/Settings'
import EditProfilePage from './components/auth/EditProfile';

import ForgotPassword from './pages/auth/ForgotPassword';


function App() {
  return (
       <ThemeProvider>
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
          
          {/* NGO-specific routes */}
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
          
          {/* Shared Customer/NGO routes */}
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


       
         <Route path="/edit-listing/:listingId" element={<EditListing />} />
          <Route path="/providers" element={<FoodProvidersPage />} />
           <Route path="/provider/:id" element={<SpecificFoodProvider />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/edit-profile" element={<EditProfilePage />} />
            <Route path="/foodprovider-profile" element={<FoodproviderProfile />} />
            <Route path="/settings" element={<FoodproviderSettings />} />
             <Route path="/customer-settings" element={<CustomerSettings />} />


              <Route path="/admin-login" element={<AdminLogin />} />
        <Route element={<Layout />}>

          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/verifications" element={<Verifications />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/admin-reviews" element={<AdminReviews />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/admin-notifications" element={<AdminNotifications />} />
          <Route path="/admin-analytics" element={<AdminAnalytics />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/system-logs" element={<SystemLogs />} />
           <Route path="/admin-settings" element={<AdminSettings />} />
        </Route>


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

          {/* FIXED: Notifications accessible by ALL authenticated users */}
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute 
                requiredRoles={[USER_TYPES.CUSTOMER, USER_TYPES.NGO, USER_TYPES.PROVIDER]}
                requireAuth={true}
              >
                <Notification />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
 
  );
}



export default App;