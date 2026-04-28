import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserSession } from "../../utils/session";
import { saveAdFenceApi } from "../../api/authapi";

const AdLocationScreen = () => {
  const navigate = useNavigate();
  const user = getUserSession();
  const { adId } = useParams();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polygonRef = useRef(null);
  const markersRef = useRef([]);

  const [points, setPoints] = useState([]);
  const [label, setLabel] = useState("");

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

  /*
    Load Google Map safely
  */
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

  /*
    Initialize map
  */
  const initializeMap = () => {
    const center = {
      lat: 31.5204,
      lng: 74.3587,
    };

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstance.current.addListener("click", (event) => {
      addPoint(event.latLng);
    });
  };

  /*
    Add clicked point
  */
  const addPoint = (latLng) => {
    const newPoint = {
      lat: latLng.lat(),
      lng: latLng.lng(),
    };

    setPoints((prevPoints) => {
      const updatedPoints = [...prevPoints, newPoint];

      const marker = new window.google.maps.Marker({
        position: newPoint,
        map: mapInstance.current,
      });

      markersRef.current.push(marker);

      drawPolygon(updatedPoints);

      return updatedPoints;
    });
  };

  /*
    Draw polygon fence
  */
  const drawPolygon = (polygonPoints) => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
    }

    if (polygonPoints.length < 3) return;

    polygonRef.current = new window.google.maps.Polygon({
      paths: polygonPoints,
      strokeColor: "#22c55e",
      strokeOpacity: 1,
      strokeWeight: 2,
      fillColor: "#22c55e",
      fillOpacity: 0.25,
    });

    polygonRef.current.setMap(mapInstance.current);
  };

  const clearFence = () => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (polygonRef.current) {
      polygonRef.current.setMap(null);
    }

    polygonRef.current = null;
    setPoints([]);
  };

  const saveFence = async () => {
    try {
      if (points.length < 3) {
        alert("Please select at least 3 points for fence");
        return;
      }

      if (!label.trim()) {
        alert("Please enter fence label");
        return;
      }

      const payload = {
        AdId: parseInt(adId),
        Polygon: JSON.stringify(points),
        Label: label.trim(),
      };

      console.log("Saving Ad Fence:", payload);

      await saveAdFenceApi(payload);

      alert("Ad Fence saved successfully!");
      navigate(-1);
    } catch (error) {
      console.log(error);
      alert("Failed to save ad fence");
    }
  };

  return (
    <div style={styles.page}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          📢 MovingAds
        </div>

        <div style={styles.nav}>
          <div style={styles.activeNav}>
            📍 Ad Fence
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.title}>📍 Advertisement Fence</h2>

          <p style={styles.subTitle}>
            Click on the map to create advertisement fence
            (minimum 3 points required)
          </p>

          <p style={styles.adIdText}>
            Ad ID: <strong>{adId}</strong>
          </p>

          {/* Label */}
          <div style={styles.inputWrap}>
            <input
              type="text"
              placeholder="Enter fence label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Map */}
          <div
            ref={mapRef}
            style={styles.map}
          />

          {/* Info */}
          <div style={styles.info}>
            Selected Points: {points.length}
          </div>

          {/* Buttons */}
          <div style={styles.buttonRow}>
            <button
              style={styles.clearBtn}
              onClick={clearFence}
            >
              Clear Fence
            </button>

            <button
              style={styles.saveBtn}
              onClick={saveFence}
            >
              Save Ad Fence
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdLocationScreen;

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
  },

  activeNav: {
    padding: "14px 16px",
    borderRadius: 12,
    background: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    fontWeight: 600,
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
  },

  map: {
    width: "100%",
    height: 500,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },

  info: {
    color: "#fff",
    marginBottom: 20,
    fontSize: 14,
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
    flex: 1,
    padding: 14,
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
};