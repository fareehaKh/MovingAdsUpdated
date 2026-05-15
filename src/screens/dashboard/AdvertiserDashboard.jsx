////////////////////////////////////   RESPONSIVE   //////////////////////////////////

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserSession, clearUserSession } from "../../utils/session";
import { createAdApi, getAdsByUserApi } from "../../api/authapi";

// ─── Cloudinary config ────────────────────────────────────────────
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

  if (!res.ok) throw new Error("Cloudinary upload failed");

  const data = await res.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
};

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Food & Beverage",
  "Automotive",
  "Real Estate",
  "Services",
  "Entertainment",
  "Other",
];

const AdvertiserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUserSession();

  const isMobile = window.innerWidth <= 768;

  const [ads, setAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    adTitle: "",
    category: "",
    startingDate: "",
    endingDate: "",
  });

  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    fetchAds();
  }, []);

  // ───────────────── FETCH ADS ─────────────────
  const fetchAds = async () => {
    setLoadingAds(true);

    try {
      const res = await getAdsByUserApi(user.UserId);
      setAds(res.data || []);
    } catch (err) {
      console.log(err);
      setAds([]);
    } finally {
      setLoadingAds(false);
    }
  };

  // ───────────────── FILE CHANGE ─────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  // ───────────────── SUBMIT ─────────────────
  const handleSubmit = async () => {
    setFormError("");

    if (
      !form.adTitle ||
      !form.category ||
      !form.startingDate ||
      !form.endingDate ||
      !mediaFile
    ) {
      setFormError("All fields are required.");
      return;
    }

    setSubmitting(true);

    try {
      // upload image/video
      const uploaded = await uploadToCloudinary(mediaFile);

      // create ad
      await createAdApi({
        AdTitle: form.adTitle,
        Category: form.category,
        StartingDate: form.startingDate,
        EndingDate: form.endingDate,
        UserId: user.UserId,
        Status: "inactive",

        MediaPath: uploaded.url,
        MediaName: mediaFile.name,
        MediaType: mediaFile.type,
      });

      // reset
      setShowForm(false);

      setForm({
        adTitle: "",
        category: "",
        startingDate: "",
        endingDate: "",
      });

      setMediaFile(null);
      setMediaPreview(null);

      fetchAds();
    } catch (err) {
      console.log(err);
      setFormError("Failed to post ad.");
    } finally {
      setSubmitting(false);
    }
  };

  // ───────────────── LOGOUT ─────────────────
  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  // ───────────────── ACTIVE SIDEBAR ─────────────────
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  // ───────────────── STATUS COLOR ─────────────────
  const statusColor = (s) => {
    if (s?.toLowerCase() === "approved") return "#22c55e";
    if (s?.toLowerCase() === "rejected") return "#ef4444";
    return "#f59e0b";
  };

  return (
    <div
      style={{
        ...styles.page,
        flexDirection: isMobile ? "column" : "row",
      }}
    >
      {/* ───────────────── SIDEBAR ───────────────── */}
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
          <span>📢</span>
          <span style={styles.logoText}>MovingAds</span>
        </div>

        {/* NAV */}
        <nav style={styles.nav}>
          <div
            style={{
              ...styles.navItem,
              ...(location.pathname === "/advertiser"
                ? styles.navItemActive
                : {}),
            }}
            onClick={() => navigate("/advertiser")}
          >
            📊 Dashboard
          </div>

          <div
            style={{
              ...styles.navItem,
              ...(isActive("/sent-requests")
                ? styles.navItemActive
                : {}),
            }}
            onClick={() => navigate("/advertiser/sent-requests")}
          >
            📩 Sent Requests
          </div>

          <div
            style={{
              ...styles.navItem,
              ...(isActive("/ad-stats")
                ? styles.navItemActive
                : {}),
            }}
            onClick={() => navigate("/advertiser/ad-stats")}
          >
            📈 Ad Stats
          </div>

          <div
            style={{
              ...styles.navItem,
              ...(isActive("/ad-billing")
                ? styles.navItemActive
                : {}),
            }}
            onClick={() => navigate("/advertiser/ad-billing")}
          >
             Ad Billings
          </div>
        </nav>

        {/* FOOTER */}
        <div style={styles.sidebarFooter}>
          <div style={styles.userBox}>
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
            style={styles.logout}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ───────────────── MAIN ───────────────── */}
      <main
        style={{
          ...styles.main,
          padding: isMobile ? 14 : 20,
        }}
      >
        {/* TOPBAR */}
        <div
          style={{
            ...styles.topBar,
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? 12 : 0,
          }}
        >
          <div>
            <h1 style={styles.title}>My Ads</h1>
            <p style={styles.sub}>
              Manage your campaigns
            </p>
          </div>

          <button
            style={{
              ...styles.primaryBtn,
              width: isMobile ? "100%" : "auto",
            }}
            onClick={() => setShowForm(true)}
          >
            + Post Ad
          </button>
        </div>

        {/* ───────────────── CREATE AD FORM ───────────────── */}
        {showForm && (
          <div style={styles.formOverlay}>
            <div
              style={{
                ...styles.formCard,
                width: isMobile ? "92%" : 420,
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Create New Ad
              </h2>

              {formError && (
                <div style={styles.error}>
                  {formError}
                </div>
              )}

              {/* TITLE */}
              <input
                type="text"
                placeholder="Ad Title"
                value={form.adTitle}
                onChange={(e) =>
                  setForm({
                    ...form,
                    adTitle: e.target.value,
                  })
                }
                style={styles.input}
              />

              {/* CATEGORY */}
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value,
                  })
                }
                style={styles.input}
              >
                <option value="">
                  Select Category
                </option>

                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* START DATE */}
              <input
                type="date"
                value={form.startingDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startingDate: e.target.value,
                  })
                }
                style={styles.input}
              />

              {/* END DATE */}
              <input
                type="date"
                value={form.endingDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endingDate: e.target.value,
                  })
                }
                style={styles.input}
              />

              {/* FILE */}
              <input
                type="file"
                onChange={handleFileChange}
                style={styles.input}
              />

              {/* PREVIEW */}
              {mediaPreview && (
                <img
                  src={mediaPreview}
                  alt="preview"
                  style={styles.preview}
                />
              )}

              {/* ACTIONS */}
              <div style={styles.formActions}>
                <button
                  style={styles.submitBtn}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting
                    ? "Posting..."
                    : "Post Ad"}
                </button>

                <button
                  style={styles.cancelBtn}
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────── ADS ───────────────── */}
        {loadingAds ? (
          <p style={{ color: "#aaa" }}>
            Loading...
          </p>
        ) : ads.length === 0 ? (
          <p style={{ color: "#777" }}>
            No ads found.
          </p>
        ) : (
          <div style={styles.grid}>
            {ads.map((ad) => (
              <div
                key={ad.AdId}
                style={styles.card}
              >
                <img
                  src={ad.MediaPath}
                  alt="ad"
                  style={styles.image}
                />

                <div style={styles.cardBody}>
                  <h3 style={styles.adTitle}>
                    {ad.AdTitle}
                  </h3>

                  <div style={styles.badges}>
                    <span style={styles.category}>
                      {ad.Category}
                    </span>

                    <span
                      style={{
                        ...styles.status,
                        color: statusColor(ad.Status),
                      }}
                    >
                      {ad.Status}
                    </span>
                  </div>

                  {/* ACTIONS */}
                  <div style={styles.actions}>
                    <button
                      style={styles.btn}
                      onClick={() =>
                        navigate(
                          `/location/ad-location-screen/${ad.AdId}`
                        )
                      }
                    >
                      📍 Fence
                    </button>

                    <button
                      style={styles.btn}
                      onClick={() =>
                        navigate(
                          `/schedule/ad-schedule-screen/${ad.AdId}`
                        )
                      }
                    >
                      🗓 Schedule
                    </button>
                  </div>

                  <button
                    style={styles.fullBtn}
                    onClick={() =>
                      navigate(
                        `/advertiser/find-agencies/${ad.AdId}`
                      )
                    }
                  >
                    Find Agencies
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdvertiserDashboard;

/* ───────────────── STYLES ───────────────── */

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f0f1a",
    color: "#fff",
    fontFamily: "Segoe UI",
  },

  // SIDEBAR
  sidebar: {
    background: "rgba(255,255,255,0.03)",
    display: "flex",
    flexDirection: "column",
    padding: "20px 0",
  },

  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 18px",
    marginBottom: 25,
    fontWeight: 700,
  },

  logoText: {
    fontSize: 16,
  },

  nav: {
    flex: 1,
    padding: "0 10px",
  },

  navItem: {
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginBottom: 6,
    transition: "0.2s",
  },

  navItemActive: {
    background: "rgba(167,139,250,0.18)",
    color: "#a78bfa",
  },

  sidebarFooter: {
    padding: "12px 16px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
  },

  userBox: {
    display: "flex",
    gap: 10,
    marginBottom: 10,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#7c5cff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 700,
  },

  userName: {
    fontSize: 13,
  },

  userRole: {
    fontSize: 11,
    opacity: 0.5,
  },

  logout: {
    width: "100%",
    padding: 8,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#aaa",
    borderRadius: 8,
    cursor: "pointer",
  },

  // MAIN
  main: {
    flex: 1,
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  title: {
    margin: 0,
    fontSize: 24,
  },

  sub: {
    opacity: 0.5,
    fontSize: 13,
    marginTop: 4,
  },

  primaryBtn: {
    background: "#7c5cff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 10,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },

  // GRID
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(260px,1fr))",
    gap: 14,
  },

  // CARD
  card: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  image: {
    width: "100%",
    height: 160,
    objectFit: "cover",
  },

  cardBody: {
    padding: 12,
  },

  adTitle: {
    fontSize: 15,
    margin: 0,
    marginBottom: 10,
  },

  badges: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },

  category: {
    fontSize: 11,
    background: "#7c5cff33",
    padding: "3px 8px",
    borderRadius: 20,
  },

  status: {
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 20,
    textTransform: "capitalize",
  },

  actions: {
    display: "flex",
    gap: 8,
  },

  btn: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
  },

  fullBtn: {
    marginTop: 10,
    width: "100%",
    padding: 10,
    background: "#7c5cff",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    cursor: "pointer",
  },

  // FORM
  formOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    padding: 12,
  },

  formCard: {
    background: "#171717",
    borderRadius: 16,
    padding: 20,
    border: "1px solid rgba(255,255,255,0.08)",
  },

  input: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0f0f1a",
    color: "#fff",
    outline: "none",
    marginTop: 12,
    boxSizing: "border-box",
  },

  preview: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    borderRadius: 10,
    marginTop: 14,
  },

  formActions: {
    display: "flex",
    gap: 10,
    marginTop: 16,
  },

  submitBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#7c5cff",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },

  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
  },

  error: {
    background: "rgba(239,68,68,0.15)",
    color: "#ef4444",
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 10,
  },
};