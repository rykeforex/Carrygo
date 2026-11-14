import React, { useEffect, useRef, useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import RootFrame from "../components/RootFrame";
import AdminApplicationsPage from "../pages/AdminApplicationsPage";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const IDLE_LIMIT_MS = 15 * 60 * 1000; // auto sign-out after 15 minutes without activity
const RECHECK_MS = 5 * 60 * 1000;     // re-confirm the admin role with the database every 5 minutes
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"];

// Minimal admin shell. The full console (pricing, payments, analytics, reports) is Phase 6.
// Real protection is server-side (every admin action checks private.is_admin() in the database);
// this shell adds a session auto-lock and a periodic role re-check on top.
export default function AdminShell({ profile, onLogout }) {
  const [theme] = useState("light");
  const { refreshProfile } = useAuth();
  const { showToast } = useToast();
  const lastActive = useRef(Date.now());

  useEffect(() => {
    const touch = () => { lastActive.current = Date.now(); };
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, touch, { passive: true }));

    const idleCheck = setInterval(() => {
      if (Date.now() - lastActive.current > IDLE_LIMIT_MS) {
        showToast("Signed out after 15 minutes of inactivity.", "info");
        onLogout();
      }
    }, 20_000);

    // If this account is demoted or suspended while signed in, the profile reload routes it away.
    const roleCheck = setInterval(() => { refreshProfile(); }, RECHECK_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastActive.current > IDLE_LIMIT_MS) {
        showToast("Signed out after 15 minutes of inactivity.", "info");
        onLogout();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, touch));
      clearInterval(idleCheck);
      clearInterval(roleCheck);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [onLogout, refreshProfile, showToast]);

  return (
    <RootFrame theme={theme}>
      <header className="cg-nav-wrap">
        <div className="cg-nav glass">
          <span className="cg-logo"><span className="cg-logo-mark"><ShieldCheck size={16} /></span><span className="cg-logo-text">CarryGo Admin</span></span>
          <span className="cg-nav-links" />
          <span className="cg-account-email cg-admin-who">{profile.email}</span>
          <button className="cg-account-logout cg-admin-logout" onClick={onLogout}><LogOut size={14} /> Log out</button>
        </div>
      </header>
      <main className="cg-page-transition"><AdminApplicationsPage /></main>
    </RootFrame>
  );
}
