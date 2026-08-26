import React from "react";
import { ROLES, ROLE_LABELS } from "../utils/roles";

// Un usuario puede tener mas de un rol (ej. Recepcion + Facturacion), asi
// que la asignacion es de casillas multiples en vez de un unico selector.
export function RolesChecklist({ value, onChange }) {
  function toggle(rol) {
    if (value.includes(rol)) onChange(value.filter((r) => r !== rol));
    else onChange([...value, rol]);
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
      {Object.values(ROLES).map((r) => (
        <label key={r} className="flex items-center gap-1.5 text-xs whitespace-nowrap" style={{ color: "#444" }}>
          <input type="checkbox" checked={value.includes(r)} onChange={() => toggle(r)} />
          {ROLE_LABELS[r]}
        </label>
      ))}
    </div>
  );
}
