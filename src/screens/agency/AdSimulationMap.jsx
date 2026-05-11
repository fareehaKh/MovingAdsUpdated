import { useState, useEffect, useRef, useCallback } from "react";

// ────────────────────────────────────────────────────────────────────────────
//  FENCE COLOURS  (matches Flutter palette)
// ────────────────────────────────────────────────────────────────────────────
const FENCE_COLORS = [
  "#2196F3", "#FF9800", "#9C27B0",
  "#F44336", "#4CAF50", "#E91E63",
];

// ────────────────────────────────────────────────────────────────────────────
//  GEOMETRY HELPERS
// ────────────────────────────────────────────────────────────────────────────
function isPointInPolygon(point, polygon) {
  if (polygon.length < 3) return false;
  let count = 0;
  const n = polygon.length;
  for (let j = 0; j < n; j++) {
    const a = polygon[j];
    const b = polygon[(j + 1) % n];
    if (
      a.lng > point.lng !== b.lng > point.lng &&
      point.lat <
        ((b.lat - a.lat) * (point.lng - a.lng)) / (b.lng - a.lng) + a.lat
    ) count++;
  }
  return count % 2 === 1;
}

// Convert {lat,lng} to SVG pixel coords given map bounds + SVG size
function geoToSvg(point, bounds, svgW, svgH, padding = 40) {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;
  const x = padding + ((point.lng - minLng) / lngRange) * (svgW - 2 * padding);
  const y = padding + ((maxLat - point.lat) / latRange) * (svgH - 2 * padding);
  return { x, y };
}

function computeBounds(points) {
  if (!points.length) return { minLat: 24.82, maxLat: 24.9, minLng: 66.97, maxLng: 67.03 };
  return {
    minLat: Math.min(...points.map((p) => p.lat)),
    maxLat: Math.max(...points.map((p) => p.lat)),
    minLng: Math.min(...points.map((p) => p.lng)),
    maxLng: Math.max(...points.map((p) => p.lng)),
  };
}

// ────────────────────────────────────────────────────────────────────────────
//  SVG MAP CANVAS
// ────────────────────────────────────────────────────────────────────────────
function MapCanvas({
  width, height,
  adsData,
  route,
  currentStep,
  activeAdIndexes,
  isRunning,
  routeLocked,
  onCanvasClick,
}) {
  const allGeoPoints = [
    ...adsData.flatMap((a) => a.fence),
    ...route,
  ];
  const bounds = computeBounds(allGeoPoints);

  const toSvg = (p) => geoToSvg(p, bounds, width, height, 50);

  const polyPath = (pts) =>
    pts.map((p, i) => {
      const { x, y } = toSvg(p);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ") + " Z";

  const routePath = route.map((p, i) => {
    const { x, y } = toSvg(p);
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

  const drivenPath = route.slice(0, currentStep + 1).map((p, i) => {
    const { x, y } = toSvg(p);
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

  const carPos = route.length > 0 ? toSvg(route[Math.min(currentStep, route.length - 1)]) : null;

  const handleClick = (e) => {
    if (routeLocked) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // Invert geoToSvg: recover lat/lng from pixel
    const { minLat, maxLat, minLng, maxLng } = bounds;
    const lngRange = maxLng - minLng || 0.01;
    const latRange = maxLat - minLat || 0.01;
    const pad = 50;
    const lng = minLng + ((px - pad) / (width - 2 * pad)) * lngRange;
    const lat = maxLat - ((py - pad) / (height - 2 * pad)) * latRange;
    onCanvasClick({ lat, lng });
  };

  return (
    <svg
      width={width}
      height={height}
      style={{ cursor: routeLocked ? "default" : "crosshair", display: "block", background: "#e8f4f8" }}
      onClick={handleClick}
    >
      {/* grid lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={(height / 8) * i} x2={width} y2={(height / 8) * i}
          stroke="#d0e8f0" strokeWidth={0.5} />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={`v${i}`} x1={(width / 10) * i} y1={0} x2={(width / 10) * i} y2={height}
          stroke="#d0e8f0" strokeWidth={0.5} />
      ))}

      {/* ad fences */}
      {adsData.map((ad, i) => {
        const color = FENCE_COLORS[i % FENCE_COLORS.length];
        const isActive = activeAdIndexes.includes(i);
        return (
          <path
            key={`fence_${i}`}
            d={polyPath(ad.fence)}
            fill={isActive ? `${color}44` : `${color}1a`}
            stroke={color}
            strokeWidth={isActive ? 2.5 : 1.5}
            strokeDasharray={isActive ? "none" : "6,3"}
          />
        );
      })}

      {/* planned route dashed */}
      {route.length >= 2 && (
        <path d={routePath} fill="none" stroke="#90a4ae" strokeWidth={3}
          strokeDasharray="12,6" strokeLinecap="round" />
      )}

      {/* driven portion */}
      {currentStep > 0 && (
        <path d={drivenPath} fill="none" stroke="#00c4aa" strokeWidth={4}
          strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* waypoint markers (during route building) */}
      {!routeLocked && route.map((p, i) => {
        const { x, y } = toSvg(p);
        return (
          <g key={`wp_${i}`}>
            <circle cx={x} cy={y} r={10} fill={i === 0 ? "#4caf50" : "#00c4aa"} opacity={0.85} />
            <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize={9} fontWeight="700">
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* car */}
      {carPos && (isRunning || (routeLocked && currentStep > 0)) && (
        <g transform={`translate(${carPos.x - 14},${carPos.y - 22})`}>
          {/* shadow */}
          <ellipse cx={14} cy={28} rx={12} ry={4} fill="rgba(0,0,0,.2)" />
          {/* body */}
          <rect x={2} y={10} width={24} height={18} rx={5} fill="#00c4aa" />
          {/* roof */}
          <rect x={6} y={4} width={16} height={10} rx={4} fill="#009982" />
          {/* windshield */}
          <rect x={8} y={5.5} width={12} height={7} rx={2.5} fill="rgba(255,255,255,.85)" />
          {/* wheels */}
          <circle cx={7} cy={29} r={4} fill="#1a1a2e" />
          <circle cx={21} cy={29} r={4} fill="#1a1a2e" />
          <circle cx={7} cy={29} r={2} fill="rgba(255,255,255,.5)" />
          <circle cx={21} cy={29} r={2} fill="rgba(255,255,255,.5)" />
          {/* headlights */}
          <rect x={2} y={11} width={5} height={3} rx={1} fill="#fff176" />
          <rect x={21} y={11} width={5} height={3} rx={1} fill="#fff176" />
        </g>
      )}
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  AD CARD (bottom panel)
// ────────────────────────────────────────────────────────────────────────────
const ROTATION_SEC = 3;

function AdCard({ adsData, activeAdIndexes, isRunning }) {
  const [displayIdx, setDisplayIdx] = useState(0); // index into activeAdIndexes
  const [secondsLeft, setSecondsLeft] = useState(ROTATION_SEC);
  const [visible, setVisible] = useState(true);

  const isOverlap = activeAdIndexes.length > 1;
  const adArrayIdx = activeAdIndexes[displayIdx] ?? activeAdIndexes[0];
  const ad = adArrayIdx != null ? adsData[adArrayIdx] : null;

  // reset when ad set changes
  useEffect(() => {
    setDisplayIdx(0);
    setSecondsLeft(ROTATION_SEC);
    setVisible(true);
  }, [activeAdIndexes.join(",")]);

  // rotation timer for overlaps
  useEffect(() => {
    if (!isOverlap || activeAdIndexes.length < 2) return;
    const intervalId = setInterval(() => {
      setDisplayIdx((prev) => {
        const next = (prev + 1) % activeAdIndexes.length;
        setVisible(false);
        setTimeout(() => setVisible(true), 200);
        setSecondsLeft(ROTATION_SEC);
        return next;
      });
    }, ROTATION_SEC * 1000);
    return () => clearInterval(intervalId);
  }, [isOverlap, activeAdIndexes.length]);

  // countdown
  useEffect(() => {
    if (!isOverlap) return;
    const t = setInterval(() => setSecondsLeft((s) => (s <= 1 ? ROTATION_SEC : s - 1)), 1000);
    return () => clearInterval(t);
  }, [isOverlap, displayIdx]);

  if (!isRunning) return null;

  if (activeAdIndexes.length === 0 || !ad) {
    return (
      <div style={cardStyles.noAd}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
        <span style={{ fontSize: 13, color: "#aaa", marginLeft: 8 }}>No ad fence at current position</span>
      </div>
    );
  }

  return (
    <div
      style={{
        ...cardStyles.card,
        ...(isOverlap ? cardStyles.overlapCard : {}),
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity .2s ease, transform .2s ease",
      }}
    >
      {isOverlap && (
        <div style={cardStyles.overlapBanner}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span style={{ fontSize: 12, color: "#d32f2f", fontWeight: 700, flex: 1, marginLeft: 6 }}>
            Overlap Zone — Rotating Ads
          </span>
          <span style={{ fontSize: 11, color: "#aaa" }}>
            {displayIdx + 1} / {activeAdIndexes.length}
          </span>
        </div>
      )}

      <div style={cardStyles.row}>
        {/* thumbnail */}
        <div style={cardStyles.thumb}>
          {ad.mediaPath ? (
            <img
              src={ad.mediaPath}
              alt={ad.adTitle}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 9 }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.8">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>
          )}
        </div>

        {/* text */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "#aaa", fontWeight: 500, marginBottom: 3 }}>
            {isOverlap ? "Now Displaying" : "Active Ad"}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#222", lineHeight: 1.3 }}>
            {ad.adTitle}
          </div>
          <div style={{ fontSize: 10, color: "#ccc", marginTop: 3 }}>Ad #{ad.adId}</div>
          {isOverlap && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00c4aa" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              <span style={{ fontSize: 11, color: "#00c4aa" }}>Next in {secondsLeft}s</span>
            </div>
          )}
        </div>
      </div>

      {/* dot indicators */}
      {isOverlap && (
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8 }}>
          {activeAdIndexes.map((_, i) => (
            <div key={i} style={{
              height: 6, width: i === displayIdx ? 18 : 6,
              borderRadius: 4,
              background: i === displayIdx ? "#00c4aa" : "#e0e0e0",
              transition: "width .3s ease",
            }} />
          ))}
        </div>
      )}

      {/* progress bar */}
      {isOverlap && (
        <div style={{ height: 4, background: "#f0f0f0", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
          <div style={{
            height: "100%", background: "#00c4aa", borderRadius: 2,
            width: `${(secondsLeft / ROTATION_SEC) * 100}%`,
            transition: "width 1s linear",
          }} />
        </div>
      )}
    </div>
  );
}

const cardStyles = {
  noAd: {
    display: "flex", alignItems: "center",
    background: "white", borderRadius: 16, padding: "14px 16px",
    boxShadow: "0 -2px 12px rgba(0,0,0,.08)",
    margin: "0 12px 12px",
  },
  card: {
    background: "white", borderRadius: 16,
    boxShadow: "0 -4px 16px rgba(0,0,0,.1)",
    margin: "0 12px 12px", padding: 14,
    border: "1.5px solid transparent",
  },
  overlapCard: {
    border: "1.5px solid rgba(244,67,54,.35)",
  },
  overlapBanner: {
    display: "flex", alignItems: "center",
    background: "#fff0f0", borderRadius: 10, padding: "7px 10px",
    marginBottom: 12,
  },
  row: { display: "flex", gap: 14, alignItems: "flex-start" },
  thumb: {
    width: 72, height: 72, borderRadius: 10,
    border: "1.5px solid rgba(0,196,170,.25)", background: "#f8f8f8",
    overflow: "hidden", flexShrink: 0,
  },
};

// ────────────────────────────────────────────────────────────────────────────
//  LEGEND
// ────────────────────────────────────────────────────────────────────────────
function Legend({ adsData, activeAdIndexes }) {
  if (!adsData.length) return null;
  return (
    <div style={{
      position: "absolute", top: 12, left: 12,
      background: "rgba(255,255,255,.97)", borderRadius: 12,
      padding: "10px 12px", boxShadow: "0 2px 10px rgba(0,0,0,.12)",
      maxWidth: 180, zIndex: 10,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#999", letterSpacing: 0.5, marginBottom: 7 }}>
        AD FENCES
      </div>
      {adsData.map((ad, i) => {
        const color = FENCE_COLORS[i % FENCE_COLORS.length];
        const active = activeAdIndexes.includes(i);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
            <div style={{
              width: 11, height: 11, borderRadius: 3,
              background: active ? color : `${color}88`,
              flexShrink: 0,
              boxShadow: active ? `0 0 6px ${color}88` : "none",
            }} />
            <span style={{
              fontSize: 10, color: active ? "#222" : "#888",
              fontWeight: active ? 700 : 400,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {ad.adTitle}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  MAIN MAP SCREEN
// ────────────────────────────────────────────────────────────────────────────
export default function AdSimulationMap({
  agency,
  vehicle,
  simulationStartTime,
  adsData: initialAdsData,
  loadingAds,
  adsError,
  onBack,
}) {
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 400 });

  const [adsData] = useState(() => initialAdsData || []);

  // route state
  const [route, setRoute] = useState([]);
  const [routeLocked, setRouteLocked] = useState(false);

  // trip state
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const moveTimerRef = useRef(null);

  // ad panel state
  const [activeAdIndexes, setActiveAdIndexes] = useState([]);

  // live clock
  const [liveTime, setLiveTime] = useState(simulationStartTime);
  const clockStart = useRef(Date.now());

  // errors / toasts
  const [toast, setToast] = useState(null);

  // ── resize observer ──
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setCanvasSize({ w: Math.floor(width), h: Math.max(Math.floor(height), 300) });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── live clock ──
  useEffect(() => {
    clockStart.current = Date.now();
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - clockStart.current) / 1000);
      setLiveTime(new Date(simulationStartTime.getTime() + elapsed * 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [simulationStartTime]);

  const clockStr = liveTime
    ? [liveTime.getHours(), liveTime.getMinutes(), liveTime.getSeconds()]
        .map((n) => String(n).padStart(2, "0"))
        .join(":")
    : "--:--:--";

  // ── zone detection ──
  const checkZones = useCallback((step, currentRoute, ads) => {
    if (!currentRoute.length || step >= currentRoute.length) return;
    const pos = currentRoute[step];
    const inFence = ads.reduce((acc, ad, i) => {
      if (isPointInPolygon(pos, ad.fence)) acc.push(i);
      return acc;
    }, []);
    setActiveAdIndexes(inFence);
  }, []);

  // ── start trip ──
  const startTrip = () => {
    if (route.length < 2) {
      showToast("Add at least 2 points to the route first.");
      return;
    }
    if (isRunning) return;
    setIsRunning(true);
    setRouteLocked(true);
    setCurrentStep(0);
    checkZones(0, route, adsData);

    let step = 0;
    moveTimerRef.current = setInterval(() => {
      step++;
      if (step >= route.length) {
        clearInterval(moveTimerRef.current);
        setIsRunning(false);
        setActiveAdIndexes([]);
        showToast("Simulation complete.");
        return;
      }
      setCurrentStep(step);
      checkZones(step, route, adsData);
    }, 2500);
  };

  const stopTrip = () => {
    clearInterval(moveTimerRef.current);
    setIsRunning(false);
    setActiveAdIndexes([]);
  };

  const resetTrip = () => {
    stopTrip();
    setRouteLocked(false);
    setRoute([]);
    setCurrentStep(0);
    setActiveAdIndexes([]);
  };

  useEffect(() => () => clearInterval(moveTimerRef.current), []);

  // ── map click → add route point ──
  const handleCanvasClick = (point) => {
    if (routeLocked) return;
    setRoute((prev) => [...prev, point]);
  };

  const undoLastPoint = () => {
    if (routeLocked) return;
    setRoute((prev) => prev.slice(0, -1));
  };

  const clearRoute = () => {
    if (routeLocked) return;
    setRoute([]);
  };

  // ── toast helper ──
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── error / loading states ──
  const renderMapContent = () => {
    if (loadingAds) {
      return (
        <div style={mapStyles.center}>
          <div style={mapStyles.spinner} />
          <div style={{ marginTop: 14, color: "#aaa", fontSize: 13 }}>Loading ad fences…</div>
        </div>
      );
    }
    if (adsError) {
      return (
        <div style={mapStyles.center}>
          <div style={{ fontSize: 14, color: "#d32f2f", textAlign: "center", padding: 20 }}>
            ⚠ {adsError}
          </div>
        </div>
      );
    }
    if (!adsData || adsData.length === 0) {
      return (
        <div style={mapStyles.center}>
          <div style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: 20 }}>
            No active ad fences found for this agency.
            <br /><br />
            You can still draw a route — just no zones will be highlighted.
          </div>
          {renderMapWithRoute()}
        </div>
      );
    }
    return renderMapWithRoute();
  };

  const renderMapWithRoute = () => (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MapCanvas
        width={canvasSize.w}
        height={canvasSize.h}
        adsData={adsData || []}
        route={route}
        currentStep={currentStep}
        activeAdIndexes={activeAdIndexes}
        isRunning={isRunning}
        routeLocked={routeLocked}
        onCanvasClick={handleCanvasClick}
      />

      {/* Legend */}
      {adsData && adsData.length > 0 && (
        <Legend adsData={adsData} activeAdIndexes={activeAdIndexes} />
      )}

      {/* Tap hint */}
      {!routeLocked && (
        <div style={mapStyles.tapHint}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" />
          </svg>
          <span style={{ fontSize: 12, color: "white", marginLeft: 5 }}>
            {route.length === 0
              ? "Click on the map to set route points"
              : `${route.length} point${route.length > 1 ? "s" : ""} — add more or press Start`}
          </span>
        </div>
      )}

      {/* Route toolbar (undo / clear) — top right */}
      {!routeLocked && (
        <div style={mapStyles.toolbar}>
          <ToolbarBtn
            icon={<UndoIcon />} label="Undo" color="#FF9800"
            onClick={undoLastPoint} disabled={route.length === 0}
          />
          <ToolbarBtn
            icon={<ClearIcon />} label="Clear" color="#F44336"
            onClick={clearRoute} disabled={route.length === 0}
          />
        </div>
      )}

      {/* Trip controls — bottom right floating */}
      <div style={mapStyles.tripControls}>
        {!routeLocked && route.length >= 2 && !isRunning && (
          <FloatingBtn
            icon={<PlayIcon />} label="Start" color="#4CAF50"
            onClick={startTrip}
          />
        )}
        {isRunning && (
          <FloatingBtn
            icon={<StopIcon />} label="Stop" color="#F44336"
            onClick={stopTrip}
          />
        )}
        {routeLocked && !isRunning && (
          <FloatingBtn
            icon={<ResetIcon />} label="Reset" color="#607D8B"
            onClick={resetTrip}
          />
        )}
      </div>

      {/* Zone badge */}
      {isRunning && activeAdIndexes.length > 0 && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: activeAdIndexes.length > 1 ? "#F44336" : "#4CAF50",
          color: "white", fontSize: 10, fontWeight: 700,
          padding: "4px 10px", borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,.2)",
          animation: "pulse 1s ease-in-out infinite alternate",
        }}>
          {activeAdIndexes.length > 1 ? "⚠ OVERLAP" : "● IN ZONE"}
        </div>
      )}

      {/* Ad card */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        pointerEvents: "none",
      }}>
        <AdCard
          adsData={adsData || []}
          activeAdIndexes={activeAdIndexes}
          isRunning={isRunning}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div style={mapStyles.toast}>{toast}</div>
      )}
    </div>
  );

  return (
    <div style={mapStyles.root}>
      {/* ── HEADER ── */}
      <div style={mapStyles.header}>
        <button onClick={onBack} style={mapStyles.backBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>

        <div style={{ flex: 1, marginLeft: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>Simulation Map</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.75)", marginTop: 1 }}>
            {agency?.agencyName} · {vehicle?.vehicleReg}
          </div>
        </div>

        {/* clock */}
        <div style={mapStyles.clockBadge}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          <span style={{ marginLeft: 5, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: "white" }}>
            {clockStr}
          </span>
        </div>

        {/* running status */}
        <div style={{ marginLeft: 8 }}>
          <div style={{
            padding: "4px 10px", borderRadius: 20,
            background: isRunning ? "rgba(76,175,80,.2)" : "rgba(255,255,255,.15)",
            border: `1px solid ${isRunning ? "rgba(76,175,80,.5)" : "rgba(255,255,255,.3)"}`,
            fontSize: 10, fontWeight: 700, color: "white",
          }}>
            {isRunning ? "● Running" : "Idle"}
          </div>
        </div>
      </div>

      {/* ── MAP BODY ── */}
      <div ref={containerRef} style={mapStyles.mapBody}>
        {renderMapContent()}
      </div>
    </div>
  );
}

// ── small widget components ───────────────────────────────────────────────────
function ToolbarBtn({ icon, label, color, onClick, disabled }) {
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
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
    </button>
  );
}

function FloatingBtn({ icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        background: color, border: "none", borderRadius: 14,
        padding: "11px 18px", cursor: "pointer", marginBottom: 8,
        boxShadow: `0 4px 16px ${color}66`,
        color: "white", fontSize: 13, fontWeight: 700,
        transition: "transform .15s", outline: "none",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {icon} {label}
    </button>
  );
}

function PlayIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}
function StopIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>;
}
function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
      <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </svg>
  );
}
function UndoIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 10h11a4 4 0 010 8h-4M3 10l4-4M3 10l4 4" /></svg>;
}
function ClearIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}

// ── map styles ────────────────────────────────────────────────────────────────
const mapStyles = {
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
    flexShrink: 0,
    gap: 4,
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
  mapBody: {
    flex: 1, position: "relative", overflow: "hidden",
  },
  center: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    height: "100%",
  },
  spinner: {
    width: 36, height: 36, borderRadius: "50%",
    border: "3px solid rgba(0,196,170,.2)", borderTopColor: "#00c4aa",
    animation: "spin 0.7s linear infinite",
  },
  tapHint: {
    position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
    background: "rgba(0,0,0,.65)", borderRadius: 20,
    padding: "7px 14px", display: "flex", alignItems: "center",
    pointerEvents: "none", whiteSpace: "nowrap",
  },
  toolbar: {
    position: "absolute", top: 12, right: 12,
    display: "flex", flexDirection: "column",
  },
  tripControls: {
    position: "absolute", bottom: 100, right: 14,
    display: "flex", flexDirection: "column", alignItems: "flex-end",
  },
  toast: {
    position: "absolute", bottom: 110, left: "50%", transform: "translateX(-50%)",
    background: "rgba(0,0,0,.75)", color: "white", borderRadius: 20,
    padding: "8px 18px", fontSize: 13, pointerEvents: "none",
    whiteSpace: "nowrap",
  },
};

// inject animations globally once
if (typeof document !== "undefined" && !document.getElementById("sim-map-style")) {
  const s = document.createElement("style");
  s.id = "sim-map-style";
  s.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { from { opacity:1; } to { opacity:0.6; } }
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  `;
  document.head.appendChild(s);
}