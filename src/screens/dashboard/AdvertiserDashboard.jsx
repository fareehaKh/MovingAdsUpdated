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
    { method: "POST", body: fd }
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

  const fetchAds = async () => {
    setLoadingAds(true);
    try {
      const res = await getAdsByUserApi(user.UserId);
      setAds(res.data || []);
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
      const uploaded = await uploadToCloudinary(mediaFile);

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
      setFormError("Failed to post ad.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  const isActive = (path) => location.pathname.includes(path);

  const statusColor = (s) => {
    if (s === "approved") return "#22c55e";
    if (s === "rejected") return "#ef4444";
    return "#f59e0b";
  };

  return (
    <div style={styles.page}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <span>📢</span>
          <span style={styles.logoText}>MovingAds</span>
        </div>

        <nav style={styles.nav}>
          <div
            style={{
              ...styles.navItem,
              ...(isActive("/advertiser") && styles.navItemActive),
            }}
            onClick={() => navigate("/advertiser")}
          >
            📊 Dashboard
          </div>

          <div
            style={{
              ...styles.navItem,
              ...(isActive("/sent-requests") && styles.navItemActive),
            }}
            onClick={() => navigate("/advertiser/sent-requests")}
          >
            📩 Sent Requests
          </div>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userBox}>
            <div style={styles.avatar}>
              {user?.Name?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <div style={styles.userName}>{user?.Name}</div>
              <div style={styles.userRole}>Advertiser</div>
            </div>
          </div>

          <button style={styles.logout} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={styles.main}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>My Ads</h1>
            <p style={styles.sub}>Manage your campaigns</p>
          </div>

          <button style={styles.primaryBtn} onClick={() => setShowForm(true)}>
            + Post Ad
          </button>
        </div>

        {/* ADS */}
        {loadingAds ? (
          <p style={{ color: "#aaa" }}>Loading...</p>
        ) : (
          <div style={styles.grid}>
            {ads.map((ad) => (
              <div key={ad.AdId} style={styles.card}>
                <img src={ad.MediaPath} style={styles.image} />

                <div style={styles.cardBody}>
                  <h3 style={styles.adTitle}>{ad.AdTitle}</h3>

                  <div style={styles.badges}>
                    <span style={styles.category}>{ad.Category}</span>
                    <span
                      style={{
                        ...styles.status,
                        color: statusColor(ad.Status),
                      }}
                    >
                      {ad.Status}
                    </span>
                  </div>

                  <div style={styles.actions}>
                    <button
                      style={styles.btn}
                      onClick={() =>
                        navigate(`/location/ad-location-screen/${ad.AdId}`)
                      }
                    >
                      📍 Fence
                    </button>

                    <button
                      style={styles.btn}
                      onClick={() =>
                        navigate(`/schedule/ad-schedule-screen/${ad.AdId}`)
                      }
                    >
                      🗓 Schedule
                    </button>
                  </div>

                  <button
                    style={styles.fullBtn}
                    onClick={() =>
                      navigate(`/advertiser/find-agencies/${ad.AdId}`)
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

  /* SIDEBAR (MATCH SENT REQUESTS STYLE) */
  sidebar: {
    width: 240,
    background: "rgba(255,255,255,0.03)",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column",
    padding: "20px 0",
  },

  sidebarLogo: {
    display: "flex",
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
  },

  userName: { fontSize: 13 },
  userRole: { fontSize: 11, opacity: 0.5 },

  logout: {
    width: "100%",
    padding: "8px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#aaa",
    borderRadius: 8,
    cursor: "pointer",
  },

  /* MAIN */
  main: {
    flex: 1,
    padding: 20,
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  title: { fontSize: 22 },
  sub: { opacity: 0.5, fontSize: 13 },

  primaryBtn: {
    background: "#7c5cff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 10,
    color: "#fff",
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
  },

  card: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: 150,
    objectFit: "cover",
  },

  cardBody: {
    padding: 12,
  },

  adTitle: { fontSize: 15 },

  badges: {
    display: "flex",
    gap: 8,
    margin: "8px 0",
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
  },

  actions: {
    display: "flex",
    gap: 8,
    marginTop: 10,
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
};