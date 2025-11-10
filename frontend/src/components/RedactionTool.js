import React, { useState } from "react";
import "../App.css";

export default function RedactionTool() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [redacted, setRedacted] = useState(false);
  const [showRedactedPreview, setShowRedactedPreview] = useState(false);
  const [selectedFields, setSelectedFields] = useState({
    name: false,
    phone: false,
    dob: false,
    address: false,
  });

  // Handle file upload
  const handleFileUpload = (e) => {
    const uploaded = e.target.files[0];
    if (uploaded) {
      setFile(uploaded);
      setPreviewUrl(URL.createObjectURL(uploaded));
      setRedacted(false);
      setShowRedactedPreview(false);
    }
  };

  // Handle individual field selection
  const handleFieldToggle = (field) => {
    setSelectedFields({ ...selectedFields, [field]: !selectedFields[field] });
  };

  // ✅ Select All toggle
  const handleSelectAll = () => {
    const allSelected = Object.values(selectedFields).every((val) => val);
    const updated = Object.keys(selectedFields).reduce((acc, key) => {
      acc[key] = !allSelected;
      return acc;
    }, {});
    setSelectedFields(updated);
  };

  // Redact simulation
  const handleRedact = () => {
    if (file) {
      setRedacted(true);
      alert("Sensitive fields have been redacted successfully!");
    }
  };

  // Show redacted preview
  const handlePreviewRedacted = () => {
    if (redacted) {
      setShowRedactedPreview(!showRedactedPreview);
    }
  };

  // Download redacted file
  const handleExport = () => {
    if (file) {
      const link = document.createElement("a");
      link.href = previewUrl;
      link.download = `REDACTED_${file.name}`;
      link.click();
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content-area">
        <h1 className="title">🧾 Just Redact – Smart Redaction Tool</h1>
        <p className="subtitle">
          Upload → Preview → Choose What to Redact → Share Securely
        </p>

        {/* Unified main section */}
        <div className="main-block">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sidebar-item">Upload</div>
            <div className="sidebar-item">Preview</div>
            <div className="sidebar-item">Redact</div>
            <div className="sidebar-item">Share</div>
          </aside>

          {/* Upload Section */}
          <div className="upload-box">
            <input
              type="file"
              id="fileInput"
              accept=".pdf,.txt,.docx,.doc"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <label htmlFor="fileInput" className="upload-label">
              📂 Click or Drag to Upload Document
            </label>
            {file && <p className="file-name">📄 Uploaded: {file.name}</p>}

            {/* Document Preview */}
            {previewUrl && (
              <div className="preview-container">
                {file.type === "application/pdf" ? (
                  <iframe
                    src={previewUrl}
                    title="PDF Preview"
                    className={`pdf-preview ${
                      showRedactedPreview ? "redacted" : ""
                    }`}
                  ></iframe>
                ) : (
                  <p className="text-preview">
                    Preview not supported for this file type.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Steps + Redaction Controls */}
          <div className="tips-section">
            <h3>💡 Steps to Use:</h3>
            <ul>
              <li>1️⃣ Upload a document</li>
              <li>2️⃣ Preview the file below</li>
              <li>3️⃣ Select fields to redact</li>
              <li>4️⃣ Redact → Preview → Download</li>
            </ul>

            {/* Redaction Controls */}
            <div className="redact-controls">
              <h4>Select fields to redact:</h4>

              {/* Select All */}
              <label>
                <input
                  type="checkbox"
                  checked={Object.values(selectedFields).every((v) => v)}
                  onChange={handleSelectAll}
                />
                <strong>Select All</strong>
              </label>

              {/* Individual Fields */}
              {Object.keys(selectedFields).map((field) => (
                <label key={field}>
                  <input
                    type="checkbox"
                    checked={selectedFields[field]}
                    onChange={() => handleFieldToggle(field)}
                  />
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
              ))}

              {/* Action Buttons */}
              <button
                className="action-btn redact-btn"
                onClick={handleRedact}
                disabled={!file}
              >
                🕶️ Redact
              </button>

              <button
                className="action-btn preview-btn"
                onClick={handlePreviewRedacted}
                disabled={!redacted}
              >
                👁️ Preview Redacted
              </button>

              <button
                className="action-btn export-btn"
                onClick={handleExport}
                disabled={!redacted}
              >
                💾 Download Redacted
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <span className="footer-tag">Confidential</span>
          <span className="footer-tag">Secure</span>
          <span className="footer-tag">Smart</span>
        </div>

        {/* Floating Admin Access */}
        <button
          className="floating-admin-btn"
          onClick={() => (window.location.href = "/admin/login")}
        >
          👑
        </button>
      </div>
    </div>
  );
}


