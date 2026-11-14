import React from "react";
import LiquidBackground from "./LiquidBackground";

export default function RootFrame({ theme = "light", className = "", children }) {
  return (
    <div className={`cg-root ${className}`} data-theme={theme}>
      <LiquidBackground />
      {children}
    </div>
  );
}
