import React, { useEffect, useRef, useState } from "react";
import { Menu, X, Sun, Moon, Truck, LogOut, ChevronDown, UserRound } from "lucide-react";
import RippleButton from "./RippleButton";
import NotificationBell from "./NotificationBell";

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "pickups", label: "My pickups" },
  { id: "support", label: "Support" },
];

export default function Navbar({ page, setPage, theme, toggleTheme, profile, onLogout, onOpenPickup, onRequest }) {
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

  const go = (id) => { setPage(id); setOpen(false); setMenuOpen(false); };
  const request = () => { setOpen(false); onRequest(); };
  const isActive = (id) => page === id || (id === "pickups" && page === "pickup");
  const initials = (profile?.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const themeLabel = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <header className={`cg-nav-wrap ${scrolled ? "is-scrolled" : ""}`}>
      <div className="cg-nav glass">
        <button className="cg-logo" onClick={() => go("home")}>
          <span className="cg-logo-mark"><Truck size={16} strokeWidth={2.4} /></span>
          <span className="cg-logo-text">CarryGo</span>
        </button>

        <nav className="cg-nav-links" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => go(item.id)} className={`cg-nav-link ${isActive(item.id) ? "is-active" : ""}`}>{item.label}</button>
          ))}
        </nav>

        <button className="cg-theme-toggle" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}>
          {theme === "dark" ? <Sun size={16} strokeWidth={2.2} /> : <Moon size={16} strokeWidth={2.2} />}
        </button>
        <NotificationBell onOpenPickup={(id) => { setOpen(false); onOpenPickup(id); }} />

        <div className="cg-nav-cta">
          <RippleButton variant="primary" onClick={request} className="cg-btn-sm">Request pickup</RippleButton>
        </div>

        <div className="cg-account-menu" ref={menuRef}>
          <button className="cg-account-chip" onClick={() => setMenuOpen((m) => !m)} aria-label="Account menu" aria-expanded={menuOpen}>
            <span className="cg-account-avatar">{initials}</span>
            <ChevronDown size={13} />
          </button>
          {menuOpen && (
            <div className="cg-account-dropdown glass">
              <div className="cg-account-name">{profile.name}</div>
              <div className="cg-account-email">{profile.email}</div>
              <button className="cg-account-logout" onClick={() => go("profile")}><UserRound size={14} /> Profile</button>
              <button className="cg-account-logout" onClick={onLogout}><LogOut size={14} /> Log out</button>
            </div>
          )}
        </div>

        <button className="cg-nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="cg-nav-mobile glass">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => go(item.id)} className={`cg-nav-mobile-link ${isActive(item.id) ? "is-active" : ""}`}>{item.label}</button>
          ))}
          <button className="cg-nav-mobile-link" onClick={() => go("profile")}>Profile</button>
          <RippleButton variant="primary" onClick={request} className="cg-btn-full">Request pickup</RippleButton>
        </div>
      )}
    </header>
  );
}
