import React, { useCallback, useState } from "react";
import CollectorNavbar from "../components/CollectorNavbar";
import Footer from "../components/Footer";
import RootFrame from "../components/RootFrame";
import CollectorDashboard from "../features/CollectorDashboard";
import CollectorHistory from "../features/CollectorHistory";
import AboutPage from "../pages/AboutPage";
import TermsPage from "../pages/TermsPage";
import PrivacyPage from "../pages/PrivacyPage";
import { NotificationsProvider } from "../context/NotificationsContext";

export default function CollectorAppShell({ profile, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [theme, setTheme] = useState("dark");
  const go = useCallback((id) => { setPage(id); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <NotificationsProvider userId={profile.id}>
      <RootFrame theme={theme} className="cg-role-collector">
        <CollectorNavbar page={page} setPage={go} theme={theme} toggleTheme={toggleTheme} profile={profile} onLogout={onLogout} />
        <main key={page} className="cg-page-transition">
          {page === "dashboard" && <CollectorDashboard theme={theme} profile={profile} />}
          {page === "history" && <CollectorHistory profile={profile} />}
          {page === "about" && <AboutPage />}
          {page === "terms" && <TermsPage />}
          {page === "privacy" && <PrivacyPage />}
        </main>
        <Footer setPage={go} variant="collector" />
      </RootFrame>
    </NotificationsProvider>
  );
}
