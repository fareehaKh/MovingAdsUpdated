import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession, clearUserSession } from "../../utils/session";
import {
  getAllAgenciesApi,
  getVehiclesByOwnerApi,
  linkVehicleToAgencyApi,
  isVehicleLinkedToAgencyApi,
} from "../../api/authapi";

const AvailableAgencies = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  const [agencies, setAgencies] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinedAgencies, setJoinedAgencies] = useState(new Set());
  const [joining, setJoining] = useState(null);

  useEffect(() => {
    if (!user) navigate("/");
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [agencyRes, vehicleRes] = await Promise.all([
        getAllAgenciesApi(),
        getVehiclesByOwnerApi(user.UserId),
      ]);

      const agenciesData = agencyRes.data || [];
      const vehiclesData = vehicleRes.data || [];

      setAgencies(agenciesData);
      setVehicles(vehiclesData);

      // CHECK JOIN STATUS FROM BACKEND
      const vehicle = vehiclesData[0];

      if (vehicle) {
        const results = await Promise.all(
          agenciesData.map((a) =>
            isVehicleLinkedToAgencyApi(vehicle.VehicleReg, a.AgencyId)
          )
        );

        const joined = new Set();

        results.forEach((res, index) => {
          if (res.data?.isLinked) {
            joined.add(agenciesData[index].AgencyId);
          }
        });

        setJoinedAgencies(joined);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (agencyId) => {
    if (!vehicles.length) {
      alert("Please register a vehicle first");
      return;
    }

    const vehicle = vehicles[0];

    try {
      setJoining(agencyId);

      await linkVehicleToAgencyApi({
        VehicleReg: vehicle.VehicleReg,
        AgencyId: agencyId,
      });

      setJoinedAgencies((prev) => new Set([...prev, agencyId]));
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

  const isJoined = (id) => joinedAgencies.has(id);

  return (
    <div style={styles.page}>
      {/* ================= SIDEBAR (MATCH DRIVER DASHBOARD) ================= */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <span style={{ fontSize: 22 }}>🚗</span>
          <span style={styles.sidebarLogoText}>MovingAds</span>
        </div>

        <nav style={styles.nav}>
          <div style={styles.navItem} onClick={() => navigate("/driver")}>
            🚘 My Vehicles
          </div>

          <div style={{ ...styles.navItem, ...styles.navItemActive }}>
            🏢 Available Agencies
          </div>

          <div style={styles.navItem} onClick={() => navigate("/driver/ad-simulation")}>
            🎬 Simulation
          </div>
        </nav>

        {/* FOOTER */}
        <div style={styles.sidebarFooter}>
          <div style={styles.userBadge}>
            <div style={styles.avatar}>
              {user?.Name?.[0]?.toUpperCase() || "D"}
            </div>
            <div>
              <div style={styles.userName}>{user?.Name}</div>
              <div style={styles.userRole}>Driver</div>
            </div>
          </div>

          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main style={styles.main}>
        <h1 style={styles.title}>Available Agencies</h1>

        {loading ? (
          <p style={{ color: "#fff" }}>Loading...</p>
        ) : (
          <div style={styles.grid}>
            {agencies.map((agency) => {
              const joined = isJoined(agency.AgencyId);

              return (
                <div key={agency.AgencyId} style={styles.card}>
                  <h3 style={{ color: "#fff" }}>{agency.AgencyName}</h3>
                  <p style={{ fontSize: 13, opacity: 0.7 }}>{agency.Email}</p>
                  <p style={{ fontSize: 13, opacity: 0.5 }}>
                    {agency.AgencyDescription}
                  </p>

                  <button
                    style={{
                      ...styles.btn,
                      background: joined
                        ? "#374151"
                        : "linear-gradient(135deg,#22c55e,#16a34a)",
                      cursor: joined ? "not-allowed" : "pointer",
                      opacity: joined ? 0.8 : 1,
                    }}
                    disabled={joined || joining === agency.AgencyId}
                    onClick={() => handleJoin(agency.AgencyId)}
                  >
                    {joined
                      ? "Joined"
                      : joining === agency.AgencyId
                      ? "Joining..."
                      : "Join Agency"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AvailableAgencies;

/* ================= STYLES ================= */

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f0f1a",
    color: "#fff",
  },

  /* SIDEBAR (MATCH DRIVER DASHBOARD) */
  sidebar: {
    width: 240,
    background: "rgba(255,255,255,0.03)",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
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
    padding: "10px 16px",
    borderRadius: 10,
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    cursor: "pointer",
    marginBottom: 4,
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
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
  },

  userName: { fontSize: 13, fontWeight: 600, color: "#fff" },
  userRole: { fontSize: 11, color: "rgba(255,255,255,0.4)" },

  logoutBtn: {
    width: "100%",
    padding: "9px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "rgba(255,255,255,0.6)",
    cursor: "pointer",
    fontSize: 13,
  },

  /* MAIN */
  main: {
    flex: 1,
    padding: 30,
  },

  title: {
    marginBottom: 20,
    fontSize: 28,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
    gap: 16,
  },

  card: {
    background: "#1e293b",
    padding: 16,
    borderRadius: 12,
  },

  btn: {
    marginTop: 12,
    width: "100%",
    padding: 10,
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 600,
  },
};