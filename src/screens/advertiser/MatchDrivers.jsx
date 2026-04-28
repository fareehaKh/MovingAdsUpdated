// import { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { getUserSession } from "../../utils/session";
// import {
//   getMatchedDriversApi,
//   createRequestApi,
//   getVehicleByRegsApi
// } from "../../api/authapi";

// const MatchDrivers = () => {
//   const navigate = useNavigate();
//   const user = getUserSession();
//   const { adId } = useParams();

//   const [drivers, setDrivers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [sending, setSending] = useState(null);

//   useEffect(() => {
//     if (!user) {
//       navigate("/");
//       return;
//     }

//     loadDrivers();
//   }, [adId, navigate]);

//   // =========================
//   // LOAD + MERGE DATA
//   // =========================
//   const loadDrivers = async () => {
//     try {
//       setLoading(true);

//       // 1. Get matched drivers (VehicleReg + Slots only)
//       const matchRes = await getMatchedDriversApi(adId);
//       const matchedDrivers = matchRes.data || [];

//       if (matchedDrivers.length === 0) {
//         setDrivers([]);
//         return;
//       }

//       // 2. Extract vehicle regs
//       const regs = matchedDrivers.map(d => d.VehicleReg);

//       // 3. Get vehicle + owner details
//       const vehicleRes = await getVehicleByRegsApi(regs);
//       const vehicleList = vehicleRes.data || [];

//       // 4. Merge both responses
//       const finalData = matchedDrivers.map(driver => {
//         const vehicleInfo = vehicleList.find(
//           v => v.VehicleReg === driver.VehicleReg
//         );

//         return {
//           ...driver,

//           // vehicle info
//           VehicleImage: vehicleInfo?.MediaPath || "",
//           DriverName: vehicleInfo?.OwnerName || "N/A",
//           VehicleModel: vehicleInfo?.VehicleModel || "",
//           VehicleType: vehicleInfo?.VehicleType || "",

//           // IMPORTANT: correct user id for request
//           RequestedTo: vehicleInfo?.VehicleOwner || 0
//         };
//       });

//       setDrivers(finalData);
//     } catch (err) {
//       console.log(err);
//       setDrivers([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // =========================
//   // SEND REQUEST
//   // =========================
//   const sendRequest = async (vehicleReg, requestedTo) => {
//     console.log("Vehicle:", vehicleReg, "To:", requestedTo);

//     try {
//       setSending(vehicleReg);

//       const payload = {
//         RequestedBy: user.UserId,
//         RequestedTo: requestedTo,   // ✅ FIXED
//         AdId: parseInt(adId),
//         VehReg: vehicleReg,
//       };

//       await createRequestApi(payload);

//       alert("Request sent!");
//     } catch (err) {
//       console.log(err);
//       alert("Failed to send request");
//     } finally {
//       setSending(null);
//     }
//   };

//   // =========================
//   // UI
//   // =========================
//   return (
//   <div style={styles.wrapper}>

//     {/* SIDEBAR (already exists in your app layout probably) */}
//     <div style={styles.sidebar}>
//       {/* keep your existing sidebar component here */}
//     </div>

//     {/* MAIN CONTENT */}
//     <div style={styles.page}>
//       <h2>Matched Drivers</h2>

//       {loading ? (
//         <p>Loading...</p>
//       ) : drivers.length === 0 ? (
//         <p>No matched drivers found</p>
//       ) : (
//         <div style={styles.list}>
//           {drivers.map((d, i) => (
//             <div key={i} style={styles.rowCard}>

//               {/* LEFT - IMAGE */}
//               <img
//                 src={d.VehicleImage}
//                 alt="vehicle"
//                 style={styles.rowImg}
//               />

//               {/* CENTER - DETAILS */}
//               <div style={styles.rowInfo}>
//                 <h3 style={{ margin: 0 }}>🚘 {d.VehicleReg}</h3>

//                 <p style={styles.text}>
//                   <strong>Driver:</strong> {d.DriverName}
//                 </p>

//                 <p style={styles.text}>
//                   <strong>Model:</strong> {d.VehicleModel}
//                 </p>

//                 <div style={styles.slotWrap}>
//                   {d.Slots?.map((s, idx) => (
//                     <span key={idx} style={styles.slotBadge}>
//                       {s.SlotName}
//                     </span>
//                   ))}
//                 </div>
//               </div>

//               {/* RIGHT - BUTTON */}
//               <div style={styles.action}>
//                 <button
//                   style={styles.btn}
//                   onClick={() =>
//                     sendRequest(d.VehicleReg, d.RequestedTo)
//                   }
//                   disabled={sending === d.VehicleReg}
//                 >
//                   {sending === d.VehicleReg
//                     ? "Sending..."
//                     : "Send Request"}
//                 </button>
//               </div>

//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   </div>
// );
// };

// export default MatchDrivers;

// // =========================
// // STYLES
// // =========================
// const styles = {

//   // OUTER WRAPPER (sidebar + content)
//   wrapper: {
//     display: "flex",
//     minHeight: "100vh",
//     background: "#0f0f1a",
//     color: "#fff",
//   },

//   // SIDEBAR (fixed)
//   sidebar: {
//     width: "250px",
//     position: "fixed",
//     top: 0,
//     left: 0,
//     height: "100vh",
//     background: "#111827",
//     borderRight: "1px solid rgba(255,255,255,0.1)",
//     padding: "20px",
//   },

//   // MAIN PAGE CONTENT (shifted right)
//   page: {
//     marginLeft: "250px",
//     flex: 1,
//     padding: 20,
//   },

//   // LIST CONTAINER
//   list: {
//     display: "flex",
//     flexDirection: "column",
//     gap: 14,
//   },

//   // HORIZONTAL CARD
//   rowCard: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     background: "rgba(255,255,255,0.05)",
//     border: "1px solid rgba(255,255,255,0.08)",
//     borderRadius: 14,
//     padding: 12,
//     gap: 16,
//   },

//   // LEFT IMAGE
//   rowImg: {
//     width: 120,
//     height: 80,
//     objectFit: "cover",
//     borderRadius: 10,
//   },

//   // CENTER INFO
//   rowInfo: {
//     flex: 1,
//   },

//   text: {
//     margin: "4px 0",
//     fontSize: 13,
//     color: "#ddd",
//   },

//   // SLOT TAGS
//   slotWrap: {
//     marginTop: 6,
//     display: "flex",
//     gap: 6,
//     flexWrap: "wrap",
//   },

//   slotBadge: {
//     background: "#1f2937",
//     padding: "4px 8px",
//     borderRadius: 6,
//     fontSize: 11,
//   },

//   // RIGHT BUTTON AREA
//   action: {
//     display: "flex",
//     alignItems: "center",
//   },

//   btn: {
//     padding: "10px 14px",
//     background: "linear-gradient(135deg,#22c55e,#16a34a)",
//     border: "none",
//     color: "#fff",
//     borderRadius: 10,
//     cursor: "pointer",
//     whiteSpace: "nowrap",
//   },
// };


import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserSession } from "../../utils/session";
import {
  getMatchedDriversApi,
  createRequestApi,
  getVehiclesByRegsApi,
  checkRequestExistsApi
} from "../../api/authapi";

const MatchDrivers = () => {
  const navigate = useNavigate();
  const user = getUserSession();
  const { adId } = useParams();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    loadDrivers();
  }, [adId, navigate]);

  // =========================
  // LOAD DATA
  // =========================
  const loadDrivers = async () => {
    try {
      setLoading(true);

      const matchRes = await getMatchedDriversApi(adId);
      const matchedDrivers = matchRes.data || [];

      if (matchedDrivers.length === 0) {
        setDrivers([]);
        return;
      }

      const regs = matchedDrivers.map(d => d.VehicleReg);

      const vehicleRes = await getVehiclesByRegsApi(regs);
      const vehicleList = vehicleRes.data || [];

      let merged = matchedDrivers.map(d => {
        const v = vehicleList.find(x => x.VehicleReg === d.VehicleReg);

        return {
          ...d,
          VehicleImage: v?.MediaPath || "",
          DriverName: v?.OwnerName || "N/A",
          RequestedTo: v?.VehicleOwner || 0,
          RequestExists: false
        };
      });

      merged = await Promise.all(
        merged.map(async (d) => {
          try {
            const res = await checkRequestExistsApi({
              RequestedBy: user.UserId,
              RequestedTo: d.RequestedTo,
              AdId: parseInt(adId),
              VehReg: d.VehicleReg,
            });

            return {
              ...d,
              RequestExists: res.data === true
            };
          } catch {
            return {
              ...d,
              RequestExists: false
            };
          }
        })
      );

      setDrivers(merged);

    } catch (err) {
      console.log(err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SEND REQUEST
  // =========================
  const sendRequest = async (vehicleReg, requestedTo) => {
    try {
      setSending(vehicleReg);

      const payload = {
        RequestedBy: user.UserId,
        RequestedTo: requestedTo,
        AdId: parseInt(adId),
        VehReg: vehicleReg,
      };

      await createRequestApi(payload);

      setDrivers(prev =>
        prev.map(d =>
          d.VehicleReg === vehicleReg
            ? { ...d, RequestExists: true }
            : d
        )
      );

    } catch (err) {
      console.log(err);
      alert("Failed to send request");
    } finally {
      setSending(null);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={styles.page}>

      <h2 style={styles.title}>Matched Drivers</h2>

      {loading ? (
        <p>Loading...</p>
      ) : drivers.length === 0 ? (
        <p>No matched drivers found</p>
      ) : (
        <div style={styles.list}>
          {drivers.map((d, i) => (
            <div
              key={i}
              style={{
                ...styles.card,
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "flex-start" : "center",
              }}
            >

              {/* IMAGE */}
              <img
                src={d.VehicleImage}
                alt="vehicle"
                style={{
                  ...styles.img,
                  width: isMobile ? "100%" : 120,
                  height: isMobile ? 180 : 80,
                }}
              />

              {/* INFO */}
              <div style={styles.info}>
                <h3>🚘 {d.VehicleReg}</h3>
                <p><strong>Driver:</strong> {d.DriverName}</p>

                <div style={styles.slots}>
                  {d.Slots?.map((s, idx) => (
                    <span key={idx} style={styles.slot}>
                      {s.SlotName}
                    </span>
                  ))}
                </div>
              </div>

              {/* BUTTON */}
              <div style={{ width: isMobile ? "100%" : "auto" }}>
                <button
                  style={{
                    ...styles.btn,
                    width: isMobile ? "100%" : "auto",
                    background: d.RequestExists
                      ? "#6b7280"
                      : "linear-gradient(135deg,#22c55e,#16a34a)",
                    cursor: d.RequestExists ? "not-allowed" : "pointer",
                  }}
                  disabled={d.RequestExists || sending === d.VehicleReg}
                  onClick={() =>
                    !d.RequestExists &&
                    sendRequest(d.VehicleReg, d.RequestedTo)
                  }
                >
                  {d.RequestExists
                    ? "Requested"
                    : sending === d.VehicleReg
                    ? "Sending..."
                    : "Send Request"}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchDrivers;

// =========================
// STYLES
// =========================
const styles = {

  page: {
    minHeight: "100vh",
    background: "#0f0f1a",
    color: "#fff",
    padding: 20,
  },

  title: {
    marginBottom: 20,
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  card: {
    display: "flex",
    justifyContent: "space-between",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 12,
    gap: 16,
  },

  img: {
    objectFit: "cover",
    borderRadius: 10,
  },

  info: {
    flex: 1,
  },

  slots: {
    marginTop: 6,
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },

  slot: {
    background: "#1f2937",
    padding: "3px 8px",
    borderRadius: 6,
    fontSize: 11,
  },

  btn: {
    padding: "10px 14px",
    border: "none",
    color: "#fff",
    borderRadius: 10,
  },
};