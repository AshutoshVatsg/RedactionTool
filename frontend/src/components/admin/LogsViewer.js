import React, { useEffect, useState } from "react";
import axios from "axios";
import "./admin.css";

export default function LogsViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/admin/logs")
      .then((res) => setLogs(res.data))
      .catch(() => {
        // Mock Data
        setLogs([
          {
            id: 1,
            user: "Hridaya",
            doc: "CaseStudy.pdf",
            fields: ["Name", "Phone"],
            date: "2025-11-10",
            status: "Pending",
          },
          {
            id: 2,
            user: "Anita",
            doc: "Report.docx",
            fields: ["Address"],
            date: "2025-11-09",
            status: "Verified",
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const verifyLog = (id) => {
    setLogs(logs.map((l) => (l.id === id ? { ...l, status: "Verified" } : l)));
    axios.post(`/api/admin/logs/${id}/verify`).catch(() => {
      alert("Verify failed (mock only).");
    });
  };

  return (
    <div className="admin-page">
      {/* 🎬 Background Video */}
      <video autoPlay loop muted playsInline className="admin-bg">
        <source src="/videos/vid1.mp4" type="video/mp4" />
      </video>

      <div className="admin-header">
        <h1>📜 Redaction Logs</h1>
        <a href="/admin" className="home-btn">⬅ Back to Dashboard</a>
      </div>

      {loading ? <p>Loading...</p> : null}

      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Document</th>
              <th>Fields Redacted</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{l.user}</td>
                <td>{l.doc}</td>
                <td>{l.fields.join(", ")}</td>
                <td>{l.date}</td>
                <td
                  className={
                    l.status === "Verified" ? "status-verified" : "status-pending"
                  }
                >
                  {l.status}
                </td>
                <td>
                  {l.status !== "Verified" && (
                    <button className="btn btn-ok" onClick={() => verifyLog(l.id)}>
                      Verify
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


