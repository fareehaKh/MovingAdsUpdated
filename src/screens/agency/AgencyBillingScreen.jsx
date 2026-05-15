////////////////////////////////////   RESPONSIVE   ///////////////////////////////////////////
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getUserSession,
  clearUserSession,
} from "../../utils/session";

import {
  getAgencyBillingApi,
  getAgencyByUserApi,
} from "../../api/authapi";

const AgencyBillingScreen = () => {
  const navigate = useNavigate();
  const user = getUserSession();
  const { agencyId } = useParams();

  const [billing, setBilling] = useState(null);
  const [agency, setAgency] = useState(null);
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

      const agencyRes = await getAgencyByUserApi(user.UserId);
      setAgency(agencyRes.data);

      const response = await getAgencyBillingApi(agencyId);
      setBilling(response.data);
    } catch (err) {
      console.log("Agency billing error:", err);
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
      {/* ================= SIDEBAR ================= */}

      <aside
        style={{
          ...styles.sidebar,
          width: isMobile ? "100%" : 240,
          minWidth: isMobile ? "100%" : 240,
          position: isMobile ? "relative" : "sticky",
          top: 0,
          height: isMobile ? "auto" : "100vh",
          borderRight: isMobile
            ? "none"
            : "1px solid rgba(255,255,255,0.07)",
          borderBottom: isMobile
            ? "1px solid rgba(255,255,255,0.07)"
            : "none",
        }}
      >
        {/* LOGO */}
        <div style={styles.logo}>🏢 MovingAds</div>

        {/* NAV */}
        <div style={styles.nav}>
          <div style={styles.navItem} onClick={() => navigate("/agency")}>
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

          <div style={styles.navItemActive}>💰 Billing</div>

          <div
            style={styles.navItem}
            onClick={() => navigate("/agency/ad-simulation-form")}
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

          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <main
        style={{
          ...styles.main,
          padding: isMobile ? 14 : 22,
        }}
      >
        {/* TITLE */}
        <h1
          style={{
            ...styles.title,
            fontSize: isMobile ? 22 : 26,
          }}
        >
          Billing Overview
        </h1>

        {loading ? (
          <div style={styles.loading}>Loading billing...</div>
        ) : !billing ? (
          <div style={styles.empty}>No billing data found</div>
        ) : (
          <>
            {/* SUMMARY */}
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Net Profit</div>

              <div
                style={{
                  ...styles.totalAmount,
                  fontSize: isMobile ? 26 : 32,
                }}
              >
                Rs. {billing.NetProfit}
              </div>

              <div style={styles.summaryText}>
                Revenue - Driver Payout
              </div>
            </div>

            {/* GRID */}
            <div style={styles.grid}>
              {/* REVENUE */}
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Ad Revenue</h2>

                <div style={styles.detail}>
                  <span>Rate</span>
                  <strong>Rs. {billing.AdvertiserRate}</strong>
                </div>

                <div style={styles.detail}>
                  <span>Trips</span>
                  <strong>{billing.TotalAdTrips}</strong>
                </div>

                <div style={styles.detail}>
                  <span>Minutes</span>
                  <strong>{billing.TotalAdMinutes}</strong>
                </div>

                <div style={styles.detail}>
                  <span>Hours</span>
                  <strong>{billing.TotalAdHours}</strong>
                </div>

                <div style={styles.revenueBox}>
                  Revenue: Rs. {billing.TotalRevenueFromAds}
                </div>
              </div>

              {/* EXPENSE */}
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Driver Expenses</h2>

                <div style={styles.detail}>
                  <span>Rate</span>
                  <strong>Rs. {billing.DriverRate}</strong>
                </div>

                <div style={styles.detail}>
                  <span>Trips</span>
                  <strong>{billing.TotalDriverTrips}</strong>
                </div>

                <div style={styles.detail}>
                  <span>Minutes</span>
                  <strong>{billing.TotalDriverMinutes}</strong>
                </div>

                <div style={styles.detail}>
                  <span>Hours</span>
                  <strong>{billing.TotalDriverHours}</strong>
                </div>

                <div style={styles.expenseBox}>
                  Payout: Rs. {billing.TotalPayoutToDrivers}
                </div>
              </div>
            </div>

            {/* PROFIT */}
            <div style={styles.profitBox}>
              Net Profit: Rs. {billing.NetProfit}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AgencyBillingScreen;

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

  /* SIDEBAR */
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
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    color: "rgba(255,255,255,0.55)",
    marginBottom: 6,
    fontSize: 13,
  },

  navItemActive: {
    padding: "10px 14px",
    borderRadius: 10,
    background:
      "linear-gradient(135deg,rgba(34,197,94,0.18),rgba(74,222,128,0.18))",
    color: "#4ade80",
    marginBottom: 6,
    fontSize: 13,
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
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },

  agencyName: {
    fontSize: 13,
    fontWeight: 700,
  },

  logoutBtn: {
    width: "100%",
    padding: 9,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
  },

  /* MAIN */
  main: {
    flex: 1,
    overflowY: "auto",
  },

  title: {
    fontWeight: 700,
    marginBottom: 18,
  },

  loading: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },

  empty: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },

  /* SUMMARY */
  summaryCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    textAlign: "center",
  },

  summaryLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },

  totalAmount: {
    fontWeight: 700,
    color: "#4ade80",
    margin: "6px 0",
  },

  summaryText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },

  /* GRID */
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(260px,1fr))",
    gap: 14,
  },

  /* CARD */
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 14,
  },

  cardTitle: {
    fontSize: 15,
    marginBottom: 12,
    fontWeight: 700,
  },

  detail: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },

  revenueBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    background: "rgba(59,130,246,0.15)",
    fontSize: 12,
    fontWeight: 600,
  },

  expenseBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    background: "rgba(239,68,68,0.15)",
    fontSize: 12,
    fontWeight: 600,
  },

  profitBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    background: "rgba(74,222,128,0.15)",
    border: "1px solid rgba(74,222,128,0.2)",
    textAlign: "center",
    color: "#4ade80",
    fontWeight: 700,
    fontSize: 16,
  },
};