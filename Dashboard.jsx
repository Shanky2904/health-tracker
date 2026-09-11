import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Footprints, Scale, Target, X, Trash2, LogOut } from "lucide-react";
import { supabase } from "./supabaseClient";

const ACCENT = "#E8622C";
const GOOD = "#7A9B76";
const BG = "#1C1B1A";
const BG2 = "#242322";
const TEXT = "#F5F1EA";
const MUTED = "#8A8782";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function ProgressBar({ label, value, target, unit, color }) {
  const pct = Math.min(100, (value / target) * 100 || 0);
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
        <span style={{ fontSize: "0.85rem", color: MUTED }}>{label}</span>
        <span style={{ fontSize: "0.85rem", color: TEXT }}>
          {Math.round(value)}
          <span style={{ color: MUTED }}> / {target}{unit}</span>
        </span>
      </div>
      <div style={{ height: 6, background: "#3A3836", width: "100%" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 0.3s ease" }} />
      </div>
    </div>
  );
}

function AddFoodModal({ onAdd, onClose, quickList }) {
  const [form, setForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const fieldStyle = {
    background: "transparent", border: "none", borderBottom: `1px solid #3A3836`,
    color: TEXT, fontSize: "1rem", padding: "0.5rem 0", width: "100%", outline: "none", fontFamily: "inherit",
  };
  const canAdd = form.name && form.calories;

  const submit = () => {
    if (!canAdd) return;
    onAdd({
      name: form.name,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", zIndex: 50 }} onClick={onClose}>
      <div style={{ background: BG2, width: "100%", maxWidth: 480, margin: "0 auto", padding: "1.5rem 1.25rem 2rem", borderTop: `1px solid #3A3836` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Log food</h2>
          <X size={20} color={MUTED} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        {quickList.length > 0 && (
          <div style={{ marginBottom: "1.3rem" }}>
            <div style={{ fontSize: "0.8rem", color: MUTED, marginBottom: "0.5rem" }}>Quick add</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {quickList.map((item, i) => (
                <button key={i} onClick={() => { onAdd(item); onClose(); }} style={{ padding: "0.5rem 0.8rem", background: "transparent", border: "1px solid #3A3836", color: TEXT, fontSize: "0.85rem", cursor: "pointer" }}>
                  {item.name} · {item.calories} cal
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input style={fieldStyle} placeholder="Food name" value={form.name} onChange={set("name")} />
          <input style={fieldStyle} type="number" placeholder="Calories" value={form.calories} onChange={set("calories")} />
          <div style={{ display: "flex", gap: "1rem" }}>
            <input style={fieldStyle} type="number" placeholder="Protein (g)" value={form.protein} onChange={set("protein")} />
            <input style={fieldStyle} type="number" placeholder="Carbs (g)" value={form.carbs} onChange={set("carbs")} />
            <input style={fieldStyle} type="number" placeholder="Fat (g)" value={form.fat} onChange={set("fat")} />
          </div>
        </div>

        <button disabled={!canAdd} onClick={submit} style={{ marginTop: "1.5rem", width: "100%", padding: "0.9rem", background: canAdd ? ACCENT : "#3A3836", color: canAdd ? "#1C1B1A" : MUTED, border: "none", fontSize: "0.95rem", fontWeight: 700, cursor: canAdd ? "pointer" : "not-allowed" }}>
          Add to today
        </button>
      </div>
    </div>
  );
}

function LogWeightModal({ onAdd, onClose }) {
  const [weight, setWeight] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", zIndex: 50 }} onClick={onClose}>
      <div style={{ background: BG2, width: "100%", maxWidth: 480, margin: "0 auto", padding: "1.5rem 1.25rem 2rem", borderTop: `1px solid #3A3836` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Log weight</h2>
          <X size={20} color={MUTED} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
        <input
          type="number" autoFocus value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Weight (kg)"
          style={{ background: "transparent", border: "none", borderBottom: `1px solid #3A3836`, color: TEXT, fontSize: "1.5rem", padding: "0.5rem 0", width: "100%", outline: "none", fontFamily: "inherit" }}
        />
        <button disabled={!weight} onClick={() => { onAdd(Number(weight)); onClose(); }} style={{ marginTop: "1.5rem", width: "100%", padding: "0.9rem", background: weight ? ACCENT : "#3A3836", color: weight ? "#1C1B1A" : MUTED, border: "none", fontSize: "0.95rem", fontWeight: 700, cursor: weight ? "pointer" : "not-allowed" }}>
          Save
        </button>
      </div>
    </div>
  );
}

export default function Dashboard({ userId, profile }) {
  const [foods, setFoods] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);
  const [steps, setSteps] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(profile.weight);
  const [weightHistory, setWeightHistory] = useState([]);
  const [showAddFood, setShowAddFood] = useState(false);
  const [showLogWeight, setShowLogWeight] = useState(false);
  const [stepsEditing, setStepsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const today = todayStr();

    const [foodRes, stepRes, weightRes, recentFoodRes] = await Promise.all([
      supabase.from("food_logs").select("*").eq("user_id", userId).gte("logged_at", `${today}T00:00:00`).order("logged_at", { ascending: true }),
      supabase.from("step_logs").select("*").eq("user_id", userId).eq("log_date", today).maybeSingle(),
      supabase.from("weight_logs").select("*").eq("user_id", userId).order("logged_at", { ascending: false }).limit(1),
      supabase.from("food_logs").select("*").eq("user_id", userId).order("logged_at", { ascending: false }).limit(20),
    ]);

    if (foodRes.data) setFoods(foodRes.data);
    if (stepRes.data) setSteps(stepRes.data.steps);
    if (weightRes.data && weightRes.data[0]) setCurrentWeight(weightRes.data[0].weight);
    if (recentFoodRes.data) {
      const seen = new Map();
      recentFoodRes.data.forEach((f) => seen.set(f.name, f));
      setRecentFoods(Array.from(seen.values()).slice(0, 5));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const consumed = useMemo(
    () =>
      foods.reduce(
        (acc, f) => ({
          calories: acc.calories + f.calories,
          protein: acc.protein + Number(f.protein),
          carbs: acc.carbs + Number(f.carbs),
          fat: acc.fat + Number(f.fat),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [foods]
  );

  const stepsCaloriesBurned = Math.round(steps * 0.04);
  const remaining = profile.calorie_target - consumed.calories + stepsCaloriesBurned;

  const startWeight = profile.weight;
  const targetWeight = profile.target_weight;
  const totalToGo = Math.abs(targetWeight - startWeight);
  const progressSoFar = Math.abs(currentWeight - startWeight);

  const dailyDeficitTarget = profile.goal === "lose" ? 500 : profile.goal === "gain" ? -400 : 0;
  const weeklyChangeKg = (dailyDeficitTarget * 7) / 7700;
  const remainingKg = Math.abs(targetWeight - currentWeight);
  const weeksToGoal = weeklyChangeKg > 0 ? Math.ceil(remainingKg / weeklyChangeKg) : null;
  const goalDate = weeksToGoal
    ? new Date(Date.now() + weeksToGoal * 7 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const addFood = async (food) => {
    const { data, error } = await supabase
      .from("food_logs")
      .insert({ user_id: userId, ...food })
      .select()
      .single();
    if (!error && data) setFoods([...foods, data]);
  };

  const removeFood = async (id) => {
    await supabase.from("food_logs").delete().eq("id", id);
    setFoods(foods.filter((f) => f.id !== id));
  };

  const saveSteps = async (val) => {
    const stepsVal = Number(val) || 0;
    setSteps(stepsVal);
    setStepsEditing(false);
    await supabase.from("step_logs").upsert(
      { user_id: userId, steps: stepsVal, log_date: todayStr() },
      { onConflict: "user_id,log_date" }
    );
  };

  const addWeight = async (w) => {
    setCurrentWeight(w);
    await supabase.from("weight_logs").insert({ user_id: userId, weight: w });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const statTile = { background: BG2, padding: "1rem", flex: 1, cursor: "pointer" };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, color: MUTED, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 480, margin: "0 auto", paddingBottom: "5rem" }}>
      <div style={{ padding: "1.75rem 1.25rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "0.8rem", color: MUTED, marginBottom: "0.3rem" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontSize: "3.2rem", fontWeight: 800, lineHeight: 1, color: remaining < 0 ? "#D9603C" : TEXT }}>
              {Math.abs(Math.round(remaining))}
            </span>
            <span style={{ fontSize: "1rem", color: MUTED }}>cal {remaining < 0 ? "over" : "remaining"}</span>
          </div>
          <div style={{ fontSize: "0.85rem", color: MUTED, marginTop: "0.4rem" }}>
            {consumed.calories} consumed · {stepsCaloriesBurned} burned from steps · {profile.calorie_target} target
          </div>
        </div>
        <LogOut size={18} color={MUTED} style={{ cursor: "pointer", marginTop: "0.3rem" }} onClick={signOut} />
      </div>

      <div style={{ padding: "0.5rem 1.25rem 1.5rem", borderBottom: `1px solid #2E2C2A` }}>
        <ProgressBar label="Protein" value={consumed.protein} target={profile.protein_target} unit="g" color={ACCENT} />
        <ProgressBar label="Carbs" value={consumed.carbs} target={profile.carb_target} unit="g" color="#C9A876" />
        <ProgressBar label="Fat" value={consumed.fat} target={profile.fat_target} unit="g" color="#8A9BC9" />
      </div>

      {weeksToGoal && (
        <div style={{ padding: "1.25rem", borderBottom: `1px solid #2E2C2A` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <Target size={16} color={GOOD} />
            <span style={{ fontSize: "0.8rem", color: MUTED }}>Estimated time to goal</span>
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>
            ~{weeksToGoal} week{weeksToGoal !== 1 ? "s" : ""}{" "}
            <span style={{ color: MUTED, fontWeight: 400, fontSize: "1rem" }}>· around {goalDate}</span>
          </div>
          <div style={{ height: 4, background: "#3A3836", width: "100%", marginTop: "0.6rem" }}>
            <div style={{ height: "100%", width: `${Math.min(100, (progressSoFar / (totalToGo || 1)) * 100)}%`, background: GOOD }} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "1px", background: "#2E2C2A", marginTop: "1px" }}>
        <div style={statTile} onClick={() => setStepsEditing(true)}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: MUTED, fontSize: "0.8rem", marginBottom: "0.4rem" }}>
            <Footprints size={14} /> Steps
          </div>
          {stepsEditing ? (
            <input
              autoFocus type="number" defaultValue={steps}
              onBlur={(e) => saveSteps(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
              style={{ background: "transparent", border: "none", borderBottom: `1px solid ${ACCENT}`, color: TEXT, fontSize: "1.4rem", fontWeight: 700, width: "100%", outline: "none", fontFamily: "inherit" }}
            />
          ) : (
            <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{steps.toLocaleString()}</div>
          )}
        </div>
        <div style={statTile} onClick={() => setShowLogWeight(true)}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: MUTED, fontSize: "0.8rem", marginBottom: "0.4rem" }}>
            <Scale size={14} /> Weight
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>
            {currentWeight} <span style={{ fontSize: "0.9rem", color: MUTED, fontWeight: 400 }}>kg</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "1.5rem 1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Today's food</span>
          <span style={{ fontSize: "0.8rem", color: MUTED }}>{foods.length} logged</span>
        </div>

        {foods.length === 0 ? (
          <div style={{ color: MUTED, fontSize: "0.9rem", padding: "1.5rem 0", textAlign: "center", border: "1px dashed #3A3836" }}>
            Nothing logged yet today.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
            {foods.map((f) => (
              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.7rem 0", borderBottom: "1px solid #2E2C2A" }}>
                <div>
                  <div style={{ fontSize: "0.95rem" }}>{f.name}</div>
                  <div style={{ fontSize: "0.78rem", color: MUTED }}>P{f.protein} · C{f.carbs} · F{f.fat}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                  <span style={{ fontSize: "0.95rem", color: TEXT }}>{f.calories} cal</span>
                  <Trash2 size={15} color={MUTED} style={{ cursor: "pointer" }} onClick={() => removeFood(f.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowAddFood(true)}
        style={{ position: "fixed", bottom: "1.5rem", right: "50%", transform: "translateX(50%) translateX(190px)", width: 56, height: 56, borderRadius: "50%", background: ACCENT, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px rgba(232,98,44,0.4)" }}
      >
        <Plus size={26} color="#1C1B1A" strokeWidth={2.5} />
      </button>

      {showAddFood && <AddFoodModal quickList={recentFoods} onAdd={addFood} onClose={() => setShowAddFood(false)} />}
      {showLogWeight && <LogWeightModal onAdd={addWeight} onClose={() => setShowLogWeight(false)} />}
    </div>
  );
}
