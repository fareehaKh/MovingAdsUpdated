
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