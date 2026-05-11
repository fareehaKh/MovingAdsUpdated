// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// import {
//   getReceivedRequestsApi,
//   updateRequestStatusApi,
//   getAgencyByUserApi,
// } from "../../api/authapi";

// import { getUserSession, clearUserSession } from "../../utils/session";

// const ReceivedRequests = () => {
//   const navigate = useNavigate();
//   const user = getUserSession();

//   const [requests, setRequests] = useState([]);
//   const [agency, setAgency] = useState(null);
//   const [filter, setFilter] = useState("all");
//   const [loading, setLoading] = useState(true);

//   const isMobile = window.innerWidth <= 768;

//   useEffect(() => {
//     if (!user) {
//       navigate("/");
//       return;
//     }
//     loadData();
//   }, []);

//   // ================= LOAD =================
//   const loadData = async () => {
//     // console.log("RECEIVED REQUESTS:", requests.data);
//     try {
//       setLoading(true);

//       const [agencyRes, reqRes] = await Promise.all([
//         getAgencyByUserApi(user.UserId),
//         getReceivedRequestsApi(user.UserId),
//       ]);
//       // console.log("RECEIVED REQUESTS:", reqRes.data);

//       setAgency(agencyRes.data);
//       setRequests(reqRes.data || []);
//     } catch (err) {
//       console.log(err);
//       setRequests([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ================= ACTION =================
//   const handleAction = async (r, status) => {
//     await updateRequestStatusApi({
//       ReqID: r.ReqID,
//       AdId: r.AdId,
//       AgencyId: agency.AgencyId,
//       Status: status,
//     });

//     loadData();
//   };

//   // ================= FILTER =================
//   // const filtered =
//   //   filter === "all"
//   //     ? requests
//   //     : requests.filter((r) => r.Status === filter);
//   const filtered =
//   filter === "all"
//     ? requests
//     : requests.filter(
//         (r) =>
//           (r.Status || "").toLowerCase() === filter
//       );

//   const logout = () => {
//     clearUserSession();
//     navigate("/");
//   };

//   return (
//     <div style={styles.page}>

//       {/* ================= SIDEBAR ================= */}
//       <aside
//         style={{
//           ...styles.sidebar,
//           width: isMobile ? "100%" : 240,
//           flexDirection: isMobile ? "row" : "column",
//           flexWrap: isMobile ? "wrap" : "nowrap",
//         }}
//       >
//         <div style={styles.logo}>🏢 MovingAds</div>

//         <div style={styles.navItem} onClick={() => navigate("/agency")}>
//           📊 Dashboard
//         </div>

//         <div style={styles.navItemActive}>📩 Requests</div>

//         <div style={styles.navItem} onClick={() => navigate("/agency/linked-drivers")}>
//           🚗 Drivers
//         </div>

//         <div style={styles.footer}>
//           <div style={styles.agencyBox}>
//             {agency?.AgencyName}
//           </div>

//           <button style={styles.logoutBtn} onClick={logout}>
//             Logout
//           </button>
//         </div>
//       </aside>

//       {/* ================= MAIN ================= */}
//       <main
//         style={{
//           ...styles.main,
//           padding: isMobile ? 12 : 24,
//         }}
//       >

//         <h2 style={{
//           fontSize: isMobile ? 20 : 26,
//           marginBottom: 12,
//         }}>
//           Received Requests
//         </h2>

//         {/* FILTERS */}
//         <div style={styles.filters}>
//           {["all", "pending", "accepted", "rejected"].map((f) => (
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
//           <p style={styles.loading}>Loading...</p>
//         ) : filtered.length === 0 ? (
//           <p style={styles.empty}>No requests found</p>
//         ) : (
//           <div
//             style={{
//               ...styles.grid,
//               gridTemplateColumns: isMobile
//                 ? "1fr"
//                 : "repeat(auto-fit,minmax(260px,1fr))",
//             }}
//           >
//             {filtered.map((r) => (
//               <div key={r.ReqID} style={styles.card}>

//                 <h3 style={styles.title}>{r.AdTitle}</h3>

//                 <p style={styles.text}>
//                   <b>From:</b> {r.FromUser}
//                 </p>

//                 <p style={styles.text}>
//                   <b>Status:</b> {r.Status}
//                 </p>

//                 {r.Status === "pending" && (
//                   <div style={styles.btnRow}>
//                     <button
//                       style={styles.acceptBtn}
//                       onClick={() => handleAction(r, "accepted")}
//                     >
//                       Accept
//                     </button>

//                     <button
//                       style={styles.rejectBtn}
//                       onClick={() => handleAction(r, "rejected")}
//                     >
//                       Reject
//                     </button>
//                   </div>
//                 )}

//               </div>
//             ))}
//           </div>
//         )}

//       </main>
//     </div>
//   );
// };

// export default ReceivedRequests;

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
//     padding: 16,
//     display: "flex",
//     flexDirection: "column",
//     borderRight: "1px solid rgba(255,255,255,0.07)",
//     gap: 10,
//   },

//   logo: {
//     fontSize: 18,
//     fontWeight: 600,
//     marginBottom: 20,
//   },

//   navItem: {
//     padding: "10px",
//     opacity: 0.6,
//     cursor: "pointer",
//     fontSize: 14,
//   },

//   navItemActive: {
//     padding: "10px",
//     background: "rgba(139,92,246,0.2)",
//     color: "#a78bfa",
//     borderRadius: 8,
//     fontSize: 14,
//   },

//   footer: {
//     marginTop: "auto",
//     width: "100%",
//   },

//   agencyBox: {
//     padding: 10,
//     background: "#1f2937",
//     borderRadius: 8,
//     marginBottom: 10,
//     fontSize: 13,
//   },

//   logoutBtn: {
//     width: "100%",
//     padding: 8,
//     background: "#ef4444",
//     border: "none",
//     color: "#fff",
//     borderRadius: 6,
//   },

//   /* MAIN */
//   main: {
//     flex: 1,
//     overflowY: "auto",
//   },

//   filters: {
//     display: "flex",
//     gap: 10,
//     flexWrap: "wrap",
//     marginBottom: 16,
//   },

//   filterBtn: {
//     padding: "6px 12px",
//     borderRadius: 20,
//     border: "1px solid #333",
//     background: "transparent",
//     color: "#fff",
//     fontSize: 12,
//     cursor: "pointer",
//   },

//   filterActive: {
//     background: "#8b5cf6",
//     border: "none",
//   },

//   grid: {
//     display: "grid",
//     gap: 14,
//   },

//   card: {
//     background: "rgba(255,255,255,0.05)",
//     padding: 14,
//     borderRadius: 12,
//   },

//   title: {
//     fontSize: 15,
//     marginBottom: 8,
//   },

//   text: {
//     fontSize: 13,
//     opacity: 0.8,
//     marginBottom: 4,
//   },

//   btnRow: {
//     display: "flex",
//     gap: 10,
//     marginTop: 10,
//   },

//   acceptBtn: {
//     flex: 1,
//     background: "#22c55e",
//     border: "none",
//     color: "#fff",
//     padding: 8,
//     borderRadius: 6,
//     cursor: "pointer",
//   },

//   rejectBtn: {
//     flex: 1,
//     background: "#ef4444",
//     border: "none",
//     color: "#fff",
//     padding: 8,
//     borderRadius: 6,
//     cursor: "pointer",
//   },

//   loading: {
//     color: "#aaa",
//   },

//   empty: {
//     color: "#aaa",
//   },
// };





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

  // =========================
  // LOAD DATA
  // =========================
  const loadData = async () => {
    try {
      setLoading(true);

      // GET LOGGED IN AGENCY
      const agencyRes = await getAgencyByUserApi(
        user.UserId
      );

      setAgency(agencyRes.data);

      // GET RECEIVED REQUESTS
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

  // =========================
  // ACCEPT / REJECT
  // =========================
  const handleAction = async (
    request,
    status
  ) => {
    try {
      setActionLoading(request.ReqID);

      await updateRequestStatusApi({
        ReqID: request.ReqID,
        AdId: request.AdId,

        // IMPORTANT
        AgencyId: agency.AgencyId,

        Status: status,
      });

      // UPDATE UI INSTANTLY
      setRequests((prev) =>
        prev.map((r) =>
          r.ReqID === request.ReqID
            ? {
                ...r,
                Status: status,
              }
            : r
        )
      );
    } catch (err) {
      console.log(err);
    } finally {
      setActionLoading(null);
    }
  };

  // =========================
  // FILTER
  // =========================
  const filteredRequests =
    filter === "all"
      ? requests
      : requests.filter(
          (r) =>
            (r.Status || "").toLowerCase() ===
            filter.toLowerCase()
        );

  // =========================
  // STATUS COLORS
  // =========================
  const getStatusStyle = (status) => {
    switch (
      (status || "").toLowerCase()
    ) {
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
        <div style={styles.logo}>
          🏢 MovingAds
        </div>

        {/* NAV */}
        <div style={styles.nav}>
          <div
            style={styles.navItem}
            onClick={() =>
              navigate("/agency")
            }
          >
            📊 Dashboard
          </div>

          <div
            style={
              styles.navItemActive
            }
          >
            📩 Requests
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              navigate(
                "/agency/linked-drivers"
              )
            }
          >
            🚗 Drivers
          </div>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <div
            style={styles.agencyBox}
          >
            <div
              style={
                styles.agencyName
              }
            >
              {agency?.AgencyName ||
                "Agency"}
            </div>

            <div
              style={
                styles.agencyOwner
              }
            >
              {agency?.OwnerName}
            </div>
          </div>

          <button
            style={styles.logoutBtn}
            onClick={
              handleLogout
            }
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <main
        style={{
          ...styles.main,
          padding: isMobile
            ? 14
            : 24,
        }}
      >
        {/* TITLE */}
        <h1
          style={{
            ...styles.title,
            fontSize: isMobile
              ? 24
              : 32,
          }}
        >
          Received Requests
        </h1>

        {/* FILTERS */}
        <div style={styles.filters}>
          {[
            "all",
            "pending",
            "accepted",
            "rejected",
          ].map((f) => (
            <button
              key={f}
              onClick={() =>
                setFilter(f)
              }
              style={{
                ...styles.filterBtn,

                ...(filter === f
                  ? styles.filterActive
                  : {}),
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* CONTENT */}

        {loading ? (
          <div style={styles.loading}>
            Loading...
          </div>
        ) : filteredRequests.length ===
          0 ? (
          <div style={styles.empty}>
            No requests found
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredRequests.map(
              (r) => (
                <div
                  key={r.ReqID}
                  style={{
                    ...styles.card,

                    flexDirection:
                      isMobile
                        ? "column"
                        : "row",

                    alignItems:
                      isMobile
                        ? "flex-start"
                        : "center",
                  }}
                >
                  {/* LEFT */}
                  <div
                    style={
                      styles.left
                    }
                  >
                    <h3
                      style={
                        styles.adTitle
                      }
                    >
                      {r.AdTitle}
                    </h3>

                    <p
                      style={
                        styles.text
                      }
                    >
                      <strong>
                        Advertiser:
                      </strong>{" "}
                      {r.FromUser}
                    </p>

                    <p
                      style={
                        styles.text
                      }
                    >
                      <strong>
                        Request ID:
                      </strong>{" "}
                      {r.ReqID}
                    </p>

                    <div
                      style={{
                        ...styles.status,

                        ...getStatusStyle(
                          r.Status
                        ),

                        marginTop: 10,
                      }}
                    >
                      {r.Status}
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div
                    style={{
                      ...styles.right,

                      width:
                        isMobile
                          ? "100%"
                          : "auto",
                    }}
                  >
                    {r.Status ===
                      "pending" && (
                      <div
                        style={
                          styles.btnRow
                        }
                      >
                        {/* ACCEPT */}
                        <button
                          disabled={
                            actionLoading ===
                            r.ReqID
                          }
                          onClick={() =>
                            handleAction(
                              r,
                              "accepted"
                            )
                          }
                          style={{
                            ...styles.acceptBtn,

                            width:
                              isMobile
                                ? "100%"
                                : "auto",

                            opacity:
                              actionLoading ===
                              r.ReqID
                                ? 0.7
                                : 1,
                          }}
                        >
                          {actionLoading ===
                          r.ReqID
                            ? "Please wait..."
                            : "Accept"}
                        </button>

                        {/* REJECT */}
                        <button
                          disabled={
                            actionLoading ===
                            r.ReqID
                          }
                          onClick={() =>
                            handleAction(
                              r,
                              "rejected"
                            )
                          }
                          style={{
                            ...styles.rejectBtn,

                            width:
                              isMobile
                                ? "100%"
                                : "auto",

                            opacity:
                              actionLoading ===
                              r.ReqID
                                ? 0.7
                                : 1,
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
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
  // PAGE
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f0f1a",
    color: "#fff",
    fontFamily:
      "'Segoe UI', sans-serif",
  },

  // SIDEBAR
  sidebar: {
    background:
      "rgba(255,255,255,0.03)",
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
    color:
      "rgba(255,255,255,0.55)",
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
    borderTop:
      "1px solid rgba(255,255,255,0.07)",
    paddingTop: 20,
  },

  agencyBox: {
    background:
      "rgba(255,255,255,0.05)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  agencyName: {
    fontSize: 14,
    fontWeight: 700,
  },

  agencyOwner: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },

  logoutBtn: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border:
      "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color:
      "rgba(255,255,255,0.7)",
    cursor: "pointer",
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

  // FILTERS
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
      "linear-gradient(135deg,#22c55e,#16a34a)",
    border: "none",
  },

  // GRID
  grid: {
    display: "grid",
    gap: 16,
  },

  // CARD
  card: {
    display: "flex",
    justifyContent:
      "space-between",
    background:
      "rgba(255,255,255,0.05)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
    gap: 18,
  },

  left: {
    flex: 1,
  },

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
    color:
      "rgba(255,255,255,0.75)",
    marginBottom: 6,
  },

  // STATUS
  status: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
  },

  // BUTTONS
  btnRow: {
    display: "flex",
    gap: 10,
    flexDirection: "column",
  },

  acceptBtn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },

  rejectBtn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background:
      "linear-gradient(135deg,#ef4444,#dc2626)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },

  // STATES
  loading: {
    color:
      "rgba(255,255,255,0.7)",
    fontSize: 14,
  },

  empty: {
    color:
      "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
};







