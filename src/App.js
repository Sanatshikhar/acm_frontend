import React, { useState, useEffect } from "react";
import SearchPanel from "./components/SearchPanel";
import StatsBar from "./components/StatsBar";
import ResultCard from "./components/ResultCard";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [isLightTheme, setIsLightTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "light") return true;
      if (savedTheme === "dark") return false;
      return true;
    } catch {
      return true;
    }
  });
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, scanned: 0, remaining: 0 });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    document.body.classList.toggle("light-theme", isLightTheme);
    try {
      localStorage.setItem("theme", isLightTheme ? "light" : "dark");
    } catch {
      // ignore storage errors
    }
  }, [isLightTheme]);

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
          <div className="header-actions">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={() => setIsLightTheme((prev) => !prev)}
              aria-label={`Switch to ${isLightTheme ? "dark" : "light"} theme`}
              title={`Switch to ${isLightTheme ? "dark" : "light"} theme`}
            >
              <span className="theme-icon" aria-hidden="true">
                {isLightTheme ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                  </svg>
                )}
              </span>
            </button>
            <div className="header-live-badge">
              <span className="live-dot" />
              LIVE
            </div>
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
        <p className="developer-credit">Design & Developed by <a href="https://www.linkedin.com/in/sanatsinhaa/" target="_blank" rel="noopener noreferrer" className="dev-name">Sanat Sinha</a></p>
      </footer>
    </div>
  );
}

export default App;
