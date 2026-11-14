import React, { useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import RootFrame from "../components/RootFrame";
import AdminApplicationsPage from "../pages/AdminApplicationsPage";

// Minimal admin shell. The full console (pricing, payments, analytics, reports) is Phase 6.
export default function AdminShell({ profile, onLogout }) {
  const [theme] = useState("light");
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
