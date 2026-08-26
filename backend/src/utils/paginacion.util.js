// Paginacion compartida para listados que pueden crecer sin limite
// (pacientes, auditoria, kardex, bitacora). Se activa solo si el caller
// manda "page" en la query — los selectores que solo quieren "todos los
// registros para un <select>" siguen funcionando igual que antes.
export function leerPaginacion(req, { pageSize: defaultPageSize = 20, maxPageSize = 100 } = {}) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, Number(req.query.pageSize) || defaultPageSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
