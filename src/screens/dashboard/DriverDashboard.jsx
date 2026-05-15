//////////////////////////////   RESPONSIVE   //////////////////////////////

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUserSession,
  clearUserSession,
} from "../../utils/session";

import {
  registerVehicleApi,
  getVehiclesByOwnerApi,
} from "../../api/authapi";

// ─── Cloudinary config ─────────────────────────────
const CLOUDINARY_CLOUD_NAME = "dgolfena6";
const CLOUDINARY_UPLOAD_PRESET = "MovingAds";

const uploadToCloudinary = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
    {
      method: "POST",
      body: fd,
    }
  );

  if (!res.ok)
    throw new Error("Cloudinary upload failed");

  const data = await res.json();

  return {
    url: data.secure_url,
    name: file.name,
    type: file.type,
  };
};
// ───────────────────────────────────────────────────

const VEHICLE_TYPES = [
  "Car",
  "Van",
  "Bus",
  "Truck",
  "Motorcycle",
  "Rickshaw",
  "Other",
];

const DriverDashboard = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] =
    useState(true);

  const [showForm, setShowForm] = useState(false);
  const [mobileSidebar, setMobileSidebar] =
    useState(false);

  const [form, setForm] = useState({
    vehicleReg: "",
    vehicleModel: "",
    vehicleType: "",
  });

  const [imageFile, setImageFile] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoadingVehicles(true);

    try {
      const res =
        await getVehiclesByOwnerApi(
          user.UserId
        );

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
    setImagePreview(
      URL.createObjectURL(file)
    );
  };

  const handleSubmit = async () => {
    setFormError("");

    if (
      !form.vehicleReg ||
      !form.vehicleModel ||
      !form.vehicleType ||
      !imageFile
    ) {
      setFormError(
        "All fields and vehicle image are required."
      );
      return;
    }

    setSubmitting(true);

    try {
      const uploaded =
        await uploadToCloudinary(
          imageFile
        );

      await registerVehicleApi({
        VehicleReg: form.vehicleReg,
        VehicleModel:
          form.vehicleModel,
        VehicleType:
          form.vehicleType,
        VehicleStatus: "offline",
        VehicleOwner: user.UserId,
        MediaPath: uploaded.url,
        MediaName: uploaded.name,
        MediaType: uploaded.type,
      });

      alert(
        "Vehicle registered successfully!"
      );

      setShowForm(false);

      setForm({
        vehicleReg: "",
        vehicleModel: "",
        vehicleType: "",
      });

      setImageFile(null);
      setImagePreview(null);

      fetchVehicles();
    } catch (err) {
      setFormError(
        err.response?.data?.Message ||
          err.response?.data ||
          err.message ||
          "Failed to register vehicle."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  return (
    <div style={styles.page}>
      {/* MOBILE HEADER */}
      <div style={styles.mobileHeader}>
        <div style={styles.mobileLogo}>
          🚗 MovingAds
        </div>

        <button
          style={styles.menuBtn}
          onClick={() =>
            setMobileSidebar(
              !mobileSidebar
            )
          }
        >
          ☰
        </button>
      </div>

      {/* SIDEBAR OVERLAY */}
      {mobileSidebar && (
        <div
          style={styles.overlay}
          onClick={() =>
            setMobileSidebar(false)
          }
        />
      )}

      {/* SIDEBAR */}
      <aside
        style={{
          ...styles.sidebar,

          ...(mobileSidebar
            ? styles.sidebarMobileOpen
            : {}),
        }}
      >
        <div style={styles.sidebarLogo}>
          <span style={{ fontSize: 22 }}>
            🚗
          </span>

          <span
            style={styles.sidebarLogoText}
          >
            MovingAds
          </span>
        </div>

        <nav style={styles.nav}>
          <div
            style={{
              ...styles.navItem,
              ...styles.navItemActive,
            }}
          >
            🚘 My Vehicles
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              navigate(
                "/driver/available-agencies"
              )
            }
          >
            🏢 Available Agencies
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              navigate(
                "/driver/trip-stats/${v.VehicleReg}"
              )
            }
          >
            📊 Trip Stats
          </div>

          <div
            style={styles.navItem}
            onClick={() =>
              navigate(
                "/driver/earnings"
              )
            }
          >
             My Earnings
          </div>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userBadge}>
            <div style={styles.avatar}>
              {user?.Name?.[0]?.toUpperCase() ||
                "D"}
            </div>

            <div>
              <div style={styles.userName}>
                {user?.Name}
              </div>

              <div style={styles.userRole}>
                Driver
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

      {/* MAIN */}
      <main style={styles.main}>
        {/* TOPBAR */}
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>
              My Vehicles
            </h1>

            <p style={styles.pageSub}>
              Register and manage your
              fleet
            </p>
          </div>

          <button
            style={styles.primaryBtn}
            onClick={() =>
              setShowForm(true)
            }
          >
            + Register Vehicle
          </button>
        </div>

        {/* MODAL */}
        {showForm && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div
                style={styles.modalHeader}
              >
                <h2
                  style={styles.modalTitle}
                >
                  Register Vehicle
                </h2>

                <button
                  style={styles.closeBtn}
                  onClick={() => {
                    setShowForm(false);
                    setFormError("");
                  }}
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div style={styles.errorBox}>
                  {formError}
                </div>
              )}

              <label style={styles.label}>
                Registration Number
              </label>

              <input
                style={styles.input}
                placeholder="ABC-1234"
                value={form.vehicleReg}
                onChange={(e) =>
                  setForm({
                    ...form,
                    vehicleReg:
                      e.target.value,
                  })
                }
              />

              <label style={styles.label}>
                Vehicle Model
              </label>

              <input
                style={styles.input}
                placeholder="Toyota Corolla"
                value={form.vehicleModel}
                onChange={(e) =>
                  setForm({
                    ...form,
                    vehicleModel:
                      e.target.value,
                  })
                }
              />

              <label style={styles.label}>
                Vehicle Type
              </label>

              <select
                style={styles.input}
                value={form.vehicleType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    vehicleType:
                      e.target.value,
                  })
                }
              >
                <option value="">
                  Select type...
                </option>

                {VEHICLE_TYPES.map(
                  (t) => (
                    <option
                      key={t}
                      value={t}
                    >
                      {t}
                    </option>
                  )
                )}
              </select>

              <label style={styles.label}>
                Vehicle Photo
              </label>

              <label
                style={styles.fileLabel}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleFileChange
                  }
                  style={{
                    display: "none",
                  }}
                />

                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="preview"
                    style={
                      styles.mediaPreview
                    }
                  />
                ) : (
                  <div
                    style={
                      styles.filePlaceholder
                    }
                  >
                    <span
                      style={{
                        fontSize: 34,
                      }}
                    >
                      📷
                    </span>

                    <span
                      style={{
                        color:
                          "rgba(255,255,255,0.5)",
                      }}
                    >
                      Click to upload
                    </span>
                  </div>
                )}
              </label>

              <div
                style={
                  styles.modalActions
                }
              >
                <button
                  style={
                    styles.cancelBtn
                  }
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  style={
                    styles.primaryBtn
                  }
                  onClick={
                    handleSubmit
                  }
                  disabled={submitting}
                >
                  {submitting
                    ? "Registering..."
                    : "Register"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VEHICLES */}
        {loadingVehicles ? (
          <div style={styles.center}>
            <div style={styles.spinner} />
          </div>
        ) : vehicles.length === 0 ? (
          <div style={styles.empty}>
            <div
              style={{ fontSize: 52 }}
            >
              🚘
            </div>

            <p style={styles.emptyText}>
              No vehicles yet. Register
              your first vehicle!
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {vehicles.map((v) => (
              <div
                key={v.VehicleReg}
                style={styles.card}
              >
                {v.MediaPath && (
                  <img
                    src={v.MediaPath}
                    alt={
                      v.VehicleModel
                    }
                    style={
                      styles.cardMedia
                    }
                  />
                )}

                <div style={styles.cardBody}>
                  <div
                    style={
                      styles.cardTop
                    }
                  >
                    <div
                      style={
                        styles.cardTitle
                      }
                    >
                      {v.VehicleModel}
                    </div>

                    <div
                      style={
                        styles.typeBadge
                      }
                    >
                      {v.VehicleType}
                    </div>
                  </div>

                  <div
                    style={
                      styles.regRow
                    }
                  >
                    🔖 {v.VehicleReg}
                  </div>

                  <div
                    style={
                      styles.iconButtonRow
                    }
                  >
                    <button
                      style={
                        styles.iconButton
                      }
                      onClick={() =>
                        navigate(
                          `/location/veh-location-screen/${v.VehicleReg}`
                        )
                      }
                    >
                      📍 Fence
                    </button>

                    <button
                      style={
                        styles.iconButton
                      }
                      onClick={() =>
                        navigate(
                          `/schedule/veh-schedule-screen/${v.VehicleReg}`
                        )
                      }
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
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f0f1a",
    fontFamily:
      "'Segoe UI', sans-serif",
  },

  /* MOBILE HEADER */
  mobileHeader: {
    display: "none",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1200,
    background: "#111827",
    padding: "16px 18px",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
  },

  mobileLogo: {
    color: "#fff",
    fontWeight: "700",
    fontSize: "18px",
  },

  menuBtn: {
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "26px",
    cursor: "pointer",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },

  /* SIDEBAR */
  sidebar: {
    width: 240,
    background:
      "rgba(255,255,255,0.03)",
    borderRight:
      "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    position: "sticky",
    top: 0,
    height: "100vh",
    zIndex: 1000,
    transition: "0.3s ease",
  },

  sidebarMobileOpen: {
    transform: "translateX(0)",
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
    padding: "12px 16px",
    borderRadius: 10,
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    cursor: "pointer",
    marginBottom: 6,
    transition: "0.2s",
  },

  navItemActive: {
    background:
      "rgba(34,197,94,0.15)",
    color: "#4ade80",
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
    width: 38,
    height: 38,
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
  },

  userName: {
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
  },

  userRole: {
    color:
      "rgba(255,255,255,0.4)",
    fontSize: 12,
  },

  logoutBtn: {
    width: "100%",
    padding: "10px",
    borderRadius: 8,
    border:
      "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color:
      "rgba(255,255,255,0.6)",
    cursor: "pointer",
  },

  /* MAIN */
  main: {
    flex: 1,
    padding: "32px",
    overflowY: "auto",
  },

  topBar: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: 32,
  },

  pageTitle: {
    color: "#fff",
    margin: 0,
    fontSize: "32px",
    fontWeight: 700,
  },

  pageSub: {
    color:
      "rgba(255,255,255,0.5)",
    marginTop: 6,
  },

  primaryBtn: {
    padding: "12px 22px",
    borderRadius: 12,
    border: "none",
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },

  /* GRID */
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(280px,1fr))",
    gap: 24,
  },

  card: {
    background:
      "rgba(255,255,255,0.05)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    overflow: "hidden",
    backdropFilter: "blur(10px)",
    transition: "0.2s ease",
  },

  cardMedia: {
    width: "100%",
    height: 220,
    objectFit: "cover",
  },

  cardBody: {
    padding: 18,
  },

  cardTop: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
  },

  cardTitle: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 20,
  },

  typeBadge: {
    padding: "6px 12px",
    borderRadius: 999,
    background:
      "rgba(34,197,94,0.15)",
    color: "#4ade80",
    fontSize: 12,
    fontWeight: 600,
  },

  regRow: {
    color:
      "rgba(255,255,255,0.55)",
    marginBottom: 18,
    fontSize: 14,
  },

  iconButtonRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  iconButton: {
    flex: 1,
    minWidth: 120,
    padding: "13px 16px",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
  },

  /* MODAL */
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(0,0,0,0.7)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: 20,
  },

  modal: {
    background: "#1a1a2e",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90vh",
    overflowY: "auto",
  },

  modalHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    color: "#fff",
    margin: 0,
  },

  closeBtn: {
    background: "none",
    border: "none",
    color:
      "rgba(255,255,255,0.6)",
    fontSize: 20,
    cursor: "pointer",
  },

  label: {
    display: "block",
    color:
      "rgba(255,255,255,0.7)",
    marginBottom: 8,
    marginTop: 14,
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border:
      "1px solid rgba(255,255,255,0.1)",
    background:
      "rgba(255,255,255,0.06)",
    color: "#fff",
    outline: "none",
    boxSizing: "border-box",
  },

  fileLabel: {
    display: "block",
    border:
      "2px dashed rgba(255,255,255,0.15)",
    borderRadius: 14,
    overflow: "hidden",
    cursor: "pointer",
    marginTop: 10,
  },

  filePlaceholder: {
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },

  mediaPreview: {
    width: "100%",
    maxHeight: 240,
    objectFit: "cover",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
    flexWrap: "wrap",
  },

  cancelBtn: {
    padding: "12px 18px",
    borderRadius: 10,
    border:
      "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color:
      "rgba(255,255,255,0.6)",
    cursor: "pointer",
  },

  errorBox: {
    background:
      "rgba(255,80,80,0.12)",
    border:
      "1px solid rgba(255,80,80,0.3)",
    color: "#ff6b6b",
    padding: "12px 14px",
    borderRadius: 10,
    marginBottom: 12,
  },

  /* LOADER */
  center: {
    display: "flex",
    justifyContent: "center",
    padding: "80px 0",
  },

  spinner: {
    width: 42,
    height: 42,
    border:
      "4px solid rgba(255,255,255,0.1)",
    borderTop:
      "4px solid #22c55e",
    borderRadius: "50%",
    animation:
      "spin 0.8s linear infinite",
  },

  empty: {
    textAlign: "center",
    padding: "100px 20px",
  },

  emptyText: {
    color:
      "rgba(255,255,255,0.5)",
    marginTop: 12,
  },

  /* RESPONSIVE */
  "@media (max-width: 900px)": {},

  "@media (max-width: 768px)": {},
};

/* RESPONSIVE CSS */
if (window.innerWidth <= 768) {
  styles.mobileHeader.display = "flex";

  styles.sidebar = {
    ...styles.sidebar,
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    transform: "translateX(-100%)",
    background: "#111827",
  };

  styles.main = {
    ...styles.main,
    padding: "90px 16px 24px",
  };

  styles.topBar = {
    ...styles.topBar,
    flexDirection: "column",
    alignItems: "flex-start",
  };

  styles.pageTitle.fontSize = "28px";

  styles.grid.gridTemplateColumns =
    "1fr";

  styles.cardMedia.height = 200;

  styles.iconButtonRow.flexDirection =
    "column";
}

export default DriverDashboard;