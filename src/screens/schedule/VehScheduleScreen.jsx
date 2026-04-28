import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserSession } from "../../utils/session";
import { saveVehicleScheduleApi } from "../../api/authapi";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_SLOTS = [
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "2:00 PM - 4:00 PM",
  "5:00 PM - 8:00 PM",
  "8:00 PM - 10:00 PM",
];

const VehScheduleScreen = () => {
  const navigate = useNavigate();
  const user = getUserSession();

  const { vehReg } = useParams();

  const [slots, setSlots] = useState(DEFAULT_SLOTS);
  const [selected, setSelected] = useState({});
  const [newSlot, setNewSlot] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) {
    navigate("/");
    return null;
  }

  const toggle = (day, slot) => {
    const key = `${day}-${slot}`;

    setSelected((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const addSlot = () => {
    const value = newSlot.trim();

    if (!value) {
      alert("Please enter a slot");
      return;
    }

    if (slots.includes(value)) {
      alert("Slot already exists");
      return;
    }

    setSlots((prev) => [...prev, value]);
    setNewSlot("");
  };


    const saveSchedule = async () => {
        try {
            setSaving(true);

            if (!vehReg) {
            alert("Vehicle Registration not found");
            return;
            }

            const payload = slots
            .map((slot) => {
                let bits = "";

                DAYS.forEach((day) => {
                const key = `${day}-${slot}`;
                bits += selected[key] ? "1" : "0";
                });

                return {
                VehReg: vehReg,
                SlotName: slot,
                Bits: bits,
                };
            })

            // ONLY save slots having at least one selected day
            .filter((item) => item.Bits.includes("1"));

            if (payload.length === 0) {
            alert("Please select at least one vehicle schedule slot");
            return;
            }

            console.log("Saving Vehicle Schedule Payload:", payload);

            await saveVehicleScheduleApi(payload);

            alert("Vehicle Schedule saved successfully!");
            navigate(-1);
        } catch (err) {
            console.log("Save Vehicle Schedule Error:", err);
            alert("Failed to save vehicle schedule");
        } finally {
            setSaving(false);
        }
    };




  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>🚗 Vehicle Schedule</h2>
          <p style={styles.sub}>
            Select weekly available slots for this Vehicle
          </p>

          <p style={styles.vehicleText}>
            Vehicle Reg: <strong>{vehReg}</strong>
          </p>
        </div>

        {/* Add Custom Slot */}
        <div style={styles.addRow}>
          <input
            value={newSlot}
            onChange={(e) => setNewSlot(e.target.value)}
            placeholder="Add custom slot e.g. 2:30 PM - 4:00 PM"
            style={styles.input}
          />

          <button style={styles.addBtn} onClick={addSlot}>
            + Add Slot
          </button>
        </div>

        {/* Schedule Grid */}
        <div style={styles.grid}>
          {/* Days Header */}
          <div style={styles.row}>
            <div></div>

            {DAYS.map((day) => (
              <div key={day} style={styles.day}>
                {day}
              </div>
            ))}
          </div>

          {/* Slot Rows */}
          {slots.map((slot) => (
            <div key={slot} style={styles.row}>
              <div style={styles.slot}>{slot}</div>

              {DAYS.map((day) => {
                const key = `${day}-${slot}`;

                return (
                  <div
                    key={key}
                    onClick={() => toggle(day, slot)}
                    style={{
                      ...styles.cell,
                      background: selected[key]
                        ? "#22c55e"
                        : "#1f2937",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Save Button */}
        <button
          style={{
            ...styles.saveBtn,
            opacity: saving ? 0.7 : 1,
          }}
          onClick={saveSchedule}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Vehicle Schedule"}
        </button>
      </div>
    </div>
  );
};

export default VehScheduleScreen;

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f0f1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 1000,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 24,
    backdropFilter: "blur(10px)",
  },

  header: {
    marginBottom: 24,
  },

  title: {
    color: "#fff",
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
  },

  sub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    marginTop: 6,
  },

  vehicleText: {
    color: "#60a5fa",
    marginTop: 10,
    fontSize: 15,
    fontWeight: 600,
  },

  addRow: {
    display: "flex",
    gap: 10,
    marginBottom: 24,
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#111827",
    color: "#fff",
    outline: "none",
    fontSize: 14,
  },

  addBtn: {
    padding: "12px 18px",
    borderRadius: 10,
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },

  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  row: {
    display: "grid",
    gridTemplateColumns: "220px repeat(7, 1fr)",
    gap: 8,
    alignItems: "center",
  },

  day: {
    color: "#fff",
    textAlign: "center",
    fontSize: 13,
    opacity: 0.8,
    fontWeight: 600,
  },

  slot: {
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
  },

  cell: {
    height: 40,
    borderRadius: 8,
    cursor: "pointer",
    transition: "0.2s",
  },

  saveBtn: {
    marginTop: 28,
    width: "100%",
    padding: 14,
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
};