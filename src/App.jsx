import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth.jsx";
import Onboarding from "./Onboarding.jsx";
import Dashboard from "./Dashboard.jsx";

const BG = "#1C1B1A";
const MUTED = "#8A8782";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [profile, setProfile] = useState(undefined); // undefined = loading, null = needs onboarding

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setProfile(undefined);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data || null);
      });
  }, [session]);

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: BG, color: MUTED, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        Loading...
      </div>
    );
  }

  if (!session) return <Auth />;

  if (profile === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: BG, color: MUTED, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <Onboarding
        userId={session.user.id}
        onComplete={(newProfile) => setProfile({ id: session.user.id, ...newProfile })}
      />
    );
  }

  return <Dashboard userId={session.user.id} profile={profile} />;
}
