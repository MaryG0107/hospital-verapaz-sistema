// Roles tal como los devuelve el backend (backend/src/utils/roles.util.js)
export const ROLES = {
  ADMIN: "Administrador",
  RECEPCION: "Recepcion",
  CONSULTA: "Consulta",
  ENFERMERIA: "Enfermeria",
  FACTURACION: "Facturacion",
  FARMACIA: "Farmacia",
};

export const ROLE_LABELS = {
  Administrador: "Administrador",
  Recepcion: "Recepción / Admisión",
  Consulta: "Personal de Consulta",
  Enfermeria: "Enfermería / Secretaría",
  Facturacion: "Facturación",
  Farmacia: "Farmacia",
};

// Un usuario puede tener mas de un rol a la vez (ej. Recepcion + Facturacion).
// true si alguno de los roles del usuario esta entre los permitidos.
export function tieneRol(usuario, ...rolesPermitidos) {
  return (usuario?.roles || []).some((r) => rolesPermitidos.includes(r));
}

export function etiquetasRoles(roles) {
  return (roles || []).map((r) => ROLE_LABELS[r] || r).join(", ");
}
