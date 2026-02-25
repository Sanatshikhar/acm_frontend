import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

const ALL_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.PDF_417,
  Html5QrcodeSupportedFormats.AZTEC,
];

function BarcodeScanner({ onScan, loading }) {
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [cameraType, setCameraType] = useState("environment");
  const [lastScanned, setLastScanned] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 1, step: 0.1 });
  const [zoomSupported, setZoomSupported] = useState(false);
  const scannerRef = useRef(null);
  const lastScanRef = useRef("");
  const lastScanTimeRef = useRef(0);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
    setStarting(false);
    setTorchOn(false);
    setTorchSupported(false);
    setZoomLevel(1);
    setZoomSupported(false);
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      const track = scannerRef.current.getRunningTrackSettings?.();
      if (!track) return;
      const videoTrack = scannerRef.current
        .getRunningTrackCameraCapabilities?.();
      if (videoTrack?.torchFeature?.()) {
        const newState = !torchOn;
        await videoTrack.torchFeature().apply(newState);
        setTorchOn(newState);
      }
    } catch (e) {
      // Try alternative method
      try {
        const video = document.querySelector("#barcode-reader video");
        if (video && video.srcObject) {
          const track = video.srcObject.getVideoTracks()[0];
          if (track) {
            await track.applyConstraints({
              advanced: [{ torch: !torchOn }],
            });
            setTorchOn(!torchOn);
          }
        }
      } catch (e2) {
        console.log("Torch not supported");
      }
    }
  }, [torchOn]);

  const switchCamera = useCallback(async () => {
    const newType = cameraType === "environment" ? "user" : "environment";
    setCameraType(newType);
    if (scanning) {
      await stopScanner();
      // Small delay then restart
      setTimeout(() => {
        startScannerWithCamera(newType);
      }, 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraType, scanning, stopScanner]);

  const startScannerWithCamera = useCallback(async (facingMode) => {
    setError("");
    setStarting(true);

    await new Promise((r) => setTimeout(r, 400));

    try {
      const el = document.getElementById("barcode-reader");
      if (!el) {
        setError("Scanner element not found. Try refreshing.");
        setStarting(false);
        return;
      }

      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch (e) {}
        try { scannerRef.current.clear(); } catch (e) {}
      }
      el.innerHTML = "";

      const scanner = new Html5Qrcode("barcode-reader", {
        formatsToSupport: ALL_FORMATS,
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,  // Use native BarcodeDetector API if available (faster + better blur handling)
        },
      });
      scannerRef.current = scanner;

      // Get available cameras and pick rear HD camera
      let cameraConfig = { facingMode: facingMode || "environment" };
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          // Prefer rear camera
          const rearCam = cameras.find(c =>
            c.label.toLowerCase().includes("back") ||
            c.label.toLowerCase().includes("rear") ||
            c.label.toLowerCase().includes("environment")
          );
          if (rearCam && facingMode !== "user") {
            cameraConfig = rearCam.id;
          }
        }
      } catch (e) {
        // fallback to facingMode
      }

      await scanner.start(
        cameraConfig,
        {
          fps: 20,                    // Higher FPS = more scan attempts for small barcodes
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Use 92% of viewport — maximum scan area for small barcodes
            const w = Math.floor(viewfinderWidth * 0.92);
            const h = Math.floor(viewfinderHeight * 0.75);
            return { width: Math.max(w, 280), height: Math.max(h, 180) };
          },
          aspectRatio: 1.5,
          disableFlip: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        },
        (decodedText) => {
          // Debounce: prevent rapid duplicate scans
          const now = Date.now();
          if (
            decodedText === lastScanRef.current &&
            now - lastScanTimeRef.current < 3000
          ) {
            return;
          }
          lastScanRef.current = decodedText;
          lastScanTimeRef.current = now;

          // Vibrate on successful scan (mobile)
          if (navigator.vibrate) navigator.vibrate(200);

          const trimmed = decodedText.trim();
          setLastScanned(trimmed);
          onScan(trimmed);
          stopScanner();
        },
        () => {}
      );

      setScanning(true);
      setStarting(false);

      // After scanner starts, force HD + continuous autofocus + sharpness
      const applyHDConstraints = async () => {
        try {
          const video = document.querySelector("#barcode-reader video");
          if (!video || !video.srcObject) return;

          const track = video.srcObject.getVideoTracks()[0];
          if (!track) return;

          const capabilities = track.getCapabilities?.() || {};

          // Build constraints
          const constraints = {};
          const advanced = [];

          // Force highest resolution possible
          if (capabilities.width) {
            constraints.width = { ideal: Math.min(capabilities.width.max || 1920, 1920) };
          }
          if (capabilities.height) {
            constraints.height = { ideal: Math.min(capabilities.height.max || 1080, 1080) };
          }

          // Continuous autofocus — CRITICAL for blur
          if (capabilities.focusMode?.includes("continuous")) {
            advanced.push({ focusMode: "continuous" });
          } else if (capabilities.focusMode?.includes("auto")) {
            advanced.push({ focusMode: "auto" });
          }

          // Sharpness boost if supported
          if (capabilities.sharpness) {
            advanced.push({ sharpness: capabilities.sharpness.max || 100 });
          }

          // Contrast boost if supported  
          if (capabilities.contrast) {
            advanced.push({ contrast: Math.min((capabilities.contrast.max || 100), 150) });
          }

          // Exposure compensation for clearer image
          if (capabilities.exposureCompensation) {
            advanced.push({ exposureCompensation: 0 });
          }

          // Torch support check
          if (capabilities.torch) {
            setTorchSupported(true);
          }

          // ── AUTO-ZOOM for small barcodes ──
          if (capabilities.zoom) {
            const minZoom = capabilities.zoom.min || 1;
            const maxZoom = capabilities.zoom.max || 1;
            const stepZoom = capabilities.zoom.step || 0.1;
            if (maxZoom > 1) {
              setZoomSupported(true);
              setZoomRange({ min: minZoom, max: maxZoom, step: stepZoom });
              // Auto-zoom to 2x (or max if less than 2x) for small barcodes
              const autoZoom = Math.min(2, maxZoom);
              advanced.push({ zoom: autoZoom });
              setZoomLevel(autoZoom);
            }
          }

          if (advanced.length > 0) {
            constraints.advanced = advanced;
          }

          await track.applyConstraints(constraints);

          // Apply CSS sharpening filter on the video for visual clarity
          video.style.filter = "contrast(1.15) brightness(1.05)";
        } catch (e) {
          // Non-critical, ignore
        }
      };

      // Apply immediately + retry after 1s (some cameras need time)
      setTimeout(applyHDConstraints, 500);
      setTimeout(applyHDConstraints, 1500);
    } catch (err) {
      console.error("Scanner error:", err);
      setStarting(false);
      if (err.toString().includes("NotAllowedError")) {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err.toString().includes("NotFoundError")) {
        setError("No camera found on this device.");
      } else if (err.toString().includes("NotReadableError")) {
        setError("Camera is in use by another app. Please close it and try again.");
      } else {
        setError("Failed to start camera: " + err.toString());
      }
    }
  }, [onScan, stopScanner]);

  const startScanner = useCallback(() => {
    startScannerWithCamera(cameraType);
  }, [cameraType, startScannerWithCamera]);

  // Handle zoom slider change
  const handleZoomChange = useCallback(async (newZoom) => {
    const val = parseFloat(newZoom);
    setZoomLevel(val);
    try {
      const video = document.querySelector("#barcode-reader video");
      if (video && video.srcObject) {
        const track = video.srcObject.getVideoTracks()[0];
        if (track) {
          await track.applyConstraints({ advanced: [{ zoom: val }] });
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch (e) {}
        try { scannerRef.current.clear(); } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="barcode-scanner">
      {!scanning && !starting && (
        <div className="scanner-start">
          <button
            className="start-scan-btn"
            onClick={startScanner}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7V5a2 2 0 012-2h2" />
              <path d="M17 3h2a2 2 0 012 2v2" />
              <path d="M21 17v2a2 2 0 01-2 2h-2" />
              <path d="M7 21H5a2 2 0 01-2-2v-2" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="7" y1="8" x2="13" y2="8" />
              <line x1="7" y1="16" x2="15" y2="16" />
            </svg>
            Open Camera &amp; Scan Barcode
          </button>
          <p className="scanner-hint">Point your camera at the barcode on the participant's ID card</p>
        </div>
      )}

      {starting && (
        <div className="scanner-loading">
          <span className="spinner" /> Starting camera...
        </div>
      )}

      {(scanning || starting) && (
        <div className="scanner-active">
          <div id="barcode-reader" className="scanner-viewport" />
          {zoomSupported && (
            <div className="zoom-control">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              <input
                type="range"
                className="zoom-slider"
                min={zoomRange.min}
                max={zoomRange.max}
                step={zoomRange.step}
                value={zoomLevel}
                onChange={(e) => handleZoomChange(e.target.value)}
              />
              <span className="zoom-label">{zoomLevel.toFixed(1)}x</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
          )}
          <div className="scanner-controls">
            {torchSupported && (
              <button
                className={`scanner-ctrl-btn ${torchOn ? "active" : ""}`}
                onClick={toggleTorch}
                title="Toggle flashlight"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill={torchOn ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M9 18h6M10 22h4M12 2v1M4.22 4.22l.71.71M1 12h1M18.36 4.22l-.71.71M23 12h-1M15.5 7.5L12 2l-3.5 5.5a5 5 0 105 5l1-5z"/>
                </svg>
                {torchOn ? "Light ON" : "Light"}
              </button>
            )}
            <button
              className="scanner-ctrl-btn"
              onClick={switchCamera}
              title="Switch camera"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 16v4a2 2 0 01-2 2H6l4-4"/>
                <path d="M4 8V4a2 2 0 012-2h12l-4 4"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Flip
            </button>
            <button className="scanner-ctrl-btn danger" onClick={stopScanner}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Close
            </button>
          </div>
          <p className="scanner-tip">Hold steady &amp; close to the barcode for best results</p>
        </div>
      )}

      {lastScanned && (
        <div className="last-scanned">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7V5a2 2 0 012-2h2" />
            <path d="M17 3h2a2 2 0 012 2v2" />
            <path d="M21 17v2a2 2 0 01-2 2h-2" />
            <path d="M7 21H5a2 2 0 01-2-2v-2" />
            <line x1="7" y1="12" x2="17" y2="12" />
          </svg>
          <span className="last-scanned-label">Scanned:</span>
          <span className="last-scanned-value">{lastScanned}</span>
        </div>
      )}

      {error && (
        <div className="scanner-error">
          <span>⚠</span> {error}
        </div>
      )}
    </div>
  );
}

export default BarcodeScanner;
