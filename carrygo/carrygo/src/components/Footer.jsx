import React from "react";
import { Truck } from "lucide-react";
import { BRAND } from "../config/brand";

export default function Footer({ setPage, variant = "customer" }) {
  const go = (id) => {
    setPage(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <footer className="cg-footer">
      <div className="cg-footer-inner glass">
        <div className="cg-footer-brand">
          <span className="cg-logo-mark small"><Truck size={14} strokeWidth={2.4} /></span>
          <div>
            <div className="cg-footer-name">{BRAND.name}{variant === "collector" ? " Collector" : ""}</div>
            <div className="cg-footer-tag">Powered by {BRAND.owner}</div>
          </div>
        </div>
        <div className="cg-footer-links">
          {variant === "customer" && <button onClick={() => go("pickups")}>My pickups</button>}
          {variant === "customer" && <button onClick={() => go("support")}>Support</button>}
          {variant === "collector" && <button onClick={() => go("dashboard")}>Dashboard</button>}
          {variant === "collector" && <button onClick={() => go("history")}>History</button>}
          <button onClick={() => go("about")}>About</button>
          <button onClick={() => go("terms")}>Terms &amp; conditions</button>
          <button onClick={() => go("privacy")}>Privacy policy</button>
        </div>
        <div className="cg-footer-copy">
          © {new Date().getFullYear()} {BRAND.owner}. {BRAND.name} is a product of {BRAND.owner}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
