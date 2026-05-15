////////////////////////////////   RESPONSIVE   ////////////////////////////////////

import { useState, useEffect, useRef, useCallback } from "react";
import { saveDriverActivityLogApi } from "../../api/authapi";

// ─────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────
const MOVE_INTERVAL_MS = 15000;
const ROTATION_SECONDS = 10;
const ACTIVITY_LOG_MS  = 30000;

const GOOGLE_MAPS_API_KEY = "AIzaSyD_tyUWEaa3u0V8SVlHwKtl9f1eppf8dD4";

const FENCE_COLORS = [
  "#2196F3", "#FF9800", "#9C27B0",
  "#F44336", "#4CAF50", "#E91E63",
];

// ─────────────────────────────────────────────────────────────────
//  GEOMETRY HELPERS
// ─────────────────────────────────────────────────────────────────
function isPointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) return false;
  let count = 0;
  const n = polygon.length;
  for (let j = 0; j < n; j++) {
    const a = polygon[j];
    const b = polygon[(j + 1) % n];
    if (
      (a.lng > point.lng) !== (b.lng > point.lng) &&
      point.lat <
        ((b.lat - a.lat) * (point.lng - a.lng)) / (b.lng - a.lng) + a.lat
    ) count++;
  }
  return count % 2 === 1;
}

function computeCenter(points) {
  if (!points || !points.length) return { lat: 24.86, lng: 67.01 };
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}

// ─────────────────────────────────────────────────────────────────
//  GOOGLE MAPS LOADER
// ─────────────────────────────────────────────────────────────────
let gmapsPromise = null;
function loadGoogleMaps(apiKey) {
  if (gmapsPromise) return gmapsPromise;
  gmapsPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.maps) { resolve(window.google.maps); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload  = () => resolve(window.google.maps);
    script.onerror = () => { gmapsPromise = null; reject(new Error("Google Maps failed to load")); };
    document.head.appendChild(script);
  });
  return gmapsPromise;
}

// ─────────────────────────────────────────────────────────────────
//  MAP CANVAS
// ─────────────────────────────────────────────────────────────────
function MapCanvas({
  adsData,
  route,
  currentStep,
  activeAdIndexes,
  isRunning,
  routeLocked,
  onCanvasClick,
}) {
  const mapDivRef          = useRef(null);
  const mapRef             = useRef(null);
  const mapInitDoneRef     = useRef(false);
  const fenceEntriesRef    = useRef([]);
  const routePolyRef       = useRef(null);
  const drivenPolyRef      = useRef(null);
  const waypointMarkersRef = useRef([]);
  const carMarkerRef       = useRef(null);

  const onCanvasClickRef   = useRef(onCanvasClick);
  const routeLockedRef     = useRef(routeLocked);
  const activeAdIndexesRef = useRef(activeAdIndexes);
  const adsDataRef         = useRef(adsData);

  useEffect(() => { onCanvasClickRef.current   = onCanvasClick;   }, [onCanvasClick]);
  useEffect(() => { routeLockedRef.current      = routeLocked;     }, [routeLocked]);
  useEffect(() => { activeAdIndexesRef.current  = activeAdIndexes; }, [activeAdIndexes]);
  useEffect(() => { adsDataRef.current          = adsData;         }, [adsData]);

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [loadError,  setLoadError]  = useState(null);

  const handleMapClick = useCallback((latLng) => {
    if (routeLockedRef.current) return;
    onCanvasClickRef.current({ lat: latLng.lat(), lng: latLng.lng() });
  }, []);

  const drawFences = useCallback((map, ads, activeIdxs) => {
    fenceEntriesRef.current.forEach(({ poly, listeners }) => {
      listeners.forEach((l) => window.google.maps.event.removeListener(l));
      poly.setMap(null);
    });
    fenceEntriesRef.current = [];

    (ads || []).forEach((ad, i) => {
      if (!ad.fence || ad.fence.length < 3) return;
      const color    = FENCE_COLORS[i % FENCE_COLORS.length];
      const isActive = (activeIdxs || []).includes(i);

      const poly = new window.google.maps.Polygon({
        paths:         ad.fence.map((p) => ({ lat: p.lat, lng: p.lng })),
        strokeColor:   color,
        strokeWeight:  isActive ? 3 : 1.5,
        strokeOpacity: 1,
        fillColor:     color,
        fillOpacity:   isActive ? 0.28 : 0.12,
        map,
        zIndex:   isActive ? 3 : 1,
        clickable: true,
      });

      const clickListener = poly.addListener("click", (e) => handleMapClick(e.latLng));
      fenceEntriesRef.current.push({ poly, listeners: [clickListener] });
    });
  }, [handleMapClick]);

  useEffect(() => {
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => setMapsLoaded(true))
      .catch((e) => setLoadError(e.message));
  }, []);

  useEffect(() => {
    if (!mapsLoaded || !mapDivRef.current || mapInitDoneRef.current) return;
    mapInitDoneRef.current = true;

    const ads       = adsDataRef.current || [];
    const allPoints = ads.flatMap((a) => a.fence || []);
    const center    = computeCenter(
      allPoints.length ? allPoints : [{ lat: 24.86, lng: 67.01 }]
    );

    const map = new window.google.maps.Map(mapDivRef.current, {
      center,
      zoom: 13,
      mapTypeId: "roadmap",
      gestureHandling: "greedy",
      disableDefaultUI: false,
      styles: [
        { featureType: "poi",     stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });
    mapRef.current = map;

    map.addListener("click", (e) => handleMapClick(e.latLng));
    drawFences(map, ads, activeAdIndexesRef.current);

    if (allPoints.length) {
      const bounds = new window.google.maps.LatLngBounds();
      allPoints.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, 60);
    }
  }, [mapsLoaded, handleMapClick, drawFences]);

  useEffect(() => {
    if (!mapRef.current) return;
    drawFences(mapRef.current, adsData, activeAdIndexes);
  }, [adsData, activeAdIndexes, drawFences]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (routePolyRef.current)  { routePolyRef.current.setMap(null);  routePolyRef.current  = null; }
    if (drivenPolyRef.current) { drivenPolyRef.current.setMap(null); drivenPolyRef.current = null; }

    if (route.length >= 2) {
      routePolyRef.current = new window.google.maps.Polyline({
        path:          route.map((p) => ({ lat: p.lat, lng: p.lng })),
        strokeColor:   "#90a4ae",
        strokeWeight:  3,
        strokeOpacity: 0.7,
        icons: [{
          icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
          offset: "0", repeat: "16px",
        }],
        map:    mapRef.current,
        zIndex: 2,
      });
    }

    if (currentStep > 0 && route.length > 0) {
      drivenPolyRef.current = new window.google.maps.Polyline({
        path:          route.slice(0, currentStep + 1).map((p) => ({ lat: p.lat, lng: p.lng })),
        strokeColor:   "#00c4aa",
        strokeWeight:  5,
        strokeOpacity: 1,
        map:    mapRef.current,
        zIndex: 4,
      });
    }
  }, [route, currentStep]);

  useEffect(() => {
    if (!mapRef.current) return;
    waypointMarkersRef.current.forEach((m) => m.setMap(null));
    waypointMarkersRef.current = [];

    if (routeLocked) return;

    route.forEach((p, i) => {
      const marker = new window.google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map:      mapRef.current,
        label: { text: String(i + 1), color: "white", fontWeight: "bold", fontSize: "11px" },
        icon: {
          path:        window.google.maps.SymbolPath.CIRCLE,
          scale:       12,
          fillColor:   i === 0 ? "#4caf50" : "#00c4aa",
          fillOpacity: 0.9,
          strokeColor: "white",
          strokeWeight: 1.5,
        },
        zIndex: 5,
      });
      waypointMarkersRef.current.push(marker);
    });
  }, [route, routeLocked]);

  useEffect(() => {
    if (!mapRef.current) return;

    const shouldShow = route.length > 0 && (isRunning || (routeLocked && currentStep > 0));
    if (!shouldShow) {
      if (carMarkerRef.current) { carMarkerRef.current.setMap(null); carMarkerRef.current = null; }
      return;
    }

    const pos    = route[Math.min(currentStep, route.length - 1)];
    const carSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <ellipse cx="18" cy="44" rx="12" ry="4" fill="rgba(0,0,0,.18)"/>
      <rect x="4" y="18" width="28" height="20" rx="6" fill="#00c4aa"/>
      <rect x="9" y="8" width="18" height="13" rx="5" fill="#009982"/>
      <rect x="11" y="9.5" width="14" height="9" rx="3" fill="rgba(255,255,255,.85)"/>
      <circle cx="10" cy="39" r="5" fill="#1a1a2e"/>
      <circle cx="26" cy="39" r="5" fill="#1a1a2e"/>
      <circle cx="10" cy="39" r="2.5" fill="rgba(255,255,255,.5)"/>
      <circle cx="26" cy="39" r="2.5" fill="rgba(255,255,255,.5)"/>
      <rect x="4"  y="19" width="6" height="4" rx="1.5" fill="#fff176"/>
      <rect x="26" y="19" width="6" height="4" rx="1.5" fill="#fff176"/>
    </svg>`;

    if (!carMarkerRef.current) {
      carMarkerRef.current = new window.google.maps.Marker({
        position: { lat: pos.lat, lng: pos.lng },
        map:      mapRef.current,
        icon: {
          url:        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(carSvg)}`,
          scaledSize: new window.google.maps.Size(36, 48),
          anchor:     new window.google.maps.Point(18, 42),
        },
        zIndex: 20,
      });
    } else {
      carMarkerRef.current.setPosition({ lat: pos.lat, lng: pos.lng });
      carMarkerRef.current.setMap(mapRef.current);
      mapRef.current.panTo({ lat: pos.lat, lng: pos.lng });
    }
  }, [route, currentStep, isRunning, routeLocked]);

  if (loadError) {
    return (
      <div style={{
        width: "100%", height: "100%", display: "flex",
        alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 10, background: "#f5f7fa",
      }}>
        <span style={{ fontSize: 28 }}>🗺️</span>
        <div style={{ color: "#d32f2f", fontSize: 13, textAlign: "center", padding: "0 24px" }}>
          Google Maps failed to load.<br />Check your API key or network connection.
        </div>
      </div>
    );
  }

  if (!mapsLoaded) {
    return (
      <div style={{
        width: "100%", height: "100%", display: "flex",
        alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 12, background: "#f5f7fa",
      }}>
        <div style={mkSpinner("#00c4aa")} />
        <div style={{ color: "#aaa", fontSize: 13 }}>Loading map…</div>
      </div>
    );
  }

  return (
    <div
      ref={mapDivRef}
      style={{ width: "100%", height: "100%", cursor: routeLocked ? "default" : "crosshair" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
//  TIME PICKER MODAL
// ─────────────────────────────────────────────────────────────────
function TimePickerModal({ onConfirm, onCancel }) {
  // Default to current local time as HH:MM
  const now = new Date();
  const defaultTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const [pickedTime, setPickedTime] = useState(defaultTime);

  const handleConfirm = () => {
    if (!pickedTime) return;
    const [h, m] = pickedTime.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    onConfirm(d);
  };

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "rgba(0,0,0,.60)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 50,
      animation: "adSimFadeIn .2s ease",
    }}>
      <div style={{
        background: "white",
        borderRadius: 24,
        padding: "32px 28px 24px",
        width: 300,
        boxShadow: "0 16px 48px rgba(0,0,0,.3)",
        display: "flex", flexDirection: "column", gap: 20,
        animation: "adSimSlideUp .25s ease",
      }}>
        {/* Icon + Title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "linear-gradient(135deg,#00c4aa,#00a896)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 18px rgba(0,196,170,.35)",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#1a1a2e" }}>Set Simulation Time</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 4, lineHeight: 1.5 }}>
              Choose the clock time for this trip.<br/>It will tick forward from this moment.
            </div>
          </div>
        </div>

        {/* Time Input */}
        <div style={{
          background: "linear-gradient(135deg,rgba(0,196,170,.07),rgba(0,168,150,.04))",
          border: "2px solid rgba(0,196,170,.25)",
          borderRadius: 16,
          padding: "14px 16px",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#00c4aa", letterSpacing: 0.8 }}>
            START TIME
          </div>
          <input
            type="time"
            value={pickedTime}
            onChange={(e) => setPickedTime(e.target.value)}
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#1a1a2e",
              border: "none",
              background: "transparent",
              outline: "none",
              width: "100%",
              letterSpacing: 2,
              fontFamily: "'DM Sans','Segoe UI',sans-serif",
            }}
          />
        </div>

        {/* Note */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          background: "rgba(255,152,0,.07)",
          border: "1px solid rgba(255,152,0,.2)",
          borderRadius: 10, padding: "9px 11px",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2.2" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize: 11, color: "#e65100", lineHeight: 1.5 }}>
            This time will be sent as <strong>RecordedAt</strong> in activity logs, not the device's real UTC time.
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 12,
              border: "1.5px solid #e8e8e8",
              background: "white", fontSize: 13, fontWeight: 700,
              color: "#999", cursor: "pointer",
              transition: "background .15s",
            }}
          >
            Cancel
          </button>
          <button
            disabled={!pickedTime}
            onClick={handleConfirm}
            style={{
              flex: 2, padding: "12px 0", borderRadius: 12, border: "none",
              background: pickedTime
                ? "linear-gradient(135deg,#00c4aa,#00a896)"
                : "#e0e0e0",
              fontSize: 13, fontWeight: 800,
              color: "white",
              cursor: pickedTime ? "pointer" : "default",
              boxShadow: pickedTime ? "0 6px 18px rgba(0,196,170,.4)" : "none",
              transition: "all .2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Start Trip
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  LEGEND
// ─────────────────────────────────────────────────────────────────
function Legend({ adsData, activeAdIndexes }) {
  if (!adsData || !adsData.length) return null;
  return (
    <div style={{
      position: "absolute", top: 12, left: 12,
      background: "rgba(255,255,255,.97)", borderRadius: 12,
      padding: "10px 12px", boxShadow: "0 2px 10px rgba(0,0,0,.12)",
      maxWidth: 180, zIndex: 10, pointerEvents: "none",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#999", letterSpacing: 0.5, marginBottom: 7 }}>
        AD FENCES
      </div>
      {adsData.map((ad, i) => {
        const color  = FENCE_COLORS[i % FENCE_COLORS.length];
        const active = activeAdIndexes.includes(i);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
            <div style={{
              width: 11, height: 11, borderRadius: 3,
              background: active ? color : `${color}88`, flexShrink: 0,
              boxShadow: active ? `0 0 6px ${color}88` : "none",
            }} />
            <span style={{
              fontSize: 10, color: active ? "#222" : "#888",
              fontWeight: active ? 700 : 400,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{ad.adTitle}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  ACTIVITY TOAST
// ─────────────────────────────────────────────────────────────────
function ActivityToast({ toast, onDone }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const hide   = setTimeout(() => setVisible(false), 3200);
    const remove = setTimeout(onDone, 4000);
    return () => { clearTimeout(hide); clearTimeout(remove); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const color = toast.isValid ? "#00c4aa" : toast.isError ? "#FF9800" : "#FF5252";
  return (
    <div style={{
      position: "absolute", top: 14, left: 14, right: 14, zIndex: 100,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(-12px)",
      transition: "opacity .35s ease, transform .35s ease",
      pointerEvents: "none",
    }}>
      <div style={{
        background: "white", borderRadius: 14,
        border: `1.5px solid ${color}66`,
        boxShadow: `0 4px 12px ${color}26, 0 2px 6px rgba(0,0,0,.08)`,
        padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <div style={{
          padding: 8, borderRadius: 10, background: `${color}1a`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {toast.isValid
            ? <CheckCircleIcon color={color} />
            : toast.isError
              ? <WifiOffIcon color={color} />
              : <CancelIcon color={color} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>
              {toast.isValid ? "Activity Logged" : "Log Skipped"}
            </span>
            {toast.tripId != null && (
              <span style={{
                fontSize: 10, fontWeight: 600, color,
                background: `${color}1a`, borderRadius: 6, padding: "2px 6px",
              }}>Trip #{toast.tripId}</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#777", lineHeight: 1.4 }}>{toast.message}</div>
          {toast.isValid && toast.km != null && toast.min != null && (
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <StatChip icon="route" label={`${toast.km.toFixed(3)} km`} color={color} />
              <StatChip icon="timer" label={`${toast.min.toFixed(1)} min`} color={color} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatChip({ icon, label, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {icon === "route"
        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      }
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>
    </div>
  );
}
function CheckCircleIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}
function CancelIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  );
}
function WifiOffIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39"/>
      <path d="M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88"/>
      <path d="M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
//  BOTTOM PANEL
// ─────────────────────────────────────────────────────────────────
function BottomPanel({
  adsData, activeAdIndexes, displayAdIndex, inOverlapZone,
  secondsLeft, isRunning, vehicle, currentStep, route, routeLocked,
}) {
  if (!isRunning && !routeLocked) return null;

  const hasAd = activeAdIndexes.length > 0 && displayAdIndex < (adsData || []).length;
  const ad    = hasAd ? adsData[displayAdIndex] : null;

  if (inOverlapZone && activeAdIndexes.length > 1 && ad) {
    const displayPos = activeAdIndexes.indexOf(displayAdIndex);
    return (
      <div style={{
        margin: "0 12px 12px", background: "white", borderRadius: 16,
        boxShadow: "0 -4px 16px rgba(0,0,0,.15)",
        border: "1.5px solid rgba(244,82,82,.35)",
        animation: "adSimSlideUp .35s ease", overflow: "hidden",
      }}>
        <div style={{ background: "#fff0f0", padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ fontSize: 12, color: "#d32f2f", fontWeight: 700, flex: 1 }}>Overlap Zone — Rotating Ads</span>
          <span style={{ fontSize: 11, color: "#aaa" }}>{displayPos + 1} / {activeAdIndexes.length}</span>
        </div>
        <AdRow ad={ad} isOverlap secondsLeft={secondsLeft} />
        <div style={{ display: "flex", justifyContent: "center", gap: 5, paddingBottom: 8 }}>
          {activeAdIndexes.map((_, i) => (
            <div key={i} style={{
              height: 7, width: i === displayPos ? 18 : 7, borderRadius: 4,
              background: i === displayPos ? "#00c4aa" : "#e0e0e0",
              transition: "width .3s ease",
            }} />
          ))}
        </div>
        <div style={{ height: 5, background: "#f0f0f0", margin: "0 12px 12px", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", background: "#00c4aa", borderRadius: 2,
            width: `${(secondsLeft / ROTATION_SECONDS) * 100}%`,
            transition: "width 1s linear",
          }} />
        </div>
      </div>
    );
  }

  const status = isRunning
    ? `Step ${currentStep + 1} / ${route.length}`
    : routeLocked ? "Trip ended" : "Ready";

  return (
    <div style={{ margin: "0 12px 12px", background: "white", borderRadius: 16, boxShadow: "0 -2px 12px rgba(0,0,0,.1)" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: "rgba(0,196,170,.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00c4aa" strokeWidth="2.2">
            <path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17a2 2 0 104 0m6 0a2 2 0 104 0"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{vehicle?.VehicleReg}</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>{status}</div>
        </div>
        <div style={{
          padding: "5px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: isRunning ? "rgba(76,175,80,.1)" : "rgba(0,0,0,.05)",
          border: `1px solid ${isRunning ? "rgba(76,175,80,.5)" : "#ddd"}`,
          color: isRunning ? "#43a047" : "#999",
        }}>
          {isRunning ? "Running" : "Idle"}
        </div>
      </div>
      {ad && (
        <>
          <div style={{ height: 1, background: "#f0f0f0" }} />
          <AdRow ad={ad} isOverlap={false} secondsLeft={0} />
        </>
      )}
      {!ad && isRunning && (
        <>
          <div style={{ height: 1, background: "#f0f0f0" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
            <span style={{ fontSize: 12, color: "#aaa" }}>No ad fence at current position</span>
          </div>
        </>
      )}
    </div>
  );
}

function AdRow({ ad, isOverlap, secondsLeft }) {
  const imgSize = isOverlap ? 80 : 64;
  return (
    <div style={{ display: "flex", gap: 12, padding: 12, alignItems: "flex-start" }}>
      <div style={{
        width: imgSize, height: imgSize, borderRadius: 10, flexShrink: 0,
        border: "1.5px solid rgba(0,196,170,.25)", background: "#f8f8f8",
        overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {ad.mediaPath ? (
          <img src={ad.mediaPath} alt={ad.adTitle}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.target.style.display = "none"; }} />
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.8">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
          </svg>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: "#aaa", fontWeight: 500, marginBottom: 3 }}>
          {isOverlap ? "Now Displaying" : "Active Ad"}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#222", lineHeight: 1.3 }}>{ad.adTitle}</div>
        <div style={{ fontSize: 10, color: "#ccc", marginTop: 3 }}>Ad #{ad.adId}</div>
        {isOverlap && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00c4aa" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            <span style={{ fontSize: 11, color: "#00c4aa" }}>Next in {secondsLeft}s</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  TOOLBAR / FLOATING BUTTONS
// ─────────────────────────────────────────────────────────────────
function ToolbarBtn({ label, color, onClick, disabled, children }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        background: "white", border: "none", borderRadius: 10,
        padding: "7px 12px", cursor: disabled ? "default" : "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,.12)", marginBottom: 8,
        opacity: disabled ? 0.3 : 1, transition: "opacity .2s",
      }}
    >
      <span style={{ color, display: "flex" }}>{children}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
    </button>
  );
}

function FloatingBtn({ label, color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        background: color, border: "none", borderRadius: 14,
        padding: "11px 18px", cursor: "pointer", marginBottom: 8,
        boxShadow: `0 4px 16px ${color}66`,
        color: "white", fontSize: 13, fontWeight: 700, outline: "none",
      }}
    >
      {children}{label}
    </button>
  );
}

function mkSpinner(color) {
  return {
    width: 36, height: 36, borderRadius: "50%",
    border: `3px solid ${color}33`, borderTopColor: color,
    animation: "adSimSpin 0.7s linear infinite",
  };
}

// ─────────────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────────────
export default function AdSimulationMap({
  agency,
  vehicle,
  simulationStartTime,
  adsData: initialAdsData,
  loadingAds,
  adsError,
  onBack,
}) {
  const [adsData] = useState(() => initialAdsData || []);

  const [route,       setRoute]       = useState([]);
  const [routeLocked, setRouteLocked] = useState(false);

  const [isRunning,   setIsRunning]   = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const moveTimerRef = useRef(null);

  const [activeAdIndexes, setActiveAdIndexes] = useState([]);
  const [inOverlapZone,   setInOverlapZone]   = useState(false);
  const [displayAdIndex,  setDisplayAdIndex]  = useState(0);
  const [secondsLeft,     setSecondsLeft]     = useState(ROTATION_SECONDS);
  const rotateTimerRef    = useRef(null);
  const countdownTimerRef = useRef(null);

  // ── Time picker state ──────────────────────────────────────────
  const [showTimePicker, setShowTimePicker] = useState(false);

  // liveTime: starts from simulationStartTime (or now), ticks every second while running
  const [liveTime, setLiveTime] = useState(simulationStartTime || new Date());
  const liveTimeIntervalRef = useRef(null);

  // Start ticking when isRunning becomes true, stop when false
  useEffect(() => {
    if (isRunning) {
      liveTimeIntervalRef.current = setInterval(
        () => setLiveTime((p) => new Date(p.getTime() + 1000)),
        1000
      );
    } else {
      clearInterval(liveTimeIntervalRef.current);
      liveTimeIntervalRef.current = null;
    }
    return () => clearInterval(liveTimeIntervalRef.current);
  }, [isRunning]);

  const clockStr = [liveTime.getHours(), liveTime.getMinutes(), liveTime.getSeconds()]
    .map((n) => String(n).padStart(2, "0")).join(":");

  const isSendingLog     = useRef(false);
  const activityTimerRef = useRef(null);

  const [toasts,      setToasts]      = useState([]);
  const [simpleToast, setSimpleToast] = useState(null);

  // stateRef: lets timers/callbacks read latest values without stale closures
  const stateRef = useRef({});
  stateRef.current = {
    isRunning, route, currentStep, activeAdIndexes,
    displayAdIndex, liveTime, adsData, inOverlapZone, routeLocked,
  };

  useEffect(() => () => {
    clearInterval(moveTimerRef.current);
    clearInterval(rotateTimerRef.current);
    clearInterval(countdownTimerRef.current);
    clearInterval(activityTimerRef.current);
    clearInterval(liveTimeIntervalRef.current);
  }, []);

  // ── zone detection ──────────────────────────────────────────────
  const checkZones = useCallback((step, currentRoute, ads) => {
    if (!currentRoute.length || step >= currentRoute.length) return { indexes: [] };
    const pos = currentRoute[step];
    const indexes = (ads || []).reduce((acc, ad, i) => {
      if (isPointInPolygon(pos, ad.fence)) acc.push(i);
      return acc;
    }, []);
    return { indexes };
  }, []);

  // ── rotation ────────────────────────────────────────────────────
  const stopRotation = useCallback(() => {
    clearInterval(rotateTimerRef.current);
    clearInterval(countdownTimerRef.current);
    rotateTimerRef.current = countdownTimerRef.current = null;
  }, []);

  const startRotation = useCallback((adIndexes) => {
    stopRotation();
    setSecondsLeft(ROTATION_SECONDS);
    countdownTimerRef.current = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? ROTATION_SECONDS : s - 1));
    }, 1000);
    rotateTimerRef.current = setInterval(() => {
      setDisplayAdIndex((prev) => {
        const pos  = adIndexes.indexOf(prev);
        return adIndexes[(pos + 1) % adIndexes.length];
      });
      setSecondsLeft(ROTATION_SECONDS);
    }, ROTATION_SECONDS * 1000);
  }, [stopRotation]);

  // ── apply zones ─────────────────────────────────────────────────
  const applyZonesDirect = useCallback((inFence, wasOverlap) => {
    if (inFence.length > 1) {
      if (!wasOverlap) {
        setInOverlapZone(true);
        setActiveAdIndexes(inFence);
        setDisplayAdIndex(inFence[0]);
        setSecondsLeft(ROTATION_SECONDS);
        startRotation(inFence);
      } else {
        setActiveAdIndexes(inFence);
      }
    } else if (inFence.length === 1) {
      if (wasOverlap) stopRotation();
      setInOverlapZone(false);
      setActiveAdIndexes(inFence);
      setDisplayAdIndex(inFence[0]);
    } else {
      if (wasOverlap) stopRotation();
      setInOverlapZone(false);
      setActiveAdIndexes([]);
    }
  }, [startRotation, stopRotation]);

  // ── activity log ─────────────────────────────────────────────────
  const sendActivityLog = useCallback(async () => {
    const s = stateRef.current;
    if (
      isSendingLog.current || !s.isRunning ||
      !s.route.length || s.currentStep >= s.route.length ||
      !s.activeAdIndexes.length || !s.adsData.length
    ) return;
    const driverId = vehicle?.VehicleOwner;
    if (!driverId) return;
    const pos = s.route[s.currentStep];
    const ad  = s.adsData[s.displayAdIndex];
    if (!ad) return;

    isSendingLog.current = true;
    try {
      // ── Use simulated clock time (local, NOT UTC) ──
      const t   = s.liveTime;
      const pad = (n) => String(n).padStart(2, "0");
      const recordedAt =
        `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}` +
        `T${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;

      const res  = await saveDriverActivityLogApi({
        DriverId:   driverId,
        VehicleReg: vehicle.VehicleReg,
        AdId:       ad.adId,
        Latitude:   pos.lat,
        Longitude:  pos.lng,
        RecordedAt: recordedAt,
      });
      const data = res.data ?? res;
      addToast({
        isValid: data.IsValid === true, isError: false,
        message: data.Message || "",
        km:     typeof data.TotalValidKm  === "number" ? data.TotalValidKm  : parseFloat(data.TotalValidKm  || 0),
        min:    typeof data.TotalValidMin === "number" ? data.TotalValidMin : parseFloat(data.TotalValidMin || 0),
        tripId: data.DailyTripId ?? null,
      });
    } catch (e) {
      addToast({ isValid: false, isError: true, message: `Log failed: ${e?.response?.data?.message || e.message || "network error"}` });
    } finally {
      isSendingLog.current = false;
    }
  }, [vehicle]);

  const addToast    = (t)  => setToasts((p) => [...p, { id: Date.now() + Math.random(), ...t }]);
  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));
  const showSimpleToast = (msg) => { setSimpleToast(msg); setTimeout(() => setSimpleToast(null), 3000); };

  const startActivityLogTimer = useCallback(() => {
    clearInterval(activityTimerRef.current);
    activityTimerRef.current = setInterval(sendActivityLog, ACTIVITY_LOG_MS);
  }, [sendActivityLog]);

  const stopActivityLogTimer = useCallback(() => {
    clearInterval(activityTimerRef.current);
    activityTimerRef.current = null;
  }, []);

  // ── trip control ────────────────────────────────────────────────
  const startTrip = useCallback(() => {
    const { route: r, adsData: ads } = stateRef.current;
    if (r.length < 2 || stateRef.current.isRunning) return;

    setIsRunning(true);
    setRouteLocked(true);
    setCurrentStep(0);

    const { indexes } = checkZones(0, r, ads);
    applyZonesDirect(indexes, false);
    startActivityLogTimer();

    let step = 0;
    moveTimerRef.current = setInterval(() => {
      step++;
      const s = stateRef.current;
      if (step >= s.route.length) {
        clearInterval(moveTimerRef.current);
        stopActivityLogTimer();
        stopRotation();
        setIsRunning(false);
        setInOverlapZone(false);
        setActiveAdIndexes([]);
        showSimpleToast("Simulation complete.");
        return;
      }
      setCurrentStep(step);
      const { indexes: idx } = checkZones(step, s.route, s.adsData);
      applyZonesDirect(idx, s.inOverlapZone);
    }, MOVE_INTERVAL_MS);
  }, [checkZones, applyZonesDirect, startActivityLogTimer, stopActivityLogTimer, stopRotation]);

  const stopTrip = useCallback(() => {
    clearInterval(moveTimerRef.current);
    stopActivityLogTimer();
    stopRotation();
    setIsRunning(false);
    setInOverlapZone(false);
    setActiveAdIndexes([]);
  }, [stopActivityLogTimer, stopRotation]);

  const resetTrip = useCallback(() => {
    stopTrip();
    setRouteLocked(false);
    setRoute([]);
    setCurrentStep(0);
    setActiveAdIndexes([]);
    setInOverlapZone(false);
    // Reset clock back to original simulationStartTime or now
    setLiveTime(simulationStartTime || new Date());
  }, [stopTrip, simulationStartTime]);

  // Called when user confirms time in picker
  const handleTimeConfirmed = useCallback((chosenDate) => {
    setLiveTime(chosenDate);
    setShowTimePicker(false);
    // Small delay so state settles before trip starts
    setTimeout(() => startTrip(), 0);
  }, [startTrip]);

  // Reads stateRef → never stale, no deps needed
  const handleCanvasClick = useCallback((point) => {
    if (stateRef.current.routeLocked || stateRef.current.isRunning) return;
    setRoute((prev) => [...prev, point]);
  }, []);

  const undoLastPoint = () => { if (!routeLocked) setRoute((p) => p.slice(0, -1)); };
  const clearRoute    = () => { if (!routeLocked) setRoute([]); };

  // ── render ──────────────────────────────────────────────────────
  return (
    <div style={MS.root}>
      {/* HEADER */}
      <div style={MS.header}>
        <button onClick={onBack} style={MS.backBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>Simulation Map</div>
          <div style={{
            fontSize: 11, color: "rgba(255,255,255,.75)", marginTop: 1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {agency?.AgencyName} · {vehicle?.VehicleReg}
          </div>
        </div>
        <div style={MS.clockBadge}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <span style={{ marginLeft: 5, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: "white" }}>
            {clockStr}
          </span>
        </div>
        <div style={{
          marginLeft: 8, padding: "4px 10px", borderRadius: 20,
          fontSize: 10, fontWeight: 700, color: "white", flexShrink: 0,
          background: isRunning
            ? (inOverlapZone ? "#F44336" : "#4CAF50")
            : "rgba(255,255,255,.15)",
          border: isRunning ? "none" : "1px solid rgba(255,255,255,.3)",
        }}>
          {isRunning ? (inOverlapZone ? "OVERLAP" : "ZONE") : "Idle"}
        </div>
      </div>

      {/* MAP BODY */}
      <div style={MS.mapBody}>
        {loadingAds ? (
          <div style={MS.center}>
            <div style={mkSpinner("#00c4aa")} />
            <div style={{ marginTop: 14, color: "#aaa", fontSize: 13 }}>Loading ad fences…</div>
          </div>
        ) : adsError ? (
          <div style={MS.center}>
            <div style={{ fontSize: 14, color: "#d32f2f", textAlign: "center", padding: 20 }}>⚠ {adsError}</div>
          </div>
        ) : (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>

            <MapCanvas
              adsData={adsData}
              route={route}
              currentStep={currentStep}
              activeAdIndexes={activeAdIndexes}
              isRunning={isRunning}
              routeLocked={routeLocked}
              onCanvasClick={handleCanvasClick}
            />

            <Legend adsData={adsData} activeAdIndexes={activeAdIndexes} />

            {/* Instruction hint banner */}
            {!routeLocked && (
              <div style={{
                position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
                background: route.length >= 2 ? "rgba(76,175,80,.92)" : "rgba(0,0,0,.65)",
                borderRadius: 20, padding: "7px 14px",
                display: "flex", alignItems: "center", gap: 6,
                pointerEvents: "none", whiteSpace: "nowrap", zIndex: 5,
                transition: "background .3s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
                <span style={{ fontSize: 12, color: "white" }}>
                  {route.length === 0
                    ? "Tap anywhere on the map (including inside fences) to add waypoints"
                    : route.length === 1
                      ? "1 point added — tap more to build your route"
                      : `${route.length} points — tap Start or keep adding`}
                </span>
              </div>
            )}

            {/* Undo / Clear toolbar */}
            {!routeLocked && (
              <div style={{ position: "absolute", top: 56, right: 12, display: "flex", flexDirection: "column", zIndex: 5 }}>
                <ToolbarBtn label="Undo" color="#FF9800" onClick={undoLastPoint} disabled={route.length === 0}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 10h11a4 4 0 010 8h-4M3 10l4-4M3 10l4 4"/>
                  </svg>
                </ToolbarBtn>
                <ToolbarBtn label="Clear" color="#F44336" onClick={clearRoute} disabled={route.length === 0}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </ToolbarBtn>
              </div>
            )}

            {/* Start / Stop / Reset */}
            <div style={{ position: "absolute", bottom: 150, right: 14, display: "flex", flexDirection: "column", alignItems: "flex-end", zIndex: 5 }}>
              {/* START — opens time picker first */}
              {!routeLocked && route.length >= 2 && !isRunning && (
                <FloatingBtn label="Start" color="#4CAF50" onClick={() => setShowTimePicker(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </FloatingBtn>
              )}
              {isRunning && (
                <FloatingBtn label="Stop" color="#F44336" onClick={stopTrip}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                </FloatingBtn>
              )}
              {routeLocked && !isRunning && (
                <FloatingBtn label="Reset" color="#607D8B" onClick={resetTrip}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                  </svg>
                </FloatingBtn>
              )}
            </div>

            {/* Zone badge */}
            {isRunning && activeAdIndexes.length > 0 && (
              <div style={{
                position: "absolute", top: 56, left: 12,
                background: inOverlapZone ? "#F44336" : "#4CAF50",
                color: "white", fontSize: 10, fontWeight: 700,
                padding: "4px 10px", borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,.2)",
                animation: "adSimPulse 1s ease-in-out infinite alternate",
                zIndex: 5,
              }}>
                {inOverlapZone ? "⚠ OVERLAP" : "● IN ZONE"}
              </div>
            )}

            {/* Activity toasts */}
            {toasts.map((t) => (
              <ActivityToast key={t.id} toast={t} onDone={() => removeToast(t.id)} />
            ))}

            {/* Bottom panel */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, pointerEvents: "none", zIndex: 5 }}>
              <BottomPanel
                adsData={adsData}
                activeAdIndexes={activeAdIndexes}
                displayAdIndex={displayAdIndex}
                inOverlapZone={inOverlapZone}
                secondsLeft={secondsLeft}
                isRunning={isRunning}
                vehicle={vehicle}
                currentStep={currentStep}
                route={route}
                routeLocked={routeLocked}
              />
            </div>

            {/* Simple toast */}
            {simpleToast && (
              <div style={{
                position: "absolute", bottom: 130, left: "50%", transform: "translateX(-50%)",
                background: "rgba(0,0,0,.75)", color: "white", borderRadius: 20,
                padding: "8px 18px", fontSize: 13, pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10,
              }}>
                {simpleToast}
              </div>
            )}

            {/* ── TIME PICKER MODAL ── */}
            {showTimePicker && (
              <TimePickerModal
                onConfirm={handleTimeConfirmed}
                onCancel={() => setShowTimePicker(false)}
              />
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────────
const MS = {
  root: {
    display: "flex", flexDirection: "column",
    height: "100vh", overflow: "hidden",
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
    background: "#f5f7fa",
  },
  header: {
    display: "flex", alignItems: "center",
    background: "linear-gradient(135deg,#00c4aa,#00a896)",
    padding: "46px 14px 14px",
    boxShadow: "0 3px 12px rgba(0,196,170,.3)",
    flexShrink: 0, gap: 4,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 9,
    background: "rgba(255,255,255,.25)", border: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
  },
  clockBadge: {
    display: "flex", alignItems: "center",
    background: "rgba(255,255,255,.2)", borderRadius: 20,
    padding: "5px 11px", flexShrink: 0,
  },
  mapBody:  { flex: 1, position: "relative", overflow: "hidden" },
  center:   { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" },
};

// Inject keyframes once
if (typeof document !== "undefined" && !document.getElementById("adSimMapStyle")) {
  const s = document.createElement("style");
  s.id = "adSimMapStyle";
  s.textContent = `
    @keyframes adSimSpin    { to { transform: rotate(360deg); } }
    @keyframes adSimPulse   { from { opacity:1; } to { opacity:0.6; } }
    @keyframes adSimSlideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes adSimFadeIn  { from { opacity:0; } to { opacity:1; } }
  `;
  document.head.appendChild(s);
}