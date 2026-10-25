import React from "react";
import { COLORS } from "../styles/tokens";

export function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <span
          className="hidden sm:block w-1.5 h-7 rounded-full shrink-0"
          style={{ background: `linear-gradient(180deg, ${COLORS.navy}, ${COLORS.navyLight})` }}
          aria-hidden="true"
        />
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: COLORS.text }}>{title}</h1>
      </div>
      {subtitle && <p className="text-sm mt-1 sm:ml-[18px]" style={{ color: COLORS.textMuted }}>{subtitle}</p>}
    </div>
  );
}
