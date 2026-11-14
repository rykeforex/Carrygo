import React, { useEffect, useRef, useState } from "react";
import { Menu, X, Sun, Moon, LogOut, ChevronDown, CarFront } from "lucide-react";
import NotificationBell from "./NotificationBell";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "history", label: "History" },
];

export default function CollectorNavbar({ page, setPage, theme, toggleTheme, profile, onLogout }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (id) => { setPage(id); setOpen(false); };
  const initials = (profile?.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const themeLabel = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <header className={`cg-nav-wrap ${scrolled ? "is-scrolled" : ""}`}>
      <div className="cg-nav glass cg-nav-collector">
        <button className="cg-logo" onClick={() => go("dashboard")}>
          <span className="cg-logo-mark cg-logo-mark-collector"><CarFront size={16} strokeWidth={2.4} /></span>
          <span className="cg-logo-text">CarryGo <span className="cg-logo-suffix">Collector</span></span>
        </button>
        <nav className="cg-nav-links" aria-label="Main">
          {NAV_ITEMS.map((item) => <button key={item.id} onClick={() => go(item.id)} className={`cg-nav-link ${page === item.id ? "is-active" : ""}`}>{item.label}</button>)}
        </nav>
        <button className="cg-theme-toggle" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}>
          {theme === "dark" ? <Sun size={16} strokeWidth={2.2} /> : <Moon size={16} strokeWidth={2.2} />}
        </button>
        <NotificationBell onOpenPickup={() => go("dashboard")} />
        <div className="cg-account-menu" ref={menuRef}>
          <button className="cg-account-chip" onClick={() => setMenuOpen((m) => !m)} aria-label="Account menu" aria-expanded={menuOpen}>
            <span className="cg-account-avatar cg-account-avatar-collector">{initials}</span><ChevronDown size={13} />
          </button>
          {menuOpen && (
            <div className="cg-account-dropdown glass">
              <div className="cg-account-name">{profile?.name}</div>
              <div className="cg-account-email">{profile?.email}</div>
              {profile?.vehicleType && <div className="cg-account-meta">{profile.vehicleType}</div>}
              <button className="cg-account-logout" onClick={onLogout}><LogOut size={14} /> Log out</button>
            </div>
          )}
        </div>
        <button className="cg-nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {open && (
        <div className="cg-nav-mobile glass">
          {NAV_ITEMS.map((item) => <button key={item.id} onClick={() => go(item.id)} className={`cg-nav-mobile-link ${page === item.id ? "is-active" : ""}`}>{item.label}</button>)}
          <button className="cg-nav-mobile-link" onClick={onLogout}><LogOut size={16} /> Log out ({profile?.name})</button>
        </div>
      )}
    </header>
  );
}
