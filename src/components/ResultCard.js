import React from "react";

function ResultCard({ data, onCheckIn, loading }) {
  const isScanned = data.status?.toLowerCase() === "scanned";

  return (
    <div className={`result-card ${isScanned ? "scanned" : "not-scanned"}`}>
      <div className="result-header">
        <div className={`status-badge ${isScanned ? "badge-scanned" : "badge-pending"}`}>
          {isScanned ? "✓ Checked In" : "○ Not Checked In"}
        </div>
      </div>

      <div className="result-body">
        <div className="result-field">
          <span className="field-label">Name</span>
          <span className="field-value">{data.name}</span>
        </div>
        <div className="result-field">
          <span className="field-label">Registration No.</span>
          <span className="field-value mono">{data.registrationNo}</span>
        </div>
        {data.scannedAt && (
          <div className="result-field">
            <span className="field-label">Scanned At</span>
            <span className="field-value">{data.scannedAt}</span>
          </div>
        )}
      </div>

      <div className="result-actions">
        {!isScanned ? (
          <button
            className="checkin-btn"
            onClick={() => onCheckIn(data.registrationNo)}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : "✓  Mark as Checked In"}
          </button>
        ) : (
          <div className="already-scanned-msg">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Already verified — no action needed
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultCard;
