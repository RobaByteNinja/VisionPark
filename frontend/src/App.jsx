import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ThemeProvider } from "./context/ThemeContext";
import { ScrollProvider } from "./context/ScrollContext";

// --- 1. LAYOUTS ---
import DriverLayout from "./driver/components/DriverLayout";
import OwnerLayout from "./owner/components/OwnerLayout";
import AttendantLayout from "./attendant/components/AttendantLayout"; // ✅ NEW

// --- 2. AUTH & PUBLIC ---
import Login from "./shared/auth/Login";
import DriverSignUp from "./shared/auth/DriverSignUp";
import ForgotPassword from "./shared/auth/ForgotPassword";
import PrivacyPolicy from "./shared/pages/PrivacyPolicy";

// --- 3. DRIVER PAGES ---
import DriverMap from "./driver/pages/DriverMap";
import ActiveSession from "./driver/pages/ActiveSession";
import DriverHistory from "./driver/pages/DriverHistory";
import DriverProfile from "./driver/pages/DriverProfile";

// --- 4. OWNER PAGES ---
import Dashboard from "./owner/pages/Dashboard";
import ParkingManagement from "./owner/pages/ParkingManagement";
import AttendantManagement from "./owner/pages/AttendantManagement";
import Operations from "./owner/pages/Operations";
import Analytics from "./owner/pages/Analytics";
import FinancialReports from "./owner/pages/FinancialReports";
import PricingSettings from "./owner/pages/PricingSettings";
import PayoutSettings from "./owner/pages/PayoutSettings";
import OwnerProfile from "./owner/pages/OwnerProfile";

// --- 5. ATTENDANT PAGES --- ✅ NEW IMPORTS
import LiveGrid from "./attendant/pages/LiveGrid";
import AIExceptions from "./attendant/pages/AIExceptions";
import WalkUpPOS from "./attendant/pages/WalkUpPOS";
import Overstays from "./attendant/pages/Overstays";
import Enforcement from "./attendant/pages/Enforcement";
import Incidents from "./attendant/pages/Incidents";
import ZReport from "./attendant/pages/ZReport";
import AttendantProfile from "./attendant/pages/AttendantProfile";

export default function App() {
  // Debugging effects... (keeping your existing logic)
  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest('a');
      if (anchor && anchor.getAttribute('href')) {
        console.warn('🚨 Anchor clicked:', { href: anchor.getAttribute('href'), element: anchor });
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
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
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* --- SECTION A: Driver Domain --- */}
            <Route path="/driver" element={<DriverLayout />}>
              <Route index element={<Navigate to="map" replace />} />
              <Route path="map" element={<DriverMap />} />
              <Route path="session" element={<ActiveSession />} />
              <Route path="history" element={<DriverHistory />} />
              <Route path="profile" element={<DriverProfile />} />
            </Route>

            {/* --- SECTION B: Owner Domain --- */}
            <Route path="/owner" element={<OwnerLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
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

            {/* --- SECTION C: Attendant Domain --- ✅ ADDED */}
            <Route path="/attendant" element={<AttendantLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<LiveGrid />} />
              <Route path="exceptions" element={<AIExceptions />} />
              <Route path="pos" element={<WalkUpPOS />} />
              <Route path="overstays" element={<Overstays />} />
              <Route path="enforcement" element={<Enforcement />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="z-report" element={<ZReport />} />
              <Route path="profile" element={<AttendantProfile />} />
            </Route>

          </Routes>
        </BrowserRouter>
      </ScrollProvider>
    </ThemeProvider>
  );
}