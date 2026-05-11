import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginApi } from "../../api/authapi";
import { setUserSession } from "../../utils/session";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      const user = res.data;
      setUserSession(user);
      if (user.role === "a") {
        navigate("/advertiser");
      } else if (user.role === "d") {
        navigate("/driver");
      } else if (user.role === "g") {
        navigate("/agency");
      }
    } catch (err) {
      setError(err.response?.data?.Message || err.response?.data || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>🚗</span>
          <span style={styles.logoText}>MovingAds</span>
        </div>
        <h2 style={styles.heading}>Welcome back</h2>
        <p style={styles.sub}>Sign in to your account</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p style={styles.footerText}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.link}>
            Sign up
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
    maxWidth: "420px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "24px",
  },
  logoIcon: { fontSize: "28px" },
  logoText: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "1px",
  },
  heading: {
    color: "#fff",
    fontSize: "26px",
    margin: "0 0 6px",
    fontWeight: "700",
  },
  sub: { color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 24px" },
  label: {
    display: "block",
    color: "rgba(255,255,255,0.7)",
    fontSize: "13px",
    marginBottom: "6px",
    marginTop: "16px",
    fontWeight: "500",
  },
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
    letterSpacing: "0.5px",
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

export default Login;
