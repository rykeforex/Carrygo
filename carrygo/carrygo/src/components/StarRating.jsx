import React, { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({ value, onChange, size = 26 }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="cg-stars" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="cg-star-btn"
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            strokeWidth={1.6}
            fill={n <= display ? "currentColor" : "none"}
            className={n <= display ? "cg-star-filled" : "cg-star-empty"}
          />
        </button>
      ))}
    </div>
  );
}
