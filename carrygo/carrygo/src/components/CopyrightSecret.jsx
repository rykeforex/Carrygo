import React, { useCallback, useEffect, useRef, useState } from "react";
import { BRAND } from "../config/brand";
import "./splash.css";

const HOLD_MS = 1400;

// Looks like ordinary copyright text. Press-and-hold it: it pulsates, then calls onUnlock().
// A quick tap does nothing, so nobody stumbles into the staff sign-in by accident.
export default function CopyrightSecret({ onUnlock }) {
  const timer = useRef(null);
  const [holding, setHolding] = useState(false);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }, []);

  const start = useCallback(() => {
    if (timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      try { navigator.vibrate?.(30); } catch { /* not supported */ }
      onUnlock();
    }, HOLD_MS);
  }, [onUnlock]);

  useEffect(() => cancel, [cancel]);

  const onKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); start(); }
  };
  const onKeyUp = (e) => {
    if (e.key === "Enter" || e.key === " ") cancel();
  };

  return (
    <button
      type="button"
      className={`cg-copy${holding ? " is-holding" : ""}`}
      style={{ "--hold": `${HOLD_MS}ms` }}
      aria-label={`Copyright ${new Date().getFullYear()} ${BRAND.owner}`}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={cancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      © {new Date().getFullYear()} {BRAND.owner}. All rights reserved.
    </button>
  );
}
