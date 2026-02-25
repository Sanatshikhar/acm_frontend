import React, { useState, useEffect } from "react";
import SearchPanel from "./components/SearchPanel";
import StatsBar from "./components/StatsBar";
import ResultCard from "./components/ResultCard";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, scanned: 0, remaining: 0 });
  const [notification, setNotification] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      const data = await res.json();
      setStats(data);
    } catch {
      console.error("Failed to fetch stats");
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = async (regNo) => {
    setLoading(true);
    setError("");
    setSearchResult(null);
    setNotification(null);

    try {
      const res = await fetch(`${API_URL}/api/search?regNo=${encodeURIComponent(regNo)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(`${data.error} (searched: "${regNo}")`);
        return;
      }

      setSearchResult(data);
    } catch {
      setError("Cannot connect to server. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (regNo) => {
    setLoading(true);
    setNotification(null);

    try {
      const res = await fetch(`${API_URL}/api/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regNo }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setNotification({ type: "warning", message: `Already checked in at ${data.scannedAt}` });
        return;
      }

      if (!res.ok) {
        setNotification({ type: "error", message: data.error || "Check-in failed" });
        return;
      }

      setSearchResult({
        name: data.name,
        registrationNo: data.registrationNo,
        status: data.status,
        scannedAt: data.scannedAt,
      });
      setNotification({ type: "success", message: "Check-in successful!" });
      fetchStats();
    } catch {
      setNotification({ type: "error", message: "Cannot connect to server" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Animated background blobs */}
      <div className="bg-decoration">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <header className="app-header">
        <div className="header-content">
          <div className="logo-group">
            <div className="logo">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 14l2 2 4-4" />
              </svg>
            </div>
            <div className="header-text">
              <h1>ACM Students Chapter</h1>
              <p className="subtitle">Gate Pass &middot; Event Check-in</p>
            </div>
          </div>
          <div className="header-live-badge">
            <span className="live-dot" />
            LIVE
          </div>
        </div>
      </header>

      <main className="main-content">
        <StatsBar stats={stats} />
        <SearchPanel onSearch={handleSearch} loading={loading} />

        {notification && (
          <div className={`notification ${notification.type}`}>
            <span className="notification-icon">
              {notification.type === "success" && "✓"}
              {notification.type === "warning" && "⚠"}
              {notification.type === "error" && "✕"}
            </span>
            <span className="notification-text">{notification.message}</span>
          </div>
        )}

        {error && (
          <div className="notification error">
            <span className="notification-icon">✕</span>
            <span className="notification-text">{error}</span>
          </div>
        )}

        {searchResult && (
          <ResultCard
            data={searchResult}
            onCheckIn={handleCheckIn}
            loading={loading}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>ACM Students Chapter &copy; {new Date().getFullYear()} &middot; Gate Pass System</p>
        <p className="developer-credit">Developed by <a href="https://www.linkedin.com/in/sanatsinhaa/" target="_blank" rel="noopener noreferrer" className="dev-name">Sanat Sinha</a></p>
      </footer>
    </div>
  );
}

export default App;
