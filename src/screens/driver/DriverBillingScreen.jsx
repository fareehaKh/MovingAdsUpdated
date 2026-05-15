import { useEffect, useState } from "react";
import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  getUserSession,
  clearUserSession,
} from "../../utils/session";

import { getDriverBillingApi } from "../../api/authapi";

const DriverBillingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = getUserSession();

  const [billing, setBilling] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [mobileSidebar, setMobileSidebar] =
    useState(false);

  const isMobile =
    window.innerWidth <= 768;

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
        await getDriverBillingApi(
          user.UserId
        );

      setBilling(response.data);
    } catch (err) {
      console.log(err);
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

  // =========================
  // ACTIVE NAV
  // =========================
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <div style={styles.page}>
      {/* MOBILE HEADER */}
      <div style={styles.mobileHeader}>
        <div style={styles.mobileLogo}>
          🚗 MovingAds
        </div>

        <button
          style={styles.menuBtn}
          onClick={() =>
            setMobileSidebar(
              !mobileSidebar
            )
          }
        >
          ☰
        </button>
      </div>

      {/* OVERLAY */}
      {mobileSidebar && (
        <div
          style={styles.overlay}
          onClick={() =>
            setMobileSidebar(false)
          }
        />
      )}

      {/* SIDEBAR */}
      <aside
        style={{
          ...styles.sidebar,

          ...(mobileSidebar
            ? styles.sidebarMobileOpen
            : {}),
        }}
      >
        {/* LOGO */}
        <div style={styles.sidebarLogo}>
          <span style={{ fontSize: 22 }}>
            🚗
          </span>

          <span
            style={styles.sidebarLogoText}
          >
            MovingAds
          </span>
        </div>

        {/* NAV */}
        <nav style={styles.nav}>
          <div
            style={{
              ...styles.navItem,

              ...(location.pathname ===
              "/driver/dashboard"
                ? styles.navItemActive
                : {}),
            }}
            onClick={() =>
              navigate(
                "/driver"
              )
            }
          >
            🚘 My Vehicles
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              navigate(
                "/driver/available-agencies"
              )
            }
          >
            🏢 Available Agencies
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              navigate(
                "/driver/trip-stats/${v.VehicleReg}"
              )
            }
          >
            📊 Trip Stats
          </div>

          <div
            style={{
              ...styles.navItem,

              ...(isActive(
                "/driver/earnings"
              )
                ? styles.navItemActive
                : {}),
            }}
            onClick={() =>
              navigate(
                "/driver/earnings"
              )
            }
          >
            💰 My Earnings
          </div>
        </nav>

        {/* FOOTER */}
        <div style={styles.sidebarFooter}>
          <div style={styles.userBadge}>
            <div style={styles.avatar}>
              {user?.Name?.[0]?.toUpperCase() ||
                "D"}
            </div>

            <div>
              <div style={styles.userName}>
                {user?.Name}
              </div>

              <div style={styles.userRole}>
                Driver
              </div>
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

      {/* MAIN */}
      <main style={styles.main}>
        {/* TOP */}
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>
              Driver Earnings
            </h1>

            <p style={styles.pageSub}>
              Track your earnings &
              driving stats
            </p>
          </div>
        </div>

        {loading ? (
          <div style={styles.center}>
            <div style={styles.spinner} />
          </div>
        ) : !billing ? (
          <div style={styles.empty}>
            <div
              style={{ fontSize: 50 }}
            >
              💰
            </div>

            <p style={styles.emptyText}>
              No earnings found.
            </p>
          </div>
        ) : (
          <>
            {/* SUMMARY CARDS */}
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <div
                  style={
                    styles.summaryLabel
                  }
                >
                  Total Earned
                </div>

                <div
                  style={
                    styles.summaryValue
                  }
                >
                  Rs.{" "}
                  {billing.TotalEarned}
                </div>
              </div>

              <div style={styles.summaryCard}>
                <div
                  style={
                    styles.summaryLabel
                  }
                >
                  Total Trips
                </div>

                <div
                  style={
                    styles.summaryValue
                  }
                >
                  {billing.TotalTrips}
                </div>
              </div>

              <div style={styles.summaryCard}>
                <div
                  style={
                    styles.summaryLabel
                  }
                >
                  Total Hours
                </div>

                <div
                  style={
                    styles.summaryValue
                  }
                >
                  {
                    billing.TotalTimeHours
                  }
                </div>
              </div>
            </div>

            {/* MAIN CARD */}
            <div style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <h2
                    style={
                      styles.driverTitle
                    }
                  >
                    {
                      billing.DriverName
                    }
                  </h2>

                  <div
                    style={
                      styles.agencyBadge
                    }
                  >
                    {
                      billing.AgencyName
                    }
                  </div>
                </div>

                <div style={styles.billBox}>
                  Rs.{" "}
                  {billing.TotalEarned}
                </div>
              </div>

              {/* STATS */}
              <div style={styles.statsGrid}>
                <div
                  style={
                    styles.statCard
                  }
                >
                  <span>Trips</span>

                  <strong>
                    {
                      billing.TotalTrips
                    }
                  </strong>
                </div>

                <div
                  style={
                    styles.statCard
                  }
                >
                  <span>
                    Distance
                  </span>

                  <strong>
                    {
                      billing.TotalDistanceKm
                    }{" "}
                    km
                  </strong>
                </div>

                <div
                  style={
                    styles.statCard
                  }
                >
                  <span>Hours</span>

                  <strong>
                    {
                      billing.TotalTimeHours
                    }
                  </strong>
                </div>

                <div
                  style={
                    styles.statCard
                  }
                >
                  <span>Rate</span>

                  <strong>
                    Rs.{" "}
                    {
                      billing.DriverRate
                    }
                  </strong>
                </div>
              </div>

              {/* DETAILS */}
              <div style={styles.details}>
                <div
                  style={
                    styles.detailRow
                  }
                >
                  <span>Email</span>

                  <strong>
                    {
                      billing.DriverEmail
                    }
                  </strong>
                </div>

                <div
                  style={
                    styles.detailRow
                  }
                >
                  <span>Agency</span>

                  <strong>
                    {
                      billing.AgencyName
                    }
                  </strong>
                </div>

                <div
                  style={
                    styles.detailRow
                  }
                >
                  <span>
                    Total Minutes
                  </span>

                  <strong>
                    {
                      billing.TotalTimeMinutes
                    }{" "}
                    mins
                  </strong>
                </div>
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
    fontFamily:
      "'Segoe UI', sans-serif",
  },

  /* MOBILE HEADER */
  mobileHeader: {
    display: "none",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1200,
    background: "#111827",
    padding: "16px 18px",
    alignItems: "center",
    justifyContent:
      "space-between",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
  },

  mobileLogo: {
    color: "#fff",
    fontWeight: "700",
    fontSize: "18px",
  },

  menuBtn: {
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "26px",
    cursor: "pointer",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(0,0,0,0.5)",
    zIndex: 999,
  },

  /* SIDEBAR */
  sidebar: {
    width: 240,
    background:
      "rgba(255,255,255,0.03)",
    borderRight:
      "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    position: "sticky",
    top: 0,
    height: "100vh",
    zIndex: 1000,
    transition: "0.3s ease",
  },

  sidebarMobileOpen: {
    transform: "translateX(0)",
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
    borderRadius: 10,
    color:
      "rgba(255,255,255,0.6)",
    fontSize: 14,
    cursor: "pointer",
    marginBottom: 6,
    transition: "0.2s",
  },

  navItemActive: {
    background:
      "rgba(34,197,94,0.15)",
    color: "#4ade80",
  },

  sidebarFooter: {
    padding: "0 16px",
    borderTop:
      "1px solid rgba(255,255,255,0.07)",
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
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
  },

  userName: {
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
  },

  userRole: {
    color:
      "rgba(255,255,255,0.4)",
    fontSize: 12,
  },

  logoutBtn: {
    width: "100%",
    padding: "10px",
    borderRadius: 8,
    border:
      "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color:
      "rgba(255,255,255,0.6)",
    cursor: "pointer",
  },

  /* MAIN */
  main: {
    flex: 1,
    padding: "32px",
    overflowY: "auto",
  },

  topBar: {
    marginBottom: 28,
  },

  pageTitle: {
    color: "#fff",
    margin: 0,
    fontSize: "32px",
    fontWeight: 700,
  },

  pageSub: {
    color:
      "rgba(255,255,255,0.5)",
    marginTop: 6,
  },

  /* SUMMARY */
  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 18,
    marginBottom: 24,
  },

  summaryCard: {
    background:
      "rgba(255,255,255,0.05)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 22,
  },

  summaryLabel: {
    color:
      "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginBottom: 10,
  },

  summaryValue: {
    color: "#4ade80",
    fontSize: 30,
    fontWeight: 700,
  },

  /* CARD */
  card: {
    background:
      "rgba(255,255,255,0.05)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 22,
  },

  cardTop: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 22,
  },

  driverTitle: {
    color: "#fff",
    margin: 0,
    marginBottom: 10,
    fontSize: 24,
  },

  agencyBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: 999,
    background:
      "rgba(34,197,94,0.15)",
    color: "#4ade80",
    fontSize: 12,
    fontWeight: 600,
  },

  billBox: {
    background:
      "rgba(74,222,128,0.15)",
    color: "#4ade80",
    padding: "12px 18px",
    borderRadius: 14,
    fontWeight: 700,
    fontSize: 22,
  },

  /* STATS */
  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",
    gap: 14,
    marginBottom: 22,
  },

  statCard: {
    background:
      "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    color:
      "rgba(255,255,255,0.7)",
    fontSize: 13,
  },

  /* DETAILS */
  details: {
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
    paddingTop: 18,
  },

  detailRow: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: 20,
    marginBottom: 12,
    color:
      "rgba(255,255,255,0.8)",
    fontSize: 14,
    flexWrap: "wrap",
  },

  /* LOADING */
  center: {
    display: "flex",
    justifyContent: "center",
    padding: "80px 0",
  },

  spinner: {
    width: 42,
    height: 42,
    border:
      "4px solid rgba(255,255,255,0.1)",
    borderTop:
      "4px solid #22c55e",
    borderRadius: "50%",
    animation:
      "spin 0.8s linear infinite",
  },

  empty: {
    textAlign: "center",
    padding: "100px 20px",
  },

  emptyText: {
    color:
      "rgba(255,255,255,0.5)",
    marginTop: 12,
  },
};

/* RESPONSIVE */
if (window.innerWidth <= 768) {
  styles.mobileHeader.display =
    "flex";

  styles.sidebar = {
    ...styles.sidebar,
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    transform: "translateX(-100%)",
    background: "#111827",
  };

  styles.main = {
    ...styles.main,
    padding: "90px 16px 24px",
  };

  styles.pageTitle.fontSize =
    "28px";

  styles.summaryGrid.gridTemplateColumns =
    "1fr";

  styles.statsGrid.gridTemplateColumns =
    "1fr";
}