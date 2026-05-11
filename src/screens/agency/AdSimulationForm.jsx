import { useState, useEffect, useRef } from "react";
import AdSimulationMap from "./AdSimulationMap";

// ── API helpers (mirrors your Flutter services) ──────────────────────────────
const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof window !== "undefined" && window.__API_BASE_URL__) ||
  "http://localhost:5000";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}

const getAgencyVehicles = (agencyId) =>
  apiFetch(`/agency/vehicles/${agencyId}`);

const getActiveAssignmentsByAgency = (agencyId) =>
  apiFetch(`/adassignment/activebyagency/${agencyId}`);

const getFenceByAd = (adId) => apiFetch(`/adfence/ad/${adId}`);

const getAllAds = () => apiFetch("/ad/GetAllAds");

// ── tiny clock hook ───────────────────────────────────────────────────────────
function useTickingTime(baseTime) {
  const [display, setDisplay] = useState("");
  const startedAt = useRef(null);
  const baseRef = useRef(baseTime);

  useEffect(() => {
    baseRef.current = baseTime;
    if (!baseTime) {
      setDisplay("");
      return;
    }
    startedAt.current = Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      const t = new Date(baseRef.current.getTime() + elapsed * 1000);
      setDisplay(
        [t.getHours(), t.getMinutes(), t.getSeconds()]
          .map((n) => String(n).padStart(2, "0"))
          .join(":")
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [baseTime]);

  return display;
}

// ── Step badge ────────────────────────────────────────────────────────────────
function StepBadge({ num, text }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
      <div style={{
        minWidth: 22, height: 22, borderRadius: "50%",
        background: "rgba(0,196,170,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: "#00c4aa", flexShrink: 0,
      }}>{num}</div>
      <p style={{ margin: 0, fontSize: 12.5, color: "#666", lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdSimulationForm({ agency }) {
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [vehicleError, setVehicleError] = useState(null);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [timeValue, setTimeValue] = useState(""); // "HH:MM"
  const [simStartTime, setSimStartTime] = useState(null); // Date object

  const [showMap, setShowMap] = useState(false);

  // Pre-load ad fences so the map opens quickly
  const [adsData, setAdsData] = useState(null);
  const [loadingAds, setLoadingAds] = useState(false);
  const [adsError, setAdsError] = useState(null);

  const liveTime = useTickingTime(simStartTime);

  // ── load vehicles ──
  useEffect(() => {
    if (!agency?.agencyId) return;
    setLoadingVehicles(true);
    setVehicleError(null);
    getAgencyVehicles(agency.agencyId)
      .then((data) => {
        setVehicles(Array.isArray(data) ? data : []);
        setLoadingVehicles(false);
      })
      .catch((e) => {
        setVehicleError(e.message);
        setLoadingVehicles(false);
      });
  }, [agency?.agencyId]);

  // ── load ads + fences when agency changes ──
  useEffect(() => {
    if (!agency?.agencyId) return;
    setLoadingAds(true);
    setAdsError(null);

    Promise.all([
      getActiveAssignmentsByAgency(agency.agencyId),
      getAllAds(),
    ])
      .then(async ([assignments, allAds]) => {
        if (!Array.isArray(assignments) || assignments.length === 0) {
          setAdsData([]);
          setLoadingAds(false);
          return;
        }

        const enriched = await Promise.allSettled(
          assignments.map(async (asgn) => {
            const fences = await getFenceByAd(asgn.adId);
            if (!Array.isArray(fences) || fences.length === 0) return null;
            const polygon = parsePolygon(fences[0].polygon);
            if (polygon.length < 3) return null;
            const match = allAds.find((a) => toInt(a.adId) === toInt(asgn.adId));
            return {
              adId: asgn.adId,
              adTitle: asgn.adTitle,
              mediaPath: match?.mediaPath || "",
              fence: polygon,
            };
          })
        );

        const valid = enriched
          .filter((r) => r.status === "fulfilled" && r.value !== null)
          .map((r) => r.value);

        setAdsData(valid);
        setLoadingAds(false);
      })
      .catch((e) => {
        setAdsError(e.message);
        setLoadingAds(false);
      });
  }, [agency?.agencyId]);

  // ── time input handler ──
  const handleTimeChange = (e) => {
    const val = e.target.value; // "HH:MM"
    setTimeValue(val);
    if (val) {
      const [h, m] = val.split(":").map(Number);
      const now = new Date();
      const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      setSimStartTime(dt);
    } else {
      setSimStartTime(null);
    }
  };

  const canStart = simStartTime && selectedVehicle;

  const handleStart = () => {
    if (!canStart) return;
    setShowMap(true);
  };

  if (showMap) {
    return (
      <AdSimulationMap
        agency={agency}
        vehicle={selectedVehicle}
        simulationStartTime={simStartTime}
        adsData={adsData}
        loadingAds={loadingAds}
        adsError={adsError}
        onBack={() => setShowMap(false)}
      />
    );
  }

  return (
    <div style={styles.root}>
      {/* ── HEADER ── */}
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>Ad Simulation</h2>
        <div style={styles.agencyRow}>
          <div style={styles.agencyIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <rect x="3" y="9" width="18" height="13" rx="2" />
              <path d="M8 9V7a4 4 0 018 0v2" />
            </svg>
          </div>
          <div>
            <div style={styles.agencyLabel}>Agency</div>
            <div style={styles.agencyName}>{agency?.agencyName || "—"}</div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={styles.body}>

        {/* ── TIME ── */}
        <SectionLabel icon={<ClockIcon />} text="Simulation Time" />
        <div style={{ ...styles.card, ...(simStartTime ? styles.cardActive : {}) }}>
          <div style={styles.cardIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c4aa" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.cardLabel}>{simStartTime ? "Start time set" : "Set simulation start time"}</div>
            <input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              style={styles.timeInput}
            />
          </div>
          {liveTime && (
            <div style={styles.liveBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00c4aa" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              <span>{liveTime}</span>
            </div>
          )}
        </div>

        <div style={{ height: 22 }} />

        {/* ── VEHICLE ── */}
        <SectionLabel icon={<CarIcon />} text="Select Vehicle" />
        {loadingVehicles ? (
          <div style={styles.loadingRow}>
            <Spinner /> <span style={{ color: "#999", fontSize: 13 }}>Loading vehicles…</span>
          </div>
        ) : vehicleError ? (
          <ErrorBanner message={vehicleError} onRetry={() => {
            setLoadingVehicles(true);
            setVehicleError(null);
            getAgencyVehicles(agency.agencyId)
              .then((d) => { setVehicles(d); setLoadingVehicles(false); })
              .catch((e) => { setVehicleError(e.message); setLoadingVehicles(false); });
          }} />
        ) : (
          <>
            <div style={{ ...styles.card, ...(selectedVehicle ? styles.cardActive : {}), padding: "4px 16px" }}>
              <select
                value={selectedVehicle ? JSON.stringify(selectedVehicle) : ""}
                onChange={(e) => {
                  if (!e.target.value) return setSelectedVehicle(null);
                  try { setSelectedVehicle(JSON.parse(e.target.value)); } catch { }
                }}
                style={styles.select}
              >
                <option value="">— Choose a vehicle —</option>
                {vehicles.length === 0
                  ? <option disabled>No vehicles found</option>
                  : vehicles.map((v) => (
                    <option key={v.vehicleReg} value={JSON.stringify(v)}>
                      {v.vehicleReg} · {v.vehicleModel} · {v.vehicleType}
                    </option>
                  ))
                }
              </select>
            </div>

            {selectedVehicle && (
              <div style={styles.vehicleInfo}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00c4aa" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                <span style={{ fontSize: 12, color: "#00c4aa", fontWeight: 600, marginLeft: 6 }}>
                  {selectedVehicle.vehicleReg} · {selectedVehicle.vehicleModel} · {selectedVehicle.vehicleType}
                </span>
                <span style={{
                  marginLeft: 8, fontSize: 10, fontWeight: 700, padding: "2px 7px",
                  borderRadius: 20, background: selectedVehicle.vehicleStatus?.toLowerCase() === "online" ? "rgba(76,175,80,.15)" : "rgba(0,0,0,.07)",
                  color: selectedVehicle.vehicleStatus?.toLowerCase() === "online" ? "#43a047" : "#999",
                }}>
                  {selectedVehicle.vehicleStatus || "—"}
                </span>
              </div>
            )}
          </>
        )}

        <div style={{ height: 28 }} />

        {/* ── HOW IT WORKS ── */}
        <div style={styles.howCard}>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#333" }}>How it works</p>
          <StepBadge num="1" text="Tap points on the map to draw the vehicle's route" />
          <StepBadge num="2" text="Active ad fences appear as colored zones on the map" />
          <StepBadge num="3" text="Press Start — the vehicle moves step-by-step along your route" />
          <StepBadge num="4" text="A card at the bottom shows the active ad when inside a fence" />
          <StepBadge num="5" text="Overlapping fences rotate ads every 3 seconds automatically" />
        </div>

        <div style={{ height: 28 }} />

        {/* ── START BUTTON ── */}
        {adsError && (
          <div style={{ ...styles.vehicleInfo, marginBottom: 12, background: "rgba(244,67,54,.08)", borderColor: "rgba(244,67,54,.3)" }}>
            <span style={{ fontSize: 12, color: "#d32f2f" }}>⚠ Could not load ad fences: {adsError}</span>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={!canStart}
          style={{
            ...styles.startBtn,
            opacity: canStart ? 1 : 0.4,
            cursor: canStart ? "pointer" : "not-allowed",
            boxShadow: canStart ? "0 6px 20px rgba(0,196,170,.4)" : "none",
          }}
        >
          {loadingAds
            ? <><Spinner white /> <span style={{ marginLeft: 8 }}>Loading ad data…</span></>
            : <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              <span style={{ marginLeft: 10, fontSize: 15, fontWeight: 700 }}>
                {canStart ? "Open Simulation Map" : "Set time & vehicle to continue"}
              </span>
            </>
          }
        </button>

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}

// ── small utils ───────────────────────────────────────────────────────────────
function toInt(v) {
  if (v == null) return 0;
  if (typeof v === "number") return Math.floor(v);
  return parseInt(v, 10) || 0;
}

function parsePolygon(raw) {
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(data) || data.length === 0) return [];
    if (typeof data[0] === "object" && !Array.isArray(data[0])) {
      return data.map((e) => ({
        lat: Number(e.lat ?? e.latitude ?? 0),
        lng: Number(e.lng ?? e.longitude ?? 0),
      }));
    }
    if (Array.isArray(data[0])) {
      return data.map((e) => ({ lat: Number(e[1]), lng: Number(e[0]) }));
    }
    return [];
  } catch {
    return [];
  }
}

function SectionLabel({ icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
      <span style={{ color: "#00c4aa", display: "flex" }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#555", letterSpacing: 0.3 }}>{text}</span>
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{ background: "#fff0f0", border: "1px solid #ffcdd2", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ color: "#d32f2f", fontSize: 13, flex: 1 }}>⚠ {message}</span>
      {onRetry && <button onClick={onRetry} style={{ background: "#d32f2f", color: "white", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>Retry</button>}
    </div>
  );
}

function Spinner({ white }) {
  return (
    <div style={{
      width: 16, height: 16, borderRadius: "50%",
      border: `2.5px solid ${white ? "rgba(255,255,255,.3)" : "rgba(0,196,170,.2)"}`,
      borderTopColor: white ? "white" : "#00c4aa",
      animation: "spin 0.7s linear infinite",
      display: "inline-block",
    }} />
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}
function CarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17a2 2 0 104 0m6 0a2 2 0 104 0" />
    </svg>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const styles = {
  root: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#f5f7fa",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "linear-gradient(135deg,#00c4aa,#00a896)",
    padding: "52px 20px 24px",
    borderRadius: "0 0 28px 28px",
    boxShadow: "0 4px 20px rgba(0,196,170,.3)",
  },
  headerTitle: {
    color: "white", fontSize: 22, fontWeight: 800, margin: "0 0 16px",
  },
  agencyRow: { display: "flex", alignItems: "center", gap: 12 },
  agencyIcon: {
    width: 38, height: 38, borderRadius: 10,
    background: "rgba(255,255,255,.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  agencyLabel: { fontSize: 11, color: "rgba(255,255,255,.7)", letterSpacing: 0.5 },
  agencyName: { fontSize: 16, fontWeight: 700, color: "white" },
  body: { padding: "24px 20px", flex: 1, overflowY: "auto" },
  card: {
    background: "white", borderRadius: 16,
    boxShadow: "0 2px 12px rgba(0,0,0,.08)",
    border: "1.5px solid transparent",
    display: "flex", alignItems: "center", padding: "16px",
    gap: 14, transition: "border-color .2s",
  },
  cardActive: { borderColor: "#00c4aa" },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12,
    background: "rgba(0,196,170,.1)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardContent: { flex: 1 },
  cardLabel: { fontSize: 11.5, color: "#aaa", marginBottom: 4 },
  timeInput: {
    fontSize: 22, fontWeight: 700, color: "#222", letterSpacing: 1,
    border: "none", outline: "none", background: "transparent", cursor: "pointer",
    width: "100%",
  },
  liveBadge: {
    display: "flex", alignItems: "center", gap: 5,
    background: "rgba(0,196,170,.1)", borderRadius: 10,
    padding: "5px 10px", fontSize: 13, fontWeight: 700, color: "#00c4aa",
    letterSpacing: 0.5, whiteSpace: "nowrap",
  },
  select: {
    width: "100%", border: "none", outline: "none",
    fontSize: 14, color: "#333", background: "transparent",
    padding: "12px 0", cursor: "pointer",
  },
  vehicleInfo: {
    marginTop: 10, display: "flex", alignItems: "center",
    background: "rgba(0,196,170,.07)", borderRadius: 12,
    border: "1px solid rgba(0,196,170,.2)", padding: "10px 14px",
  },
  loadingRow: { display: "flex", alignItems: "center", gap: 10, padding: "16px 0" },
  howCard: {
    background: "white", borderRadius: 16,
    boxShadow: "0 2px 12px rgba(0,0,0,.07)", padding: 16,
  },
  startBtn: {
    width: "100%", height: 56, background: "#00c4aa",
    border: "none", borderRadius: 16, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "white", fontSize: 15, fontWeight: 700,
    transition: "opacity .25s, box-shadow .25s",
  },
};

// inject keyframe
if (typeof document !== "undefined" && !document.getElementById("sim-spin")) {
  const s = document.createElement("style");
  s.id = "sim-spin";
  s.textContent = "@keyframes spin{to{transform:rotate(360deg)}}";
  document.head.appendChild(s);
}