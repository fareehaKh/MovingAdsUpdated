/////////////////////////////   RESPONSIVE ////////////////////////////////////

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDriverTripsApi,
  getVehiclesByOwnerApi,
} from "../../api/authapi";

import {
  getUserSession,
  clearUserSession,
} from "../../utils/session";

const TripStatsScreen = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vehicleRes, tripRes] = await Promise.all([
        getVehiclesByOwnerApi(user.UserId),
        getDriverTripsApi(user.UserId),
      ]);

      setVehicles(vehicleRes.data || []);
      setTrips(tripRes.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  // GROUP VEHICLE STATS
  const vehicleStats = useMemo(() => {
    return vehicles.map((vehicle) => {
      const vehicleTrips = trips.filter(
        (t) => t.VehicleReg === vehicle.VehicleReg
      );

      const totalTrips = vehicleTrips.length;

      const adsServed = new Set(
        vehicleTrips.map((t) => t.AdId)
      ).size;

      const validMinutes = vehicleTrips.reduce(
        (sum, t) => sum + Number(t.ValidTimeMinutes || 0),
        0
      );

      const totalKm = vehicleTrips.reduce(
        (sum, t) => sum + Number(t.ValidDistanceKm || 0),
        0
      );

      return {
        vehicle,
        trips: vehicleTrips,
        stats: {
          totalTrips,
          adsServed,
          validMinutes,
          totalKm,
        },
      };
    });
  }, [vehicles, trips]);

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.loader}></div>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          style={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        style={{
          ...styles.sidebar,
          ...(sidebarOpen ? styles.sidebarMobileOpen : {}),
        }}
      >
        <div style={styles.sidebarLogo}>
          <span style={{ fontSize: 22 }}>🚗</span>

          <span style={styles.sidebarLogoText}>
            MovingAds
          </span>
        </div>

        <nav style={styles.nav}>
          <div
            style={styles.navItem}
            onClick={() => navigate("/driver")}
          >
            🚘 My Vehicles
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              navigate("/driver/available-agencies")
            }
          >
            🏢 Available Agencies
          </div>

          <div
            style={{
              ...styles.navItem,
              ...styles.navItemActive,
            }}
          >
            📊 Trip Stats
          </div>

          {/* <div
            style={styles.navItem}
            onClick={() =>
              navigate("/driver/ad-simulation")
            }
          >
            🎬 AD Simulation
          </div> */}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userBadge}>
            <div style={styles.avatar}>
              {user?.Name?.[0]?.toUpperCase() || "D"}
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
        {/* MOBILE HEADER */}
        <div style={styles.mobileTopBar}>
          <button
            style={styles.menuBtn}
            onClick={() =>
              setSidebarOpen(!sidebarOpen)
            }
          >
            ☰
          </button>

          <div style={styles.mobileTitle}>
            Trip Stats
          </div>
        </div>

        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Trip Statistics
            </h1>

            <p style={styles.subtitle}>
              View all vehicle analytics &
              trip history
            </p>
          </div>
        </div>

        {/* EMPTY STATE */}
        {vehicleStats.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 70 }}>🚘</div>

            <h2>No Vehicles Found</h2>

            <p>
              Register a vehicle first to
              view trip statistics.
            </p>
          </div>
        ) : (
          <div style={styles.vehicleContainer}>
            {vehicleStats.map((item) => (
              <div
                key={item.vehicle.VehicleReg}
                style={styles.vehicleCard}
              >
                {/* VEHICLE HEADER */}
                <div style={styles.vehicleTop}>
                  <div style={styles.vehicleInfo}>
                    <img
                      src={item.vehicle.MediaPath}
                      alt={
                        item.vehicle.VehicleModel
                      }
                      style={styles.vehicleImage}
                    />

                    <div style={{ flex: 1 }}>
                      <h2
                        style={styles.vehicleName}
                      >
                        {
                          item.vehicle
                            .VehicleModel
                        }
                      </h2>

                      <div
                        style={styles.vehicleMeta}
                      >
                        <span
                          style={styles.regBadge}
                        >
                          {
                            item.vehicle
                              .VehicleReg
                          }
                        </span>

                        <span
                          style={
                            styles.typeBadge
                          }
                        >
                          {
                            item.vehicle
                              .VehicleType
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.statusBadge,
                      background:
                        item.vehicle
                          .VehicleStatus ===
                        "online"
                          ? "rgba(16,185,129,0.15)"
                          : "rgba(107,114,128,0.15)",

                      color:
                        item.vehicle
                          .VehicleStatus ===
                        "online"
                          ? "#10b981"
                          : "#9ca3af",
                    }}
                  >
                    ●{" "}
                    {
                      item.vehicle
                        .VehicleStatus
                    }
                  </div>
                </div>

                {/* STATS */}
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                      🚘
                    </div>

                    <div
                      style={styles.statValue}
                    >
                      {
                        item.stats.totalTrips
                      }
                    </div>

                    <div
                      style={styles.statLabel}
                    >
                      Total Trips
                    </div>
                  </div>

                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                      📢
                    </div>

                    <div
                      style={styles.statValue}
                    >
                      {
                        item.stats.adsServed
                      }
                    </div>

                    <div
                      style={styles.statLabel}
                    >
                      Ads Served
                    </div>
                  </div>

                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                      ⏱
                    </div>

                    <div
                      style={styles.statValue}
                    >
                      {item.stats.validMinutes.toFixed(
                        1
                      )}
                      m
                    </div>

                    <div
                      style={styles.statLabel}
                    >
                      Valid Time
                    </div>
                  </div>

                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                      🛣
                    </div>

                    <div
                      style={styles.statValue}
                    >
                      {item.stats.totalKm.toFixed(
                        2
                      )}
                      km
                    </div>

                    <div
                      style={styles.statLabel}
                    >
                      Distance
                    </div>
                  </div>
                </div>

                {/* TRIP HEADER */}
                <div style={styles.tripHeader}>
                  <h3 style={styles.tripTitle}>
                    Trip History
                  </h3>

                  <div style={styles.tripCount}>
                    {item.trips.length} Trips
                  </div>
                </div>

                {/* TRIPS */}
                {item.trips.length === 0 ? (
                  <div style={styles.noTrips}>
                    No trips recorded yet.
                  </div>
                ) : (
                  <div style={styles.tripList}>
                    {item.trips.map((trip) => (
                      <div
                        key={trip.TripId}
                        style={styles.tripCard}
                      >
                        <div
                          style={
                            styles.tripCardTop
                          }
                        >
                          <div
                            style={styles.tripLeft}
                          >
                            <div
                              style={
                                styles.tripId
                              }
                            >
                              Trip #
                              {trip.TripId}
                            </div>

                            <div
                              style={
                                styles.tripAd
                              }
                            >
                              📢{" "}
                              {trip.AdTitle}
                            </div>
                          </div>

                          <div
                            style={
                              styles.tripDate
                            }
                          >
                            {new Date(
                              trip.TripDate
                            ).toLocaleDateString()}
                          </div>
                        </div>

                        <div
                          style={
                            styles.tripBottom
                          }
                        >
                          <div
                            style={
                              styles.tripStatBox
                            }
                          >
                            <div
                              style={
                                styles.tripStatValue
                              }
                            >
                              {
                                trip.ValidTimeMinutes
                              }{" "}
                              min
                            </div>

                            <div
                              style={
                                styles.tripStatLabel
                              }
                            >
                              Valid Time
                            </div>
                          </div>

                          <div
                            style={
                              styles.tripStatBox
                            }
                          >
                            <div
                              style={
                                styles.tripStatValue
                              }
                            >
                              {
                                trip.ValidDistanceKm
                              }{" "}
                              km
                            </div>

                            <div
                              style={
                                styles.tripStatLabel
                              }
                            >
                              Distance
                            </div>
                          </div>

                          <div
                            style={
                              styles.tripStatBox
                            }
                          >
                            <div
                              style={
                                styles.tripStatValue
                              }
                            >
                              {
                                trip.SegmentsCount
                              }
                            </div>

                            <div
                              style={
                                styles.tripStatLabel
                              }
                            >
                              Segments
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#0b1120",
    fontFamily: "'Segoe UI', sans-serif",
  },

  // SIDEBAR
  sidebar: {
    width: "240px",
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
    overflowY: "auto",
    flexShrink: 0,
    zIndex: 1000,
  },

  sidebarMobileOpen: {
    left: 0,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
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
    letterSpacing: 1,
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
    transition: "0.2s ease",
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
    width: 40,
    height: 40,
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
  },

  userName: {
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
  },

  userRole: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },

  logoutBtn: {
    width: "100%",
    padding: "10px",
    borderRadius: 10,
    border:
      "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "rgba(255,255,255,0.6)",
    cursor: "pointer",
    fontSize: 14,
  },

  // MAIN
  main: {
    flex: 1,
    padding: "32px",
    overflowX: "hidden",
  },

  mobileTopBar: {
    display: "none",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
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
    fontSize: 22,
    fontWeight: 700,
  },

  header: {
    marginBottom: 30,
  },

  title: {
    color: "#fff",
    margin: 0,
    fontSize: "36px",
    fontWeight: 700,
  },

  subtitle: {
    color: "#94a3b8",
    marginTop: 8,
    fontSize: 15,
  },

  vehicleContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 28,
  },

  vehicleCard: {
    background: "#111827",
    borderRadius: 28,
    padding: 24,
    border:
      "1px solid rgba(255,255,255,0.06)",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.25)",
  },

  vehicleTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 24,
  },

  vehicleInfo: {
    display: "flex",
    gap: 18,
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
  },

  vehicleImage: {
    width: 120,
    height: 90,
    objectFit: "cover",
    borderRadius: 18,
    border:
      "1px solid rgba(255,255,255,0.08)",
  },

  vehicleName: {
    color: "#fff",
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
  },

  vehicleMeta: {
    display: "flex",
    gap: 10,
    marginTop: 12,
    flexWrap: "wrap",
  },

  regBadge: {
    background:
      "rgba(59,130,246,0.15)",
    color: "#60a5fa",
    padding: "8px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
  },

  typeBadge: {
    background:
      "rgba(16,185,129,0.15)",
    color: "#34d399",
    padding: "8px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
  },

  statusBadge: {
    padding: "10px 16px",
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 13,
    whiteSpace: "nowrap",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",
    gap: 18,
    marginBottom: 30,
  },

  statCard: {
    background: "#1e293b",
    borderRadius: 22,
    padding: 24,
  },

  statIcon: {
    fontSize: 30,
    marginBottom: 12,
  },

  statValue: {
    color: "#fff",
    fontSize: 30,
    fontWeight: 700,
  },

  statLabel: {
    color: "#94a3b8",
    marginTop: 8,
    fontSize: 14,
  },

  tripHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 18,
  },

  tripTitle: {
    color: "#fff",
    margin: 0,
    fontSize: 24,
  },

  tripCount: {
    background:
      "rgba(16,185,129,0.15)",
    color: "#34d399",
    padding: "8px 14px",
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 13,
  },

  tripList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  tripCard: {
    background: "#0f172a",
    borderRadius: 22,
    padding: 20,
  },

  tripCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 18,
  },

  tripLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  tripId: {
    background: "#111827",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: 999,
    width: "fit-content",
    fontWeight: 600,
    fontSize: 13,
  },

  tripAd: {
    color: "#fff",
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.4,
  },

  tripDate: {
    color: "#94a3b8",
    fontSize: 14,
  },

  tripBottom: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(140px,1fr))",
    gap: 14,
  },

  tripStatBox: {
    background: "#111827",
    borderRadius: 18,
    padding: 18,
    textAlign: "center",
  },

  tripStatValue: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 24,
  },

  tripStatLabel: {
    color: "#94a3b8",
    marginTop: 6,
    fontSize: 13,
  },

  noTrips: {
    background: "#0f172a",
    borderRadius: 18,
    padding: 30,
    color: "#94a3b8",
    textAlign: "center",
  },

  emptyState: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    textAlign: "center",
  },

  loaderContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0b1120",
  },

  loader: {
    width: 48,
    height: 48,
    border:
      "4px solid rgba(255,255,255,0.12)",
    borderTop: "4px solid #10b981",
    borderRadius: "50%",
    animation:
      "spin 1s linear infinite",
  },
};

// RESPONSIVE
if (typeof window !== "undefined") {
  const style = document.createElement("style");

  style.innerHTML = `
    @media (max-width: 900px) {

      .sidebar-hidden {
        left: -260px;
      }
    }

    @media (max-width: 768px) {

      aside {
        position: fixed !important;
        left: -260px;
        top: 0;
        transition: 0.3s ease;
      }

      main {
        padding: 20px !important;
      }
    }
  `;

  document.head.appendChild(style);
}

export default TripStatsScreen;