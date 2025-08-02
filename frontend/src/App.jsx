import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PlayerProfile from "./pages/PlayerProfile";
import Dashboard from "./pages/Dashboard";
import Gigs from "./pages/Gigs";
import GigDetails from "./pages/GigDetails";
import Messages from "./pages/Messages";
import OrgDashboard from "./pages/OrgDashboard";
import Navbar from "./components/Navbar";
import CreateGig from "./pages/CreateGig";
import Teams from "./pages/Teams";
import EditGig from "./pages/EditGig"; 
import MyProfile from "./pages/MyProfile";
import ApplicationDetails from "./pages/ApplicationDetails";
import Wallet from "./pages/Wallet";
import { isAuthenticated, getUserType } from "./utils/auth";
import { isValidToken, secureStorage, sanitizeInput, generateSafeError } from './utils/security';

// ProtectedRoute component (remains the same)
const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles) {
    const userType = getUserType();
    if (!userType || !allowedRoles.includes(userType)) {
      return <Navigate to="/" replace />;
    }
  }
  return children;
};

// Security configuration
const securityConfig = {
  headers: {
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }
};

// Security check middleware
const checkSecurity = () => {
  // Check for any security violations or tampering
  if (window.self !== window.top) {
    // Prevent clickjacking
    window.top.location = window.self.location;
  }
};

function App() {
  React.useEffect(() => {
    checkSecurity();
  }, []);

  return (
    <BrowserRouter>
      <Navbar /> 
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Gigs and GigDetails can be public or protected */}
        <Route path="/gigs" element={<Gigs />} />
        <Route path="/gigs/:gigId" element={<GigDetails />} />
        
        <Route path="/player/:username" element={<PlayerProfile />} />
        <Route path="/teams" element={<Teams />} />

        {/* Protected Routes */}
        <Route 
          path="/create-gig" 
          element={
            <ProtectedRoute allowedRoles={['org']}>
              <CreateGig />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/edit-gig/:gigId"
          element={
            <ProtectedRoute allowedRoles={['org']}>
              <EditGig />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['player']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/org-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['org']}>
              <OrgDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/messages" 
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/my-profile"
          element={
            <ProtectedRoute> 
              <MyProfile />
            </ProtectedRoute>
          } 
        />
        
        <Route
          path="/application-details/:appId"
          element={
            <ProtectedRoute>
              <ApplicationDetails />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/wallet" 
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;