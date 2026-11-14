import React from "react";
import RippleButton from "../components/RippleButton";

// Generic full-page status card used for pending collector applications, suspensions, admin notice and errors.
export default function AccountStatusPage({ kicker, title, children, actions }) {
  return (
    <div className="cg-auth">
      <div className="cg-auth-card glass">
        <span className="cg-auth-kicker">{kicker}</span>
        <h2>{title}</h2>
        <div className="cg-status-body">{children}</div>
        <div className="cg-status-actions">
          {actions.map((a) => (
            <RippleButton key={a.label} variant={a.primary ? "primary" : "ghost"} className="cg-btn-full" onClick={a.onClick}>
              {a.label}
            </RippleButton>
          ))}
        </div>
      </div>
    </div>
  );
}
