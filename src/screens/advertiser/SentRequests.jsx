import { useEffect, useState } from "react";
import { getUserSession } from "../../utils/session";
import { getSentRequestsApi } from "../../api/authapi";

const SentRequests = () => {
  const user = getUserSession();

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await getSentRequestsApi(user.UserId);
      setRequests(res.data || []);
    } catch (err) {
      console.log(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests =
  filter === "ALL"
    ? requests
    : requests.filter(
        (r) =>
          (r.Status || "").toLowerCase() === filter.toLowerCase()
      );

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return { background: "#f59e0b22", color: "#f59e0b" };
      case "Accepted":
        return { background: "#22c55e22", color: "#22c55e" };
      case "Rejected":
        return { background: "#ef444422", color: "#ef4444" };
      default:
        return { background: "#64748b22", color: "#64748b" };
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Sent Requests</h2>

      {/* FILTERS */}
      <div style={styles.filters}>
        {["ALL", "Pending", "Accepted", "Rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterBtn,
              ...(filter === f ? styles.filterActive : {}),
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {loading ? (
        <p style={{ color: "#aaa" }}>Loading...</p>
      ) : filteredRequests.length === 0 ? (
        <p style={{ color: "#aaa" }}>No requests found</p>
      ) : (
        <div style={styles.grid}>
          {filteredRequests.map((r) => (
            <div key={r.ReqID} style={styles.card}>

              <div style={styles.left}>
                <h3 style={styles.adTitle}>{r.AdTitle}</h3>
                <p><b>Vehicle:</b> {r.VehReg}</p>
                <p><b>From:</b> {r.FromUser}</p>
                <p><b>To:</b> {r.ToUser}</p>
              </div>

              <div style={styles.right}>
                <span
                  style={{
                    ...styles.status,
                    ...getStatusStyle(r.Status),
                  }}
                >
                  {r.Status}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentRequests;




const styles = {
  page: {
    padding: 16,
    color: "#fff",
  },

  title: {
    marginBottom: 14,
    fontSize: 20,
    fontWeight: 600,
  },

  /* ================= FILTERS ================= */
  filters: {
    display: "flex",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  },

  filterBtn: {
    padding: "7px 14px",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    transition: "0.2s",
  },

  filterActive: {
    background: "#764ba2",
    border: "none",
  },

  /* ================= GRID ================= */
  grid: {
    display: "grid",

    /* ✅ responsive: 1 → 2 → 3 → 4 cards */
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",

    gap: 12,
    alignItems: "start",
  },

  /* ================= CARD ================= */
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,

    padding: 12,

    /* ✅ important: prevents stretching */
    display: "flex",
    flexDirection: "column",
    gap: 6,

    minHeight: 110,

    transition: "0.2s ease",
  },

  /* optional hover effect */
  cardHover: {
    transform: "translateY(-2px)",
  },

  /* ================= TEXT ================= */
  adTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
  },

  text: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },

  /* ================= STATUS ================= */
  status: {
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    display: "inline-block",
  },

  statusPending: {
    background: "#f59e0b22",
    color: "#f59e0b",
  },

  statusAccepted: {
    background: "#22c55e22",
    color: "#22c55e",
  },

  statusRejected: {
    background: "#ef444422",
    color: "#ef4444",
  },

  /* ================= RESPONSIVE ================= */
  "@media (max-width: 768px)": {
    page: {
      padding: 10,
    },

    grid: {
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    },

    card: {
      padding: 10,
    },
  },
};