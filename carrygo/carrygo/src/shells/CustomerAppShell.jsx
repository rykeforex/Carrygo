import React, { useCallback, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RootFrame from "../components/RootFrame";
import HomePage from "../pages/HomePage";
import PickupsPage from "../pages/PickupsPage";
import PickupDetailPage from "../pages/PickupDetailPage";
import SupportPage from "../pages/SupportPage";
import ProfilePage from "../pages/ProfilePage";
import AboutPage from "../pages/AboutPage";
import TermsPage from "../pages/TermsPage";
import PrivacyPage from "../pages/PrivacyPage";
import { NotificationsProvider } from "../context/NotificationsContext";

export default function CustomerAppShell({ profile, onLogout }) {
  const [page, setPage] = useState("home");
  const [pickupId, setPickupId] = useState(null);
  const [theme, setTheme] = useState("light");

  const go = useCallback((id) => { setPage(id); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  const openPickup = useCallback((id) => { setPickupId(id); setPage("pickup"); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  const request = useCallback(() => {
    setPage("home");
    setTimeout(() => document.getElementById("cg-book")?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);
  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <NotificationsProvider userId={profile.id}>
      <RootFrame theme={theme}>
        <Navbar page={page} setPage={go} theme={theme} toggleTheme={toggleTheme} profile={profile} onLogout={onLogout} onOpenPickup={openPickup} onRequest={request} />
        <main key={`${page}:${pickupId || ""}`} className="cg-page-transition">
          {page === "home" && <HomePage setPage={go} theme={theme} openPickup={openPickup} />}
          {page === "pickups" && <PickupsPage userId={profile.id} onOpenPickup={openPickup} onRequest={request} />}
          {page === "pickup" && <PickupDetailPage pickupId={pickupId} theme={theme} onBack={() => go("pickups")} />}
          {page === "support" && <SupportPage />}
          {page === "profile" && <ProfilePage />}
          {page === "about" && <AboutPage />}
          {page === "terms" && <TermsPage />}
          {page === "privacy" && <PrivacyPage />}
        </main>
        <Footer setPage={go} />
      </RootFrame>
    </NotificationsProvider>
  );
}
