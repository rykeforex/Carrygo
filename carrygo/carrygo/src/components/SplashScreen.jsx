import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./splash.css";

export const SPLASH_SLOGAN = "Bin it. We'll carry it.";

// Total time before the splash fades out on its own (ms). Tap anywhere to skip.
const TOTAL_MS = 3900;
const FADE_MS = 500;
const SEEN_KEY = "cg_splash_seen";

const LETTERS = ["C", "a", "r", "r", "y", "G", "o"];

export function shouldShowSplash() {
  try {
    return sessionStorage.getItem(SEEN_KEY) !== "1";
  } catch {
    return true;
  }
}

function Truck() {
  return (
    <svg className="cg-sp-truck-svg" viewBox="0 0 170 84" aria-hidden="true">
      <defs>
        <linearGradient id="cgSpBox" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2fd088" />
          <stop offset="1" stopColor="#12794b" />
        </linearGradient>
        <linearGradient id="cgSpCab" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b8cff" />
          <stop offset="1" stopColor="#2247b0" />
        </linearGradient>
        <radialGradient id="cgSpGlow" cx="0.5" cy="1" r="0.8">
          <stop offset="0" stopColor="#9dffd0" stopOpacity="0.95" />
          <stop offset="1" stopColor="#9dffd0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* speed lines */}
      <g className="cg-sp-speed" stroke="#fff" strokeLinecap="round" strokeWidth="2.4">
        <line x1="-34" y1="26" x2="-8" y2="26" />
        <line x1="-48" y1="40" x2="-14" y2="40" />
        <line x1="-30" y1="54" x2="-6" y2="54" />
      </g>

      <g className="cg-sp-body">
        {/* light spilling out of the open hatch */}
        <ellipse className="cg-sp-hatchglow" cx="50" cy="12" rx="44" ry="34" fill="url(#cgSpGlow)" />

        {/* cargo box */}
        <rect x="4" y="12" width="92" height="48" rx="7" fill="url(#cgSpBox)" />
        <rect x="12" y="22" width="76" height="3" rx="1.5" fill="#fff" opacity="0.22" />
        <rect x="12" y="30" width="52" height="3" rx="1.5" fill="#fff" opacity="0.14" />

        {/* hatch lid (pops open) */}
        <g className="cg-sp-lid">
          <rect x="9" y="7.5" width="82" height="5.5" rx="2.5" fill="#0f6b42" />
        </g>

        {/* cab */}
        <path d="M100 60 V26 a6 6 0 0 1 6 -6 h22 a8 8 0 0 1 6.4 3.2 l17.4 22.6 a8 8 0 0 1 1.7 4.9 V60 z" fill="url(#cgSpCab)" />
        <path d="M112 27 h14 a3 3 0 0 1 2.4 1.2 l11.5 15 a2 2 0 0 1 -1.6 3.2 H112 a2 2 0 0 1 -2 -2 V29 a2 2 0 0 1 2 -2 z" fill="#dff1ff" opacity="0.92" />
        <rect x="164" y="48" width="4" height="7" rx="2" fill="#ffe27a" />
        <rect x="96" y="58" width="76" height="6" rx="3" fill="#0a1512" opacity="0.85" />

        {/* wheels */}
        {[34, 72, 142].map((cx) => (
          <g key={cx} transform={`translate(${cx} 66)`}>
            <g className="cg-sp-wheel">
              <circle r="11.5" fill="#0a1512" />
              <circle r="11.5" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="1" />
              <circle r="5" fill="#cfd8d4" />
              <line x1="-5" y1="0" x2="5" y2="0" stroke="#0a1512" strokeWidth="1.6" />
              <line x1="0" y1="-5" x2="0" y2="5" stroke="#0a1512" strokeWidth="1.6" />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function SplashScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  const slotRef = useRef(null);
  const stageRef = useRef(null);
  const letterRefs = useRef([]);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* storage unavailable — fine */ }
    setLeaving(true);
    setTimeout(onDone, FADE_MS);
  }, [onDone]);

  // Aim every letter at the truck's cargo hatch so they appear to shoot out of it.
  useLayoutEffect(() => {
    const aim = () => {
      const slot = slotRef.current;
      if (!slot) return;
      const r = slot.getBoundingClientRect();
      const hx = r.left + r.width * 0.29;
      const hy = r.top + r.height * 0.14;
      letterRefs.current.forEach((el) => {
        if (!el) return;
        const lr = el.getBoundingClientRect();
        el.style.setProperty("--sx", `${Math.round(hx - (lr.left + lr.width / 2))}px`);
        el.style.setProperty("--sy", `${Math.round(hy - (lr.top + lr.height / 2))}px`);
      });
    };
    aim();
    window.addEventListener("resize", aim);
    return () => window.removeEventListener("resize", aim);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(finish, reduce ? 1400 : TOTAL_MS);
    return () => clearTimeout(t);
  }, [finish]);

  return (
    <div
      className={`cg-splash${leaving ? " is-leaving" : ""}`}
      role="img"
      aria-label={`CarryGo — ${SPLASH_SLOGAN}`}
      onClick={finish}
    >
      <div className="cg-sp-bg" aria-hidden="true">
        <span className="cg-sp-blob cg-sp-blob-a" />
        <span className="cg-sp-blob cg-sp-blob-b" />
        <span className="cg-sp-grid" />
      </div>

      <div className="cg-sp-stage" ref={stageRef}>
        <h1 className="cg-sp-word" aria-hidden="true">
          {LETTERS.map((ch, i) => (
            <span
              key={i}
              ref={(el) => (letterRefs.current[i] = el)}
              className={`cg-sp-l${i >= 5 ? " is-go" : ""}`}
              style={{ "--i": i }}
            >
              <span>{ch}</span>
            </span>
          ))}
        </h1>

        <p className="cg-sp-slogan" aria-hidden="true">{SPLASH_SLOGAN}</p>

        <div className="cg-sp-scene" aria-hidden="true">
          <div className="cg-sp-slot" ref={slotRef}>
            <div className="cg-sp-truck"><Truck /></div>
          </div>
          <div className="cg-sp-road"><span /></div>
        </div>
      </div>

      <span className="cg-sp-skip" aria-hidden="true">Tap to skip</span>
    </div>
  );
}
