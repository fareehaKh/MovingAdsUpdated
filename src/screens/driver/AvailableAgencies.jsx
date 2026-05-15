//////////////////////////////   RESPONSIVE   ////////////////////////////////////

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession, clearUserSession } from "../../utils/session";

import {
  getAllAgenciesApi,
  getVehiclesByOwnerApi,
  linkVehicleToAgencyApi,
  isVehicleLinkedToAgencyApi,
} from "../../api/authapi";

// ─────────────────────────────────────────────────────────────────
//  Inject global styles once
// ─────────────────────────────────────────────────────────────────
if (typeof window !== "undefined" && !document.getElementById("aa-global-style")) {
  const s = document.createElement("style");
  s.id = "aa-global-style";
  s.innerHTML = `
    @keyframes aa-spin { to { transform: rotate(360deg); } }
    @keyframes aa-fade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

    @media (max-width: 768px) {
      .aa-sidebar {
        position: fixed !important;
        left: -260px !important;
        top: 0 !important;
        height: 100vh !important;
        z-index: 1000 !important;
        transition: left 0.3s ease !important;
      }
      .aa-sidebar.open { left: 0 !important; }
      .aa-main { padding: 20px !important; }
      .aa-mobile-bar { display: flex !important; }
      .aa-page-title { font-size: 26px !important; }
      .aa-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; }
      .aa-vehicle-select { width: 100% !important; }
    }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
const AvailableAgencies = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  const [agencies, setAgencies] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // selected vehicle reg (string)
  const [selectedVehicleReg, setSelectedVehicleReg] = useState("");

  // joinedAgencies: Map<vehicleReg, Set<agencyId>>
  const [joinedMap, setJoinedMap] = useState(new Map());

  const [loadingAgencies, setLoadingAgencies] = useState(true);
  // loading link-status for the currently selected vehicle
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [joining, setJoining] = useState(null); // agencyId being joined right now
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Initial load ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate("/"); return; }
    fetchInitial();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInitial = async () => {
    try {
      const [agencyRes, vehicleRes] = await Promise.all([
        getAllAgenciesApi(),
        getVehiclesByOwnerApi(user.UserId),
      ]);

      const agenciesData = agencyRes.data || [];
      const vehiclesData = vehicleRes.data || [];

      setAgencies(agenciesData);
      setVehicles(vehiclesData);

      if (vehiclesData.length > 0) {
        const firstReg = vehiclesData[0].VehicleReg;
        setSelectedVehicleReg(firstReg);
        await fetchLinkStatus(firstReg, agenciesData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAgencies(false);
    }
  };

  // ── Fetch link status for a given vehicle ─────────────────────
  const fetchLinkStatus = useCallback(async (vehicleReg, agenciesData) => {
    if (!vehicleReg || !agenciesData?.length) return;

    setLoadingStatus(true);
    try {
      const results = await Promise.all(
        agenciesData.map((a) =>
          isVehicleLinkedToAgencyApi(vehicleReg, a.AgencyId)
        )
      );

      const joined = new Set();
      results.forEach((res, i) => {
        if (res.data?.isLinked) joined.add(agenciesData[i].AgencyId);
      });

      setJoinedMap((prev) => {
        const next = new Map(prev);
        next.set(vehicleReg, joined);
        return next;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  // ── Vehicle selection change ───────────────────────────────────
  const handleVehicleChange = async (reg) => {
    setSelectedVehicleReg(reg);
    // If we already fetched status for this vehicle, no need to re-fetch
    if (!joinedMap.has(reg)) {
      await fetchLinkStatus(reg, agencies);
    }
  };

  // ── Join agency ───────────────────────────────────────────────
  const handleJoin = async (agencyId) => {
    if (!selectedVehicleReg) {
      alert("Please select a vehicle first");
      return;
    }

    try {
      setJoining(agencyId);
      await linkVehicleToAgencyApi({
        VehicleReg: selectedVehicleReg,
        AgencyId: agencyId,
      });

      setJoinedMap((prev) => {
        const next = new Map(prev);
        const current = new Set(next.get(selectedVehicleReg) || []);
        current.add(agencyId);
        next.set(selectedVehicleReg, current);
        return next;
      });
    } catch (err) {
      alert(err.response?.data || "Failed to join agency");
    } finally {
      setJoining(null);
    }
  };

  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  // ── Helpers ───────────────────────────────────────────────────
  const isJoined = (agencyId) =>
    joinedMap.get(selectedVehicleReg)?.has(agencyId) ?? false;

  const selectedVehicle = vehicles.find((v) => v.VehicleReg === selectedVehicleReg);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={S.page}>

      {/* OVERLAY */}
      {sidebarOpen && (
        <div style={S.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside
        className={`aa-sidebar${sidebarOpen ? " open" : ""}`}
        style={S.sidebar}
      >
        <div style={S.sidebarLogo}>
          <span style={{ fontSize: 22 }}>🚗</span>
          <span style={S.sidebarLogoText}>MovingAds</span>
        </div>

        <nav style={S.nav}>
          <div style={S.navItem} onClick={() => navigate("/driver")}>
            🚘 My Vehicles
          </div>
          <div style={{ ...S.navItem, ...S.navItemActive }}>
            🏢 Available Agencies
          </div>
          <div
            style={S.navItem}
            onClick={() =>
              navigate(
                selectedVehicleReg
                  ? `/driver/trip-stats/${selectedVehicleReg}`
                  : "/driver"
              )
            }
          >
            📊 Trip Stats
          </div>

          <div
            style={S.navItem}
            onClick={() =>
              navigate(
                selectedVehicleReg
                  ? `/driver/earnings`
                  : "/driver"
              )
            }
          >
            💰 My Earnings
          </div>

          
        </nav>

        <div style={S.sidebarFooter}>
          <div style={S.userBadge}>
            <div style={S.avatar}>
              {user?.Name?.[0]?.toUpperCase() || "D"}
            </div>
            <div>
              <div style={S.userName}>{user?.Name}</div>
              <div style={S.userRole}>Driver</div>
            </div>
          </div>
          <button style={S.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="aa-main" style={S.main}>

        {/* MOBILE TOP BAR */}
        <div className="aa-mobile-bar" style={S.mobileTopBar}>
          <button style={S.menuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <h2 style={S.mobileTitle}>Agencies</h2>
        </div>

        {/* HEADER ROW */}
        <div className="aa-header-row" style={S.headerRow}>
          <div>
            <h1 className="aa-page-title" style={S.title}>Available Agencies</h1>
            <p style={S.subtitle}>
              Join agencies and start running ad campaigns with your vehicles.
            </p>
          </div>

          {/* VEHICLE SELECTOR */}
          {vehicles.length > 0 && (
            <div className="aa-vehicle-select" style={S.vehicleSelectWrap}>
              <label style={S.selectLabel}>
                <span style={S.selectLabelIcon}>🚗</span>
                Select Vehicle
              </label>
              <div style={S.selectWrapper}>
                <select
                  value={selectedVehicleReg}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  style={S.select}
                >
                  {vehicles.map((v) => (
                    <option key={v.VehicleReg} value={v.VehicleReg}>
                      {v.VehicleReg}
                      {v.VehicleModel ? ` — ${v.VehicleModel}` : ""}
                    </option>
                  ))}
                </select>
                {/* custom arrow */}
                <svg
                  style={S.selectArrow}
                  width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="#94a3b8" strokeWidth="2.5"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {selectedVehicle && (
                <div style={S.vehicleChip}>
                  <span style={S.vehicleChipDot} />
                  {selectedVehicle.VehicleType || "Vehicle"} · {selectedVehicle.VehicleReg}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CONTENT */}
        {loadingAgencies ? (
          <div style={S.loaderWrap}>
            <div style={S.loader} />
          </div>
        ) : agencies.length === 0 ? (
          <div style={S.emptyState}>
            <div style={{ fontSize: 70 }}>🏢</div>
            <h2>No Agencies Found</h2>
            <p>No agencies are available at the moment.</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div style={S.emptyState}>
            <div style={{ fontSize: 70 }}>🚗</div>
            <h2>No Vehicles Registered</h2>
            <p>Please register a vehicle first before joining an agency.</p>
            <button style={S.registerVehicleBtn} onClick={() => navigate("/driver")}>
              Register Vehicle
            </button>
          </div>
        ) : (
          <>
            {/* Status strip */}
            {loadingStatus && (
              <div style={S.statusStrip}>
                <div style={S.miniSpinner} />
                <span style={{ fontSize: 13, color: "#94a3b8" }}>
                  Checking link status for {selectedVehicleReg}…
                </span>
              </div>
            )}

            <div style={S.grid}>
              {agencies.map((agency) => {
                const joined = isJoined(agency.AgencyId);
                const isJoiningThis = joining === agency.AgencyId;

                return (
                  <div
                    key={agency.AgencyId}
                    style={{
                      ...S.card,
                      ...(joined ? S.cardJoined : {}),
                      animation: "aa-fade .3s ease",
                    }}
                  >
                    {/* Joined badge */}
                    {joined && (
                      <div style={S.joinedBadge}>✓ Joined</div>
                    )}

                    <div style={S.cardHeader}>
                      <div style={{
                        ...S.agencyLogo,
                        background: joined
                          ? "rgba(34,197,94,0.2)"
                          : "rgba(34,197,94,0.1)",
                      }}>
                        🏢
                      </div>
                      <div>
                        <h3 style={S.agencyName}>{agency.AgencyName}</h3>
                        <p style={S.email}>{agency.Email}</p>
                      </div>
                    </div>

                    <p style={S.description}>{agency.AgencyDescription}</p>

                    {/* Vehicle context line */}
                    <div style={S.vehicleContext}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke={joined ? "#4ade80" : "#94a3b8"} strokeWidth="2">
                        <path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17a2 2 0 104 0m6 0a2 2 0 104 0" />
                      </svg>
                      <span style={{
                        fontSize: 12,
                        color: joined ? "#4ade80" : "#94a3b8",
                      }}>
                        {joined
                          ? `${selectedVehicleReg} is linked`
                          : `Linking: ${selectedVehicleReg}`}
                      </span>
                    </div>

                    <button
                      style={{
                        ...S.btn,
                        background: joined
                          ? "rgba(34,197,94,0.12)"
                          : isJoiningThis
                          ? "rgba(34,197,94,0.5)"
                          : "linear-gradient(135deg,#22c55e,#16a34a)",
                        border: joined
                          ? "1px solid rgba(34,197,94,0.3)"
                          : "none",
                        color: joined ? "#4ade80" : "#fff",
                        cursor: joined || loadingStatus ? "not-allowed" : "pointer",
                        opacity: loadingStatus ? 0.6 : 1,
                      }}
                      disabled={joined || isJoiningThis || loadingStatus}
                      onClick={() => !joined && !loadingStatus && handleJoin(agency.AgencyId)}
                    >
                      {joined
                        ? "✓ Already Joined"
                        : isJoiningThis
                        ? "Joining…"
                        : "Join Agency"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AvailableAgencies;

// ─────────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────────
const S = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#0b1120",
    color: "#fff",
    fontFamily: "'Segoe UI', sans-serif",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 999,
  },

  sidebar: {
    width: 240,
    background: "rgba(255,255,255,0.03)",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
    flexShrink: 0,
  },

  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 24px",
    marginBottom: 32,
  },

  sidebarLogoText: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 18,
  },

  nav: {
    flex: 1,
    padding: "0 12px",
  },

  navItem: {
    padding: "12px 16px",
    borderRadius: 12,
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    cursor: "pointer",
    marginBottom: 6,
    transition: "background 0.2s",
  },

  navItemActive: {
    background: "rgba(34,197,94,0.15)",
    color: "#4ade80",
  },

  sidebarFooter: {
    padding: "0 16px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    paddingTop: 20,
  },

  userBadge: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 15,
  },

  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
  },

  userRole: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },

  logoutBtn: {
    width: "100%",
    padding: "10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "rgba(255,255,255,0.6)",
    cursor: "pointer",
    fontSize: 14,
  },

  main: {
    flex: 1,
    padding: 32,
    overflowX: "hidden",
  },

  mobileTopBar: {
    display: "none",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },

  menuBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    width: 42,
    height: 42,
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 20,
  },

  mobileTitle: {
    color: "#fff",
    margin: 0,
    fontSize: 24,
  },

  // HEADER ROW — title left, vehicle selector right
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 30,
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: 36,
    fontWeight: 700,
  },

  subtitle: {
    color: "#94a3b8",
    marginTop: 8,
    fontSize: 15,
    maxWidth: 520,
    lineHeight: 1.6,
  },

  // ── Vehicle Selector ──
  vehicleSelectWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 220,
    flexShrink: 0,
  },

  selectLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  selectLabelIcon: {
    fontSize: 14,
  },

  selectWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  select: {
    width: "100%",
    padding: "11px 40px 11px 14px",
    borderRadius: 12,
    background: "#111827",
    border: "1.5px solid rgba(34,197,94,0.3)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
    cursor: "pointer",
    boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
    transition: "border-color 0.2s",
  },

  selectArrow: {
    position: "absolute",
    right: 12,
    pointerEvents: "none",
  },

  vehicleChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "#4ade80",
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.2)",
    borderRadius: 20,
    padding: "4px 10px",
    width: "fit-content",
  },

  vehicleChipDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#4ade80",
    display: "inline-block",
  },

  // ── Status strip ──
  statusStrip: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    padding: "10px 14px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.06)",
  },

  miniSpinner: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.1)",
    borderTopColor: "#22c55e",
    animation: "aa-spin 0.7s linear infinite",
  },

  // ── Cards ──
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
    gap: 22,
  },

  card: {
    position: "relative",
    background: "#111827",
    borderRadius: 24,
    padding: 22,
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },

  cardJoined: {
    border: "1px solid rgba(34,197,94,0.25)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2), 0 0 0 1px rgba(34,197,94,0.1)",
  },

  joinedBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
    border: "1px solid rgba(34,197,94,0.3)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },

  agencyLogo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    flexShrink: 0,
  },

  agencyName: {
    margin: 0,
    color: "#fff",
    fontSize: 20,
    fontWeight: 700,
  },

  email: {
    marginTop: 3,
    color: "#94a3b8",
    fontSize: 13,
  },

  description: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 1.7,
    flex: 1,
    marginBottom: 10,
  },

  vehicleContext: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },

  btn: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: 14,
    fontWeight: 700,
    fontSize: 15,
    transition: "opacity 0.2s, background 0.2s",
  },

  // ── Empty / Loader ──
  emptyState: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    color: "#fff",
    gap: 8,
  },

  registerVehicleBtn: {
    marginTop: 12,
    padding: "12px 28px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },

  loaderWrap: {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  loader: {
    width: 48,
    height: 48,
    border: "4px solid rgba(255,255,255,0.1)",
    borderTop: "4px solid #10b981",
    borderRadius: "50%",
    animation: "aa-spin 1s linear infinite",
  },
};