import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession } from "../../utils/session";
import {
  getReceivedRequestsApi,
  updateRequestStatusApi
} from "../../api/authapi";

const FILTERS = ["all", "pending", "accepted", "rejected"];

const RequestsToDriver = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getReceivedRequestsApi(user.UserId);
      setRequests(res.data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (req, status) => {
    try {
      await updateRequestStatusApi({
        AdId: req.AdId,
        VehReg: req.VehReg,
        Status: status,
      });

      fetchRequests();
    } catch (err) {
      alert("Failed to update request");
    }
  };

  const filtered = requests.filter((r) =>
    filter === "all" ? true : r.Status.toLowerCase() === filter
  );

  return (
  <div style={styles.page}>
    {/* Sidebar */}
    <aside style={styles.sidebar}>
      <div style={styles.sidebarLogo}>
        <span style={{ fontSize: 22 }}>🚗</span>
        <span style={styles.sidebarLogoText}>MovingAds</span>
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
          onClick={() => navigate("/driver/new-ad-opportunities")}
        >
          📢 New Ad Opportunities
        </div>

        <div
          style={{ ...styles.navItem, ...styles.navItemActive }}
          onClick={() => navigate("/driver/requests")}
        >
          📩 Your Requests
        </div>

        <div
            style={{ ...styles.navItem }}
            onClick={() => navigate(`/driver/ad-simulation`) }
          >
            AD Simulation
          </div>
          
      </nav>
    </aside>

    {/* Main */}
    <main style={styles.main}>
      <h1 style={styles.title}>Your Requests</h1>

      {/* Filters */}
      <div style={styles.filterRow}>
        {FILTERS.map((f) => (
          <button
            key={f}
            style={{
              ...styles.filterBtn,
              background: filter === f ? "#22c55e" : "transparent",
              color: filter === f ? "#fff" : "#aaa",
            }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p style={{ color: "#fff" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#888" }}>No requests</p>
      ) : (
        <div style={styles.grid}>
          {filtered.map((r) => (
            <div key={r.ReqID} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.avatar}>
                  {r.FromUser?.[0]}
                </div>
                <div>
                  <div style={styles.name}>{r.FromUser}</div>
                  <div style={styles.sub}>{r.AdTitle}</div>
                </div>
              </div>

              <div style={styles.info}>
                🚗 {r.VehReg}
              </div>

              <div style={styles.status}>
                Status: {r.Status}
              </div>

              {r.Status === "pending" && (
                <div style={styles.actions}>
                  <button
                    style={styles.rejectBtn}
                    onClick={() => handleAction(r, "rejected")}
                  >
                    Reject
                  </button>

                  <button
                    style={styles.acceptBtn}
                    onClick={() => handleAction(r, "accepted")}
                  >
                    Accept
                  </button>
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

export default RequestsToDriver;


const styles = {
  page: { display: "flex", minHeight: "100vh", background: "#0f0f1a" },

  main: { flex: 1, padding: 32 },

  title: { color: "#fff", marginBottom: 20 },

  filterRow: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },

  filterBtn: {
    padding: "8px 16px",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.1)",
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
    gap: 20,
  },

  card: {
    background: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
  },

  cardHeader: {
    display: "flex",
    gap: 10,
    marginBottom: 10,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#22c55e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
  },

  name: { color: "#fff", fontWeight: 600 },

  sub: { color: "#aaa", fontSize: 13 },

  info: { color: "#ddd", marginTop: 10 },

  status: { color: "#888", marginTop: 6 },

  actions: {
    display: "flex",
    gap: 10,
    marginTop: 14,
  },

  rejectBtn: {
    flex: 1,
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "10px",
    borderRadius: 10,
    cursor: "pointer",
  },

  acceptBtn: {
    flex: 1,
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    padding: "10px",
    borderRadius: 10,
    cursor: "pointer",
  },
  sidebar: {
  width: "250px",
  minWidth: "250px",
  height: "100vh",
  background: "#111827",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  flexDirection: "column",
  padding: "24px 0",
  position: "sticky",
  top: 0,
  left: 0,
},

sidebarLogo: {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "0 24px",
  marginBottom: "32px",
},

sidebarLogoText: {
  color: "#fff",
  fontSize: "18px",
  fontWeight: 700,
  letterSpacing: "0.5px",
},

nav: {
  display: "flex",
  flexDirection: "column",
  padding: "0 14px",
  gap: "8px",
},

navItem: {
  padding: "14px 16px",
  borderRadius: "12px",
  color: "rgba(255,255,255,0.65)",
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
},

navItemActive: {
  background: "rgba(34,197,94,0.15)",
  color: "#4ade80",
  fontWeight: 700,
},
};