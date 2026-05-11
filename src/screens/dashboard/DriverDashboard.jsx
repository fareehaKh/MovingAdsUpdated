import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession, clearUserSession } from "../../utils/session";
import { registerVehicleApi, getVehiclesByOwnerApi } from "../../api/authapi";

// ─── Cloudinary config ────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = "dgolfena6";   // ← replace
const CLOUDINARY_UPLOAD_PRESET = "MovingAds";    // ← replace unsigned preset

const uploadToCloudinary = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
    { method: "POST", body: fd }
  );
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return { url: data.secure_url, name: file.name, type: file.type };
};
// ─────────────────────────────────────────────────────────────────

const VEHICLE_TYPES = ["Car", "Van", "Bus", "Truck", "Motorcycle", "Rickshaw", "Other"];

const DriverDashboard = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    vehicleReg: "",
    vehicleModel: "",
    vehicleType: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const res = await getVehiclesByOwnerApi(user.UserId);
      setVehicles(res.data || []);
    } catch {
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!form.vehicleReg || !form.vehicleModel || !form.vehicleType || !imageFile) {
      setFormError("All fields and a vehicle image are required.");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Upload to Cloudinary
      const uploaded = await uploadToCloudinary(imageFile);

      // 2. Register vehicle
      await registerVehicleApi({
        VehicleReg: form.vehicleReg,
        VehicleModel: form.vehicleModel,
        VehicleType: form.vehicleType,
        VehicleStatus: "offline",
        VehicleOwner: user.UserId,
        MediaPath: uploaded.url,
        MediaName: uploaded.name,
        MediaType: uploaded.type,
      });

      alert("Vehicle registered successfully!");
      setShowForm(false);
      setForm({ vehicleReg: "", vehicleModel: "", vehicleType: "" });
      setImageFile(null);
      setImagePreview(null);
      fetchVehicles();
    } catch (err) {
      setFormError(err.response?.data?.Message || err.response?.data || err.message || "Failed to register vehicle.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  const statusColor = (s) => s === "online" ? "#22c55e" : "#6b7280";

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <span style={{ fontSize: 22 }}>🚗</span>
          <span style={styles.sidebarLogoText}>MovingAds</span>
        </div>
        <nav style={styles.nav}>
          <div style={{ ...styles.navItem, ...styles.navItemActive }}>🚘 My Vehicles</div>
          {/* <div style={styles.navItem} onClick={() => navigate("/driver/new-ad-opportunities")}>📢 New Ad Opportunities</div> */}

          <div style={styles.navItem} onClick={() => navigate(`/driver/available-agencies`)}>
            🏢 Available Agencies
          </div>

          {/* <div style={styles.navItem} onClick={() => navigate("/driver/requests-to-driver")}>📩 Your Requests</div> */}
          <div
            style={{ ...styles.navItem }}
            onClick={() => navigate(`/driver/ad-simulation`) }
          >
            AD Simulation
          </div>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userBadge}>
            <div style={styles.avatar}>{user?.Name?.[0]?.toUpperCase() || "D"}</div>
            <div>
              <div style={styles.userName}>{user?.Name}</div>
              <div style={styles.userRole}>Driver</div>
            </div>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>My Vehicles</h1>
            <p style={styles.pageSub}>Register and manage your fleet</p>
          </div>
          <button style={styles.primaryBtn} onClick={() => setShowForm(true)}>
            + Register Vehicle
          </button>
        </div>

        {/* Register Vehicle Modal */}
        {showForm && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Register Vehicle</h2>
                <button style={styles.closeBtn} onClick={() => { setShowForm(false); setFormError(""); }}>✕</button>
              </div>

              {formError && <div style={styles.errorBox}>{formError}</div>}

              <label style={styles.label}>Registration Number</label>
              <input
                style={styles.input}
                placeholder="e.g. ABC-1234"
                value={form.vehicleReg}
                onChange={(e) => setForm({ ...form, vehicleReg: e.target.value })}
              />

              <label style={styles.label}>Vehicle Model</label>
              <input
                style={styles.input}
                placeholder="e.g. Toyota Corolla 2022"
                value={form.vehicleModel}
                onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
              />

              <label style={styles.label}>Vehicle Type</label>
              <select
                style={styles.input}
                value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
              >
                <option value="">Select type...</option>
                {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>

              <label style={styles.label}>Vehicle Photo</label>
              <label style={styles.fileLabel}>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" style={styles.mediaPreview} />
                ) : (
                  <div style={styles.filePlaceholder}>
                    <span style={{ fontSize: 32 }}>📷</span>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Click to upload vehicle photo</span>
                  </div>
                )}
              </label>

              <div style={styles.modalActions}>
                <button style={styles.cancelBtn} onClick={() => { setShowForm(false); setFormError(""); }}>Cancel</button>
                <button
                  style={{ ...styles.primaryBtn, opacity: submitting ? 0.7 : 1 }}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Registering..." : "Register"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vehicles Grid */}
        {loadingVehicles ? (
          <div style={styles.center}><div style={styles.spinner} /></div>
        ) : vehicles.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 48 }}>🚘</div>
            <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 12 }}>No vehicles yet. Register your first vehicle!</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {vehicles.map((v) => (
              <div key={v.VehicleReg} style={styles.card}>
                {v.MediaPath && (
                  <img src={v.MediaPath} alt={v.VehicleModel} style={styles.cardMedia} />
                )}
                <div style={styles.cardBody}>
                  <div style={styles.cardTitle}>{v.VehicleModel}</div>
                  <div style={styles.cardMeta}>
                    <span style={styles.typeBadge}>{v.VehicleType}</span>
                    <span style={{ ...styles.statusBadge, background: statusColor(v.VehicleStatus) + "22", color: statusColor(v.VehicleStatus) }}>
                      ● {v.VehicleStatus}
                    </span>
                  </div>
                  <div style={styles.regRow}>🔖 {v.VehicleReg}</div>
                   <div style={styles.iconButtonRow}>

                    <button
                      style={styles.iconButton}
                      onClick={() => {
                        const selectedVehicleReg = v.VehicleReg || v.VehReg;
                        console.log("Selected Vehicle Reg:", selectedVehicleReg);
                        navigate(`/location/veh-location-screen/${selectedVehicleReg}`);
                      }}
                    >
                      📍 Fence
                    </button>

                    <button
                        style={styles.iconButton}
                        onClick={() => {
                          const selectedVehicleReg = v.VehicleReg || v.VehReg;
                          console.log("Selected Vehicle Reg:", selectedVehicleReg);
                          navigate(`/schedule/veh-schedule-screen/${selectedVehicleReg}`);
                        }}
                      >
                        🗓 Schedule
                      </button>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  page: { display: "flex", minHeight: "100vh", background: "#0f0f1a", fontFamily: "'Segoe UI', sans-serif" },
  sidebar: {
    width: 240, background: "rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.07)",
    display: "flex", flexDirection: "column", padding: "24px 0",
  },
  sidebarLogo: { display: "flex", alignItems: "center", gap: 10, padding: "0 24px", marginBottom: 32 },
  sidebarLogoText: { color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: 1 },
  nav: { flex: 1, padding: "0 12px" },
  navItem: { padding: "10px 16px", borderRadius: 10, color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", marginBottom: 4 },
  navItemActive: { background: "rgba(34,197,94,0.15)", color: "#4ade80" },
  sidebarFooter: { padding: "0 16px", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20 },
  userBadge: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  avatar: {
    width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15,
  },
  userName: { color: "#fff", fontWeight: 600, fontSize: 13 },
  userRole: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
  logoutBtn: {
    width: "100%", padding: "9px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13,
  },
  main: { flex: 1, padding: "32px", overflowY: "auto" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  pageTitle: { color: "#fff", margin: 0, fontSize: 26, fontWeight: 700 },
  pageSub: { color: "rgba(255,255,255,0.4)", margin: "4px 0 0", fontSize: 14 },
  primaryBtn: {
    padding: "11px 22px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
  },
  modal: {
    background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20, padding: 32, width: "100%", maxWidth: 480,
    maxHeight: "90vh", overflowY: "auto",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: "#fff", margin: 0, fontSize: 20, fontWeight: 700 },
  closeBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 18, cursor: "pointer" },
  label: { display: "block", color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 6, marginTop: 14, fontWeight: 500 },
  input: {
    width: "100%", padding: "11px 13px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)",
    color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
  },
  fileLabel: {
    display: "block", border: "2px dashed rgba(255,255,255,0.15)", borderRadius: 12,
    cursor: "pointer", overflow: "hidden", marginTop: 8,
  },
  filePlaceholder: {
    padding: "28px 20px", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  mediaPreview: { width: "100%", maxHeight: 220, objectFit: "cover", display: "block" },
  modalActions: { display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" },
  cancelBtn: {
    padding: "11px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14,
  },
  errorBox: {
    background: "rgba(255,80,80,0.12)", border: "1px solid rgba(255,80,80,0.35)",
    borderRadius: 8, padding: "10px 14px", color: "#ff6b6b", fontSize: 13, marginBottom: 8,
  },
  center: { display: "flex", justifyContent: "center", padding: "60px 0" },
  spinner: {
    width: 36, height: 36, border: "3px solid rgba(255,255,255,0.1)",
    borderTop: "3px solid #22c55e", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  empty: { textAlign: "center", padding: "80px 0", color: "#fff" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 },
  card: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, overflow: "hidden",
  },
  cardMedia: { width: "100%", height: 160, objectFit: "cover", display: "block" },
  cardBody: { padding: "14px 16px" },
  cardTitle: { color: "#fff", fontWeight: 600, fontSize: 15, marginBottom: 8 },
  cardMeta: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  typeBadge: {
    padding: "3px 10px", borderRadius: 20, background: "rgba(34,197,94,0.15)",
    color: "#4ade80", fontSize: 11, fontWeight: 600,
  },
  statusBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  regRow: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
    iconButtonRow: {
    display: "flex",
    gap: "12px",
    marginTop: "14px",
    justifyContent: "space-between",
  },

  iconButton: {
    flex: 1,
    padding: "12px 14px",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    background: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    color: "#1E293B",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "0.2s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },

};

export default DriverDashboard;
