import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupApi } from "../../api/authapi";

const Signup = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "d" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      await signupApi({
        Name: form.name,
        Email: form.email,
        Password: form.password,
        role: form.role,
      });
      alert("Signup successful! Please login.");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.Message || err.response?.data || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>🚗</span>
          <span style={styles.logoText}>MovingAds</span>
        </div>
        <h2 style={styles.heading}>Create account</h2>
        <p style={styles.sub}>Join the MovingAds network</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <label style={styles.label}>Full Name</label>
        <input
          style={styles.input}
          type="text"
          placeholder="John Doe"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <label style={styles.label}>I am a...</label>
        <div style={styles.roleRow}>
          {[
            { value: "d", label: "🚗 Driver", desc: "I own vehicles" },
            { value: "a", label: "📢 Advertiser", desc: "I post ads" },
          ].map((r) => (
            <div
              key={r.value}
              style={{
                ...styles.roleCard,
                ...(form.role === r.value ? styles.roleCardActive : {}),
              }}
              onClick={() => setForm({ ...form, role: r.value })}
            >
              <div style={styles.roleLabel}>{r.label}</div>
              <div style={styles.roleDesc}>{r.desc}</div>
            </div>
          ))}
        </div>

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link to="/" style={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "20px",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
  },
  logoRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" },
  logoIcon: { fontSize: "28px" },
  logoText: { fontSize: "22px", fontWeight: "700", color: "#fff", letterSpacing: "1px" },
  heading: { color: "#fff", fontSize: "26px", margin: "0 0 6px", fontWeight: "700" },
  sub: { color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 24px" },
  label: { display: "block", color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px", marginTop: "16px", fontWeight: "500" },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  roleRow: { display: "flex", gap: "12px", marginTop: "8px" },
  roleCard: {
    flex: 1,
    padding: "14px",
    borderRadius: "12px",
    border: "2px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  roleCardActive: {
    border: "2px solid #764ba2",
    background: "rgba(118,75,162,0.2)",
  },
  roleLabel: { color: "#fff", fontWeight: "600", fontSize: "14px", marginBottom: "4px" },
  roleDesc: { color: "rgba(255,255,255,0.5)", fontSize: "12px" },
  btn: {
    width: "100%",
    padding: "13px",
    marginTop: "24px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  errorBox: {
    background: "rgba(255,80,80,0.15)",
    border: "1px solid rgba(255,80,80,0.4)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#ff6b6b",
    fontSize: "13px",
    marginBottom: "10px",
  },
  footerText: { color: "rgba(255,255,255,0.5)", fontSize: "13px", marginTop: "20px", textAlign: "center" },
  link: { color: "#a78bfa", textDecoration: "none", fontWeight: "600" },
};

export default Signup;
