////////////////////////////////////   RESPONSIVE   //////////////////////////////////

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  getUserSession,
  clearUserSession,
} from "../../utils/session";

import {
  getAgencyByUserApi,
  getReceivedRequestsApi,
  getActiveAssignmentsByAgencyApi,
  getAdAssignmentByAdApi
} from "../../api/authapi";

const AgencyDashboard = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  const [agency, setAgency] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    loadDashboard();
  }, []);

  // =========================
  // LOAD DASHBOARD
  // =========================
  const loadDashboard = async () => {
    try {
      setLoading(true);

      // 1️⃣ GET AGENCY OF LOGGED IN USER
      const agencyRes = await getAgencyByUserApi(user.UserId);

      const agencyData = agencyRes.data;

      setAgency(agencyData);

      // 2️⃣ GET RECEIVED REQUESTS
      const reqRes = await getReceivedRequestsApi(user.UserId);

      // ONLY ACCEPTED REQUESTS
      const acceptedRequests = (reqRes.data || []).filter(
        (r) =>
          (r.Status || "").toLowerCase() === "accepted"
      );

      // 3️⃣ GET ACTIVE ADS OF THIS AGENCY
      const activeAssignmentsRes =
        await getActiveAssignmentsByAgencyApi(
          agencyData.AgencyId
      );

      const activeAssignments =
        activeAssignmentsRes.data || [];

      // 4️⃣ MERGE REQUEST + ASSIGNMENT DATA
      const finalAds = await Promise.all(
        activeAssignments.map(async (assignment) => {
          // console.log('The Adszz:  ', activeAssignments.AdTitle, ' , ', activeAssignments.FromUser);
          const matchingRequest = acceptedRequests.find(
            (r) => r.AdId === assignment.AdId
          );

          let vehicles = [];

          try {
            const vehicleRes = await getAdAssignmentByAdApi(assignment.AdId);

            vehicles = vehicleRes.data || [];
          } catch (err) {
            console.log(err);
          }

          return {
            ...assignment,
            FromUser: matchingRequest?.FromUser || "",
            vehicles,
          };
        })
      );

      setAds(finalAds);
      console.log("adsssssss",finalAds);
    } catch (err) {
      console.log(err);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {
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
        }}
      >
        {/* LOGO */}
        <div style={styles.logo}>
          🏢 MovingAds
        </div>

        {/* NAVIGATION */}
        <div style={styles.nav}>
          <div style={styles.navItemActive}>
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

          <div
            style={styles.navItem}
            onClick={() =>
              navigate("/agency/linked-drivers")
            }
          >
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
            onClick={handleLogout}
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
          Active Ads
        </h1>

        {/* CONTENT */}

        {loading ? (
          <div style={styles.loading}>
            Loading...
          </div>
        ) : ads.length === 0 ? (
          <div style={styles.empty}>
            No active ads found
          </div>
        ) : (
          <div style={styles.grid}>
            {ads.map((ad, index) => (
              <div
                key={index}
                style={{
                  ...styles.card,
                  flexDirection: isMobile
                    ? "column"
                    : "row",
                  alignItems: isMobile
                    ? "flex-start"
                    : "center",
                }}
              >
              {/* {console.log("piccccc",ad.MediaPath)} */}
                
                {/* LEFT IMAGE */}
                {/* <div style={styles.imageBox}>
                  <img
                    src={
                      ad.MediaPath     
                    }
                    alt="Ad"
                    style={styles.image}
                  />
                </div> */}

                {/* CENTER INFO */}
                <div style={styles.info}>
                  <h3 style={styles.adTitle}>
                    {ad.AdTitle}
                  </h3>

                  <p style={styles.text}>
                    <strong>Advertiser:</strong>{" "}
                    {ad.FromUser || "Unknown"}
                  </p>

                  <p style={styles.text}>
                    <strong>Status:</strong>{" "}
                    Active
                  </p>

                  

                  <p style={styles.text}>
                    <strong>Agency:</strong>{" "}
                    {agency?.AgencyName}
                  </p>

                  {/* VEHICLES */}
                  {/* {ad.vehicles?.length > 0 && (
                    <div style={styles.vehicleList}>
                      {ad.vehicles.map((v, i) => (
                        <div
                          key={i}
                          style={styles.vehicle}
                        >
                          🚗 {v.VehicleModel} (
                          {v.VehicleType})
                          <br />
                          👤 {v.DriverName} ⭐{" "}
                          {v.Rating}
                        </div>
                      ))}
                    </div>
                  )} */}
                </div>

                {/* RIGHT STATUS */}
                <div
                  onClick={() =>
                    navigate(
                      `/agency/agency-analytics/${ad.AdId}`
                    )
                  }
                  style={{
                    ...styles.activeBadge,
                    width: isMobile
                      ? "100%"
                      : "auto",
                    textAlign: "center",
                  }}
                >
                  Analytics
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AgencyDashboard;

/* =========================
   STYLES
========================= */

const styles = {
  // PAGE
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f0f1a",
    color: "#fff",
    fontFamily: "'Segoe UI', sans-serif",
  },

  // SIDEBAR
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
    borderTop:
      "1px solid rgba(255,255,255,0.07)",
    paddingTop: 20,
  },

  agencyBox: {
    background: "rgba(255,255,255,0.05)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  agencyName: {
    fontSize: 14,
    fontWeight: 700,
  },

  agencyOwner: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },

  logoutBtn: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border:
      "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
  },

  // MAIN
  main: {
    flex: 1,
    overflowY: "auto",
  },

  title: {
    fontWeight: 700,
    marginBottom: 24,
  },

  // GRID
  grid: {
    display: "grid",
    gap: 16,
  },

  // CARD
  card: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    padding: 14,
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    border:
      "1px solid rgba(255,255,255,0.08)",
  },

  imageBox: {
    width: 120,
    minWidth: 120,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
    background: "#1e293b",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  info: {
    flex: 1,
  },

  adTitle: {
    margin: 0,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: 700,
  },

  text: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 6,
  },

  vehicleList: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  vehicle: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },

  activeBadge: {
    padding: "8px 16px",
    borderRadius: 30,
    background: "#22c55e22",
    color: "#22c55e",
    fontWeight: 700,
    fontSize: 12,
    alignSelf: "center",
    cursor: "pointer",
    transition: "0.2s",
    userSelect: "none",
  },

  // STATES
  loading: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },

  empty: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
};