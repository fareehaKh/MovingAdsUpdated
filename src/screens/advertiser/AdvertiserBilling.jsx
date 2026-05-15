import { useEffect, useState } from "react";
import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  getUserSession,
  clearUserSession,
} from "../../utils/session";

import { getAdvertiserBillingApi } from "../../api/authapi";

const AdvertiserBillingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = getUserSession();

  const [billingData, setBillingData] = useState([]);
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

      const response =
        await getAdvertiserBillingApi(
          user.UserId
        );

      setBillingData(response.data || []);
    } catch (err) {
      console.log(err);
      setBillingData([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // TOTALS
  // =========================
  const totalBill = billingData.reduce(
    (sum, item) =>
      sum + Number(item.TotalBill || 0),
    0
  );

  const totalTrips = billingData.reduce(
    (sum, item) =>
      sum + Number(item.TotalTrips || 0),
    0
  );

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  // =========================
  // ACTIVE SIDEBAR
  // =========================
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <div
      style={{
        ...styles.page,
        flexDirection: isMobile
          ? "column"
          : "row",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          ...styles.sidebar,
          width: isMobile
            ? "100%"
            : 240,
          minWidth: isMobile
            ? "100%"
            : 240,

          borderRight: isMobile
            ? "none"
            : "1px solid rgba(255,255,255,0.07)",

          borderBottom: isMobile
            ? "1px solid rgba(255,255,255,0.07)"
            : "none",
        }}
      >
        {/* LOGO */}
        <div style={styles.sidebarLogo}>
          <span>📢</span>
          <span style={styles.logoText}>
            MovingAds
          </span>
        </div>

        {/* NAVIGATION */}
        <nav style={styles.nav}>
          <div
            style={{
              ...styles.navItem,
              ...(location.pathname ===
              "/advertiser"
                ? styles.navItemActive
                : {}),
            }}
            onClick={() =>
              navigate("/advertiser")
            }
          >
            📊 Dashboard
          </div>

          <div
            style={{
              ...styles.navItem,
              ...(isActive(
                "/sent-requests"
              )
                ? styles.navItemActive
                : {}),
            }}
            onClick={() =>
              navigate(
                "/advertiser/sent-requests"
              )
            }
          >
            📩 Sent Requests
          </div>

          <div
            style={{
              ...styles.navItem,
              ...(isActive("/ad-stats")
                ? styles.navItemActive
                : {}),
            }}
            onClick={() =>
              navigate(
                "/advertiser/ad-stats"
              )
            }
          >
            📈 Ad Stats
          </div>

          <div
            style={{
              ...styles.navItem,
              ...(isActive(
                "/ad-billing"
              )
                ? styles.navItemActive
                : {}),
            }}
            onClick={() =>
              navigate(
                "/advertiser/ad-billing"
              )
            }
          >
            💳 Ad Billings
          </div>
        </nav>

        {/* FOOTER */}
        <div style={styles.sidebarFooter}>
          <div style={styles.userBox}>
            <div style={styles.avatar}>
              {user?.Name?.[0]?.toUpperCase() ||
                "A"}
            </div>

            <div>
              <div style={styles.userName}>
                {user?.Name}
              </div>

              <div style={styles.userRole}>
                Advertiser
              </div>
            </div>
          </div>

          <button
            style={styles.logout}
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
          padding: isMobile ? 14 : 22,
        }}
      >
        {/* TOP */}
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>
              Billing Overview
            </h1>

            <p style={styles.sub}>
              View all billing records
            </p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "#aaa" }}>
            Loading billing...
          </p>
        ) : billingData.length === 0 ? (
          <div style={styles.emptyCard}>
            No billing records found.
          </div>
        ) : (
          <>
            {/* SUMMARY CARDS */}
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>
                  Total Revenue
                </div>

                <div style={styles.summaryValue}>
                  Rs.{" "}
                  {totalBill.toFixed(2)}
                </div>
              </div>

              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>
                  Total Ads
                </div>

                <div style={styles.summaryValue}>
                  {billingData.length}
                </div>
              </div>

              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>
                  Total Trips
                </div>

                <div style={styles.summaryValue}>
                  {totalTrips}
                </div>
              </div>
            </div>

            {/* BILLING CARDS */}
            <div style={styles.grid}>
              {billingData.map((bill) => (
                <div
                  key={bill.AdId}
                  style={styles.card}
                >
                  {/* TOP */}
                  <div style={styles.cardTop}>
                    <div>
                      <h2 style={styles.adTitle}>
                        {bill.AdTitle}
                      </h2>

                      <div
                        style={
                          styles.category
                        }
                      >
                        {bill.Category}
                      </div>
                    </div>

                    <div style={styles.billBox}>
                      Rs. {bill.TotalBill}
                    </div>
                  </div>

                  {/* STATS */}
                  <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                      <span>Trips</span>
                      <strong>
                        {bill.TotalTrips}
                      </strong>
                    </div>

                    <div style={styles.statCard}>
                      <span>Distance</span>
                      <strong>
                        {
                          bill.TotalDistanceKm
                        }{" "}
                        km
                      </strong>
                    </div>

                    <div style={styles.statCard}>
                      <span>Hours</span>
                      <strong>
                        {
                          bill.TotalTimeHours
                        }
                      </strong>
                    </div>

                    <div style={styles.statCard}>
                      <span>Rate</span>
                      <strong>
                        Rs.{" "}
                        {
                          bill.AdvertiserRate
                        }
                      </strong>
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div style={styles.details}>
                    <div style={styles.detailRow}>
                      <span>Status</span>
                      <strong>
                        {bill.AdStatus}
                      </strong>
                    </div>

                    <div style={styles.detailRow}>
                      <span>Agency</span>
                      <strong>
                        {bill.AgencyName}
                      </strong>
                    </div>

                    <div style={styles.detailRow}>
                      <span>Email</span>
                      <strong>
                        {
                          bill.AdvertiserEmail
                        }
                      </strong>
                    </div>
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

export default AdvertiserBillingScreen;

/* =========================
   STYLES
========================= */

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f0f1a",
    color: "#fff",
    fontFamily: "Segoe UI",
  },

  // SIDEBAR
  sidebar: {
    background:
      "rgba(255,255,255,0.03)",
    display: "flex",
    flexDirection: "column",
    padding: "20px 0",
  },

  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 18px",
    marginBottom: 25,
    fontWeight: 700,
  },

  logoText: {
    fontSize: 16,
  },

  nav: {
    flex: 1,
    padding: "0 10px",
  },

  navItem: {
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginBottom: 6,
  },

  navItemActive: {
    background:
      "rgba(167,139,250,0.18)",
    color: "#a78bfa",
  },

  sidebarFooter: {
    padding: "12px 16px",
    borderTop:
      "1px solid rgba(255,255,255,0.07)",
  },

  userBox: {
    display: "flex",
    gap: 10,
    marginBottom: 10,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#7c5cff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 700,
  },

  userName: {
    fontSize: 13,
  },

  userRole: {
    fontSize: 11,
    opacity: 0.5,
  },

  logout: {
    width: "100%",
    padding: 8,
    background: "transparent",
    border:
      "1px solid rgba(255,255,255,0.1)",
    color: "#aaa",
    borderRadius: 8,
    cursor: "pointer",
  },

  // MAIN
  main: {
    flex: 1,
  },

  topBar: {
    marginBottom: 22,
  },

  title: {
    margin: 0,
    fontSize: 28,
  },

  sub: {
    opacity: 0.5,
    fontSize: 13,
    marginTop: 4,
  },

  emptyCard: {
    padding: 30,
    borderRadius: 16,
    background:
      "rgba(255,255,255,0.04)",
    textAlign: "center",
    color: "#888",
  },

  // SUMMARY
  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 16,
    marginBottom: 24,
  },

  summaryCard: {
    background:
      "rgba(255,255,255,0.05)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
  },

  summaryLabel: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 10,
  },

  summaryValue: {
    fontSize: 30,
    fontWeight: 700,
    color: "#7c5cff",
  },

  // GRID
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(340px,1fr))",
    gap: 18,
  },

  // CARD
  card: {
    background:
      "rgba(255,255,255,0.05)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 18,
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },

  adTitle: {
    margin: 0,
    marginBottom: 8,
    fontSize: 20,
  },

  category: {
    display: "inline-block",
    background: "#7c5cff33",
    padding: "5px 10px",
    borderRadius: 30,
    fontSize: 12,
  },

  billBox: {
    background:
      "rgba(74,222,128,0.15)",
    color: "#4ade80",
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 18,
    whiteSpace: "nowrap",
  },

  // STATS
  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,1fr)",
    gap: 12,
    marginBottom: 18,
  },

  statCard: {
    background:
      "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 13,
    opacity: 0.9,
  },

  // DETAILS
  details: {
    borderTop:
      "1px solid rgba(255,255,255,0.07)",
    paddingTop: 14,
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
    fontSize: 14,
    gap: 10,
  },
};