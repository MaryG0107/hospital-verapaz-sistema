import React from "react";
import { COLORS } from "../styles/tokens";

export function Table({ headers, rows, renderRow, emptyMessage = "Sin datos por mostrar.", onRowClick }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border overflow-hidden" style={{ borderColor: COLORS.border }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "#F7F8FB" }}>
              {headers.map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 font-semibold whitespace-nowrap"
                  style={{ color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-sm" style={{ color: "#99A1B3" }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  className={`transition-colors hover:bg-gray-50${onRowClick ? " cursor-pointer" : ""}`}
                  style={{ borderTop: `1px solid ${COLORS.border}` }}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {renderRow(row)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
