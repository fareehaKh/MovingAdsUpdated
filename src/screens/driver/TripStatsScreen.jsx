import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDriverTripsApi } from "../../api/authapi";
import { getUserSession } from "../../utils/session";

const TripStatsScreen = () => {
  const navigate = useNavigate();
  const { vehicleReg } = useParams();

  const user = getUserSession();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalTrips: 0,
    adsServed: 0,
    validMinutes: 0,
    totalKm: 0,
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await getDriverTripsApi(user.UserId);

      const allTrips = res.data || [];

      // filter by vehicle
      const vehicleTrips = allTrips.filter(
        (t) => t.VehicleReg === vehicleReg
      );

      setTrips(vehicleTrips);

      // stats
      const totalTrips = vehicleTrips.length;

      const adsServed = new Set(
        vehicleTrips.map((t) => t.AdId)
      ).size;

      const validMinutes = vehicleTrips.reduce(
        (sum, t) => sum + Number(t.ValidTimeMinutes || 0),
        0
      );

      const totalKm = vehicleTrips.reduce(
        (sum, t) => sum + Number(t.ValidDistanceKm || 0),
        0
      );

      setStats({
        totalTrips,
        adsServed,
        validMinutes,
        totalKm,
      });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.loader}></div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button
          style={styles.backBtn}
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <div>
          <h1 style={styles.title}>My Trip Stats</h1>
          <p style={styles.subtitle}>{vehicleReg}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🚘</div>
          <div style={styles.statNumber}>
            {stats.totalTrips}
          </div>
          <div style={styles.statLabel}>Total Trips</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📢</div>
          <div style={styles.statNumber}>
            {stats.adsServed}
          </div>
          <div style={styles.statLabel}>Ads Served</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⏰</div>
          <div style={styles.statNumber}>
            {stats.validMinutes.toFixed(1)} min
          </div>
          <div style={styles.statLabel}>Valid Time</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>🛣</div>
          <div style={styles.statNumber}>
            {stats.totalKm.toFixed(2)} km
          </div>
          <div style={styles.statLabel}>Total Distance</div>
        </div>
      </div>

      {/* Trip History */}
      <div style={styles.tripHeader}>
        <h2 style={styles.tripTitle}>Trip History</h2>

        <div style={styles.tripBadge}>
          {trips.length} trips
        </div>
      </div>

      <div style={styles.tripList}>
        {trips.map((trip) => (
          <div key={trip.TripId} style={styles.tripCard}>
            <div style={styles.tripTop}>
              <div style={styles.tripId}>
                Trip #{trip.TripId}
              </div>

              <div style={styles.vehicleBadge}>
                {trip.VehicleReg}
              </div>

              <div style={styles.tripDate}>
                {new Date(trip.TripDate).toLocaleDateString()}
              </div>
            </div>

            <div style={styles.adTitle}>
              📢 {trip.AdTitle}
            </div>

            <div style={styles.divider}></div>

            <div style={styles.tripStatsRow}>
              <div style={styles.tripStat}>
                <div style={styles.tripStatValue}>
                  {trip.ValidTimeMinutes} min
                </div>
                <div style={styles.tripStatLabel}>
                  Valid Time
                </div>
              </div>

              <div style={styles.tripStat}>
                <div style={styles.tripStatValue}>
                  {trip.ValidDistanceKm} km
                </div>
                <div style={styles.tripStatLabel}>
                  Distance
                </div>
              </div>

              <div style={styles.tripStat}>
                <div style={styles.tripStatValue}>
                  {trip.SegmentsCount}
                </div>
                <div style={styles.tripStatLabel}>
                  Segments
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f5",
    padding: "20px",
    fontFamily: "Segoe UI",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
  },

  backBtn: {
    border: "none",
    background: "#fff",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "20px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "700",
  },

  subtitle: {
    margin: 0,
    color: "#666",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginBottom: "30px",
  },

  statCard: {
    background: "#fff",
    padding: "24px",
    borderRadius: "20px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
  },

  statIcon: {
    fontSize: "30px",
    marginBottom: "14px",
  },

  statNumber: {
    fontSize: "34px",
    fontWeight: "700",
  },

  statLabel: {
    color: "#777",
    marginTop: "6px",
  },

  tripHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },

  tripTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
  },

  tripBadge: {
    background: "#d1fae5",
    color: "#10b981",
    padding: "6px 14px",
    borderRadius: "20px",
    fontWeight: "600",
  },

  tripList: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  tripCard: {
    background: "#fff",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },

  tripTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  tripId: {
    background: "#111",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "20px",
    fontWeight: "600",
  },

  vehicleBadge: {
    background: "#d1fae5",
    color: "#10b981",
    padding: "8px 16px",
    borderRadius: "20px",
    fontWeight: "600",
  },

  tripDate: {
    marginLeft: "auto",
    color: "#999",
  },

  adTitle: {
    marginTop: "18px",
    fontSize: "24px",
    fontWeight: "700",
  },

  divider: {
    height: "1px",
    background: "#eee",
    margin: "20px 0",
  },

  tripStatsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: "18px",
  },

  tripStat: {
    textAlign: "center",
  },

  tripStatValue: {
    fontSize: "24px",
    fontWeight: "700",
  },

  tripStatLabel: {
    color: "#888",
    marginTop: "4px",
  },

  loaderContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  loader: {
    width: "40px",
    height: "40px",
    border: "4px solid #ddd",
    borderTop: "4px solid #10b981",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

export default TripStatsScreen;