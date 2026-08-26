import React, { useEffect, useRef, useState } from "react";
import { TextInput } from "./FormField";
import { useFetch } from "../hooks/useFetch";
import { normalizarTexto } from "../utils/texto";
import { COLORS } from "../styles/tokens";

// A diferencia de Combobox (que obliga a elegir de una lista cerrada), este
// campo deja escribir libremente: el catalogo CIE-10 sembrado es un
// subconjunto curado (~90 codigos comunes) y no la totalidad de los mas de
// 14,000 codigos de la OMS, asi que el personal medico debe poder capturar
// un codigo que no este en la lista sin quedar bloqueado.
export function Cie10Input({ value, onChange, placeholder = "Código o descripción…", style }) {
  const { data: catalogo } = useFetch("/cie10");
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickFuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  const query = value || "";
  const sugerencias = query.trim().length > 0
    ? (catalogo || []).filter((c) => normalizarTexto(`${c.codigo} ${c.descripcion}`).includes(normalizarTexto(query))).slice(0, 30)
    : [];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <TextInput
        value={value}
        placeholder={placeholder}
        style={style}
        onChange={(e) => { onChange(e.target.value); setAbierto(true); }}
        onFocus={() => setAbierto(true)}
      />
      {abierto && sugerencias.length > 0 && (
        <div
          className="mt-1.5 rounded-xl shadow-lifted overflow-y-auto animate-fade-in"
          style={{ position: "absolute", zIndex: 20, width: "100%", minWidth: 280, maxHeight: 260, backgroundColor: "white", border: `1px solid ${COLORS.border}` }}
        >
          {sugerencias.map((s) => (
            <div
              key={s.codigo}
              onClick={() => { onChange(s.codigo); setAbierto(false); }}
              className="px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100"
            >
              <strong>{s.codigo}</strong> <span style={{ color: "#888" }}>— {s.descripcion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
