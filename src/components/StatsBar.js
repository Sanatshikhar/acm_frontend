import React from "react";

function StatsBar({ stats }) {
  const percentage = stats.total > 0 ? Math.round((stats.scanned / stats.total) * 100) : 0;

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <svg className="stat-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#35a6d0" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
        <span className="stat-number">{stats.total}</span>
        <span className="stat-label">Registered</span>
      </div>
      <div className="stat-item scanned">
        <svg className="stat-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#22c55e" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span className="stat-number">{stats.scanned}</span>
        <span className="stat-label">Checked In</span>
      </div>
      <div className="stat-item remaining">
        <svg className="stat-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="stat-number">{stats.remaining}</span>
        <span className="stat-label">Remaining</span>
      </div>
      <div className="stat-item progress">
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
        </div>
        <span className="stat-label stat-percentage">{percentage}%</span>
      </div>
    </div>
  );
}

export default StatsBar;
