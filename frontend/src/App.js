import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import RedactionTool from "./components/RedactionTool";
import AdminDashboard from "./components/admin/AdminDashboard";
import ManageUsers from "./components/admin/ManageUsers";
import LogsViewer from "./components/admin/LogsViewer";
import AdminLogin from "./components/admin/AdminLogin";
import "./App.css";

// 🔒 Protected Route Wrapper
const ProtectedRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem("adminAuth") === "true";
  return isAuthenticated ? element : <Navigate to="/admin/login" />;
};

function App() {
  // 💫 Cursor Glow
  useEffect(() => {
    const glow = document.createElement("div");
    glow.classList.add("cursor-glow");
    document.body.appendChild(glow);

    const handleMove = (e) => {
      glow.style.left = e.pageX + "px";
      glow.style.top = e.pageY + "px";
    };

    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      glow.remove();
    };
  }, []);

  // 💥 Ripple Click Effect
  useEffect(() => {
    const handleClick = (e) => {
      const ripple = document.createElement("div");
      ripple.classList.add("ripple");
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <Router>
      <Routes>
        {/* 🏠 User App */}
        <Route
          path="/"
          element={
            <>
              <video autoPlay loop muted playsInline className="video-bg">
                <source src="/videos/vid1.mp4" type="video/mp4" />
              </video>
              <RedactionTool />
            </>
          }
        />

        {/* 🔐 Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* 👑 Protected Admin Pages */}
        <Route
          path="/admin"
          element={<ProtectedRoute element={<AdminDashboard />} />}
        />
        <Route
          path="/admin/users"
          element={<ProtectedRoute element={<ManageUsers />} />}
        />
        <Route
          path="/admin/logs"
          element={<ProtectedRoute element={<LogsViewer />} />}
        />

        {/* 🚫 Redirect Unknown Routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
