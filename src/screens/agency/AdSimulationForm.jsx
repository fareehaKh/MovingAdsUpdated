
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdSimulationMap from "./AdSimulationMap";
import { getUserSession } from "../../utils/session";

import {
  getAgencyByUserApi,
  getAgencyVehiclesApi,
  getActiveAssignmentsByAgencyApi,
  getAdFenceApi,
  getAllAdsApi,
} from "../../api/authapi";

// ─────────────────────────────────────────────────────────────────
// RESPONSIVE HOOK
// ─────────────────────────────────────────────────────────────────
function useResponsive() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const onResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  return {
    ...size,
    isMobile: size.width < 768,
    isTablet: size.width >= 768 && size.width < 1024,
    isDesktop: size.width >= 1024,
  };
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
function toInt(v) {
  if (v == null) return 0;
  if (typeof v === "number") return Math.floor(v);
  return parseInt(v, 10) || 0;
}

function parsePolygon(raw) {
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    if (!Array.isArray(data) || data.length === 0) return [];

    if (
      typeof data[0] === "object" &&
      !Array.isArray(data[0])
    ) {
      return data.map((e) => ({
        lat: Number(e.lat ?? e.latitude ?? 0),
        lng: Number(e.lng ?? e.longitude ?? 0),
      }));
    }

    if (Array.isArray(data[0])) {
      return data.map((e) => ({
        lat: Number(e[1]),
        lng: Number(e[0]),
      }));
    }

    return [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────
// SMALL UI PIECES
// ─────────────────────────────────────────────────────────────────
function SectionLabel({ icon, text, isMobile }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        marginBottom: 10,
      }}
    >
      <span
        style={{
          color: "#00c4aa",
          display: "flex",
        }}
      >
        {icon}
      </span>

      <span
        style={{
          fontSize: isMobile ? 12 : 13,
          fontWeight: 600,
          color: "#555",
          letterSpacing: 0.3,
        }}
      >
        {text}
      </span>
    </div>
  );
}

function StepBadge({ num, text, isMobile }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          minWidth: isMobile ? 20 : 22,
          height: isMobile ? 20 : 22,
          borderRadius: "50%",
          background: "rgba(0,196,170,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: isMobile ? 10 : 11,
          fontWeight: 700,
          color: "#00c4aa",
          flexShrink: 0,
        }}
      >
        {num}
      </div>

      <p
        style={{
          margin: 0,
          fontSize: isMobile ? 12 : 12.5,
          color: "#666",
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}
      >
        {text}
      </p>
    </div>
  );
}

function Spinner({ white }) {
  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        border: `2.5px solid ${
          white
            ? "rgba(255,255,255,.3)"
            : "rgba(0,196,170,.2)"
        }`,
        borderTopColor: white ? "white" : "#00c4aa",
        animation: "adSimSpin 0.7s linear infinite",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

function ErrorBanner({ message, onRetry, isMobile }) {
  return (
    <div
      style={{
        background: "#fff0f0",
        border: "1px solid #ffcdd2",
        borderRadius: 12,
        padding: isMobile ? "10px 12px" : "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          color: "#d32f2f",
          fontSize: isMobile ? 12 : 13,
          flex: 1,
          wordBreak: "break-word",
        }}
      >
        ⚠ {message}
      </span>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: "#d32f2f",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "5px 12px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

function CarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17a2 2 0 104 0m6 0a2 2 0 104 0" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function AdSimulationForm() {
  const navigate = useNavigate();

  const { isMobile } = useResponsive();

  const session = getUserSession();

  const userId = session?.UserId;

  // ── agency ──
  const [agency, setAgency] = useState(null);
  const [loadingAgency, setLoadingAgency] = useState(true);
  const [agencyError, setAgencyError] = useState(null);

  // ── vehicles ──
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleError, setVehicleError] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // ── ads ──
  const [adsData, setAdsData] = useState(null);
  const [loadingAds, setLoadingAds] = useState(false);
  const [adsError, setAdsError] = useState(null);

  // ── navigation ──
  const [showMap, setShowMap] = useState(false);

  // ───────────────────────────────────────────────────────────────
  // LOAD AGENCY
  // ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setAgencyError(
        "No user session found. Please log in again."
      );

      setLoadingAgency(false);

      return;
    }

    setLoadingAgency(true);

    setAgencyError(null);

    getAgencyByUserApi(userId)
      .then((res) => {
        const data = res.data ?? res;

        setAgency(data);

        setLoadingAgency(false);
      })
      .catch((e) => {
        setAgencyError(
          e?.response?.data?.message ||
            e.message ||
            "Failed to load agency"
        );

        setLoadingAgency(false);
      });
  }, [userId]);

  // ───────────────────────────────────────────────────────────────
  // LOAD VEHICLES
  // ───────────────────────────────────────────────────────────────
  const loadVehicles = () => {
    if (!agency?.AgencyId) return;

    setLoadingVehicles(true);

    setVehicleError(null);

    setSelectedVehicle(null);

    getAgencyVehiclesApi(agency.AgencyId)
      .then((res) => {
        const data = res.data ?? res;

        setVehicles(Array.isArray(data) ? data : []);

        setLoadingVehicles(false);
      })
      .catch((e) => {
        setVehicleError(
          e?.response?.data?.message ||
            e.message ||
            "Failed to load vehicles"
        );

        setLoadingVehicles(false);
      });
  };

  useEffect(() => {
    if (agency?.AgencyId) {
      loadVehicles();
    }
  }, [agency?.AgencyId]);

  // ───────────────────────────────────────────────────────────────
  // LOAD ADS
  // ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!agency?.AgencyId) return;

    setLoadingAds(true);

    setAdsError(null);

    Promise.all([
      getActiveAssignmentsByAgencyApi(
        agency.AgencyId
      ).then((r) => r.data ?? r),

      getAllAdsApi().then((r) => r.data ?? r),
    ])
      .then(async ([assignments, allAds]) => {
        if (
          !Array.isArray(assignments) ||
          assignments.length === 0
        ) {
          setAdsData([]);

          setLoadingAds(false);

          return;
        }

        const settled = await Promise.allSettled(
          assignments.map(async (asgn) => {
            const adId =
              asgn.AdId ?? asgn.adId;

            const adTitle =
              asgn.AdTitle ?? asgn.adTitle;

            if (!adId) return null;

            const fenceRes = await getAdFenceApi(adId)
              .then((r) => r.data ?? r);

            if (
              !Array.isArray(fenceRes) ||
              fenceRes.length === 0
            ) {
              return null;
            }

            const rawPolygon =
              fenceRes[0].Polygon ??
              fenceRes[0].polygon;

            if (!rawPolygon) return null;

            const polygon = parsePolygon(rawPolygon);

            if (polygon.length < 3) return null;

            const match = Array.isArray(allAds)
              ? allAds.find(
                  (a) =>
                    toInt(a.AdId ?? a.adId) ===
                    toInt(adId)
                )
              : null;

            return {
              adId,
              adTitle,
              mediaPath:
                match?.MediaPath ??
                match?.mediaPath ??
                "",
              fence: polygon,
            };
          })
        );

        const valid = settled
          .filter(
            (r) =>
              r.status === "fulfilled" &&
              r.value !== null
          )
          .map((r) => r.value);

        setAdsData(valid);

        setLoadingAds(false);
      })
      .catch((e) => {
        setAdsError(
          e?.response?.data?.message ||
            e.message ||
            "Failed to load ad fences"
        );

        setLoadingAds(false);
      });
  }, [agency?.AgencyId]);

  const canStart = !!selectedVehicle;

  // ───────────────────────────────────────────────────────────────
  // SHOW MAP
  // ───────────────────────────────────────────────────────────────
  if (showMap) {
    return (
      <AdSimulationMap
        agency={agency}
        vehicle={selectedVehicle}
        adsData={adsData}
        loadingAds={loadingAds}
        adsError={adsError}
        onBack={() => setShowMap(false)}
      />
    );
  }

  // ───────────────────────────────────────────────────────────────
  // LOADING
  // ───────────────────────────────────────────────────────────────
  if (loadingAgency) {
    return (
      <div
        style={{
          ...S.root,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner />

        <p
          style={{
            marginTop: 14,
            color: "#aaa",
            fontSize: 13,
          }}
        >
          Loading agency…
        </p>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────
  // ERROR
  // ───────────────────────────────────────────────────────────────
  if (agencyError) {
    return (
      <div
        style={{
          ...S.root,
          padding: 24,
        }}
      >
        <ErrorBanner
          message={agencyError}
          isMobile={isMobile}
        />
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────
  // MAIN UI
  // ───────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      {/* HEADER */}
      <div style={S.header(isMobile)}>
        {/* LEFT */}
        <button
          onClick={() => navigate(-1)}
          style={S.backBtn(isMobile)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>

        {/* CENTER */}
        <div style={S.headerCenter}>
          <h2 style={S.headerTitle(isMobile)}>
            Ad Simulation
          </h2>

          <div style={S.agencyPill(isMobile)}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,.85)"
              strokeWidth="2.3"
            >
              <rect
                x="3"
                y="9"
                width="18"
                height="13"
                rx="2"
              />

              <path d="M8 9V7a4 4 0 018 0v2" />
            </svg>

            <span style={S.agencyPillText(isMobile)}>
              {agency?.AgencyName || "—"}
            </span>
          </div>
        </div>

        {/* RIGHT SPACER */}
        <div style={S.headerSpacer(isMobile)} />
      </div>

      {/* BODY */}
      <div style={S.body(isMobile)}>
        {/* VEHICLE */}
        <SectionLabel
          icon={<CarIcon />}
          text="Select Vehicle"
          isMobile={isMobile}
        />

        {loadingVehicles ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 0",
            }}
          >
            <Spinner />

            <span
              style={{
                color: "#999",
                fontSize: 13,
              }}
            >
              Loading vehicles…
            </span>
          </div>
        ) : vehicleError ? (
          <ErrorBanner
            message={vehicleError}
            onRetry={loadVehicles}
            isMobile={isMobile}
          />
        ) : (
          <>
            <div
              style={{
                ...S.card(isMobile),
                ...(selectedVehicle
                  ? S.cardActive
                  : {}),
                padding: "4px 16px",
              }}
            >
              <select
                value={
                  selectedVehicle
                    ? JSON.stringify(selectedVehicle)
                    : ""
                }
                onChange={(e) => {
                  if (!e.target.value) {
                    return setSelectedVehicle(null);
                  }

                  try {
                    setSelectedVehicle(
                      JSON.parse(e.target.value)
                    );
                  } catch {}
                }}
                style={S.select(isMobile)}
              >
                <option value="">
                  — Choose a vehicle —
                </option>

                {vehicles.length === 0 ? (
                  <option disabled>
                    No vehicles found for this agency
                  </option>
                ) : (
                  vehicles.map((v) => (
                    <option
                      key={v.VehicleReg}
                      value={JSON.stringify(v)}
                    >
                      {v.VehicleReg} · {v.VehicleModel} ·{" "}
                      {v.VehicleType}
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedVehicle && (
              <div style={S.vehicleInfo(isMobile)}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00c4aa"
                  strokeWidth="2.2"
                >
                  <circle cx="12" cy="12" r="10" />

                  <path d="M12 8v4M12 16h.01" />
                </svg>

                <span
                  style={{
                    fontSize: isMobile ? 11 : 12,
                    color: "#00c4aa",
                    fontWeight: 600,
                    marginLeft: 6,
                    wordBreak: "break-word",
                  }}
                >
                  {selectedVehicle.VehicleReg} ·{" "}
                  {selectedVehicle.VehicleModel} ·{" "}
                  {selectedVehicle.VehicleType}
                </span>

                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 20,

                    background:
                      selectedVehicle.VehicleStatus?.toLowerCase() ===
                      "online"
                        ? "rgba(76,175,80,.15)"
                        : "rgba(0,0,0,.07)",

                    color:
                      selectedVehicle.VehicleStatus?.toLowerCase() ===
                      "online"
                        ? "#43a047"
                        : "#999",
                  }}
                >
                  {selectedVehicle.VehicleStatus || "—"}
                </span>
              </div>
            )}
          </>
        )}

        <div style={{ height: 28 }} />

        {/* HOW IT WORKS */}
        <div style={S.howCard(isMobile)}>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: isMobile ? 12 : 13,
              fontWeight: 700,
              color: "#333",
            }}
          >
            How it works
          </p>

          <StepBadge
            num="1"
            text="Click points on the map to draw the vehicle's route"
            isMobile={isMobile}
          />

          <StepBadge
            num="2"
            text="All agency ad fences appear as colored zones on the map"
            isMobile={isMobile}
          />

          <StepBadge
            num="3"
            text="Press Start — the vehicle moves step-by-step along your route"
            isMobile={isMobile}
          />

          <StepBadge
            num="4"
            text="A card at the bottom shows the active ad when inside a fence"
            isMobile={isMobile}
          />

          <StepBadge
            num="5"
            text="Overlapping fences rotate ads every 10 seconds automatically"
            isMobile={isMobile}
          />
        </div>

        <div style={{ height: 28 }} />

        {/* ADS ERROR */}
        {adsError && (
          <div style={{ marginBottom: 12 }}>
            <ErrorBanner
              message={`Could not load ad fences: ${adsError}`}
              isMobile={isMobile}
            />
          </div>
        )}

        {/* CONTINUE BUTTON */}
        <button
          onClick={() =>
            canStart && setShowMap(true)
          }
          disabled={!canStart}
          style={{
            ...S.startBtn(isMobile),

            opacity: canStart ? 1 : 0.4,

            cursor: canStart
              ? "pointer"
              : "not-allowed",

            boxShadow: canStart
              ? "0 6px 20px rgba(0,196,170,.4)"
              : "none",
          }}
        >
          {loadingAds ? (
            <>
              <Spinner white />

              <span style={{ marginLeft: 8 }}>
                Loading ad data…
              </span>
            </>
          ) : (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                />

                <path d="M3 9h18M9 21V9" />
              </svg>

              <span
                style={{
                  marginLeft: 10,
                  fontSize: isMobile ? 13 : 15,
                  fontWeight: 700,
                }}
              >
                Continue to Simulate
              </span>
            </>
          )}
        </button>

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────
const S = {
  root: {
    fontFamily:
      "'DM Sans','Segoe UI',sans-serif",

    background: "#f5f7fa",

    height: "100dvh",

    display: "flex",

    flexDirection: "column",

    overflow: "hidden",
  },

  // HEADER
  header: (isMobile) => ({
    background:
      "linear-gradient(135deg,#00c4aa,#00a896)",

    padding: isMobile
      ? "44px 14px 18px"
      : "52px 20px 20px",

    paddingTop:
      "max(44px, env(safe-area-inset-top, 44px))",

    borderRadius: isMobile
      ? "0 0 22px 22px"
      : "0 0 28px 28px",

    boxShadow:
      "0 4px 20px rgba(0,196,170,.3)",

    display: "flex",

    alignItems: "center",

    gap: 10,
  }),

  backBtn: (isMobile) => ({
    width: isMobile ? 36 : 40,

    height: isMobile ? 36 : 40,

    minWidth: isMobile ? 36 : 40,

    borderRadius: 10,

    background: "rgba(255,255,255,.25)",

    border: "none",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    cursor: "pointer",

    flexShrink: 0,
  }),

  headerCenter: {
    flex: 1,

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    gap: 7,

    minWidth: 0,
  },

  headerTitle: (isMobile) => ({
    color: "white",

    fontSize: isMobile ? 19 : 23,

    fontWeight: 800,

    margin: 0,

    textAlign: "center",

    letterSpacing: -0.3,
  }),

  agencyPill: (isMobile) => ({
    display: "inline-flex",

    alignItems: "center",

    gap: 5,

    background: "rgba(255,255,255,.2)",

    borderRadius: 20,

    padding: isMobile
      ? "4px 11px 4px 8px"
      : "5px 13px 5px 9px",

    backdropFilter: "blur(4px)",
  }),

  agencyPillText: (isMobile) => ({
    fontSize: isMobile ? 12 : 13,

    fontWeight: 700,

    color: "white",

    whiteSpace: "nowrap",

    overflow: "hidden",

    textOverflow: "ellipsis",

    maxWidth: isMobile ? 200 : 320,
  }),

  headerSpacer: (isMobile) => ({
    width: isMobile ? 36 : 40,

    minWidth: isMobile ? 36 : 40,

    flexShrink: 0,
  }),

  body: (isMobile) => ({
    padding: isMobile
      ? "18px 14px"
      : "24px 20px",

    flex: 1,

    overflowY: "auto",

    overflowX: "hidden",
  }),

  card: (isMobile) => ({
    background: "white",

    borderRadius: isMobile ? 14 : 16,

    boxShadow:
      "0 2px 12px rgba(0,0,0,.08)",

    border: "1.5px solid transparent",

    display: "flex",

    alignItems: "center",

    padding: isMobile ? "14px" : "16px",

    gap: isMobile ? 10 : 14,

    transition: "border-color .2s",

    minWidth: 0,
  }),

  cardActive: {
    borderColor: "#00c4aa",
  },

  select: (isMobile) => ({
    width: "100%",

    border: "none",

    outline: "none",

    fontSize: isMobile ? 13 : 14,

    color: "#333",

    background: "transparent",

    padding: "12px 0",

    cursor: "pointer",
  }),

  vehicleInfo: (isMobile) => ({
    marginTop: 10,

    display: "flex",

    alignItems: "center",

    flexWrap: "wrap",

    rowGap: 6,

    background: "rgba(0,196,170,.07)",

    borderRadius: 12,

    border:
      "1px solid rgba(0,196,170,.2)",

    padding: isMobile
      ? "10px 12px"
      : "10px 14px",

    wordBreak: "break-word",
  }),

  howCard: (isMobile) => ({
    background: "white",

    borderRadius: isMobile ? 14 : 16,

    boxShadow:
      "0 2px 12px rgba(0,0,0,.07)",

    padding: isMobile ? 14 : 16,
  }),

  startBtn: (isMobile) => ({
    width: "100%",

    minHeight: isMobile ? 52 : 56,

    background: "#00c4aa",

    border: "none",

    borderRadius: isMobile ? 14 : 16,

    cursor: "pointer",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    color: "white",

    fontSize: isMobile ? 14 : 15,

    fontWeight: 700,

    transition:
      "opacity .25s, box-shadow .25s",

    padding: "0 14px",

    textAlign: "center",
  }),
};

// ─────────────────────────────────────────────────────────────────
// KEYFRAMES
// ─────────────────────────────────────────────────────────────────
if (
  typeof document !== "undefined" &&
  !document.getElementById("adSimSpinStyle")
) {
  const s = document.createElement("style");

  s.id = "adSimSpinStyle";

  s.textContent =
    "@keyframes adSimSpin{to{transform:rotate(360deg)}}";

  document.head.appendChild(s);
}