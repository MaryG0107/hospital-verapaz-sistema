import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ClipboardList, FileText, FolderOpen, Syringe, Users, Wallet, Receipt, Pill,
  ShieldCheck, BarChart3, LogOut, Menu, X,
} from "lucide-react";
import { COLORS } from "../styles/tokens";
import { etiquetasRoles, modulosPermitidos } from "../utils/roles";
import logoVerapaz from "../assets/logo-verapaz.png";

const NAV_ITEMS = [
  { key: "registro", label: "Registro y Admisión", Icon: ClipboardList, allowedInRestricted: true },
  { key: "expediente", label: "Expediente Clínico", Icon: FileText, allowedInRestricted: true },
  { key: "documentos", label: "Documentos del Paciente", Icon: FolderOpen, allowedInRestricted: false },
  { key: "tratamiento", label: "Tratamiento", Icon: Syringe, allowedInRestricted: false },
  { key: "referidos", label: "Clientes Referidos", Icon: Users, allowedInRestricted: false },
  { key: "financiera", label: "Área Financiera", Icon: Wallet, allowedInRestricted: false },
  { key: "gastos", label: "Gastos del Hospital", Icon: Receipt, allowedInRestricted: false },
  { key: "farmacia", label: "Farmacia", Icon: Pill, allowedInRestricted: false },
  { key: "seguridad", label: "Seguridad y Roles", Icon: ShieldCheck, allowedInRestricted: false },
  { key: "reportes", label: "Reportes", Icon: BarChart3, allowedInRestricted: false },
];

// Fondo del menu lateral: el degradado institucional. La textura de puntos en
// movimiento se agrega aparte con la clase CSS "sidebar-texture" (ver
// styles/index.css) para poder animarla sin pelear con este degradado.
const SIDEBAR_BG = {
  background: `linear-gradient(165deg, ${COLORS.navyDark} 0%, ${COLORS.navy} 55%, ${COLORS.navyLight} 100%)`,
};

function iniciales(nombre) {
  return (nombre || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function SidebarContent({ usuario, onLogout, onNavigate, restrictedMode, puedeAlternarModo, onToggleRestrictedMode, giroLogo }) {
  const location = useLocation();

  // Permisos por rol: el Administrador ve todos; Recepcion/Enfermeria/
  // Consulta solo Registro y Expediente. El modo restringido manual (solo
  // para el Administrador) oculta ademas los demas modulos.
  const permitidos = modulosPermitidos(usuario);
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (permitidos !== null && !permitidos.has(item.key)) return false;
    if (permitidos === null && restrictedMode && !item.allowedInRestricted) return false;
    return true;
  });

  return (
    // relative + z-10: el contenido debe pintarse encima de la textura
    // animada del fondo (::before de .sidebar-texture, ver styles/index.css),
    // que al ser position:absolute pintaria por encima del contenido normal
    // si no se le da una capa (stacking context) mas alta.
    <div className="relative z-10 flex flex-col flex-1 min-h-0">
      <div className="px-5 pt-6 pb-5">
        <button
          onClick={onToggleRestrictedMode}
          className="flex items-center gap-2.5 w-full"
          aria-label={puedeAlternarModo ? (restrictedMode ? "Mostrar todos los módulos" : "Ocultar módulos (solo Registro y Expediente)") : "Hospital Verapaz"}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <img key={giroLogo} src={logoVerapaz} alt="Hospital Verapaz" className={"w-7 h-7 rounded-full shrink-0" + (giroLogo ? " animate-giro-total" : "")} />
          <div className="text-white font-bold text-sm tracking-wide flex-1 text-left">
            HOSPITAL VERAPAZ
            {restrictedMode && puedeAlternarModo ? (
              <span className="block text-[10px] font-normal opacity-75">Modo restringido</span>
            ) : (
              <span className="block text-[10px] font-normal tracking-wider" style={{ color: "#A5D8BD" }}>Sistema Madián</span>
            )}
          </div>
        </button>
        <div className="flex items-center gap-2.5 mt-4">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: COLORS.gold, color: COLORS.navy }}
          >
            {iniciales(usuario.nombre) || "U"}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{usuario.nombre}</div>
            <div className="text-xs truncate" style={{ color: "#A5D8BD" }}>{etiquetasRoles(usuario.roles)}</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 overflow-y-auto">
        {visibleItems.map((item) => {
          const activo = location.pathname === `/${item.key}`;
          return (
            <Link
              key={item.key}
              to={`/${item.key}`}
              onClick={() => onNavigate?.()}
              className="nav-item relative w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl text-sm mb-1 transition-all duration-150 hover:translate-x-1"
              style={
                activo
                  ? { background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldLight})`, color: COLORS.navyDark, fontWeight: 600 }
                  : { color: "#D8F0E2", backgroundColor: "transparent" }
              }
              onMouseEnter={(e) => { if (!activo) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e) => { if (!activo) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              {!activo && <span className="nav-indicator" />}
              <item.Icon size={17} strokeWidth={2} className="shrink-0 transition-transform duration-150" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-5 pt-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl text-sm transition-colors duration-150 hover:bg-white/5"
          style={{ color: "#A5D8BD" }}
        >
          <LogOut size={17} className="shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export function Layout({ usuario, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [restrictedMode, setRestrictedMode] = useState(() => {
    const guardado = localStorage.getItem("hp_restricted_mode");
    if (guardado === null) return true; // por defecto solo Registro y Expediente
    return guardado === "true";
  });
  // Solo el Administrador puede alternar manualmente el modo restringido:
  // los demas roles ya tienen su menu limitado por permisos.
  const puedeAlternarModo = modulosPermitidos(usuario) === null;
  // Se incrementa en cada clic: cambia la key del logo para reiniciar la
  // animacion de "giro total" (360 grados).
  const [giroLogo, setGiroLogo] = useState(0);

  const toggleRestrictedMode = () => {
    setGiroLogo((n) => n + 1);
    if (puedeAlternarModo) {
      setRestrictedMode((prev) => {
        const siguiente = !prev;
        localStorage.setItem("hp_restricted_mode", String(siguiente));
        return siguiente;
      });
    }
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: COLORS.lightBg }}>
      {/* Sidebar de escritorio */}
      <div
        className="hidden md:flex flex-col shrink-0 sidebar-texture"
        style={{ width: 248, ...SIDEBAR_BG }}
      >
        <SidebarContent
          usuario={usuario}
          onLogout={onLogout}
          restrictedMode={restrictedMode}
          puedeAlternarModo={puedeAlternarModo}
          onToggleRestrictedMode={toggleRestrictedMode}
          giroLogo={giroLogo}
        />
      </div>

      {/* Sidebar movil (drawer) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="relative flex flex-col w-72 max-w-[80%] shadow-lifted" style={SIDEBAR_BG}>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-4 text-white/70 hover:text-white"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
            <SidebarContent
              usuario={usuario}
              onLogout={onLogout}
              onNavigate={() => setMobileOpen(false)}
              restrictedMode={restrictedMode}
              puedeAlternarModo={puedeAlternarModo}
              onToggleRestrictedMode={toggleRestrictedMode}
              giroLogo={giroLogo}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar movil */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b sticky top-0 z-30" style={{ borderColor: COLORS.border }}>
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú" style={{ color: COLORS.navy }}>
            <Menu size={22} />
          </button>
          <button
            onClick={toggleRestrictedMode}
            aria-label={puedeAlternarModo ? (restrictedMode ? "Mostrar todos los módulos" : "Ocultar módulos (solo Registro y Expediente)") : "Hospital Verapaz"}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <img key={giroLogo} src={logoVerapaz} alt="Hospital Verapaz" className={"w-6 h-6 rounded-full" + (giroLogo ? " animate-giro-total" : "")} />
          </button>
          <div className="text-sm font-bold" style={{ color: COLORS.navy }}>
            HOSPITAL VERAPAZ
            {restrictedMode && puedeAlternarModo && <span className="block text-[10px] font-normal opacity-75">Modo restringido</span>}
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
