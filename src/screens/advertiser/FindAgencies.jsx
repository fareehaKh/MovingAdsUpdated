// import { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { getUserSession } from "../../utils/session";

// import {
//   getMatchedAgenciesApi,
//   createRequestApi,
//   getSentRequestsApi,
// } from "../../api/authapi";

// const FindAgencies = () => {
//   const navigate = useNavigate();
//   const { adId } = useParams();
//   const user = getUserSession();

//   const [agencies, setAgencies] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [requestMap, setRequestMap] = useState({});

//   const isMobile = window.innerWidth <= 768;

//   useEffect(() => {
//     if (!user) {
//       navigate("/");
//       return;
//     }

//     loadAgencies();
//     loadRequests();
//   }, [adId]);

//   // =========================
//   // LOAD AGENCIES
//   // =========================
//   const loadAgencies = async () => {
//     try {
//       setLoading(true);
//       const res = await getMatchedAgenciesApi(adId);
//       setAgencies(res.data || []);
//     } catch (err) {
//       console.log(err);
//       setAgencies([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // =========================
//   // LOAD REQUEST STATUS
//   // =========================
//   const loadRequests = async () => {
//     try {
//       const res = await getSentRequestsApi(user.UserId);

//       const map = {};
//       (res.data || []).forEach((r) => {
//         const key = `${r.AgencyId}_${r.AdId}`;
//         map[key] = r.Status;
//       });

//       setRequestMap(map);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   // =========================
//   // SEND REQUEST
//   // =========================
//   const handleSendRequest = async (agencyId, adId) => {
//     try {
//       await createRequestApi({
//         RequestedBy: user.UserId,
//         RequestedTo: agencyId,
//         AdId: adId,
//         AgencyId: agencyId,
//         Status: "pending",
//       });

//       setRequestMap((prev) => ({
//         ...prev,
//         [`${agencyId}_${adId}`]: "pending",
//       }));
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   // =========================
//   // LOGOUT
//   // =========================
//   const handleLogout = () => {
//     navigate("/");
//   };

//   // =========================
//   // UI
//   // =========================
//   return (
//     <div style={styles.page}>

//       {/* SIDEBAR */}
//       <aside style={styles.sidebar}>
//         <div style={styles.logo}>📢 MovingAds</div>

//         <div style={styles.nav}>
//           <div style={styles.navItem} onClick={() => navigate("/advertiser")}>
//             📊 Dashboard
//           </div>

//           <div style={styles.navItem} onClick={() => navigate("/advertiser/sent-requests")} >
//             Sent Requests
//           </div>
//         </div>

//         <div style={styles.footer}>
//           <div style={styles.user}>
//             <div style={styles.avatar}>
//               {user?.Name?.[0]?.toUpperCase() || "A"}
//             </div>

//             <div>
//               <div style={styles.name}>{user?.Name}</div>
//               <div style={styles.role}>Advertiser</div>
//             </div>
//           </div>

//           <button style={styles.logout} onClick={handleLogout}>
//             Logout
//           </button>
//         </div>
//       </aside>

//       {/* MAIN */}
//       <main style={styles.main}>
//         <h2 style={styles.title}>Matched Agencies</h2>

//         {loading ? (
//           <p style={{ color: "#fff" }}>Loading...</p>
//         ) : agencies.length === 0 ? (
//           <p style={{ color: "#fff" }}>No matched agencies found</p>
//         ) : (
//           <div style={styles.list}>
//             {agencies.map((agency, i) => {
//               const key = `${agency.AgencyId}_${adId}`;
//               const status = requestMap[key];

//               return (
//                 <div key={i} style={styles.card}>

//                   {/* INFO */}
//                   <div style={styles.info}>
//                     <h3>🏢 {agency.AgencyName}</h3>

//                     <p><b>Owner:</b> {agency.OwnerName}</p>
//                     <p><b>Email:</b> {agency.Email}</p>

//                     <p style={styles.desc}>
//                       {agency.AgencyDescription}
//                     </p>
//                   </div>

//                   {/* BUTTON */}
//                   <div style={{ width: isMobile ? "100%" : "auto" }}>
//                     <button
//                       disabled={status === "pending" || status === "accepted"}
//                       onClick={() =>
//                         handleSendRequest(agency.AgencyId, adId)
//                       }
//                       style={{
//                         ...styles.btn,
//                         width: isMobile ? "100%" : "auto",

//                         background:
//                           status === "pending"
//                             ? "#6b7280"
//                             : status === "accepted"
//                             ? "#16a34a"
//                             : "linear-gradient(135deg,#667eea,#764ba2)",

//                         cursor:
//                           status === "pending" || status === "accepted"
//                             ? "not-allowed"
//                             : "pointer",

//                         opacity:
//                           status === "pending" || status === "accepted"
//                             ? 0.7
//                             : 1,
//                       }}
//                     >
//                       {status === "pending"
//                         ? "Requested"
//                         : status === "accepted"
//                         ? "Accepted"
//                         : "Send Request"}
//                     </button>
//                   </div>

//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default FindAgencies;

// /* =========================
//    STYLES
// ========================= */

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
//     width: 230,
//     background: "rgba(255,255,255,0.03)",
//     borderRight: "1px solid rgba(255,255,255,0.08)",
//     display: "flex",
//     flexDirection: "column",
//     padding: "20px 0",
//   },

//   logo: {
//     padding: "0 18px",
//     fontWeight: 700,
//     marginBottom: 20,
//   },

//   nav: {
//     flex: 1,
//     padding: "0 10px",
//   },

//   navItem: {
//     padding: "10px 12px",
//     borderRadius: 10,
//     cursor: "pointer",
//     color: "rgba(255,255,255,0.6)",
//     marginBottom: 5,
//   },

//   footer: {
//     padding: 15,
//     borderTop: "1px solid rgba(255,255,255,0.08)",
//   },

//   user: {
//     display: "flex",
//     gap: 10,
//     marginBottom: 10,
//   },

//   avatar: {
//     width: 32,
//     height: 32,
//     borderRadius: "50%",
//     background: "#7c5cff",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   name: { fontSize: 13 },
//   role: { fontSize: 11, opacity: 0.5 },

//   logout: {
//     width: "100%",
//     padding: 8,
//     background: "transparent",
//     border: "1px solid rgba(255,255,255,0.2)",
//     color: "#aaa",
//     borderRadius: 8,
//     cursor: "pointer",
//   },

//   /* MAIN */
//   main: {
//     flex: 1,
//     padding: 20,
//   },

//   title: {
//     marginBottom: 14,
//   },

//   list: {
//     display: "flex",
//     flexDirection: "column",
//     gap: 14,
//   },

//   card: {
//     display: "flex",
//     justifyContent: "space-between",
//     background: "rgba(255,255,255,0.05)",
//     borderRadius: 14,
//     padding: 16,
//     gap: 16,
//   },

//   info: {
//     flex: 1,
//   },

//   desc: {
//     fontSize: 13,
//     opacity: 0.6,
//     marginTop: 8,
//   },

//   btn: {
//     padding: "10px 14px",
//     border: "none",
//     borderRadius: 10,
//     color: "#fff",
//     fontWeight: 600,
//   },
// };











import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getUserSession, clearUserSession } from "../../utils/session";

import {
  getMatchedAgenciesApi,
  createRequestApi,
  getSentRequestsApi,
  getAgencyByIdApi,
} from "../../api/authapi";

const FindAgencies = () => {
  const navigate = useNavigate();
  const { adId } = useParams();

  const user = getUserSession();

  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  // stores request statuses
  const [requestMap, setRequestMap] = useState({});

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    loadAllData();
  }, [adId]);

  // =========================
  // LOAD EVERYTHING
  // =========================
  const loadAllData = async () => {
    try {
      setLoading(true);

      // 1️⃣ matched agencies
      const agencyRes = await getMatchedAgenciesApi(adId);

      const agencyList = agencyRes.data || [];

      // 2️⃣ get sent requests
      const sentRes = await getSentRequestsApi(user.UserId);

      const sentRequests = sentRes.data || [];

      // 3️⃣ build status map
      const map = {};

      sentRequests.forEach((r) => {
        const key = `${r.AgencyId}_${r.AdId}`;
        map[key] = r.Status;
      });

      setRequestMap(map);

      // 4️⃣ attach agency userId
      const updatedAgencies = await Promise.all(
        agencyList.map(async (agency) => {
          try {
            const res = await getAgencyByIdApi(
              agency.AgencyId
            );

            return {
              ...agency,
              UserId: res.data.UserId, // ✅ IMPORTANT
            };
          } catch {
            return agency;
          }
        })
      );

      setAgencies(updatedAgencies);
    } catch (err) {
      console.log(err);
      setAgencies([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SEND REQUEST
  // =========================
  const handleSendRequest = async (agency) => {
    try {
      // ✅ RequestedTo MUST BE USER ID
      // NOT AGENCY ID

      await createRequestApi({
        RequestedBy: user.UserId,
        RequestedTo: agency.UserId,
        AdId: parseInt(adId),
        AgencyId: agency.AgencyId,
        Status: "pending",
      });

      const key = `${agency.AgencyId}_${adId}`;

      setRequestMap((prev) => ({
        ...prev,
        [key]: "pending",
      }));
    } catch (err) {
      console.log(err);
      alert("Failed to send request");
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
  // STATUS STYLE
  // =========================
  const getBtnStyle = (status) => {
    if (status === "pending") {
      return {
        background: "#6b7280",
        cursor: "not-allowed",
        opacity: 0.8,
      };
    }

    if (status === "accepted") {
      return {
        background: "#16a34a",
        cursor: "not-allowed",
      };
    }

    return {
      background:
        "linear-gradient(135deg,#6366f1,#8b5cf6)",
      cursor: "pointer",
    };
  };

  // =========================
  // BUTTON TEXT
  // =========================
  const getBtnText = (status) => {
    if (status === "pending") return "Requested";
    if (status === "accepted") return "Accepted";

    return "Send Request";
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
            : "1px solid rgba(255,255,255,0.08)",

          borderBottom: isMobile
            ? "1px solid rgba(255,255,255,0.08)"
            : "none",
        }}
      >
        {/* LOGO */}

        <div style={styles.logo}>
          📢 MovingAds
        </div>

        {/* NAV */}

        <div style={styles.nav}>
          <div
            style={styles.navItem}
            onClick={() => navigate("/advertiser")}
          >
            📊 Dashboard
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              navigate("/advertiser/sent-requests")
            }
          >
            📩 Sent Requests
          </div>

          <div
            style={{
              ...styles.navItem,
              ...styles.navActive,
            }}
          >
            🏢 Find Agencies
          </div>
        </div>

        {/* FOOTER */}

        <div style={styles.footer}>
          <div style={styles.userBox}>
            <div style={styles.avatar}>
              {user?.Name?.[0]?.toUpperCase() || "A"}
            </div>

            <div>
              <div style={styles.name}>
                {user?.Name}
              </div>

              <div style={styles.role}>
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
        <h1
          style={{
            ...styles.title,
            fontSize: isMobile ? 24 : 32,
          }}
        >
          Matched Agencies
        </h1>

        {/* CONTENT */}

        {loading ? (
          <div style={styles.loading}>
            Loading...
          </div>
        ) : agencies.length === 0 ? (
          <div style={styles.empty}>
            No matched agencies found
          </div>
        ) : (
          <div style={styles.list}>
            {agencies.map((agency, index) => {
              const key = `${agency.AgencyId}_${adId}`;

              const status = requestMap[key];

              return (
                <div
                  key={index}
                  style={{
                    ...styles.card,

                    flexDirection: isMobile
                      ? "column"
                      : "row",

                    alignItems: isMobile
                      ? "flex-start"
                      : "center",
                  }}
                >
                  {/* LEFT */}

                  <div style={styles.info}>
                    <h3 style={styles.agencyName}>
                      🏢 {agency.AgencyName}
                    </h3>

                    <p style={styles.text}>
                      <strong>Owner:</strong>{" "}
                      {agency.OwnerName}
                    </p>

                    <p style={styles.text}>
                      <strong>Email:</strong>{" "}
                      {agency.Email}
                    </p>

                    <p style={styles.desc}>
                      {agency.AgencyDescription}
                    </p>
                  </div>

                  {/* RIGHT */}

                  <div
                    style={{
                      width: isMobile
                        ? "100%"
                        : "auto",
                    }}
                  >
                    <button
                      disabled={
                        status === "pending" ||
                        status === "accepted"
                      }
                      onClick={() =>
                        handleSendRequest(agency)
                      }
                      style={{
                        ...styles.btn,
                        width: isMobile
                          ? "100%"
                          : "auto",

                        ...getBtnStyle(status),
                      }}
                    >
                      {getBtnText(status)}
                    </button>
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

export default FindAgencies;

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

  /* SIDEBAR */

  sidebar: {
    background: "rgba(255,255,255,0.03)",
    display: "flex",
    flexDirection: "column",
    padding: "22px 0",
  },

  logo: {
    padding: "0 22px",
    fontWeight: 700,
    fontSize: 20,
    marginBottom: 30,
  },

  nav: {
    flex: 1,
    padding: "0 12px",
  },

  navItem: {
    padding: "11px 14px",
    borderRadius: 10,
    cursor: "pointer",
    marginBottom: 6,
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    transition: "0.2s",
  },

  navActive: {
    background:
      "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.18))",

    color: "#a78bfa",
  },

  footer: {
    padding: 16,
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
  },

  userBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#6366f1,#8b5cf6)",

    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    fontWeight: 700,
    fontSize: 15,
  },

  name: {
    fontSize: 13,
    fontWeight: 600,
  },

  role: {
    fontSize: 11,
    opacity: 0.6,
  },

  logoutBtn: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border:
      "1px solid rgba(255,255,255,0.12)",

    background: "transparent",
    color: "#aaa",
    cursor: "pointer",
    fontSize: 13,
  },

  /* MAIN */

  main: {
    flex: 1,
    overflowY: "auto",
  },

  title: {
    fontWeight: 700,
    marginBottom: 22,
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  card: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,

    background: "rgba(255,255,255,0.05)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    borderRadius: 18,
    padding: 18,
  },

  info: {
    flex: 1,
  },

  agencyName: {
    margin: 0,
    marginBottom: 10,
    fontSize: 18,
  },

  text: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 6,
  },

  desc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    marginTop: 10,
    lineHeight: 1.6,
  },

  btn: {
    padding: "11px 18px",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontWeight: 600,
    minWidth: 140,
    transition: "0.2s",
  },

  loading: {
    color: "#aaa",
    fontSize: 14,
  },

  empty: {
    color: "#aaa",
    fontSize: 14,
  },
};