import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export default function ConfirmDialog({ open, title, children, confirmLabel = "Confirm", cancelLabel = "Keep", danger = false, busy = false, onConfirm, onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => { if (e.key === "Escape" && !busy) onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [open, busy, onCancel]);
  if (!open) return null;
  return (
    <div className="cg-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div className="cg-modal glass" role="dialog" aria-modal="true" aria-labelledby="cg-modal-title" tabIndex={-1} ref={ref}>
        <h3 id="cg-modal-title">{title}</h3>
        <div className="cg-modal-body">{children}</div>
        <div className="cg-modal-actions">
          <button type="button" className="cg-btn cg-btn-ghost" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button type="button" className={`cg-btn ${danger ? "cg-btn-danger" : "cg-btn-primary"}`} onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 size={16} className="cg-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
