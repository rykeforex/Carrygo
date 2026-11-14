import React, { useRef, useState } from "react";

export default function RippleButton({
  children,
  onClick,
  variant = "primary",
  className = "",
  ...rest
}) {
  const [ripples, setRipples] = useState([]);
  const btnRef = useRef(null);

  const spawnRipple = (e) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
    const y = (e.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;
    const id = Date.now() + Math.random();
    setRipples((r) => [...r, { id, x, y, size }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 620);
  };

  return (
    <button
      ref={btnRef}
      className={`cg-btn cg-btn-${variant} ${className}`}
      onMouseDown={spawnRipple}
      onClick={onClick}
      {...rest}
    >
      <span className="cg-btn-label">{children}</span>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="cg-ripple"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
    </button>
  );
}
