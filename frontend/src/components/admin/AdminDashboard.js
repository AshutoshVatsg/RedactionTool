import React, { useEffect, useState } from "react";
import axios from "axios";
import "./admin.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    uploads: 0,
    redactedDocs: 0,
    sharedDocs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/admin/stats")
      .then((res) => setStats(res.data))
      .catch(() =>
        setStats({ users: 24, uploads: 52, redactedDocs: 41, sharedDocs: 18 })
      )
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    window.location.href = "/admin/login";
  };

  return (
    <div className="admin-page">
      {/* 🎬 Background Video */}
      <video autoPlay loop muted playsInline className="admin-bg">
        <source src="/videos/vid1.mp4" type="video/mp4" />
      </video>

      {/* 🧠 Admin Header */}
      <div className="admin-header">
        <h1>👑 Admin Dashboard</h1>
        <div className="header-buttons">
          <button
            className="home-btn"
            onClick={() => (window.location.href = "/")}
          >
            🏠 Home
          </button>
          <button className="home-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      <h2 className="section-title">System Overview</h2>
      {loading ? <p>Loading...</p> : null}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.users}</div>
          <div className="stat-label">Registered Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.uploads}</div>
          <div className="stat-label">Documents Uploaded</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.redactedDocs}</div>
          <div className="stat-label">Redacted Documents</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.sharedDocs}</div>
          <div className="stat-label">Shared Links</div>
        </div>
      </div>

      <div className="admin-actions">
        <a className="admin-button" href="/admin/users">
          👥 Manage Users
        </a>
        <a className="admin-button" href="/admin/logs">
          📜 View Logs
        </a>
      </div>
    </div>
  );
}



