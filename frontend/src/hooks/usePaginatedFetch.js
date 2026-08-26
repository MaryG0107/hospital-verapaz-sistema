import { useEffect, useState } from "react";
import { useFetch } from "./useFetch";

// Variante de useFetch para listados que pueden crecer sin limite (el
// backend solo pagina si recibe "page" en la query, ver paginacion.util.js).
// basePath puede traer su propio "?buscar=..." — se le agrega page/pageSize
// con & o ? segun corresponda.
export function usePaginatedFetch(basePath, { pageSize = 20, enabled = true } = {}) {
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [basePath]);

  const path = basePath
    ? `${basePath}${basePath.includes("?") ? "&" : "?"}page=${page}&pageSize=${pageSize}`
    : null;
  // basePath nulo desactiva el fetch aunque el caller no haya pasado su
  // propio "enabled": evita pedir fetch(null) -> "/apinull".
  const { data, loading, error, reload } = useFetch(path, { enabled: enabled && !!basePath });

  const total = data?.total ?? 0;
  return {
    items: data?.items || [],
    total,
    page,
    setPage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    loading,
    error,
    reload,
  };
}
