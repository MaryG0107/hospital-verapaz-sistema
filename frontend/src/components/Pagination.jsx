import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COLORS } from "../styles/tokens";

export function Pagination({ page, totalPages, total, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-3 text-sm" style={{ color: "#666" }}>
      <span>{total} registro{total === 1 ? "" : "s"} · página {page} de {totalPages}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
          style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
        >
          <ChevronLeft size={14} /> Anterior
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
          style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
        >
          Siguiente <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
