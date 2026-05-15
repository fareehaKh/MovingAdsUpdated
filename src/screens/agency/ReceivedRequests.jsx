////////////////////////////////////   RESPONSIVE   //////////////////////////////////

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getReceivedRequestsApi,
  updateRequestStatusApi,
  getAgencyByUserApi,
} from "../../api/authapi";

import {
  getUserSession,
  clearUserSession,
} from "../../utils/session";

const ReceivedRequests = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  const [requests, setRequests] = useState([]);
  const [agency, setAgency] = useState(null);

  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] =
    useState(null);

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const agencyRes = await getAgencyByUserApi(
        user.UserId
      );

      setAgency(agencyRes.data);

      const reqRes = await getReceivedRequestsApi(
        user.UserId
      );

      setRequests(reqRes.data || []);
    } catch (err) {
      console.log(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (request, status) => {
    try {
      setActionLoading(request.ReqID);

      await updateRequestStatusApi({
        ReqID: request.ReqID,
        AdId: request.AdId,
        AgencyId: agency.AgencyId,
        Status: status,
      });

      setRequests((prev) =>
        prev.map((r) =>
          r.ReqID === request.ReqID
            ? { ...r, Status: status }
            : r
        )
      );
    } catch (err) {
      console.log(err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests =
    filter === "all"
      ? requests
      : requests.filter(
          (r) =>
            (r.Status || "").toLowerCase() ===
            filter.toLowerCase()
        );

  const getStatusStyle = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return { background: "#f59e0b22", color: "#f59e0b" };
      case "accepted":
        return { background: "#22c55e22", color: "#22c55e" };
      case "rejected":
        return { background: "#ef444422", color: "#ef4444" };
      default:
        return { background: "#64748b22", color: "#64748b" };
    }
  };

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

          // ✅ FIX: sticky sidebar
          position: isMobile ? "relative" : "sticky",
          top: 0,
          height: isMobile ? "auto" : "100vh",
          overflowY: "auto",
        }}
      >
        <div style={styles.logo}>🏢 MovingAds</div>

        <div style={styles.nav}>
          <div style={styles.navItem} onClick={() => navigate("/agency")}>
            📊 Dashboard
          </div>

          <div style={styles.navItemActive}>📩 Requests</div>

          <div
            style={styles.navItem}
            onClick={() => navigate("/agency/linked-drivers")}
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
          padding: isMobile ? 14 : 24,
        }}
      >
        <h1
          style={{
            ...styles.title,
            fontSize: isMobile ? 24 : 32,
          }}
        >
          Received Requests
        </h1>

        {/* FILTERS */}
        <div style={styles.filters}>
          {["all", "pending", "accepted", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterBtn,
                ...(filter === f ? styles.filterActive : {}),
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : filteredRequests.length === 0 ? (
          <div style={styles.empty}>No requests found</div>
        ) : (
          <div style={styles.grid}>
            {filteredRequests.map((r) => (
              <div
                key={r.ReqID}
                style={{
                  ...styles.card,
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "flex-start" : "center",
                }}
              >
                <div style={styles.left}>
                  <h3 style={styles.adTitle}>{r.AdTitle}</h3>

                  <p style={styles.text}>
                    <strong>Advertiser:</strong> {r.FromUser}
                  </p>

                  <p style={styles.text}>
                    <strong>Request ID:</strong> {r.ReqID}
                  </p>

                  <div
                    style={{
                      ...styles.status,
                      ...getStatusStyle(r.Status),
                      marginTop: 10,
                    }}
                  >
                    {r.Status}
                  </div>
                </div>

                <div style={styles.right}>
                  {r.Status === "pending" && (
                    <div style={styles.btnRow}>
                      <button
                        disabled={actionLoading === r.ReqID}
                        onClick={() => handleAction(r, "accepted")}
                        style={styles.acceptBtn}
                      >
                        Accept
                      </button>

                      <button
                        disabled={actionLoading === r.ReqID}
                        onClick={() => handleAction(r, "rejected")}
                        style={styles.rejectBtn}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ReceivedRequests;

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
    color: "rgba(255,255,255,0.55)",
    marginBottom: 6,
    fontSize: 14,
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
    borderTop: "1px solid rgba(255,255,255,0.07)",
    paddingTop: 20,
  },

  agencyBox: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  agencyName: {
    fontSize: 14,
    fontWeight: 700,
  },

  logoutBtn: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
  },

  main: {
    flex: 1,
    overflowY: "auto",
  },

  title: {
    fontWeight: 700,
    marginBottom: 24,
  },

  filters: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 24,
  },

  filterBtn: {
    padding: "8px 16px",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
  },

  filterActive: {
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    border: "none",
  },

  grid: {
    display: "grid",
    gap: 16,
  },

  card: {
    display: "flex",
    justifyContent: "space-between",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
    gap: 18,
  },

  left: { flex: 1 },

  right: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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

  status: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
  },

  btnRow: {
    display: "flex",
    gap: 10,
    flexDirection: "column",
  },

  acceptBtn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },

  rejectBtn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#ef4444,#dc2626)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },

  loading: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },

  empty: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
};