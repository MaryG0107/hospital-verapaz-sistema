import React from "react";
import { COLORS } from "../styles/tokens";

export function Button({ children, onClick, variant = "primary", type = "button", disabled = false }) {
  const base = "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:active:scale-100";
  if (variant === "primary") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={base + " btn-shine shadow-soft hover:shadow-lifted hover:-translate-y-1 hover:scale-[1.02] disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-soft"}
        style={{
          background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.navyLight})`,
          color: "white",
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={base + " border shadow-soft hover:shadow-card hover:-translate-y-0.5 hover:border-navy disabled:hover:translate-y-0 disabled:hover:shadow-soft"}
      style={{ borderColor: COLORS.border, color: COLORS.text, backgroundColor: "white", opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      {children}
    </button>
  );
}
