import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";

const AuthContext = createContext(null);

export function explainAuthError(err) {
  const m = (err?.message || "").toLowerCase();
  if (m.includes("invalid login")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox.";
  if (m.includes("already registered")) return "An account with this email already exists.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a few minutes and try again.";
  if (m.includes("password") && m.includes("least")) return "That password is too short.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Network problem — check your connection and try again.";
  return err?.message || "Something went wrong. Please try again.";
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(supabaseConfigured);
  const [recovery, setRecovery] = useState(false);
  const [profile, setProfile] = useState(null);
  const [collectorApp, setCollectorApp] = useState(null);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const uid = session?.user?.id;

  const loadProfile = useCallback(async () => {
    if (!supabase || !uid) {
      setProfile(null);
      setCollectorApp(null);
      return;
    }
    setProfileError(null);
    const [p, a] = await Promise.all([
      supabase.from("profiles").select("id, role, full_name, phone, is_suspended").eq("id", uid).maybeSingle(),
      supabase.rpc("my_collector_application"),
    ]);
    if (p.error || !p.data) {
      setProfile(null);
      setProfileError(p.error?.message || "Your profile could not be loaded.");
    } else {
      setProfile(p.data);
    }
    setCollectorApp(a.data?.[0] ?? null);
  }, [uid]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });

  const signUp = async ({ email, password, fullName, applyCollector, vehicleType }) => {
    const data = { full_name: fullName };
    if (applyCollector) {
      data.apply_collector = "true";
      data.vehicle_type = vehicleType;
    }
    const res = await supabase.auth.signUp({
      email,
      password,
      options: { data, emailRedirectTo: window.location.origin },
    });
    return { error: res.error, needsConfirmation: !res.error && !res.data.session };
  };

  const sendReset = (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  const updatePassword = (password) => supabase.auth.updateUser({ password });
  const finishRecovery = () => setRecovery(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setCollectorApp(null);
  };

  const loading = booting || (!!uid && !profile && !profileError);

  return (
    <AuthContext.Provider
      value={{
        configured: supabaseConfigured, loading, session, profile, collectorApp, profileError, recovery,
        signIn, signUp, sendReset, updatePassword, finishRecovery, signOut, refreshProfile: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
