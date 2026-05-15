import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getUserSession,
  clearUserSession,
} from "../../utils/session";

import { getAdAnalyticsApi } from "../../api/authapi";

const AgencyAnalyticsScreen = () => {
  const navigate = useNavigate();
  const { adId } = useParams();
  const user = getUserSession();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    if (adId) {
      loadAnalytics();
    }
  }, [adId]);

  // =========================
  // LOAD ANALYTICS
  // =========================
  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const response = await getAdAnalyticsApi(adId);
      console.log("reespose",response);
      setAnalytics(response.data);
    
      console.log("analytixcs",analytics);
    } catch (err) {
      console.log("Analytics error:", err);
      setAnalytics(null);
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
        <div style={styles.logo}>🏢 MovingAds</div>

        <div style={styles.nav}>
          <div
            style={styles.navItem}
            onClick={() => navigate("/agency/dashboard")}
          >
            📊 Dashboard
          </div>

          <div
            style={styles.navItem}
            onClick={() => navigate("/agency/received-requests")}
          >
            📩 Requests
          </div>

          <div
            style={styles.navItem}
            onClick={() => navigate("/agency/linked-drivers")}
          >
            🚗 Linked Drivers
          </div>

          <div
            style={styles.navItem}
            onClick={() => navigate("/agency/ad-simulation-form")}
          >
            🎬 Simulate Ads
          </div>
        </div>

        <div style={styles.footer}>
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
        <h1 style={styles.title}>Ad Analytics</h1>

        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : !analytics ? (
          <div style={styles.empty}>No analytics found</div>
        ) : (
          <>
            {/* SUMMARY CARD */}
            <div style={styles.summaryCard}>
              <h2 style={styles.adTitle}>
                
                {analytics.AdTitle}
              </h2>

              <div style={styles.kvRow}>
                <div style={styles.kvBox}>
                  <span>Allocated</span>
                  <b>{analytics.AllocatedMinutes} min</b>
                </div>

                <div style={styles.kvBox}>
                  <span>Consumed</span>
                  <b>{analytics.ConsumedMinutes} min</b>
                </div>

                <div style={styles.kvBox}>
                  <span>Remaining</span>
                  <b>{analytics.RemainingMinutes} min</b>
                </div>

                <div style={styles.kvBox}>
                  <span>Total KM</span>
                  <b>{analytics.TotalValidKm}</b>
                </div>
              </div>
            </div>

            {/* DAILY TRIPS */}
            <h2 style={styles.sectionTitle}>Daily Trips</h2>

            <div style={styles.grid}>
              {analytics.DailyTrips?.map((trip) => (
                <div key={trip.TripId} style={styles.card}>
                  <div style={styles.tripDetail}>
                    🚗 <strong>Vehicle:</strong>{" "}
                    {trip.VehicleReg}
                  </div>

                  <div style={styles.tripDetail}>
                    📅 <strong>Date:</strong>{" "}
                    {new Date(
                      trip.TripDate
                    ).toLocaleDateString()}
                  </div>

                  <div style={styles.tripDetail}>
                    📍 <strong>Distance:</strong>{" "}
                    {trip.ValidDistanceKm} km
                  </div>

                  <div style={styles.tripDetail}>
                    ⏱ <strong>Time:</strong>{" "}
                    {trip.ValidTimeMinutes} min
                  </div>

                  <div style={styles.tripDetail}>
                    🔢 <strong>Segments:</strong>{" "}
                    {trip.SegmentsCount}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AgencyAnalyticsScreen;

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
    color: "rgba(255,255,255,0.6)",
    marginBottom: 6,
  },

  footer: {
    padding: "0 16px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    paddingTop: 20,
  },

  logoutBtn: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    background: "transparent",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    cursor: "pointer",
  },

  main: {
    flex: 1,
    overflowY: "auto",
  },

  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 20,
  },

  loading: {
    opacity: 0.7,
  },

  empty: {
    opacity: 0.6,
  },

  summaryCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },

  adTitle: {
    margin: 0,
    fontSize: 22,
    marginBottom: 16,
  },

  kvRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },

  kvBox: {
    minWidth: 140,
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    flexDirection: "column",
    fontSize: 13,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 16,
  },

  grid: {
    display: "grid",
    gap: 14,
  },

  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 16,
  },

  tripDetail: {
    marginBottom: 10,
    fontSize: 14,
  },
};