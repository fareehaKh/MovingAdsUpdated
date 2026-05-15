////////////////////////////////////   RESPONSIVE   //////////////////////////////////

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getAgencyVehiclesApi,
  getAgencyByUserApi
} from "../../api/authapi";

import {
  getUserSession,
  clearUserSession
} from "../../utils/session";

const LinkedDrivers = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  const [vehicles, setVehicles] = useState([]);
  const [agency, setAgency] = useState(null);

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const agencyRes = await getAgencyByUserApi(user.UserId);

      setAgency(agencyRes.data);

      const res = await getAgencyVehiclesApi(
        agencyRes.data.AgencyId
      );

      setVehicles(res.data || []);
    } catch (err) {
      console.log(err);
      setVehicles([]);
    }
  };

  const logout = () => {
    clearUserSession();
    navigate("/");
  };

  return (
    <div
      style={{
        ...styles.page,
        flexDirection: isMobile ? "column" : "row",
      }}
    >
      {/* ================= SIDEBAR ================= */}

      <aside
        style={{
          ...styles.sidebar,
          width: isMobile ? "100%" : 240,
          minWidth: isMobile ? "100%" : 240,

          borderRight: isMobile
            ? "none"
            : "1px solid rgba(255,255,255,0.07)",

          borderBottom: isMobile
            ? "1px solid rgba(255,255,255,0.07)"
            : "none",

          // ✅ FIX: make sidebar sticky on desktop
          position: isMobile ? "relative" : "sticky",
          top: 0,
          height: isMobile ? "auto" : "100vh",
          overflowY: "auto",
        }}
      >
        {/* LOGO */}
        <div style={styles.logo}>
          🏢 MovingAds
        </div>

        {/* NAVIGATION */}
        <div style={styles.nav}>
          <div
            style={styles.navItem}
            onClick={() => navigate("/agency")}
          >
            📊 Dashboard
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              navigate("/agency/received-requests")
            }
          >
            📩 Requests
          </div>

          <div style={styles.navItemActive}>
            🚗 Linked Drivers
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              navigate(`/agency/billing/${agency.AgencyId}`)
            }
          >
            💰 Billing
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              navigate("/agency/ad-simulation-form")
            }
          >
            🎬 Simulate Ads
          </div>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <div style={styles.agencyBox}>
            <div style={styles.agencyName}>
              {agency?.AgencyName || "Agency"}
            </div>
          </div>

          <button
            style={styles.logoutBtn}
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <main
        style={{
          ...styles.main,
          padding: isMobile ? 14 : 24,
        }}
      >
        {/* TITLE */}
        <h1
          style={{
            ...styles.title,
            fontSize: isMobile ? 24 : 32,
          }}
        >
          Linked Drivers
        </h1>

        {/* GRID */}
        {vehicles.length === 0 ? (
          <div style={styles.empty}>
            No linked drivers found
          </div>
        ) : (
          <div style={styles.grid}>
            {vehicles.map((v) => (
              <div
                key={v.VehicleReg}
                style={styles.card}
              >
                {/* IMAGE */}
                <div style={styles.imageBox}>
                  <img
                    src={
                      v.MediaPath ||
                      "https://via.placeholder.com/300x180"
                    }
                    alt="Vehicle"
                    style={styles.image}
                  />
                </div>

                {/* CONTENT */}
                <div style={styles.cardContent}>
                  <h3 style={styles.driverName}>
                    {v.OwnerName || "Driver"}
                  </h3>

                  <p style={styles.text}>
                    <strong>Vehicle:</strong>{" "}
                    {v.VehicleModel}
                  </p>

                  <p style={styles.text}>
                    <strong>Registration:</strong>{" "}
                    {v.VehicleReg}
                  </p>

                  <p style={styles.text}>
                    <strong>Type:</strong>{" "}
                    {v.VehicleType}
                  </p>

                  <div
                    style={{
                      ...styles.statusBadge,
                      background:
                        v.VehicleStatus?.toLowerCase() ===
                        "online"
                          ? "#22c55e22"
                          : "rgba(255,255,255,0.08)",
                      color:
                        v.VehicleStatus?.toLowerCase() ===
                        "online"
                          ? "#4ade80"
                          : "rgba(255,255,255,0.7)",
                    }}
                  >
                    {v.VehicleStatus || "Unknown"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default LinkedDrivers;

/* =========================
   STYLES
========================= */

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f0f1a",
    color: "#fff",
    fontFamily: "'Segoe UI', sans-serif",
  },

  sidebar: {
    background: "rgba(255,255,255,0.03)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
  },

  logo: {
    padding: "0 24px",
    marginBottom: 30,
    fontSize: 22,
    fontWeight: 700,
  },

  nav: {
    flex: 1,
    padding: "0 12px",
  },

  navItem: {
    padding: "12px 16px",
    borderRadius: 10,
    cursor: "pointer",
    color: "rgba(255,255,255,0.55)",
    marginBottom: 6,
    fontSize: 14,
    transition: "0.2s",
  },

  navItemActive: {
    padding: "12px 16px",
    borderRadius: 10,
    background:
      "linear-gradient(135deg,rgba(34,197,94,0.18),rgba(74,222,128,0.18))",
    color: "#4ade80",
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 600,
  },

  footer: {
    padding: "0 16px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    paddingTop: 20,
  },

  agencyBox: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  agencyName: {
    fontSize: 14,
    fontWeight: 700,
  },

  logoutBtn: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
  },

  main: {
    flex: 1,
    overflowY: "auto",
  },

  title: {
    fontWeight: 700,
    marginBottom: 24,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill,minmax(260px,1fr))",
    gap: 16,
  },

  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },

  imageBox: {
    width: "100%",
    height: 180,
    background: "#1e293b",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  cardContent: {
    padding: 14,
  },

  driverName: {
    margin: 0,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: 700,
  },

  text: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 8,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },

  statusBadge: {
    marginTop: 12,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 14px",
    borderRadius: 30,
    fontSize: 12,
    fontWeight: 700,
  },

  empty: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
};