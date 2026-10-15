import React, { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Banner } from "../components/Banner";
import { FormField, TextArea } from "../components/FormField";
import { PacienteBuscador } from "../components/PacienteBuscador";
import { useFetch } from "../hooks/useFetch";
import { usePaginatedFetch } from "../hooks/usePaginatedFetch";
import { Pagination } from "../components/Pagination";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../styles/tokens";
import { ROLES, tieneRol, etiquetasRoles } from "../utils/roles";

export function BitacoraPage({ pacienteIdInicial }) {
  const { usuario } = useAuth();
  const puedeRegistrar = tieneRol(usuario, ROLES.ENFERMERIA, ROLES.RECEPCION, ROLES.ADMIN);

  const [pacienteId, setPacienteId] = useState(pacienteIdInicial || null);
  // Un solo paciente por id (no una lista completa): con volumen alto de
  // pacientes, cargar todos de una vez para un <select> deja de ser viable.
  const { data: patient } = useFetch(pacienteId ? `/pacientes/${pacienteId}` : null, { enabled: !!pacienteId });

  const {
    items: visitas, loading, error, reload,
    page, setPage, totalPages, total,
  } = usePaginatedFetch(pacienteId ? `/bitacora?pacienteId=${pacienteId}` : null, { pageSize: 20, enabled: !!pacienteId });

  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      await api.post("/bitacora", { pacienteId, descripcion });
      setMensaje({ tone: "success", texto: "Visita registrada." });
      setDescripcion("");
      reload();
    } catch (err) {
      setMensaje({ tone: "error", texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <PageHeader title="Bitácora de Visitas" subtitle="Registro de cada visita/consulta: qué se hizo y quién lo hizo (RF-28)" />
      <div className="mb-4">
        <PacienteBuscador pacienteSeleccionado={patient} onSelect={(p) => setPacienteId(p?.id || null)} mostrarListado />
      </div>

      {error && <Banner tone="error">{error}</Banner>}
      {pacienteId && (
        <>
          <Card>
            {loading ? (
              <div className="text-sm" style={{ color: "#888" }}>Cargando…</div>
            ) : !visitas?.length ? (
              <div className="text-sm" style={{ color: "#888" }}>Sin visitas registradas para este paciente.</div>
            ) : (
              visitas.map((v, i) => (
                <div key={v.id} className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-3" style={i > 0 ? { borderTop: `1px solid ${COLORS.border}` } : {}}>
                  <div className="flex items-center gap-2 sm:contents">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS.gold }} />
                    <div style={{ color: "#888" }} className="text-xs font-semibold sm:w-44 sm:shrink-0">{new Date(v.fecha).toLocaleString()}</div>
                  </div>
                  <div className="pl-5 sm:pl-0">
                    <div className="text-sm font-semibold">{v.autor?.nombre} — {etiquetasRoles(v.autor?.roles)}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#888" }}>{v.descripcion}</div>
                  </div>
                </div>
              ))
            )}
          </Card>
          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
        </>
      )}

      {pacienteId && puedeRegistrar && (
        <Card style={{ marginTop: 16 }}>
          <div className="font-semibold text-sm mb-3">+ Registrar visita</div>
          {mensaje && <Banner tone={mensaje.tone}>{mensaje.texto}</Banner>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField label="Descripción">
              <TextArea required rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </FormField>
            <div>
              <Button type="submit" disabled={guardando}>{guardando ? "Guardando…" : "Registrar visita"}</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
