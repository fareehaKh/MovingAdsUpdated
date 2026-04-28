import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession, clearUserSession } from "../../utils/session";
import { createAdApi, getAdsByUserApi } from "../../api/authapi";


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
  return {
    url: data.secure_url,
    publicId: data.public_id,
    format: data.format,
    resourceType: data.resource_type,
  };
};
// ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["Electronics", "Fashion", "Food & Beverage", "Automotive", "Real Estate", "Services", "Entertainment", "Other"];

const AdvertiserDashboard = () => {
  const navigate = useNavigate();
  const user = getUserSession();

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
    if (!user) { navigate("/"); return; }
    fetchAds();
  }, []);

  const fetchAds = async () => {
  setLoadingAds(true);
  try {
    const res = await getAdsByUserApi(user.UserId);

    const adsData = res.data || [];
    setAds(adsData);

    // ✅ ALL AD IDS
    const allAdIds = adsData.map(ad => ad.AdID);

    console.log("ALL ADS:", adsData);
    console.log("ALL AD IDS:", allAdIds);

  } catch {
    setAds([]);
  } finally {
    setLoadingAds(false);
  }
};


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!form.adTitle || !form.category || !form.startingDate || !form.endingDate || !mediaFile) {
      setFormError("All fields and a media file are required.");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Upload to Cloudinary
      const uploaded = await uploadToCloudinary(mediaFile);

      // 2. Post ad to backend
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

      alert("Ad posted successfully!");
      setShowForm(false);
      setForm({ adTitle: "", category: "", startingDate: "", endingDate: "" });
      setMediaFile(null);
      setMediaPreview(null);
      fetchAds();
    } catch (err) {
      setFormError(err.response?.data?.Message || err.response?.data || err.message || "Failed to post ad.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  const statusColor = (s) => {
    if (s === "approved") return "#22c55e";
    if (s === "rejected") return "#ef4444";
    return "#f59e0b";
  };

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <span style={{ fontSize: 22 }}>📢</span>
          <span style={styles.sidebarLogoText}>MovingAds</span>
        </div>
        <nav style={styles.nav}>
          <div style={{ ...styles.navItem, ...styles.navItemActive }}>📋 My Ads</div>
          <div
            style={{ ...styles.navItem, ...styles.navItemActive }}
            onClick={() => navigate(`/advertiser/sent-requests`) }
          >
            Sent Requests
          </div>

        </nav>


        <div style={styles.sidebarFooter}>
          <div style={styles.userBadge}>
            <div style={styles.avatar}>{user?.Name?.[0]?.toUpperCase() || "A"}</div>
            <div>
              <div style={styles.userName}>{user?.Name}</div>
              <div style={styles.userRole}>Advertiser</div>
            </div>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>My Ads</h1>
            <p style={styles.pageSub}>Manage your advertising campaigns</p>
          </div>
          <button style={styles.primaryBtn} onClick={() => setShowForm(true)}>
            + Post New Ad
          </button>
        </div>

        {/* Post Ad Modal */}
        {showForm && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Post New Ad</h2>
                <button style={styles.closeBtn} onClick={() => { setShowForm(false); setFormError(""); }}>✕</button>
              </div>

              {formError && <div style={styles.errorBox}>{formError}</div>}

              <label style={styles.label}>Ad Title</label>
              <input
                style={styles.input}
                placeholder="e.g. Summer Sale 2025"
                value={form.adTitle}
                onChange={(e) => setForm({ ...form, adTitle: e.target.value })}
              />

              <label style={styles.label}>Category</label>
              <select
                style={styles.input}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <div style={styles.dateRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Start Date</label>
                  <input
                    style={styles.input}
                    type="date"
                    value={form.startingDate}
                    onChange={(e) => setForm({ ...form, startingDate: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>End Date</label>
                  <input
                    style={styles.input}
                    type="date"
                    value={form.endingDate}
                    onChange={(e) => setForm({ ...form, endingDate: e.target.value })}
                  />
                </div>
              </div>

              <label style={styles.label}>Ad Media (image/video)</label>
              <label style={styles.fileLabel}>
                <input type="file" accept="image/*,video/*" onChange={handleFileChange} style={{ display: "none" }} />
                {mediaPreview ? (
                  mediaFile?.type?.startsWith("video") ? (
                    <video src={mediaPreview} style={styles.mediaPreview} controls />
                  ) : (
                    <img src={mediaPreview} alt="preview" style={styles.mediaPreview} />
                  )
                ) : (
                  <div style={styles.filePlaceholder}>
                    <span style={{ fontSize: 32 }}>📁</span>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Click to upload image or video</span>
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
                  {submitting ? "Uploading..." : "Post Ad"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ads Grid */}
        {loadingAds ? (
          <div style={styles.center}><div style={styles.spinner} /></div>
        ) : ads.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 48 }}>📢</div>
            <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 12 }}>No ads yet. Post your first ad!</p>
          </div>
        ) : (
          
          <div style={styles.grid}>
            {ads.map((ad) => (
              
              <div key={ad.AdId} style={styles.card}>
                {ad.MediaPath && (
                  ad.MediaType?.startsWith("video") ? (
                    <video src={ad.MediaPath} style={styles.cardMedia} controls />
                  ) : (
                    <img src={ad.MediaPath} alt={ad.AdTitle} style={styles.cardMedia} />
                  )
                )}

                <div style={styles.cardBody}>
                  <div style={styles.cardTitle}>{ad.AdTitle}</div>
                  <div style={styles.cardMeta}>
                    <span style={styles.categoryBadge}>{ad.Category}</span>
                    <span style={{ ...styles.statusBadge, background: statusColor(ad.Status) + "22", color: statusColor(ad.Status) }}>
                      {ad.Status || "inactive"}
                    </span>
                  </div>
                  <div style={styles.cardDates}>
                    📅 {ad.StartingDate ? new Date(ad.StartingDate).toLocaleDateString() : "—"} →{" "}
                    {ad.EndingDate ? new Date(ad.EndingDate).toLocaleDateString() : "—"}
                  </div>
                  <div style={styles.iconButtonRow}>

                    <button
                      style={styles.iconButton}
                      onClick={() => {
                        const selectedAdId = ad.AdId;
                        console.log("Selected Ad ID for Fence:", selectedAdId);
                        navigate(`/location/ad-location-screen/${selectedAdId}`);
                      }}
                    >
                      📍 Fence
                    </button>

                    <button
                      style={styles.iconButton}

                      onClick={() => {
                      const selectedAdId = ad.AdId;
                      console.log("Clicked Ad ID:", selectedAdId);
                      navigate(`/schedule/ad-schedule-screen/${selectedAdId}`);
                    }}
                    >
                      🗓 Schedule
                    </button>
                  </div>
                  <div style={styles.fullButtonRow}>
                    <button
                      style={styles.findDriversButton}
                      onClick={() => {
                        const selectedAdId = ad.AdId;
                        console.log("Clicked Ad ID:", selectedAdId);
                        navigate(`/advertiser/find-drivers/${selectedAdId}`)
                      }}
                    >
                      Find Drivers
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
  navItemActive: { background: "rgba(118,75,162,0.25)", color: "#a78bfa" },
  sidebarFooter: { padding: "0 16px", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20 },
  userBadge: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  avatar: {
    width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)",
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
    background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
  },
  modal: {
    background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20, padding: 32, width: "100%", maxWidth: 520,
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
  dateRow: { display: "flex", gap: 12 },
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
    borderTop: "3px solid #764ba2", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  empty: { textAlign: "center", padding: "80px 0", color: "#fff" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  card: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, overflow: "hidden",
  },
  cardMedia: { width: "100%", height: 160, objectFit: "cover", display: "block" },
  cardBody: { padding: "14px 16px" },
  cardTitle: { color: "#fff", fontWeight: 600, fontSize: 15, marginBottom: 8 },
  cardMeta: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  categoryBadge: {
    padding: "3px 10px", borderRadius: 20, background: "rgba(102,126,234,0.2)",
    color: "#818cf8", fontSize: 11, fontWeight: 600,
  },
  statusBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  cardDates: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
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

  fullButtonRow: {
    marginTop: "14px",
  },

  findDriversButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "#2563EB",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "0.2s ease",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
  },
};


export default AdvertiserDashboard;



