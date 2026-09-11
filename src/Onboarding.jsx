import { useState } from "react";
import { supabase } from "./supabaseClient";

const ACCENT = "#E8622C";
const BG = "#1C1B1A";
const BG2 = "#242322";
const TEXT = "#F5F1EA";
const MUTED = "#8A8782";

function calcTargets({ sex, age, height, weight, activity, goal }) {
  const bmr =
    sex === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
  const activityMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  const tdee = bmr * activityMultipliers[activity];
  let calorieTarget = tdee;
  if (goal === "lose") calorieTarget = tdee - 500;
  if (goal === "gain") calorieTarget = tdee + 400;

  const proteinG = Math.round(weight * 1.8);
  const proteinCal = proteinG * 4;
  const fatCal = calorieTarget * 0.28;
  const fatG = Math.round(fatCal / 9);
  const carbCal = calorieTarget - proteinCal - fatCal;
  const carbG = Math.round(carbCal / 4);

  return {
    calorie_target: Math.round(calorieTarget),
    protein_target: proteinG,
    carb_target: carbG,
    fat_target: fatG,
  };
}

export default function Onboarding({ userId, onComplete }) {
  const [form, setForm] = useState({
    sex: "male",
    age: "",
    height: "",
    weight: "",
    targetWeight: "",
    activity: "moderate",
    goal: "lose",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = form.age && form.height && form.weight && form.targetWeight;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const fieldStyle = {
    background: "transparent",
    border: "none",
    borderBottom: `1px solid #3A3836`,
    color: TEXT,
    fontSize: "1.1rem",
    padding: "0.6rem 0",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  };
  const labelStyle = { color: MUTED, fontSize: "0.8rem", marginBottom: "0.3rem", display: "block" };
  const segBtn = (active) => ({
    flex: 1,
    padding: "0.7rem 0",
    background: active ? ACCENT : "transparent",
    color: active ? "#1C1B1A" : TEXT,
    border: `1px solid ${active ? ACCENT : "#3A3836"}`,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    fontSize: "0.95rem",
  });

  const submit = async () => {
    setSaving(true);
    setError("");

    const profileData = {
      sex: form.sex,
      age: Number(form.age),
      height: Number(form.height),
      weight: Number(form.weight),
      target_weight: Number(form.targetWeight),
      activity: form.activity,
      goal: form.goal,
    };
    const targets = calcTargets({
      sex: form.sex,
      age: Number(form.age),
      height: Number(form.height),
      weight: Number(form.weight),
      activity: form.activity,
      goal: form.goal,
    });

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...profileData, ...targets });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    // Also log the starting weight
    await supabase.from("weight_logs").insert({ user_id: userId, weight: Number(form.weight) });

    onComplete({ ...profileData, ...targets });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        color: TEXT,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "2rem 1.25rem 3rem",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ fontSize: "0.85rem", color: ACCENT, marginBottom: "0.4rem", fontWeight: 600 }}>
          Set up
        </div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
          A few numbers to build your plan
        </h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <label style={labelStyle}>Sex</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button style={segBtn(form.sex === "male")} onClick={() => setForm({ ...form, sex: "male" })}>Male</button>
            <button style={segBtn(form.sex === "female")} onClick={() => setForm({ ...form, sex: "female" })}>Female</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Age</label>
            <input style={fieldStyle} type="number" value={form.age} onChange={set("age")} placeholder="28" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Height (cm)</label>
            <input style={fieldStyle} type="number" value={form.height} onChange={set("height")} placeholder="175" />
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Current weight (kg)</label>
            <input style={fieldStyle} type="number" value={form.weight} onChange={set("weight")} placeholder="78" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Target weight (kg)</label>
            <input style={fieldStyle} type="number" value={form.targetWeight} onChange={set("targetWeight")} placeholder="72" />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Goal</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["lose", "maintain", "gain"].map((g) => (
              <button key={g} style={segBtn(form.goal === g)} onClick={() => setForm({ ...form, goal: g })}>
                {g[0].toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Activity level</label>
          <select value={form.activity} onChange={set("activity")} style={{ ...fieldStyle, cursor: "pointer" }}>
            <option value="sedentary" style={{ background: BG2 }}>Sedentary — desk job, little exercise</option>
            <option value="light" style={{ background: BG2 }}>Light — 1-3 workouts/week</option>
            <option value="moderate" style={{ background: BG2 }}>Moderate — 3-5 workouts/week</option>
            <option value="active" style={{ background: BG2 }}>Active — daily exercise</option>
          </select>
        </div>

        {error && <div style={{ color: "#D9603C", fontSize: "0.85rem" }}>{error}</div>}

        <button
          disabled={!canSubmit || saving}
          onClick={submit}
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: canSubmit ? ACCENT : "#3A3836",
            color: canSubmit ? "#1C1B1A" : MUTED,
            border: "none",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {saving ? "Saving..." : "Calculate my targets"}
        </button>
      </div>
    </div>
  );
}
