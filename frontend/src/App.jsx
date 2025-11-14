import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import RedactionTool from "./components/RedactionTool.jsx";
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import ManageUsers from "./components/admin/ManageUsers.jsx";
import LogsViewer from "./components/admin/LogsViewer.jsx";
import AdminLogin from "./components/admin/AdminLogin.jsx";

import "./App.css";

// 🔒 Protected Route Wrapper
const ProtectedRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem("adminAuth") === "true";
  return isAuthenticated ? element : <Navigate to="/admin/login" />;
};

export default function App() {

  // 💫 Cursor Glow Effect
  useEffect(() => {
    const glow = document.createElement("div");
    glow.classList.add("cursor-glow");
    document.body.appendChild(glow);

    const move = (e) => {
      glow.style.left = `${e.pageX}px`;
      glow.style.top = `${e.pageY}px`;
    };

    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mousemove", move);
      glow.remove();
    };
  }, []);

  // 💥 Ripple Click Effect
  useEffect(() => {
    const clickHandler = (e) => {
      const ripple = document.createElement("div");
      ripple.className = "ripple";
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    };
    document.addEventListener("click", clickHandler);

    return () => document.removeEventListener("click", clickHandler);
  }, []);

  return (
    <Router>
      <Routes>

        {/* 🏠 User Main Page */}
        <Route
          path="/"
          element={
            <div className="page-wrapper">
              {/* Video should always be inside /public/videos/ */}
              <video autoPlay muted loop playsInline className="video-bg">
                <source src="/videos/vid1.mp4" type="video/mp4" />
              </video>

              <RedactionTool />
            </div>
          }
        />

        {/* 🔐 Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* 👑 Admin Pages */}
        <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} />} />
        <Route path="/admin/users" element={<ProtectedRoute element={<ManageUsers />} />} />
        <Route path="/admin/logs" element={<ProtectedRoute element={<LogsViewer />} />} />

        {/* 🚫 Redirect */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router>
  );
}
