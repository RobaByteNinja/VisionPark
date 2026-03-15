import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 1. Import the ThemeProvider (and ScrollProvider if you have it)
import { ThemeProvider } from "./context/ThemeContext"; 
import { ScrollProvider } from "./context/ScrollContext"; // Added to prevent scrolling errors on Driver pages

// 2. Import Layouts
import DriverLayout from "./driver/components/DriverLayout";
import OwnerLayout from "./owner/components/OwnerLayout"; 

// 3. Import Auth & Public Pages
import Login from "./shared/auth/Login";
import DriverSignUp from "./shared/auth/DriverSignUp"; 
import ForgotPassword from "./shared/auth/ForgotPassword"; 
import PrivacyPolicy from "./shared/pages/PrivacyPolicy"; // ✅ ADDED PRIVACY POLICY

// 4. Import Driver Domain Pages
import DriverMap from "./driver/pages/DriverMap";
import ActiveSession from "./driver/pages/ActiveSession";
import DriverHistory from "./driver/pages/DriverHistory";
import DriverProfile from "./driver/pages/DriverProfile"; 

// 5. Import Owner Domain Pages
import Dashboard from "./owner/pages/Dashboard";
import ParkingManagement from "./owner/pages/ParkingManagement"; 
import AttendantManagement from "./owner/pages/AttendantManagement"; 
import Operations from "./owner/pages/Operations"; 
import Analytics from "./owner/pages/Analytics"; 
import FinancialReports from "./owner/pages/FinancialReports";
import PricingSettings from "./owner/pages/PricingSettings"; 
import PayoutSettings from "./owner/pages/PayoutSettings"; 
import OwnerProfile from "./owner/pages/OwnerProfile"; 

export default function App() {
  // 🚨 DEBUGGING: Catch any anchor clicks or form submissions globally
  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest('a');
      if (anchor && anchor.getAttribute('href')) {
        console.warn('🚨 Anchor clicked:', {
          href: anchor.getAttribute('href'),
          target: anchor.target,
          element: anchor
        });
      }
    };

    const handleSubmit = (e) => {
      if (e.target.tagName === 'FORM') {
        console.warn('📝 Form submitted:', e.target);
        // e.preventDefault(); 
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleSubmit);
    };
  }, []);
  
  return (
    <ThemeProvider>
      <ScrollProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<DriverSignUp />} /> 
            <Route path="/forgot-password" element={<ForgotPassword />} /> 
            <Route path="/privacy-policy" element={<PrivacyPolicy />} /> {/* ✅ HOOKED UP ROUTE */}

            {/* Driver Domain Routing */}
            <Route path="/driver" element={<DriverLayout />}>
              <Route index element={<Navigate to="map" replace />} />
              <Route path="map" element={<DriverMap />} />
              <Route path="session" element={<ActiveSession />} />
              <Route path="history" element={<DriverHistory />} />
              <Route path="profile" element={<DriverProfile />} />
            </Route>

            {/* Owner Domain Routing */}
            <Route path="/owner" element={<OwnerLayout />}>
              {/* Default redirect to dashboard */}
              <Route index element={<Navigate to="dashboard" replace />} />
              
              {/* Connected Owner Modules */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="parking" element={<ParkingManagement />} /> 
              <Route path="attendants" element={<AttendantManagement />} /> 
              <Route path="operations" element={<Operations />} /> 
              <Route path="analytics" element={<Analytics />} /> 
              <Route path="finance" element={<FinancialReports />} /> 
              <Route path="pricing" element={<PricingSettings />} /> 
              <Route path="payout" element={<PayoutSettings />} /> 
              <Route path="profile" element={<OwnerProfile />} /> 
            </Route>

          </Routes>
        </BrowserRouter>
      </ScrollProvider>
    </ThemeProvider>
  );
}