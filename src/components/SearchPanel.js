import React, { useState, useRef, useEffect } from "react";
import BarcodeScanner from "./BarcodeScanner";

function SearchPanel({ onSearch, loading }) {
  const [regNo, setRegNo] = useState("");
  const [mode, setMode] = useState("scan"); // "scan" or "manual"
  const inputRef = useRef(null);

  useEffect(() => {
    if (mode === "manual") {
      inputRef.current?.focus();
    }
  }, [mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (regNo.trim()) {
      onSearch(regNo.trim());
    }
  };

  const handleClear = () => {
    setRegNo("");
    inputRef.current?.focus();
  };

  const handleBarcodeScan = (scannedValue) => {
    setRegNo(scannedValue);
    onSearch(scannedValue);
  };

  return (
    <div className="search-panel">
      {/* Tab Switcher */}
      <div className="search-tabs">
        <button
          className={`tab-btn ${mode === "scan" ? "active" : ""}`}
          onClick={() => setMode("scan")}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7V5a2 2 0 012-2h2" />
            <path d="M17 3h2a2 2 0 012 2v2" />
            <path d="M21 17v2a2 2 0 01-2 2h-2" />
            <path d="M7 21H5a2 2 0 01-2-2v-2" />
            <line x1="7" y1="12" x2="17" y2="12" />
          </svg>
          Scan Barcode
        </button>
        <button
          className={`tab-btn ${mode === "manual" ? "active" : ""}`}
          onClick={() => setMode("manual")}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          Manual Search
        </button>
      </div>

      {/* Scan Mode */}
      {mode === "scan" && (
        <BarcodeScanner onScan={handleBarcodeScan} loading={loading} />
      )}

      {/* Manual Mode */}
      {mode === "manual" && (
        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              placeholder="Enter Registration Number..."
              className="search-input"
              disabled={loading}
            />
            {regNo && (
              <button type="button" className="clear-btn" onClick={handleClear}>
                ✕
              </button>
            )}
          </div>
          <button type="submit" className="search-btn" disabled={loading || !regNo.trim()}>
            {loading ? (
              <span className="spinner" />
            ) : (
              "Search"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default SearchPanel;
