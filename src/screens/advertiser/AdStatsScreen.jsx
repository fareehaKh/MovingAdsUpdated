////////////////////////////////////   RESPONSIVE   //////////////////////////////////

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  getUserSession,
  clearUserSession,
} from "../../utils/session";

import {
  getAdsByUserApi,
  getAdAnalyticsApi,
  getAllocatedTimeApi,
} from "../../api/authapi";

const AdStatsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = getUserSession();

  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    loadStats();
  }, []);

  // =========================
  // LOAD STATS
  // =========================

  const loadStats = async () => {
    try {
      setLoading(true);

      // GET ADS
      const adsRes = await getAdsByUserApi(
        user.UserId
      );

      const ads = adsRes.data || [];

      // GET STATS OF EACH AD
      const finalStats = await Promise.all(
        ads.map(async (ad) => {
          try {
            const analyticsRes =
              await getAdAnalyticsApi(ad.AdId);

            const allocatedRes =
              await getAllocatedTimeApi(ad.AdId);

            const analytics =
              analyticsRes.data;

            const allocated =
              allocatedRes.data;
    

            return {
              AdId: ad.AdId,
              AdTitle:
                analytics.AdTitle ||
                ad.AdTitle,

              MediaPath: ad.MediaPath,

              AllocatedMinutes:
                allocated.AllocatedMinutes ||
                0,

              ConsumedMinutes:
                analytics.ConsumedMinutes ||
                0,

              RemainingMinutes:
                analytics.RemainingMinutes ||
                0,

              TotalValidKm:
                analytics.TotalValidKm ||
                0,
            };
          } catch (err) {
            console.log(err);

            return {
              AdId: ad.AdId,
              AdTitle: ad.AdTitle,
              MediaPath: ad.MediaPath,

              AllocatedMinutes: 0,
              ConsumedMinutes: 0,
              RemainingMinutes: 0,
              TotalValidKm: 0,
            };
          }
        })
      );

      setStats(finalStats);
    } catch (err) {
      console.log(err);
      setStats([]);
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
  // ACTIVE SIDEBAR
  // =========================

  const isActive = (path) =>
    location.pathname.includes(path);

  // =========================
  // FORMAT TIME
  // =========================

  const formatMinutes = (mins) => {
    mins = Number(mins || 0);

    if (mins <= 0) return "0m";

    if (mins < 60) {
      return `${mins.toFixed(1)} mins`;
    }

    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);

    if (m === 0) return `${h} hrs`;

    return `${h} hrs ${m} mins`;
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
      {/* ================= SIDEBAR ================= */}

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

        {/* NAV */}

        <div style={styles.nav}>
          <div
            style={{
              ...styles.navItem,
              ...(isActive("/advertiser") &&
              !isActive("/ad-stats")
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
              ...(isActive("/sent-requests")
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
              ...(isActive("/ad-billing")
                ? styles.navItemActive
                : {}),
            }}
            onClick={() => navigate("/advertiser/ad-billing")}
          >
             Ad Billings
          </div>
          
        </div>

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

      {/* ================= MAIN ================= */}

      <main
        style={{
          ...styles.main,
          padding: isMobile ? 14 : 20,
        }}
      >
        {/* HEADER */}

        <div
          style={{
            ...styles.topBar,
            flexDirection: isMobile
              ? "column"
              : "row",
          }}
        >
          <div>
            <h1 style={styles.title}>
              Ad Statistics
            </h1>

            <p style={styles.sub}>
              Track ad performance &
              campaign usage
            </p>
          </div>
        </div>

        {/* CONTENT */}

        {loading ? (
          <div style={styles.loading}>
            Loading stats...
          </div>
        ) : stats.length === 0 ? (
          <div style={styles.empty}>
            No ad stats found
          </div>
        ) : (
          <div style={styles.grid}>
            {stats.map((ad) => (
              <div
                key={ad.AdId}
                style={styles.card}
              >
                {/* IMAGE */}

                <img
                  src={
                    ad.MediaPath ||
                    "https://via.placeholder.com/300x180"
                  }
                  alt="ad"
                  style={styles.image}
                />

                {/* BODY */}

                <div style={styles.cardBody}>
                  <h3 style={styles.adTitle}>
                    {ad.AdTitle}
                  </h3>

                  {/* STATS */}

                  <div style={styles.statsBox}>
                    {/* ALLOCATED */}

                    <div style={styles.statRow}>
                      <span
                        style={styles.statLabel}
                      >
                        ⏳ Allocated
                      </span>

                      <span
                        style={styles.statValue}
                      >
                        {formatMinutes(
                          ad.AllocatedMinutes
                        )}
                      </span>
                    </div>

                    {/* CONSUMED */}

                    <div style={styles.statRow}>
                      <span
                        style={styles.statLabel}
                      >
                        🕒 Consumed
                      </span>

                      <span
                        style={{
                          ...styles.statValue,
                          color: "#f59e0b",
                        }}
                      >
                        {formatMinutes(
                          ad.ConsumedMinutes
                        )}
                      </span>
                    </div>

                    {/* REMAINING */}

                    <div style={styles.statRow}>
                      <span
                        style={styles.statLabel}
                      >
                        ✅ Remaining
                      </span>

                      <span
                        style={{
                          ...styles.statValue,
                          color: "#22c55e",
                        }}
                      >
                        {formatMinutes(
                          ad.RemainingMinutes
                        )}
                      </span>
                    </div>

                    {/* DISTANCE */}

                    <div style={styles.statRow}>
                      <span
                        style={styles.statLabel}
                      >
                        🚗 Distance
                      </span>

                      <span
                        style={{
                          ...styles.statValue,
                          color: "#60a5fa",
                        }}
                      >
                        {Number(
                          ad.TotalValidKm || 0
                        ).toFixed(2)}{" "}
                        km
                      </span>
                    </div>
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

export default AdStatsScreen;

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
    padding: "20px 0",
  },

  sidebarLogo: {
    display: "flex",
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
    transition: "0.2s",
  },

  navItemActive: {
    background: "rgba(167,139,250,0.18)",
    color: "#a78bfa",
    fontWeight: 600,
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
    padding: "8px",
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
    overflowY: "auto",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 14,
  },

  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
  },

  sub: {
    marginTop: 6,
    fontSize: 13,
    opacity: 0.6,
  },

  // GRID

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(240px,1fr))",
    gap: 14,
  },

  // CARD

  card: {
    background: "rgba(255,255,255,0.04)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    overflow: "hidden",
    transition: "0.2s",
    backdropFilter: "blur(10px)",
  },

  image: {
    width: "100%",
    height: 120,
    objectFit: "cover",
    background: "#1e293b",
  },

  cardBody: {
    padding: 12,
  },

  adTitle: {
    margin: 0,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: 700,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  // STATS

  statsBox: {
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: 10,
  },

  statRow: {
    background: "rgba(255,255,255,0.03)",
    border:
      "1px solid rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: "10px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    minHeight: 74,
  },

  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 6,
    fontWeight: 500,
  },

  statValue: {
    fontSize: 15,
    fontWeight: 700,
    color: "#fff",
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