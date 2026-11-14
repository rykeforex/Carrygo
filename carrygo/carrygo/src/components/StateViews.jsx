import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import RippleButton from "./RippleButton";

export function LoadingBlock({ label = "Loading…" }) {
  return (
    <div className="cg-state" role="status" aria-live="polite">
      <Loader2 size={20} className="cg-spin" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }) {
  return (
    <div className="cg-state cg-state-error" role="alert">
      <AlertCircle size={20} />
      <span>{message}</span>
      {onRetry && <RippleButton variant="ghost" className="cg-btn-sm" onClick={onRetry}>Try again</RippleButton>}
    </div>
  );
}

export function EmptyBlock({ icon: Icon, title, children, action }) {
  return (
    <div className="cg-empty-state glass">
      {Icon && <Icon size={28} className="cg-icon-blue" />}
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
