/**
 * SimulateAdsButton.jsx
 *
 * Drop this anywhere in your Agency dashboard.
 * Pass the `agency` object as a prop.
 *
 * Usage:
 *   import SimulateAdsButton from "./SimulateAdsButton";
 *   <SimulateAdsButton agency={agency} />
 */

import { useState } from "react";
import SimulationForm from "./AdSimulationForm";

export default function SimulateAdsButton({ agency }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#f5f7fa" }}>
        <SimulationForm agency={agency} onClose={() => setOpen(false)} />
      </div>
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 9,
        background: "linear-gradient(135deg,#00c4aa,#00a896)",
        color: "white", border: "none", borderRadius: 14,
        padding: "11px 20px", fontSize: 14, fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(0,196,170,.4)",
        transition: "transform .15s, box-shadow .15s",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,196,170,.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,196,170,.4)";
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
      Simulate Ads
    </button>
  );
}