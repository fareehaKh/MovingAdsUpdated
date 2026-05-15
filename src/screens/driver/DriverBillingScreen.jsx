import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getUserSession,
  clearUserSession,
} from "../../utils/session";

import { getDriverBillingApi } from "../../api/authapi";

const DriverBillingScreen = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    loadBilling();
  }, []);

  // =========================
  // LOAD BILLING
  // =========================
  const loadBilling = async () => {
    try {
      setLoading(true);

      
      const user=getUserSession();
      const response = await getDriverBillingApi(user.UserId);

      setBilling(response.data);
    } catch (err) {
      console.log("Driver billing error:", err);
      setBilling(null);
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
      {/* SIDEBAR */}
      <aside
        style={{
          ...styles.sidebar,
          width: isMobile ? "100%" : 240,
          minWidth: isMobile ? "100%" : 240,
        }}
      >
        <div style={styles.logo}>🚗 MovingAds</div>

        <div style={styles.nav}>
          <div
            style={styles.navItem}
            onClick={() =>
              navigate("/driver/dashboard")
            }
          >
            📊 Dashboard
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              navigate("/driver/billing")
            }
          >
            💰 Earnings
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

      {/* MAIN */}
      <main
        style={{
          ...styles.main,
          padding: isMobile ? 14 : 24,
        }}
      >
        <h1 style={styles.title}>
          Driver Earnings
        </h1>

        {loading ? (
          <div style={styles.loading}>
            Loading earnings...
          </div>
        ) : !billing ? (
          <div style={styles.empty}>
            No earnings found
          </div>
        ) : (
          <>
            {/* TOTAL EARNINGS SUMMARY */}
            <div style={styles.summaryCard}>
              <h2>Total Earned</h2>

              <div style={styles.totalAmount}>
                Rs. {billing.TotalEarned}
              </div>

              <div>
                Across {billing.TotalTrips} Trips
              </div>
            </div>

            {/* DRIVER DETAILS CARD */}
            <div style={styles.card}>
              <h2 style={styles.driverTitle}>
                {billing.DriverName}
              </h2>

              <div style={styles.detail}>
                <strong>Email:</strong>{" "}
                {billing.DriverEmail}
              </div>

              <div style={styles.detail}>
                <strong>Agency:</strong>{" "}
                {billing.AgencyName}
              </div>

              <div style={styles.detail}>
                <strong>Driver Rate:</strong> Rs.{" "}
                {billing.DriverRate}
              </div>

              <div style={styles.detail}>
                <strong>Total Trips:</strong>{" "}
                {billing.TotalTrips}
              </div>

              <div style={styles.detail}>
                <strong>Total Distance:</strong>{" "}
                {billing.TotalDistanceKm} km
              </div>

              <div style={styles.detail}>
                <strong>Total Time:</strong>{" "}
                {billing.TotalTimeMinutes} mins
              </div>

              <div style={styles.detail}>
                <strong>Total Hours:</strong>{" "}
                {billing.TotalTimeHours}
              </div>

              <div style={styles.billBox}>
                Rs. {billing.TotalEarned}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DriverBillingScreen;

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
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    textAlign: "center",
  },

  totalAmount: {
    fontSize: 34,
    fontWeight: 700,
    margin: "12px 0",
    color: "#4ade80",
  },

  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
  },

  driverTitle: {
    marginBottom: 14,
    fontSize: 20,
  },

  detail: {
    marginBottom: 8,
    fontSize: 14,
  },

  billBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    background: "rgba(74,222,128,0.15)",
    fontSize: 22,
    fontWeight: 700,
    textAlign: "center",
    color: "#4ade80",
  },
};