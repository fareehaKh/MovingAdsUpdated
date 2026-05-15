// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// import {
//   getSentRequestsApi,
//   getAllAgenciesApi,
// } from "../../api/authapi";

// import { getUserSession, clearUserSession } from "../../utils/session";

// const SentRequests = () => {
//   const navigate = useNavigate();
//   const user = getUserSession();

//   const [requests, setRequests] = useState([]);
//   const [agencies, setAgencies] = useState([]);
//   const [filter, setFilter] = useState("ALL");
//   const [loading, setLoading] = useState(true);

//   const isMobile = window.innerWidth <= 768;

//   useEffect(() => {
//     if (!user) {
//       navigate("/");
//       return;
//     }

//     loadData();
//   }, []);

//   // =========================
//   // LOAD REQUESTS + AGENCIES
//   // =========================
//   const loadData = async () => {
//     try {
//       setLoading(true);

//       const [reqRes, agencyRes] = await Promise.all([
//         getSentRequestsApi(user.UserId),
//         getAllAgenciesApi(),
//       ]);

//       setRequests(reqRes.data || []);
//       setAgencies(agencyRes.data || []);
//     } catch (err) {
//       console.log(err);
//       setRequests([]);
//       setAgencies([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // =========================
//   // GET AGENCY NAME
//   // =========================
//   const getAgencyName = (agencyId) => {
//     const agency = agencies.find((a) => a.AgencyId === agencyId);
//     return agency?.AgencyName || "Unknown Agency";
//   };

//   // =========================
//   // FILTER
//   // =========================
//   const filteredRequests =
//     filter === "ALL"
//       ? requests
//       : requests.filter(
//           (r) =>
//             (r.Status || "").toLowerCase() === filter.toLowerCase()
//         );

//   // =========================
//   // STATUS COLORS
//   // =========================
//   const getStatusStyle = (status) => {
//     switch ((status || "").toLowerCase()) {
//       case "pending":
//         return { background: "#f59e0b22", color: "#f59e0b" };
//       case "accepted":
//         return { background: "#22c55e22", color: "#22c55e" };
//       case "rejected":
//         return { background: "#ef444422", color: "#ef4444" };
//       default:
//         return { background: "#64748b22", color: "#64748b" };
//     }
//   };

//   // =========================
//   // LOGOUT
//   // =========================
//   const handleLogout = () => {
//     clearUserSession();
//     navigate("/");
//   };

//   return (
//     <div style={{ ...styles.page, flexDirection: isMobile ? "column" : "row" }}>

//       {/* ================= SIDEBAR ================= */}
//       <aside style={{
//         ...styles.sidebar,
//         width: isMobile ? "100%" : 240,
//         minWidth: isMobile ? "100%" : 240,
//       }}>

//         <div style={styles.sidebarLogo}>
//           <span style={{ fontSize: 22 }}>📢</span>
//           <span style={styles.sidebarLogoText}>MovingAds</span>
//         </div>

//         <nav style={styles.nav}>
//           <div style={styles.navItem} onClick={() => navigate("/advertiser")}>
//             📊 Dashboard
//           </div>

//           <div style={{ ...styles.navItem, ...styles.navItemActive }}>
//             📩 Sent Requests
//           </div>
//         </nav>

//         <div style={styles.sidebarFooter}>
//           <div style={styles.userBadge}>
//             <div style={styles.avatar}>
//               {user?.Name?.[0]?.toUpperCase() || "A"}
//             </div>

//             <div>
//               <div style={styles.userName}>{user?.Name}</div>
//               <div style={styles.userRole}>Advertiser</div>
//             </div>
//           </div>

//           <button style={styles.logoutBtn} onClick={handleLogout}>
//             Logout
//           </button>
//         </div>
//       </aside>

//       {/* ================= MAIN ================= */}
//       <main style={styles.main}>

//         <h1 style={styles.title}>Sent Requests</h1>

//         {/* FILTERS */}
//         <div style={styles.filters}>
//           {["ALL", "pending", "accepted", "rejected"].map((f) => (
//             <button
//               key={f}
//               onClick={() => setFilter(f)}
//               style={{
//                 ...styles.filterBtn,
//                 ...(filter === f ? styles.filterActive : {}),
//               }}
//             >
//               {f.toUpperCase()}
//             </button>
//           ))}
//         </div>

//         {/* CONTENT */}
//         {loading ? (
//           <div style={{ color: "#aaa" }}>Loading...</div>
//         ) : filteredRequests.length === 0 ? (
//           <div style={{ color: "#aaa" }}>No requests found</div>
//         ) : (
//           <div style={styles.grid}>
//             {filteredRequests.map((r) => (
//               <div key={r.ReqID} style={styles.card}>

//                 <div style={styles.left}>
//                   <h3 style={styles.titleText}>{r.AdTitle}</h3>

//                   {/* ✅ FIXED: Agency instead of Vehicle */}
//                   <p style={styles.text}>
//                     {/* <b>Agency:</b>  */}
//                     {getAgencyName(r.AgencyId)}
//                   </p>

//                   {/* <p style={styles.text}>
//                     <b>Agency ID:</b> {r.AgencyId}
//                   </p> */}

//                   <p style={styles.text}>
//                     <b>Status:</b> {r.Status}
//                   </p>
//                 </div>

//                 <div>
//                   <span style={{
//                     ...styles.status,
//                     ...getStatusStyle(r.Status),
//                   }}>
//                     {r.Status}
//                   </span>
//                 </div>

//               </div>
//             ))}
//           </div>
//         )}

//       </main>
//     </div>
//   );
// };

// export default SentRequests;

// /* ================= STYLES ================= */

// const styles = {

//   page: {
//     display: "flex",
//     minHeight: "100vh",
//     background: "#0f0f1a",
//     color: "#fff",
//     fontFamily: "Segoe UI",
//   },

//   /* SIDEBAR */
//   sidebar: {
//     background: "rgba(255,255,255,0.03)",
//     borderRight: "1px solid rgba(255,255,255,0.07)",
//     display: "flex",
//     flexDirection: "column",
//     padding: "24px 0",
//   },

//   sidebarLogo: {
//     display: "flex",
//     alignItems: "center",
//     gap: 10,
//     padding: "0 20px",
//     marginBottom: 30,
//   },

//   sidebarLogoText: {
//     fontWeight: 700,
//   },

//   nav: { flex: 1, padding: "0 10px" },

//   navItem: {
//     padding: "10px 14px",
//     borderRadius: 10,
//     cursor: "pointer",
//     color: "#aaa",
//     marginBottom: 6,
//   },

//   navItemActive: {
//     background: "rgba(139,92,246,0.2)",
//     color: "#a78bfa",
//   },

//   sidebarFooter: {
//     padding: "10px 16px",
//     borderTop: "1px solid rgba(255,255,255,0.07)",
//   },

//   userBadge: {
//     display: "flex",
//     gap: 10,
//     marginBottom: 10,
//   },

//   avatar: {
//     width: 34,
//     height: 34,
//     borderRadius: "50%",
//     background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     fontWeight: "bold",
//   },

//   userName: { fontSize: 13 },
//   userRole: { fontSize: 11, opacity: 0.6 },

//   logoutBtn: {
//     width: "100%",
//     padding: 8,
//     borderRadius: 8,
//     background: "transparent",
//     border: "1px solid rgba(255,255,255,0.1)",
//     color: "#aaa",
//   },

//   /* MAIN */
//   main: {
//     flex: 1,
//     padding: 20,
//   },

//   title: {
//     fontSize: 22,
//     marginBottom: 15,
//   },

//   filters: {
//     display: "flex",
//     gap: 10,
//     flexWrap: "wrap",
//     marginBottom: 20,
//   },

//   filterBtn: {
//     padding: "6px 12px",
//     borderRadius: 20,
//     background: "transparent",
//     border: "1px solid #333",
//     color: "#fff",
//     cursor: "pointer",
//   },

//   filterActive: {
//     background: "#8b5cf6",
//     border: "none",
//   },

//   grid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
//     gap: 14,
//   },

//   card: {
//     background: "rgba(255,255,255,0.05)",
//     padding: 14,
//     borderRadius: 12,
//     display: "flex",
//     justifyContent: "space-between",
//   },

//   left: {
//     flex: 1,
//   },

//   titleText: {
//     fontSize: 15,
//     marginBottom: 8,
//   },

//   text: {
//     fontSize: 13,
//     opacity: 0.8,
//     marginBottom: 4,
//   },

//   status: {
//     padding: "5px 10px",
//     borderRadius: 20,
//     fontSize: 11,
//   },
// };



















import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getSentRequestsApi,
  getAgencyByIdApi,
  createRequestApi,
} from "../../api/authapi";

import {
  getUserSession,
  clearUserSession,
} from "../../utils/session";

const SentRequests = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  const [requests, setRequests] = useState([]);
  const [agencyMap, setAgencyMap] = useState({});
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    loadData();
  }, []);

  // =========================
  // LOAD DATA
  // =========================
  const loadData = async () => {
    try {
      setLoading(true);

      const res = await getSentRequestsApi(user.UserId);

      const reqs = res.data || [];

      setRequests(reqs);

      // UNIQUE AGENCY IDS
      const uniqueAgencyIds = [
        ...new Set(reqs.map((r) => r.AgencyId)),
      ];

      // FETCH AGENCIES
      const agencies = await Promise.all(
        uniqueAgencyIds.map(async (id) => {
          try {
            const agencyRes = await getAgencyByIdApi(id);
            return agencyRes.data;
          } catch {
            return null;
          }
        })
      );

      const map = {};

      agencies.forEach((a) => {
        if (a) {
          map[a.AgencyId] = a;
        }
      });

      setAgencyMap(map);
    } catch (err) {
      console.log(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SEND REQUEST AGAIN
  // =========================
  const handleSendRequest = async (agencyId, adId) => {
    try {
      // GET AGENCY DETAILS
      const agencyRes = await getAgencyByIdApi(agencyId);

      const agency = agencyRes.data;

      // VERY IMPORTANT:
      // REQUESTED TO MUST BE USERID
      const agencyUserId = agency.UserId;

      await createRequestApi({
        RequestedBy: user.UserId,
        RequestedTo: agencyUserId,
        AdId: adId,
        AgencyId: agencyId,
        Status: "pending",
      });

      loadData();
    } catch (err) {
      console.log(err);
    }
  };

  // =========================
  // FILTER REQUESTS
  // =========================
  const filteredRequests =
    filter === "ALL"
      ? requests
      : requests.filter(
          (r) =>
            (r.Status || "").toLowerCase() ===
            filter.toLowerCase()
        );

  // =========================
  // STATUS STYLE
  // =========================
  const getStatusStyle = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return {
          background: "#f59e0b22",
          color: "#f59e0b",
        };

      case "accepted":
        return {
          background: "#22c55e22",
          color: "#22c55e",
        };

      case "rejected":
        return {
          background: "#ef444422",
          color: "#ef4444",
        };

      default:
        return {
          background: "#64748b22",
          color: "#64748b",
        };
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
          <span style={{ fontSize: 22 }}>📢</span>

          <span style={styles.sidebarLogoText}>
            MovingAds
          </span>
        </div>

        {/* NAVIGATION */}
        <nav style={styles.nav}>
          <div
            style={styles.navItem}
            onClick={() => navigate("/advertiser")}
          >
            📊 Dashboard
          </div>

          <div
            style={{
              ...styles.navItem,
              ...styles.navItemActive,
            }}
          >
            📩 Sent Requests
          </div>

          <div
            style={{
              ...styles.navItem,
            }}
            onClick={() => navigate("/advertiser/ad-stats")}
          >
            📈 Ad Stats
          </div>

          {/* <div
            style={styles.navItem}
            onClick={() =>
              navigate("/advertiser/find-agencies")
            }
          >
            🏢 Find Agencies
          </div> */}
        </nav>

        {/* FOOTER */}
        <div style={styles.sidebarFooter}>
          <div style={styles.userBadge}>
            <div style={styles.avatar}>
              {user?.Name?.[0]?.toUpperCase() || "A"}
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
            style={styles.logoutBtn}
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
          padding: isMobile ? 14 : 24,
        }}
      >
        {/* TITLE */}
        <h1
          style={{
            ...styles.title,
            fontSize: isMobile ? 24 : 32,
          }}
        >
          Sent Requests
        </h1>

        {/* FILTERS */}
        <div style={styles.filters}>
          {["ALL", "pending", "accepted", "rejected"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...styles.filterBtn,
                  ...(filter === f
                    ? styles.filterActive
                    : {}),
                }}
              >
                {f}
              </button>
            )
          )}
        </div>

        {/* CONTENT */}

        {loading ? (
          <div style={styles.loading}>
            Loading...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={styles.empty}>
            No requests found
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredRequests.map((r) => {
              const agency =
                agencyMap[r.AgencyId];

              return (
                <div
                  key={r.ReqID}
                  style={styles.card}
                >
                  <div style={styles.left}>
                    <h3 style={styles.adTitle}>
                      {agency?.AgencyName ||
                        "Agency"}
                    </h3>

                    <p style={styles.text}>
                      <strong>Owner:</strong>{" "}
                      {agency?.OwnerName || "-"}
                    </p>

                    <p style={styles.text}>
                      <strong>Email:</strong>{" "}
                      {agency?.Email || "-"}
                    </p>

                    <p style={styles.text}>
                      <strong>Ad:</strong>{" "}
                      {r.AdTitle}
                    </p>
                  </div>

                  <div style={styles.right}>
                    <span
                      style={{
                        ...styles.status,
                        ...getStatusStyle(
                          r.Status
                        ),
                      }}
                    >
                      {r.Status}
                    </span>

                    {/* REJECTED => ALLOW AGAIN */}
                    {(r.Status || "").toLowerCase() ===
                      "rejected" && (
                      <button
                        style={styles.resendBtn}
                        onClick={() =>
                          handleSendRequest(
                            r.AgencyId,
                            r.AdId
                          )
                        }
                      >
                        Send Again
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default SentRequests;

// =========================
// STYLES
// =========================

const styles = {
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
    letterSpacing: 1,
  },

  nav: {
    flex: 1,
    padding: "0 12px",
  },

  navItem: {
    padding: "10px 16px",
    borderRadius: 10,
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    cursor: "pointer",
    marginBottom: 4,
  },

  navItemActive: {
    background:
      "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.18))",
    color: "#a78bfa",
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
    width: 36,
    height: 36,
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#6366f1,#8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
  },

  userName: {
    color: "#fff",
    fontWeight: 600,
    fontSize: 13,
  },

  userRole: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
  },

  logoutBtn: {
    width: "100%",
    padding: "9px",
    borderRadius: 8,
    border:
      "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "rgba(255,255,255,0.5)",
    cursor: "pointer",
    fontSize: 13,
  },

  // MAIN
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
    border:
      "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
  },

  filterActive: {
    background:
      "linear-gradient(135deg,#6366f1,#8b5cf6)",
    border: "none",
  },

  // GRID
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(280px,1fr))",
    gap: 16,
  },

  // CARD
  card: {
    background: "rgba(255,255,255,0.05)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  left: {
    flex: 1,
  },

  right: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  adTitle: {
    margin: 0,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
  },

  text: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 6,
  },

  status: {
    padding: "8px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    display: "inline-block",
    width: "fit-content",
  },

  resendBtn: {
    padding: "10px",
    borderRadius: 10,
    border: "none",
    background:
      "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
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