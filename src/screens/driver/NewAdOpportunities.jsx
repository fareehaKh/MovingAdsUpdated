import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllAdsApi } from "../../api/authapi";

const NewAdOpportunities = () => {
  const navigate = useNavigate();

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const res = await getAllAdsApi();
      setAds(res.data || []);
    } catch (error) {
      console.log("Error fetching ads:", error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status) => {
    if (status === "active") return "#22c55e";
    if (status === "pending") return "#f59e0b";
    if (status === "completed") return "#3b82f6";
    return "#94a3b8";
  };

  return (
    <div style={styles.page}>
      {/* ================= Sidebar ================= */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <span style={{ fontSize: 22 }}>🚗</span>
          <span style={styles.sidebarLogoText}>MovingAds</span>
        </div>

        <nav style={styles.nav}>
          <div
            style={styles.navItem}
            onClick={() => navigate("/driver")}
          >
            🚘 My Vehicles
          </div>

          <div
            style={{ ...styles.navItem, ...styles.navItemActive }}
            onClick={() => navigate("/driver/new-ad-opportunities")}
          >
            📢 New Ad Opportunities
          </div>

          <div style={styles.navItem} onClick={() => navigate("/driver/requests-to-driver")}>📩 Your Requests</div>

          <div
            style={{ ...styles.navItem }}
            onClick={() => navigate(`/driver/ad-simulation`) }
          >
            AD Simulation
          </div>

        </nav>
      </aside>

      {/* ================= Main Content ================= */}
      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.title}>New Ad Opportunities</h1>
          <p style={styles.subTitle}>
            Browse all available advertisement campaigns
          </p>
        </div>

        {loading ? (
          <div style={styles.center}>
            <p style={{ color: "#fff" }}>Loading ads...</p>
          </div>
        ) : ads.length === 0 ? (
          <div style={styles.center}>
            <p style={{ color: "#fff" }}>No ads available</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {ads.map((ad) => (
              <div key={ad.AdId} style={styles.card}>
                {ad.MediaPath &&
                  (ad.MediaType?.startsWith("video") ? (
                    <video
                      src={ad.MediaPath}
                      controls
                      style={styles.cardMedia}
                    />
                  ) : (
                    <img
                      src={ad.MediaPath}
                      alt={ad.AdTitle}
                      style={styles.cardMedia}
                    />
                  ))}

                <div style={styles.cardBody}>
                  <div style={styles.cardTitle}>
                    {ad.AdTitle || "Untitled Ad"}
                  </div>

                  <div style={styles.cardMeta}>
                    <span style={styles.categoryBadge}>
                      {ad.Category || "General"}
                    </span>

                    <span
                      style={{
                        ...styles.statusBadge,
                        background: statusColor(ad.Status) + "22",
                        color: statusColor(ad.Status),
                      }}
                    >
                      {ad.Status || "pending"}
                    </span>
                  </div>

                  <div style={styles.infoRow}>
                    👤 Advertiser: {ad.UserName || "Unknown"}
                  </div>

                  <div style={styles.infoRow}>
                    📅 Start:{" "}
                    {ad.StartingDate
                      ? new Date(ad.StartingDate).toLocaleDateString()
                      : "—"}
                  </div>

                  <div style={styles.infoRow}>
                    🏁 End:{" "}
                    {ad.EndingDate
                      ? new Date(ad.EndingDate).toLocaleDateString()
                      : "—"}
                  </div>

                  {/* <button
                    style={styles.applyBtn}
                    onClick={() =>
                      navigate(`/driver/ad-details/${ad.AdId}`)
                    }
                  >
                    View Details
                  </button> */}
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
    fontFamily: "'Segoe UI', sans-serif",
  },

  /* ================= Sidebar ================= */

  sidebar: {
    width: "250px",
    minWidth: "250px",
    height: "100vh",
    background: "#111827",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    position: "sticky",
    top: 0,
    left: 0,
  },

  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 24px",
    marginBottom: "32px",
  },

  sidebarLogoText: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    padding: "0 14px",
    gap: "8px",
  },

  navItem: {
    padding: "14px 16px",
    borderRadius: "12px",
    color: "rgba(255,255,255,0.65)",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "0.2s ease",
  },

  navItemActive: {
    background: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    fontWeight: 700,
  },

  /* ================= Main ================= */

  main: {
    flex: 1,
    padding: "32px",
    overflowY: "auto",
  },

  header: {
    marginBottom: "28px",
  },

  title: {
    color: "#fff",
    fontSize: "28px",
    fontWeight: 700,
    margin: 0,
  },

  subTitle: {
    color: "rgba(255,255,255,0.5)",
    marginTop: "6px",
    fontSize: "14px",
  },

  center: {
    display: "flex",
    justifyContent: "center",
    padding: "80px 0",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "22px",
  },

  /* ================= Cards ================= */

  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    overflow: "hidden",
  },

  cardMedia: {
    width: "100%",
    height: "220px",
    objectFit: "cover",
    display: "block",
  },

  cardBody: {
    padding: "18px",
  },

  cardTitle: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "12px",
  },

  cardMeta: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },

  categoryBadge: {
    padding: "6px 12px",
    borderRadius: "30px",
    background: "rgba(59,130,246,0.15)",
    color: "#60a5fa",
    fontSize: "12px",
    fontWeight: 600,
  },

  statusBadge: {
    padding: "6px 12px",
    borderRadius: "30px",
    fontSize: "12px",
    fontWeight: 600,
  },

  infoRow: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "14px",
    marginBottom: "10px",
  },

  applyBtn: {
    width: "100%",
    marginTop: "14px",
    padding: "13px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
  },
};

export default NewAdOpportunities;