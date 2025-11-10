import React, { useEffect } from "react";
import { FaUpload, FaEye, FaShieldAlt, FaShareAlt } from "react-icons/fa";
import "../App.css";

function Sidebar() {
  // AI Pulse Idle Animation
  useEffect(() => {
    let timeout;
    const sidebar = document.querySelector(".sidebar-left");

    const resetIdle = () => {
      sidebar.classList.remove("idle");
      clearTimeout(timeout);
      timeout = setTimeout(() => sidebar.classList.add("idle"), 8000);
    };

    document.addEventListener("mousemove", resetIdle);
    document.addEventListener("keydown", resetIdle);
    resetIdle();

    return () => {
      document.removeEventListener("mousemove", resetIdle);
      document.removeEventListener("keydown", resetIdle);
    };
  }, []);

  return (
    <div className="sidebar-left">
      <div className="sidebar-item">
        <FaUpload className="sidebar-icon" />
        <span className="sidebar-label">Upload</span>
      </div>

      <div className="sidebar-item">
        <FaEye className="sidebar-icon" />
        <span className="sidebar-label">Preview</span>
      </div>

      <div className="sidebar-item">
        <FaShieldAlt className="sidebar-icon" />
        <span className="sidebar-label">Redact</span>
      </div>

      <div className="sidebar-item">
        <FaShareAlt className="sidebar-icon" />
        <span className="sidebar-label">Share</span>
      </div>
    </div>
  );
}

export default Sidebar;
