import React, { useState, useEffect } from "react";
import "./admin.css";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // ✅ Auto-login if "Remember Me" was previously set
  useEffect(() => {
    const remembered = localStorage.getItem("adminRemember") === "true";
    const authenticated = localStorage.getItem("adminAuth") === "true";
    if (remembered && authenticated) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (email === "admin@justredact.com" && password === "admin123") {
      localStorage.setItem("adminAuth", "true");
      if (rememberMe) localStorage.setItem("adminRemember", "true");
      else localStorage.removeItem("adminRemember");
      navigate("/admin");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <video autoPlay loop muted playsInline className="admin-bg">
        <source src="/videos/vid1.mp4" type="video/mp4" />
      </video>

      <div className="login-container">
        <h1>🔐 Admin Login</h1>
        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* ✅ Remember Me Checkbox */}
          <div className="remember-row">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />{" "}
              Remember Me
            </label>
          </div>

          <button type="submit">Login</button>

          {error && <p className="error">{error}</p>}

          <p
            className="forgot-link"
            onClick={() => setShowModal(true)}
            style={{ cursor: "pointer", marginTop: "10px", color: "#00ffb0" }}
          >
            Forgot Password?
          </p>
        </form>
      </div>

      {/* ✨ Forgot Password Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="forgot-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Password Reset</h2>
            <p>
              Please contact the system administrator to reset your password.
            </p>
            <p className="email-text">📧 support@justredact.com</p>
            <button
              className="close-btn"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}




