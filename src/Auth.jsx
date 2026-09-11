import { useState } from "react";
import { supabase } from "./supabaseClient";

const ACCENT = "#E8622C";
const BG = "#1C1B1A";
const TEXT = "#F5F1EA";
const MUTED = "#8A8782";

export default function Auth() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fieldStyle = {
    background: "transparent",
    border: "none",
    borderBottom: `1px solid #3A3836`,
    color: TEXT,
    fontSize: "1.05rem",
    padding: "0.7rem 0",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account, then sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        color: TEXT,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ fontSize: "0.85rem", color: ACCENT, fontWeight: 600, marginBottom: "0.4rem" }}>
          Track
        </div>
        <h1 style={{ fontSize: "1.7rem", fontWeight: 700, margin: "0 0 2rem" }}>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.3rem" }}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={fieldStyle}
          />
          <input
            type="password"
            placeholder="Password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={fieldStyle}
          />

          {error && (
            <div style={{ color: "#D9603C", fontSize: "0.85rem" }}>{error}</div>
          )}
          {message && (
            <div style={{ color: "#7A9B76", fontSize: "0.85rem" }}>{message}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.5rem",
              padding: "1rem",
              background: ACCENT,
              color: "#1C1B1A",
              border: "none",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setMessage("");
          }}
          style={{
            marginTop: "1.5rem",
            background: "none",
            border: "none",
            color: MUTED,
            fontSize: "0.9rem",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
