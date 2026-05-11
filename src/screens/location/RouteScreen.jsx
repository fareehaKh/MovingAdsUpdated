import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserSession } from "../../utils/session";
import { saveAdFenceApi } from "../../api/authapi";

const TABS = ["polygon", "route"];

const RouteScreen = () => {
  const navigate = useNavigate();
  const user = getUserSession();
  const { adId } = useParams();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // --- Polygon state ---
  const polygonRef = useRef(null);
  const polygonMarkersRef = useRef([]);
  const [polygonPoints, setPolygonPoints] = useState([]);

  // --- Route state ---
  const polylineRef = useRef(null);
  const routeMarkersRef = useRef([]);
  const [routePoints, setRoutePoints] = useState([]);

  // --- Shared ---
  const [label, setLabel] = useState("");
  const [activeTab, setActiveTab] = useState("polygon");
  const activeTabRef = useRef("polygon");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    if (!adId) {
      alert("Ad ID not found");
      navigate(-1);
      return;
    }
    loadGoogleMap();
  }, []);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const loadGoogleMap = () => {
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }
    const existingScript = document.getElementById("googleMapsScript");
    if (existingScript) {
      existingScript.onload = initializeMap;
      return;
    }
    const script = document.createElement("script");
    script.id = "googleMapsScript";
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyD_tyUWEaa3u0V8SVlHwKtl9f1eppf8dD4";
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    document.body.appendChild(script);
  };

  const initializeMap = () => {
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 31.5204, lng: 74.3587 },
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstance.current.addListener("click", (event) => {
      if (activeTabRef.current === "polygon") {
        addPolygonPoint(event.latLng);
      } else {
        addRoutePoint(event.latLng);
      }
    });
  };

  // ─── POLYGON ────────────────────────────────────────────

  const addPolygonPoint = (latLng) => {
    const newPoint = { lat: latLng.lat(), lng: latLng.lng() };
    setPolygonPoints((prev) => {
      const updated = [...prev, newPoint];
      const marker = new window.google.maps.Marker({
        position: newPoint,
        map: mapInstance.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#22c55e",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });
      polygonMarkersRef.current.push(marker);
      drawPolygon(updated);
      return updated;
    });
  };

  const drawPolygon = (pts) => {
    if (polygonRef.current) polygonRef.current.setMap(null);
    if (pts.length < 3) return;
    polygonRef.current = new window.google.maps.Polygon({
      paths: pts,
      strokeColor: "#22c55e",
      strokeOpacity: 1,
      strokeWeight: 2,
      fillColor: "#22c55e",
      fillOpacity: 0.25,
    });
    polygonRef.current.setMap(mapInstance.current);
  };

  const clearPolygon = () => {
    polygonMarkersRef.current.forEach((m) => m.setMap(null));
    polygonMarkersRef.current = [];
    if (polygonRef.current) polygonRef.current.setMap(null);
    polygonRef.current = null;
    setPolygonPoints([]);
  };

  // ─── ROUTE ──────────────────────────────────────────────

  const addRoutePoint = (latLng) => {
    const newPoint = { lat: latLng.lat(), lng: latLng.lng() };
    setRoutePoints((prev) => {
      const updated = [...prev, newPoint];
      const marker = new window.google.maps.Marker({
        position: newPoint,
        map: mapInstance.current,
        label: {
          text: String(updated.length),
          color: "#fff",
          fontWeight: "bold",
          fontSize: "12px",
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });
      routeMarkersRef.current.push(marker);
      drawPolyline(updated);
      return updated;
    });
  };

  const drawPolyline = (pts) => {
    if (polylineRef.current) polylineRef.current.setMap(null);
    if (pts.length < 2) return;
    polylineRef.current = new window.google.maps.Polyline({
      path: pts,
      strokeColor: "#3b82f6",
      strokeOpacity: 1,
      strokeWeight: 3,
      icons: [
        {
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 4,
            strokeColor: "#fff",
          },
          offset: "50%",
          repeat: "120px",
        },
      ],
    });
    polylineRef.current.setMap(mapInstance.current);
  };

  const clearRoute = () => {
    routeMarkersRef.current.forEach((m) => m.setMap(null));
    routeMarkersRef.current = [];
    if (polylineRef.current) polylineRef.current.setMap(null);
    polylineRef.current = null;
    setRoutePoints([]);
  };

  // ─── SHARED SAVE ────────────────────────────────────────

  const handleSave = async () => {
    if (polygonPoints.length < 3) {
      alert("Please select at least 3 points for the fence (Polygon tab)");
      setActiveTab("polygon");
      return;
    }
    if (routePoints.length < 2) {
      alert("Please select at least 2 points for the route (Route tab)");
      setActiveTab("route");
      return;
    }
    if (!label.trim()) {
      alert("Please enter a label");
      return;
    }

    try {
      const payload = {
        AdId: parseInt(adId),
        Polygon: JSON.stringify(polygonPoints),
        Route: JSON.stringify(routePoints),
        Label: label.trim(),
      };

      console.log("Saving Ad Route & Fence:", payload);

      await saveAdRouteAndFenceApi(payload);

      alert("Ad Route & Fence saved successfully!");
      navigate(-1);
    } catch (error) {
      console.log(error);
      alert("Failed to save");
    }
  };

  const handleClear = () => {
    if (activeTab === "polygon") clearPolygon();
    else clearRoute();
  };

  // ─── RENDER ─────────────────────────────────────────────

  const isPolygon = activeTab === "polygon";
  const polygonReady = polygonPoints.length >= 3;
  const routeReady = routePoints.length >= 2;
  const bothReady = polygonReady && routeReady && label.trim();

  return (
    <div style={styles.page}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>📢 MovingAds</div>
        <div style={styles.nav}>
          <div
            style={{
              ...styles.navItem,
              ...(isPolygon ? styles.activeNavPolygon : {}),
            }}
            onClick={() => setActiveTab("polygon")}
          >
            📍 Ad Fence
          </div>
          <div
            style={{
              ...styles.navItem,
              ...(!isPolygon ? styles.activeNavRoute : {}),
            }}
            onClick={() => setActiveTab("route")}
          >
            🛣️ Ad Route
          </div>
        </div>

        {/* Progress indicators in sidebar */}
        <div style={styles.sidebarProgress}>
          <p style={styles.progressTitle}>Progress</p>
          <div style={styles.progressItem}>
            <span style={styles.progressDot(polygonReady ? "green" : "dim")} />
            <span style={styles.progressText}>
              Fence: {polygonPoints.length}/3 pts {polygonReady ? "✓" : ""}
            </span>
          </div>
          <div style={styles.progressItem}>
            <span style={styles.progressDot(routeReady ? "blue" : "dim")} />
            <span style={styles.progressText}>
              Route: {routePoints.length}/2 pts {routeReady ? "✓" : ""}
            </span>
          </div>
          <div style={styles.progressItem}>
            <span style={styles.progressDot(label.trim() ? "purple" : "dim")} />
            <span style={styles.progressText}>
              Label: {label.trim() ? "✓" : "required"}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={styles.main}>
        <div style={styles.card}>
          {/* Header */}
          <h2 style={styles.title}>
            {isPolygon ? "📍 Advertisement Fence" : "🛣️ Advertisement Route"}
          </h2>
          <p style={styles.subTitle}>
            {isPolygon
              ? "Click on the map to create a fence (min 3 points), then switch to Route tab to add route points"
              : "Click on the map to define a route (min 2 points)"}
          </p>
          <p style={styles.adIdText}>
            Ad ID: <strong>{adId}</strong>
          </p>

          {/* TABS */}
          <div style={styles.tabRow}>
            {TABS.map((tab) => (
              <button
                key={tab}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab
                    ? tab === "polygon"
                      ? styles.tabActivePolygon
                      : styles.tabActiveRoute
                    : {}),
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "polygon"
                  ? `📍 Polygon Fence ${polygonReady ? "✓" : `(${polygonPoints.length}/3)`}`
                  : `🛣️ Route ${routeReady ? "✓" : `(${routePoints.length}/2)`}`}
              </button>
            ))}
          </div>

          {/* Shared label */}
          <div style={styles.inputWrap}>
            <input
              type="text"
              placeholder="Enter label for this ad placement"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Map */}
          <div ref={mapRef} style={styles.map} />

          {/* Info bar */}
          <div style={styles.infoBar}>
            <div style={styles.infoChip(isPolygon ? "green" : "blue")}>
              {isPolygon ? "🟢 Drawing Fence" : "🔵 Drawing Route"} — click map to add points
            </div>
            <div style={styles.infoPoints}>
              {isPolygon
                ? `${polygonPoints.length} point${polygonPoints.length !== 1 ? "s" : ""} selected`
                : `${routePoints.length} point${routePoints.length !== 1 ? "s" : ""} selected`}
            </div>
          </div>

          {/* Buttons */}
          <div style={styles.buttonRow}>
            <button style={styles.clearBtn} onClick={handleClear}>
              Clear {isPolygon ? "Fence" : "Route"}
            </button>

            <button
              style={{
                ...styles.saveBtn,
                opacity: bothReady ? 1 : 0.45,
                cursor: bothReady ? "pointer" : "not-allowed",
              }}
              onClick={handleSave}
              disabled={!bothReady}
            >
              {bothReady
                ? "💾 Save Fence & Route"
                : `Needs: ${!polygonReady ? `fence (${polygonPoints.length}/3)` : ""}${!polygonReady && !routeReady ? " + " : ""}${!routeReady ? `route (${routePoints.length}/2)` : ""}${(polygonReady && routeReady && !label.trim()) ? "label" : ""}`}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RouteScreen;

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f0f1a",
    fontFamily: "'Segoe UI', sans-serif",
  },

  sidebar: {
    width: 240,
    background: "rgba(255,255,255,0.03)",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    padding: "24px 0",
    display: "flex",
    flexDirection: "column",
  },

  sidebarLogo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: 700,
    padding: "0 24px",
    marginBottom: 30,
  },

  nav: {
    padding: "0 12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  navItem: {
    padding: "14px 16px",
    borderRadius: 12,
    color: "rgba(255,255,255,0.5)",
    fontWeight: 600,
    cursor: "pointer",
  },

  activeNavPolygon: {
    background: "rgba(34,197,94,0.15)",
    color: "#4ade80",
  },

  activeNavRoute: {
    background: "rgba(59,130,246,0.15)",
    color: "#60a5fa",
  },

  sidebarProgress: {
    marginTop: "auto",
    padding: "20px 24px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  progressTitle: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    margin: 0,
    marginBottom: 4,
  },

  progressItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  progressDot: (color) => ({
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
    background:
      color === "green"
        ? "#22c55e"
        : color === "blue"
        ? "#3b82f6"
        : color === "purple"
        ? "#a78bfa"
        : "rgba(255,255,255,0.15)",
  }),

  progressText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },

  main: {
    flex: 1,
    padding: 30,
  },

  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 24,
  },

  title: {
    color: "#fff",
    margin: 0,
    marginBottom: 8,
  },

  subTitle: {
    color: "rgba(255,255,255,0.6)",
    marginBottom: 10,
  },

  adIdText: {
    color: "#60a5fa",
    marginBottom: 20,
    fontWeight: 600,
  },

  tabRow: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },

  tab: {
    flex: 1,
    padding: "12px 0",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.5)",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },

  tabActivePolygon: {
    background: "rgba(34,197,94,0.15)",
    border: "1px solid rgba(34,197,94,0.4)",
    color: "#4ade80",
  },

  tabActiveRoute: {
    background: "rgba(59,130,246,0.15)",
    border: "1px solid rgba(59,130,246,0.4)",
    color: "#60a5fa",
  },

  inputWrap: {
    marginBottom: 20,
  },

  input: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#111827",
    color: "#fff",
    outline: "none",
    boxSizing: "border-box",
  },

  map: {
    width: "100%",
    height: 500,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },

  infoBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  infoChip: (color) => ({
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    background:
      color === "green" ? "rgba(34,197,94,0.1)" : "rgba(59,130,246,0.1)",
    color: color === "green" ? "#4ade80" : "#60a5fa",
    border: `1px solid ${
      color === "green" ? "rgba(34,197,94,0.25)" : "rgba(59,130,246,0.25)"
    }`,
  }),

  infoPoints: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },

  buttonRow: {
    display: "flex",
    gap: 14,
  },

  clearBtn: {
    flex: 1,
    padding: 14,
    border: "none",
    borderRadius: 12,
    background: "#ef4444",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },

  saveBtn: {
    flex: 2,
    padding: 14,
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(135deg,#6366f1,#4f46e5)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    transition: "opacity 0.2s",
  },
};