import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getAllAdsApi,
  getAdFenceApi,
  getFenceByVehicleApi,
  getAssignmentsApi,
} from "../../api/authapi";

// ─── Google Maps singleton loader ────────────────────────────────────────────
const GOOGLE_MAPS_API_KEY = "AIzaSyD_tyUWEaa3u0V8SVlHwKtl9f1eppf8dD4";

let _mapsPromise = null;

function loadGoogleMaps() {
  if (_mapsPromise) return _mapsPromise;

  _mapsPromise = new Promise((resolve) => {
    if (window.google?.maps) {
      console.log("✅ [Maps] Google Maps already loaded.");
      resolve();
      return;
    }

    if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
      console.log("⏳ [Maps] Script already injected, polling for readiness...");
      const poll = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(poll);
          console.log("✅ [Maps] Google Maps ready after polling.");
          resolve();
        }
      }, 50);
      return;
    }

    console.log("🚀 [Maps] Injecting Google Maps script...");
    const callbackName = "__googleMapsReady__";
    window[callbackName] = () => {
      delete window[callbackName];
      console.log("✅ [Maps] Google Maps loaded via callback.");
      resolve();
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });

  return _mapsPromise;
}

function useGoogleMaps() {
  const [loaded, setLoaded] = useState(!!window.google?.maps);
  useEffect(() => {
    if (loaded) return;
    loadGoogleMaps().then(() => setLoaded(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return loaded;
}

// ─── Geo helpers ─────────────────────────────────────────────────────────────
function isPointInPolygon(point, polygon) {
  if (polygon.length < 3) return false;
  let intersect = 0;
  const n = polygon.length;
  for (let j = 0; j < n; j++) {
    const a = polygon[j];
    const b = polygon[(j + 1) % n];
    if (
      a.lng > point.lng !== b.lng > point.lng &&
      point.lat <
        ((b.lat - a.lat) * (point.lng - a.lng)) / (b.lng - a.lng) + a.lat
    ) {
      intersect++;
    }
  }
  return intersect % 2 === 1;
}

function centroid(polygon) {
  let lat = 0, lng = 0;
  polygon.forEach((p) => { lat += p.lat; lng += p.lng; });
  return { lat: lat / polygon.length, lng: lng / polygon.length };
}

function parsePolygon(raw) {
  console.log("🔍 [parsePolygon] Raw input:", raw);
  try {
    let data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("⚠️ [parsePolygon] Empty or non-array data:", data);
      return [];
    }

    let result = [];
    if (typeof data[0] === "object" && !Array.isArray(data[0])) {
      result = data.map((e) => ({
        lat: parseFloat(e.lat ?? e.latitude ?? e.Lat ?? e.Latitude ?? 0),
        lng: parseFloat(e.lng ?? e.longitude ?? e.Lng ?? e.Longitude ?? 0),
      }));
    } else if (Array.isArray(data[0])) {
      result = data.map((e) => ({ lat: parseFloat(e[1]), lng: parseFloat(e[0]) }));
    }

    console.log(`✅ [parsePolygon] Parsed ${result.length} points:`, result.slice(0, 3), result.length > 3 ? "..." : "");
    return result;
  } catch (err) {
    console.error("❌ [parsePolygon] Parse error:", err, "| Raw:", raw);
    return [];
  }
}

// function buildRoute(vehicleFence, adFenceMap) {
//   console.log("🛣️ [buildRoute] Building route from vehicleFence:", vehicleFence.length, "points, adFences:", Object.keys(adFenceMap).length);
//   const points = [];

//   if (vehicleFence.length > 0) {
//     const c = centroid(vehicleFence);
//     console.log("📍 [buildRoute] Vehicle fence centroid:", c);
//     points.push(c);
//   } else {
//     console.warn("⚠️ [buildRoute] No vehicle fence — skipping vehicle origin point.");
//   }

//   Object.entries(adFenceMap).forEach(([id, poly]) => {
//     if (poly.length === 0) {
//       console.warn(`⚠️ [buildRoute] Ad ${id} has empty polygon, skipping.`);
//       return;
//     }
//     const center = centroid(poly);
//     console.log(`📍 [buildRoute] Ad ${id} centroid:`, center);

//     if (points.length > 0) {
//       const prev = points[points.length - 1];
//       points.push({
//         lat: prev.lat + (center.lat - prev.lat) / 3,
//         lng: prev.lng + (center.lng - prev.lng) / 3,
//       });
//       points.push({
//         lat: prev.lat + (2 * (center.lat - prev.lat)) / 3,
//         lng: prev.lng + (2 * (center.lng - prev.lng)) / 3,
//       });
//     }
//     points.push(center);
//   });

//   // ── FIX: if only 1 point, add an offset so route has ≥ 2 points ──
//   if (points.length === 1) {
//     console.warn("⚠️ [buildRoute] Only 1 point found — adding offset duplicate to satisfy minimum route length.");
//     points.push({ lat: points[0].lat + 0.005, lng: points[0].lng + 0.005 });
//   }

//   if (points.length >= 2) {
//     const last = points[points.length - 1];
//     const prev = points[points.length - 2];
//     points.push({
//       lat: last.lat + (last.lat - prev.lat),
//       lng: last.lng + (last.lng - prev.lng),
//     });
//   }

//   console.log(`✅ [buildRoute] Final route has ${points.length} points:`, points);
//   return points;
// }

function buildRoute(vehicleFence, adFenceMap) {
  console.log(
    "🛣️ [buildRoute] Building route from vehicleFence:",
    vehicleFence.length,
    "points, adFences:",
    Object.keys(adFenceMap).length
  );

  const points = [];

  // start point 
  if (vehicleFence.length > 0) {
    const vehicleStart = vehicleFence[0]; // first point of vehicle fence
    const vehicleEnd = vehicleFence[vehicleFence.length - 1]; // last point

    console.log("🚗 Vehicle Start Point:", vehicleStart);
    console.log("🏁 Vehicle End Point:", vehicleEnd);

    // Start from vehicle fence first point
    points.push(vehicleStart);

    Object.entries(adFenceMap).forEach(([id, poly]) => {
      if (!poly || poly.length === 0) {
        console.warn(`⚠️ Ad ${id} has empty polygon, skipping.`);
        return;
      }

      const center = centroid(poly);
      console.log(`📍 Ad ${id} centroid:`, center);

      const prev = points[points.length - 1];

      points.push({
        lat: prev.lat + (center.lat - prev.lat) / 3,
        lng: prev.lng + (center.lng - prev.lng) / 3,
      });

      points.push({
        lat: prev.lat + (2 * (center.lat - prev.lat)) / 3,
        lng: prev.lng + (2 * (center.lng - prev.lng)) / 3,
      });

      // Add actual destination
      points.push(center);
    });

    //end point
    const prev = points[points.length - 1];

    points.push({
      lat: prev.lat + (vehicleEnd.lat - prev.lat) / 3,
      lng: prev.lng + (vehicleEnd.lng - prev.lng) / 3,
    });

    points.push({
      lat: prev.lat + (2 * (vehicleEnd.lat - prev.lat)) / 3,
      lng: prev.lng + (2 * (vehicleEnd.lng - prev.lng)) / 3,
    });

    // Final destination = vehicle fence last point
    points.push(vehicleEnd);

    console.log("🏁 Route ending at vehicle fence end:", vehicleEnd);
  } else {
    console.warn("⚠️ No vehicle fence found.");

    // fallback if no vehicle fence
    Object.entries(adFenceMap).forEach(([id, poly]) => {
      if (poly.length > 0) {
        points.push(centroid(poly));
      }
    });
  }

  console.log(`✅ Final route has ${points.length} points`, points);

  return points;
}


const AD_COLORS = ["#3B82F6", "#F97316", "#A855F7", "#EF4444"];
const ROTATION_SECS = 3;

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdSimulation() {
  const mapsLoaded = useGoogleMaps();
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const carMarkerRef = useRef(null);
  const polylinesRef = useRef([]);
  const polygonsRef = useRef([]);
  const drivenPolyRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [inOverlap, setInOverlap] = useState(false);

  const [route, setRoute] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [adQueue, setAdQueue] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [adFenceMap, setAdFenceMap] = useState({});
  const [vehicleFence, setVehicleFence] = useState([]);
  const [vehicleReg, setVehicleReg] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(ROTATION_SECS);
  const [activeRotationAds, setActiveRotationAds] = useState([]);
  const [panelVisible, setPanelVisible] = useState(false);

  const moveTimerRef = useRef(null);
  const adRotateTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const currentStepRef = useRef(0);
  const routeRef = useRef([]);
  const adFenceMapRef = useRef({});
  const adQueueRef = useRef([]);
  const currentAdIndexRef = useRef(0);
  const inOverlapRef = useRef(false);
  const activeRotationAdsRef = useRef([]);

  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => { routeRef.current = route; }, [route]);
  useEffect(() => { adFenceMapRef.current = adFenceMap; }, [adFenceMap]);
  useEffect(() => { adQueueRef.current = adQueue; }, [adQueue]);
  useEffect(() => { currentAdIndexRef.current = currentAdIndex; }, [currentAdIndex]);
  useEffect(() => { inOverlapRef.current = inOverlap; }, [inOverlap]);
  useEffect(() => { activeRotationAdsRef.current = activeRotationAds; }, [activeRotationAds]);

  // ─── Load data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    console.log("🚀 [loadData] Starting data load...");
    setIsLoading(true);
    setError(null);
    try {
      // ── Step 1: Fetch all ads ──
      console.log("📡 [loadData] Fetching all ads...");
      const allAdsRes = await getAllAdsApi();
      const allAds = allAdsRes.data ?? [];
      console.log(`📦 [loadData] Total ads received: ${allAds.length}`, allAds);

      const activeAds = allAds.filter((a) => {
        const status = a.Status ?? a.status ?? "";
        return status.toLowerCase() === "active";
      });
      console.log(`✅ [loadData] Active ads: ${activeAds.length}`, activeAds);

      if (activeAds.length === 0) {
        console.error("❌ [loadData] No active ads found.");
        setError("No active ads found.");
        setIsLoading(false);
        return;
      }

      // ── Step 2: Get vehicle registrations from assignments ──
      console.log("📡 [loadData] Fetching assignments for each active ad...");
      const regSet = new Set();
      for (const ad of activeAds) {
        const adId = ad.AdId ?? ad.adId;
        console.log(`  → Fetching assignments for AdId: ${adId}`);
        try {
          const res = await getAssignmentsApi(adId);
          const assignments = res.data ?? [];
          console.log(`  ✅ Assignments for AdId ${adId}: ${assignments.length}`, assignments);
          assignments.forEach((a) => {
            const reg = a.VehicleReg?.trim() ?? a.vehicleReg?.trim();
            if (reg) {
              regSet.add(reg);
              console.log(`    🚗 Added VehicleReg: ${reg}`);
            } else {
              console.warn(`    ⚠️ Assignment has no VehicleReg:`, a);
            }
          });
        } catch (e) {
          console.warn(`  ❌ Assignments error for AdId ${adId}:`, e);
        }
      }

      console.log(`🚗 [loadData] All unique vehicle regs found:`, [...regSet]);

      if (regSet.size === 0) {
        console.error("❌ [loadData] No vehicles assigned to any active ad.");
        setError("No vehicles assigned to active ads.");
        setIsLoading(false);
        return;
      }

      const vReg = [...regSet][0];
      console.log(`🎯 [loadData] Using vehicle: ${vReg}`);

      // ── Step 3: Get vehicle fence ──
      let vFence = [];
      try {
        console.log(`📡 [loadData] Fetching vehicle fence for: ${vReg}`);
        const vRes = await getFenceByVehicleApi(vReg);
        const fences = vRes.data ?? [];
        console.log(`📦 [loadData] Vehicle fences received: ${fences.length}`, fences);
        if (fences.length > 0) {
          const rawPoly = fences[0].polygon ?? fences[0].Polygon ?? fences[0].coordinates;
          console.log(`🔍 [loadData] Vehicle fence raw polygon key check:`, {
            polygon: fences[0].polygon,
            Polygon: fences[0].Polygon,
            coordinates: fences[0].coordinates,
          });
          vFence = parsePolygon(rawPoly);
          console.log(`✅ [loadData] Vehicle fence parsed: ${vFence.length} points`);
        } else {
          console.warn("⚠️ [loadData] No vehicle fences returned from API.");
        }
      } catch (e) {
        console.warn("❌ [loadData] Vehicle fence fetch error:", e);
      }

      // ── Step 4: Get ad fences ──
      console.log("📡 [loadData] Fetching ad fences...");
      const fenceMap = {};
      const queue = [];

      for (const ad of activeAds) {
        // ── FIX: Normalise all possible key casings ──
        const adId    = ad.AdId    ?? ad.adId;
        const adTitle = ad.AdTitle ?? ad.adTitle ?? ad.Title ?? ad.title ?? `Ad ${adId}`;
        const mediaPath = ad.MediaPath ?? ad.mediaPath ?? ad.Media ?? ad.media ?? "";

        console.log(`  → Fetching fence for AdId: ${adId} | Title: "${adTitle}"`);
        try {
          const res = await getAdFenceApi(adId);
          const fences = res.data ?? [];
          console.log(`  📦 Ad fence response for ${adId}: ${fences.length} fences`, fences);

          if (fences.length > 0) {
            // ── FIX: Try all possible polygon key names ──
            const rawPoly = fences[0].Polygon ?? fences[0].polygon ?? fences[0].coordinates ?? fences[0].Coordinates;
            console.log(`  🔍 Ad ${adId} fence raw polygon key check:`, {
              Polygon: fences[0].Polygon,
              polygon: fences[0].polygon,
              coordinates: fences[0].coordinates,
              Coordinates: fences[0].Coordinates,
            });

            const poly = parsePolygon(rawPoly);
            if (poly.length > 0) {
              fenceMap[adId] = poly;
              queue.push({ adId, adTitle, mediaPath });
              console.log(`  ✅ Ad ${adId} fence loaded: ${poly.length} points. Added to queue.`);
            } else {
              console.warn(`  ⚠️ Ad ${adId} fence parsed to 0 points — skipping.`);
            }
          } else {
            console.warn(`  ⚠️ No fence data returned for AdId ${adId}.`);
          }
        } catch (e) {
          console.warn(`  ❌ Ad fence fetch error for AdId ${adId}:`, e);
        }
      }

      // ── Step 5: Validate ──
      console.log("📊 [loadData] Summary:");
      console.log("  Vehicle fence points:", vFence.length);
      console.log("  Ad fences loaded:", Object.keys(fenceMap).length, "| Keys:", Object.keys(fenceMap));
      console.log("  Ad queue:", queue);

      if (Object.keys(fenceMap).length === 0) {
        console.error("❌ [loadData] fenceMap is empty — no ad fences were parsed successfully.");
        setError("No ad fences found for active ads. Check console for details.");
        setIsLoading(false);
        return;
      }

      // ── Step 6: Build route ──
      const rt = buildRoute(vFence, fenceMap);

      if (rt.length < 2) {
        console.error("❌ [loadData] Route has fewer than 2 points:", rt);
        setError("Could not build a valid route from fence data.");
        setIsLoading(false);
        return;
      }

      console.log(`🏁 [loadData] Route built successfully with ${rt.length} points. Setting state...`);
      setAdQueue(queue);
      setAdFenceMap(fenceMap);
      setVehicleFence(vFence);
      setVehicleReg(vReg);
      setRoute(rt);
      setCurrentStep(0);
      setCurrentAdIndex(0);
      setIsLoading(false);
      console.log("✅ [loadData] State updated. Ready to simulate.");
    } catch (e) {
      console.error("💥 [loadData] Unexpected error:", e);
      setError("Failed to load data: " + e.message);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Init Google Map ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapsLoaded || isLoading || error || route.length === 0) return;
    if (!mapRef.current) return;

    console.log("🗺️ [Map] Initialising Google Map...");

    if (googleMapRef.current) {
      console.log("🗺️ [Map] Cleaning up old map instance.");
      carMarkerRef.current?.setMap(null);
      carMarkerRef.current = null;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
      polygonsRef.current.forEach((p) => p.setMap(null));
      polygonsRef.current = [];
      drivenPolyRef.current?.setMap(null);
      drivenPolyRef.current = null;
      googleMapRef.current = null;
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center: route[0],
      zoom: 14,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    });
    googleMapRef.current = map;
    console.log("✅ [Map] Map created, centering on:", route[0]);

    carMarkerRef.current = new window.google.maps.Marker({
      position: route[0],
      map,
      title: vehicleReg,
      icon: {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: "#18B6A3",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2,
      },
    });
    console.log("🚗 [Map] Car marker placed at:", route[0]);

    drawMapOverlays(map, route, vehicleFence, adFenceMap);
  }, [mapsLoaded, isLoading, error, route, vehicleFence, adFenceMap, vehicleReg]);

  function drawMapOverlays(map, rt, vFence, fMap) {
    console.log("🎨 [Map] Drawing overlays: route, vehicle fence, ad fences...");
    polylinesRef.current.forEach((p) => p.setMap(null));
    polygonsRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    polygonsRef.current = [];

    if (rt.length > 1) {
      const pl = new window.google.maps.Polyline({
        path: rt,
        map,
        strokeColor: "#3B82F6",
        strokeOpacity: 0.4,
        strokeWeight: 4,
        icons: [{
          icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
          offset: "0",
          repeat: "20px",
        }],
      });
      polylinesRef.current.push(pl);
      console.log(`✅ [Map] Route polyline drawn with ${rt.length} points.`);
    }

    if (vFence.length > 0) {
      const pg = new window.google.maps.Polygon({
        paths: vFence,
        map,
        strokeColor: "#22C55E",
        strokeWeight: 3,
        fillColor: "#22C55E",
        fillOpacity: 0.12,
      });
      polygonsRef.current.push(pg);
      console.log(`✅ [Map] Vehicle fence polygon drawn: ${vFence.length} points.`);
    } else {
      console.warn("⚠️ [Map] Vehicle fence is empty — not drawing vehicle polygon.");
    }

    const adEntries = Object.entries(fMap);
    console.log(`✅ [Map] Drawing ${adEntries.length} ad fence polygons...`);
    adEntries.forEach(([id, poly], i) => {
      const color = AD_COLORS[i % AD_COLORS.length];
      const pg = new window.google.maps.Polygon({
        paths: poly,
        map,
        strokeColor: color,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.12,
      });
      polygonsRef.current.push(pg);
      console.log(`  ✅ Ad ${id} fence drawn in ${color} with ${poly.length} points.`);
    });
  }

  // ─── Update map driven path + car position ────────────────────────────────
  useEffect(() => {
    if (!googleMapRef.current || route.length === 0) return;
    const pos = route[currentStep];
    if (carMarkerRef.current) carMarkerRef.current.setPosition(pos);
    googleMapRef.current.panTo(pos);

    const driven = route.slice(0, currentStep + 1);
    if (drivenPolyRef.current) {
      drivenPolyRef.current.setPath(driven);
    } else {
      drivenPolyRef.current = new window.google.maps.Polyline({
        path: driven,
        map: googleMapRef.current,
        strokeColor: "#18B6A3",
        strokeWeight: 5,
        strokeOpacity: 1,
      });
    }
  }, [currentStep, route]);

  // ─── Zone checking ───────────────────────────────────────────────────────
  const stopAdRotation = useCallback(() => {
    clearInterval(adRotateTimerRef.current);
    clearInterval(countdownTimerRef.current);
    adRotateTimerRef.current = null;
    countdownTimerRef.current = null;
  }, []);

  const startAdRotation = useCallback(
    (adIds) => {
      console.log("🔄 [Rotation] Starting ad rotation for overlap zone. AdIds:", adIds);
      activeRotationAdsRef.current = adIds;
      setActiveRotationAds(adIds);
      stopAdRotation();
      setSecondsLeft(ROTATION_SECS);

      countdownTimerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          const next = s - 1;
          return next <= 0 ? ROTATION_SECS : next;
        });
      }, 1000);

      adRotateTimerRef.current = setInterval(() => {
        const ids = activeRotationAdsRef.current;
        if (!ids.length) return;
        const q = adQueueRef.current;
        const cur = q[currentAdIndexRef.current]?.adId;
        const ci = ids.indexOf(cur);
        const nextId = ids[(ci + 1) % ids.length];
        const qi = q.findIndex((a) => a.adId === nextId);
        if (qi !== -1) {
          console.log(`🔄 [Rotation] Switching to ad index ${qi}, adId: ${nextId}`);
          setCurrentAdIndex(qi);
          setSecondsLeft(ROTATION_SECS);
          setPanelVisible(false);
          setTimeout(() => setPanelVisible(true), 50);
        }
      }, ROTATION_SECS * 1000);
    },
    [stopAdRotation]
  );

  const checkZones = useCallback(() => {
    const pos = routeRef.current[currentStepRef.current];
    if (!pos) return;
    const fMap = adFenceMapRef.current;
    const inside = Object.entries(fMap)
      .filter(([, poly]) => isPointInPolygon(pos, poly))
      .map(([id]) => parseInt(id));

    if (inside.length > 0) {
      console.log(`📍 [Zone] Step ${currentStepRef.current} — Inside ad zones:`, inside);
    }

    if (inside.length > 1) {
      if (!inOverlapRef.current) {
        console.log("⚠️ [Zone] ENTERING overlap zone! Ads:", inside);
        setInOverlap(true);
        setPanelVisible(true);
        startAdRotation(inside);
      }
    } else {
      if (inOverlapRef.current) {
        console.log("✅ [Zone] LEAVING overlap zone.");
        setInOverlap(false);
        stopAdRotation();
        setPanelVisible(false);
      }
      if (inside.length === 1) {
        const qi = adQueueRef.current.findIndex((a) => a.adId === inside[0]);
        if (qi !== -1) {
          console.log(`📍 [Zone] Single zone — showing ad index ${qi}, adId: ${inside[0]}`);
          setCurrentAdIndex(qi);
        }
      }
    }
  }, [startAdRotation, stopAdRotation]);

  // ─── Start / Stop ─────────────────────────────────────────────────────────
  const startSimulation = useCallback(() => {
    if (isRunning || route.length === 0) return;
    console.log("▶️ [Simulation] Starting simulation. Route length:", route.length);
    setIsRunning(true);
    moveTimerRef.current = setInterval(() => {
      setCurrentStep((s) => {
        const next = (s + 1) % routeRef.current.length;
        console.log(`🚗 [Simulation] Moving to step ${next} / ${routeRef.current.length - 1}`);
        return next;
      });
      checkZones();
    }, 2000);
  }, [isRunning, route.length, checkZones]);

  const stopSimulation = useCallback(() => {
    console.log("■ [Simulation] Stopping simulation.");
    setIsRunning(false);
    clearInterval(moveTimerRef.current);
    moveTimerRef.current = null;
    stopAdRotation();
    setInOverlap(false);
    setPanelVisible(false);
  }, [stopAdRotation]);

  useEffect(() => {
    return () => {
      clearInterval(moveTimerRef.current);
      clearInterval(adRotateTimerRef.current);
      clearInterval(countdownTimerRef.current);
    };
  }, []);

  const currentAd = adQueue[currentAdIndex] ?? null;

  // ─── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
        <p style={{ color: "#18B6A3", marginTop: 16, fontFamily: "sans-serif" }}>
          Loading simulation…
        </p>
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={styles.centered}>
        <div style={styles.errorBox}>
          <span style={{ fontSize: 40 }}>⚠️</span>
          <p style={{ color: "#333", marginTop: 12, fontSize: 15 }}>{error}</p>
          <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 6 }}>
            Open DevTools → Console for detailed debug logs.
          </p>
          <button style={styles.retryBtn} onClick={loadData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      {/* AppBar */}
      <div style={styles.appBar}>
        <button style={styles.backBtn} onClick={() => window.history.back()}>←</button>
        <span style={styles.appBarTitle}>Ad Simulation</span>
        <div style={{ ...styles.badge, background: inOverlap ? "#EF4444" : "#22C55E" }}>
          {inOverlap ? "OVERLAP ZONE" : "Single Zone"}
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} style={styles.map} />

      {/* Legend */}
      <div style={styles.legend}>
        <LegendRow color="#22C55E" label={`Vehicle Fence${vehicleFence.length === 0 ? " (not loaded)" : ""}`} />
        {Object.keys(adFenceMap).map((id, i) => {
          const ad = adQueue.find((a) => String(a.adId) === String(id));
          return (
            <LegendRow
              key={id}
              color={AD_COLORS[i % AD_COLORS.length]}
              label={ad?.adTitle ?? `Ad ${id}`}
            />
          );
        })}
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <button
          style={{ ...styles.ctrlBtn, background: isRunning ? "#aaa" : "#18B6A3" }}
          onClick={startSimulation}
          disabled={isRunning}
        >
          ▶ Start
        </button>
        <button
          style={{ ...styles.ctrlBtn, background: !isRunning ? "#aaa" : "#EF4444", marginTop: 8 }}
          onClick={stopSimulation}
          disabled={!isRunning}
        >
          ■ Stop
        </button>
      </div>

      {/* Bottom Panel */}
      <div style={styles.bottomWrapper}>
        {inOverlap && currentAd ? (
          <OverlapPanel
            adQueue={adQueue}
            currentAdIndex={currentAdIndex}
            currentAd={currentAd}
            secondsLeft={secondsLeft}
            panelVisible={panelVisible}
          />
        ) : (
          <NormalPanel
            vehicleReg={vehicleReg}
            currentStep={currentStep}
            routeLength={route.length}
            isRunning={isRunning}
            currentAd={currentAd}
          />
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function LegendRow({ color, label }) {
  return (
    <div style={styles.legendRow}>
      <div style={{ ...styles.legendDot, background: color }} />
      <span style={styles.legendLabel}>{label}</span>
    </div>
  );
}

function AdImageBox({ ad, large = false }) {
  const [imgError, setImgError] = useState(false);
  const size = large ? 90 : 72;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", padding: 12 }}>
      <div style={{
        width: size, height: size, borderRadius: 12,
        border: "1.5px solid rgba(24,182,163,0.4)", background: "#f3f4f6",
        overflow: "hidden", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {ad?.mediaPath && !imgError ? (
          <img
            src={ad.mediaPath}
            alt={ad.adTitle}
            onError={() => {
              console.warn(`🖼️ [AdImageBox] Image failed to load for ad "${ad.adTitle}": ${ad.mediaPath}`);
              setImgError(true);
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 28, color: "#aaa" }}>🖼</span>
        )}
      </div>
      <div style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
        <p style={styles.adLabel}>{large ? "Now Displaying" : "Active Ad"}</p>
        <p style={styles.adTitle}>{ad?.adTitle ?? "—"}</p>
        <p style={styles.adUrl} title={ad?.mediaPath}>{ad?.mediaPath || "No media URL"}</p>
      </div>
    </div>
  );
}

function NormalPanel({ vehicleReg, currentStep, routeLength, isRunning, currentAd }) {
  return (
    <div style={styles.card}>
      <div style={{ display: "flex", alignItems: "center", padding: 14 }}>
        <span style={{ fontSize: 28, marginRight: 12 }}>🚗</span>
        <div style={{ flex: 1 }}>
          <p style={styles.vehReg}>{vehicleReg || "Vehicle"}</p>
          <p style={styles.vehSub}>
            Step {currentStep + 1} / {routeLength} &nbsp;•&nbsp;{" "}
            {isRunning ? "Driving" : "Stopped"}
          </p>
        </div>
        <div style={{
          ...styles.statusPill,
          borderColor: isRunning ? "#22C55E" : "#9CA3AF",
          color: isRunning ? "#22C55E" : "#9CA3AF",
          background: isRunning ? "rgba(34,197,94,0.08)" : "rgba(156,163,175,0.08)",
        }}>
          {isRunning ? "Running" : "Idle"}
        </div>
      </div>
      {currentAd && (
        <>
          <div style={{ height: 1, background: "#e5e7eb" }} />
          <AdImageBox ad={currentAd} large={false} />
        </>
      )}
    </div>
  );
}

function OverlapPanel({ adQueue, currentAdIndex, currentAd, secondsLeft, panelVisible }) {
  return (
    <div style={{
      ...styles.overlapCard,
      transform: panelVisible ? "translateY(0)" : "translateY(100%)",
      transition: "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)",
    }}>
      <div style={styles.overlapHeader}>
        <span style={{ marginRight: 6 }}>⚠️</span>
        <span style={{ flex: 1, color: "#EF4444", fontWeight: 700, fontSize: 13 }}>
          Overlap Zone — Ad Queue Active
        </span>
        <span style={{ fontSize: 12, color: "#6B7280" }}>
          {currentAdIndex + 1} / {adQueue.length}
        </span>
      </div>
      <AdImageBox ad={currentAd} large={true} />
      {adQueue.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          {adQueue.map((_, i) => (
            <div key={i} style={{
              width: i === currentAdIndex ? 20 : 8, height: 8,
              borderRadius: 4,
              background: i === currentAdIndex ? "#18B6A3" : "#D1D5DB",
              margin: "0 4px", transition: "width 0.3s",
            }} />
          ))}
        </div>
      )}
      <div style={{ padding: "0 12px 12px" }}>
        <div style={styles.progressTrack}>
          <div style={{
            ...styles.progressFill,
            width: `${(secondsLeft / ROTATION_SECS) * 100}%`,
            transition: "width 1s linear",
          }} />
        </div>
        <p style={{ fontSize: 11, color: "#18B6A3", marginTop: 4, textAlign: "right" }}>
          Next ad in {secondsLeft}s
        </p>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  root: { position: "relative", width: "100%", height: "100vh", overflow: "hidden", fontFamily: "'Segoe UI', sans-serif" },
  appBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, height: 52, background: "#18B6A3", display: "flex", alignItems: "center", padding: "0 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" },
  backBtn: { background: "none", border: "none", color: "#000", fontSize: 20, cursor: "pointer", marginRight: 10, padding: 4 },
  appBarTitle: { flex: 1, fontWeight: 700, fontSize: 16, color: "#000" },
  badge: { borderRadius: 20, padding: "3px 10px", color: "#fff", fontSize: 11, fontWeight: 700 },
  map: { position: "absolute", top: 52, left: 0, right: 0, bottom: 0 },
  legend: { position: "absolute", top: 64, left: 12, zIndex: 5, background: "rgba(255,255,255,0.95)", borderRadius: 10, padding: "10px 12px", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" },
  legendRow: { display: "flex", alignItems: "center", marginBottom: 4 },
  legendDot: { width: 14, height: 14, borderRadius: 3, marginRight: 6, flexShrink: 0 },
  legendLabel: { fontSize: 11, color: "#374151" },
  controls: { position: "absolute", top: 64, right: 12, zIndex: 5, display: "flex", flexDirection: "column" },
  ctrlBtn: { border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, padding: "8px 16px", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.2)", transition: "background 0.2s" },
  bottomWrapper: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5, padding: "0 12px 12px" },
  card: { background: "#fff", borderRadius: 14, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", overflow: "hidden" },
  overlapCard: { background: "#fff", borderRadius: 16, boxShadow: "0 6px 20px rgba(0,0,0,0.18)", border: "1.5px solid rgba(24,182,163,0.5)", overflow: "hidden" },
  overlapHeader: { background: "#FEE2E2", padding: "8px 14px", display: "flex", alignItems: "center" },
  vehReg: { margin: 0, fontWeight: 700, fontSize: 15, color: "#111" },
  vehSub: { margin: "2px 0 0", fontSize: 12, color: "#6B7280" },
  statusPill: { border: "1px solid", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 700 },
  adLabel: { margin: 0, fontSize: 11, color: "#9CA3AF", fontWeight: 500 },
  adTitle: { margin: "3px 0 0", fontSize: 15, fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  adUrl: { margin: "3px 0 0", fontSize: 10, color: "#D1D5DB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  progressTrack: { height: 5, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", background: "#18B6A3", borderRadius: 4 },
  centered: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f9fafb" },
  spinner: { width: 40, height: 40, border: "4px solid #e5e7eb", borderTop: "4px solid #18B6A3", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  errorBox: { textAlign: "center", padding: 32, background: "#fff", borderRadius: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxWidth: 380 },
  retryBtn: { marginTop: 16, background: "#18B6A3", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
};

const styleTag = document.createElement("style");
styleTag.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleTag);