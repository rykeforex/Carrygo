import React from "react";
import { Truck, PackageSearch, CarFront } from "lucide-react";
import CopyrightSecret from "../components/CopyrightSecret";

export default function LandingChooser({ onPick }) {
  return (
    <div className="cg-chooser">
      <div className="cg-chooser-inner">
        <div className="cg-chooser-brand">
          <span className="cg-logo-mark"><Truck size={18} strokeWidth={2.4} /></span>
          <span className="cg-chooser-brand-text">CarryGo</span>
        </div>

        <h1>Two apps, one platform.</h1>
        <p className="cg-chooser-sub">
          Customers and collectors sign in separately, see different tools, and never share a dashboard.
        </p>

        <div className="cg-chooser-grid">
          <button className="cg-chooser-card glass" onClick={() => onPick("customer")}>
            <span className="cg-chooser-icon cg-chooser-icon-customer"><PackageSearch size={22} /></span>
            <h3>Book a pickup</h3>
            <p>Request waste pickups, track them live on a map, and rate your collector.</p>
            <span className="cg-chooser-cta">Continue as a customer →</span>
          </button>
          <button className="cg-chooser-card glass" onClick={() => onPick("collector")}>
            <span className="cg-chooser-icon cg-chooser-icon-collector"><CarFront size={22} /></span>
            <h3>Drive for CarryGo</h3>
            <p>Apply, get approved by CarryGo, then accept nearby pickups.</p>
            <span className="cg-chooser-cta">Continue as a collector →</span>
          </button>
        </div>

        {/* Staff sign-in is intentionally not listed anywhere. Press and hold the copyright line. */}
        <CopyrightSecret onUnlock={() => onPick("staff")} />
      </div>
    </div>
  );
}
