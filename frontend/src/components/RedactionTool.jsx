import React, { useState } from "react";
import "../App.css";

const prettify = (field) =>
  field
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const FIELD_MAP = {
  name: "PERSON",
  phone: "PHONE",
  dob: "DATE",
  address: "ADDRESS",
  nric: "NRIC/FIN",
  mcr: "MCR no.",
  email: "EMAIL",
  id_number: "ID_NUMBER",
};

export default function RedactionTool() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");      // original
  const [redactedUrl, setRedactedUrl] = useState("");    // backend output
  const [showRedacted, setShowRedacted] = useState(false);

  const [selectedFields, setSelectedFields] = useState({
    name: false,
    phone: false,
    dob: false,
    address: false,
    nric: false,
    mcr: false,
    email: false,
    id_number: false,
  });

  // ------------------------
  // FILE UPLOAD
  // ------------------------
  const handleFileUpload = (e) => {
    const uploaded = e.target.files[0];
    if (uploaded) {
      setFile(uploaded);
      setPreviewUrl(URL.createObjectURL(uploaded));
      setRedactedUrl("");
      setShowRedacted(false);
    }
  };

  // ------------------------
  // FIELD TOGGLES
  // ------------------------
  const handleFieldToggle = (key) => {
    setSelectedFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAll = () => {
    const allChecked = Object.values(selectedFields).every(Boolean);
    const updated = {};
    Object.keys(selectedFields).forEach(
      (k) => (updated[k] = !allChecked)
    );
    setSelectedFields(updated);
  };

  // ------------------------
  // REDACTION
  // ------------------------
  const handleRedact = async () => {
    if (!file) return alert("Upload a file first.");

    const mapped = Object.keys(selectedFields)
      .filter((f) => selectedFields[f])
      .map((f) => FIELD_MAP[f]);

    if (mapped.length === 0)
      return alert("Select at least one field.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("categories", JSON.stringify(mapped));

    try {
      const res = await fetch("http://127.0.0.1:5000/redact", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Backend error");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setRedactedUrl(url);
      setShowRedacted(true);

      alert("✔ Redaction completed!");
    } catch (err) {
      console.error(err);
      alert("Redaction failed. Check backend logs.");
    }
  };

  // ------------------------
  // DOWNLOAD
  // ------------------------
  const handleExport = () => {
    if (!redactedUrl) return;
    const link = document.createElement("a");
    link.href = redactedUrl;
    link.download = `REDACTED_${file.name}`;
    link.click();
  };

  // ------------------------
  // UI
  // ------------------------
  return (
    <div className="page-wrapper">
      <div className="content-area">
        <h1 className="title">🧾 Just Redact – Smart Redaction Tool</h1>
        <p className="subtitle">
          Upload → Preview → Choose What to Redact → Share Securely
        </p>

        <div className="main-block">
          {/* -------- Sidebar -------- */}
          <aside className="sidebar">
            <div className="sidebar-item">Upload</div>
            <div className="sidebar-item">Preview</div>
            <div className="sidebar-item">Redact</div>
            <div className="sidebar-item">Share</div>
          </aside>

          {/* -------- Upload Box -------- */}
          <div className="upload-box">
            <input
              type="file"
              id="fileInput"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <label htmlFor="fileInput" className="upload-label">
              📂 Click or Drag to Upload Document
            </label>

            {file && <p className="file-name">📄 Uploaded: {file.name}</p>}

            {(previewUrl || redactedUrl) && (
              <div className="preview-container">
                <iframe
                  src={showRedacted ? redactedUrl : previewUrl}
                  title="PDF Viewer"
                  className="pdf-preview"
                ></iframe>
              </div>
            )}
          </div>

          {/* -------- Redaction Controls -------- */}
          <div className="tips-section">
            <h3>💡 Steps to Use:</h3>
            <ul>
              <li>1️⃣ Upload a document</li>
              <li>2️⃣ Preview the file</li>
              <li>3️⃣ Select fields to redact</li>
              <li>4️⃣ Redact → Preview → Download</li>
            </ul>

            <div className="redact-controls">
              <h4>Select fields to redact:</h4>

              <label>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={Object.values(selectedFields).every(Boolean)}
                />
                <strong>Select All</strong>
              </label>

              {Object.keys(selectedFields).map((field) => (
                <label key={field}>
                  <input
                    type="checkbox"
                    checked={selectedFields[field]}
                    onChange={() => handleFieldToggle(field)}
                  />
                  {prettify(field)}
                </label>
              ))}

              <button
                className="action-btn redact-btn"
                disabled={!file}
                onClick={handleRedact}
              >
                🕶️ Redact
              </button>

              {redactedUrl && (
                <>
                  <button
                    className="action-btn preview-btn"
                    onClick={() => setShowRedacted(!showRedacted)}
                  >
                    👁️ {showRedacted ? "Show Original" : "Preview Redacted"}
                  </button>

                  <button
                    className="action-btn export-btn"
                    onClick={handleExport}
                  >
                    💾 Download Redacted
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <span className="footer-tag">Confidential</span>
          <span className="footer-tag">Secure</span>
          <span className="footer-tag">Smart</span>
        </div>

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






