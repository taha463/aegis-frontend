import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import { Login, Signup } from "./pages/auth";
import { TermsConditions, PrivacyPolicy } from "./pages/legal";

// Pages
import DashboardNGO from "./pages/Dashboard/DashboardNGO";
import DashboardCitizen from "./pages/Dashboard/DashboardCitizen";

import Forhelp from "./components/layout/Forhelp";
import AegisAssist from "./components/layout/AegisAssist";
import Aegismap from "./components/layout/Aegismap";
import Mapview from "./components/layout/mapview";

import NGOLayout from "./components/layout/NGOLayout";
import NGOHelp from "./components/layout/NGOHelp";

import PageLoader from "./components/layout/PageLoader";

import "./assets/styles/global.css";

function App() {
  const [showGlobalLoader, setShowGlobalLoader] = useState(true);

  useEffect(() => {
    // 🚨 THE GLOBAL KILL SWITCH 🚨
    // This gives the PageLoader exactly 2.5 seconds to do its job.
    // If we are trapped offline and it hangs, we forcefully destroy it.
    const loaderTimeout = setTimeout(() => {
      console.log("⏱️ Global PageLoader hung. Ripping it out of the UI.");
      setShowGlobalLoader(false);
    }, 2500);

    // If the window successfully fully loads before 2.5 seconds, we clear the loader normally
    window.addEventListener("load", () => {
      setShowGlobalLoader(false);
      clearTimeout(loaderTimeout);
    });

    return () => clearTimeout(loaderTimeout);
  }, []);

  return (
    <Router>
      {/* If showGlobalLoader is false, the 4 colored dots vanish completely */}
      {showGlobalLoader && <PageLoader />}

      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/AegisAssist" element={<AegisAssist />} />

        {/* NGO */}
        <Route element={<NGOLayout />}>
          <Route path="/DashboardNGO" element={<DashboardNGO />} />
          <Route path="/mapview" element={<Mapview />} />
          <Route path="/NGOHelp" element={<NGOHelp />} />
        </Route>

        {/* Citizen */}
        <Route path="/DashboardCitizen" element={<DashboardCitizen />} />
        <Route path="/Aegismap" element={<Aegismap />} />
        <Route path="/Forhelp" element={<Forhelp />} />
      </Routes>
    </Router>
  );
}

export default App;
