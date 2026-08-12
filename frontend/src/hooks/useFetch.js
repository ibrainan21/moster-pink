import { useEffect, useState } from "react";

/**
 * useFetch
 * Ejecuta fetchFn() al montar el componente (y cada vez que cambie algo en
 * "deps") y expone { data, loading, error }. Cancela la petición si el
 * componente se desmonta antes de que responda (evita el warning de React
 * "no se puede actualizar el estado de un componente desmontado").
 *
 * Ejemplo:
 *   const { data: categories, loading, error } = useFetch(
 *     (signal) => categoryService.list(true, signal),
 *     []
 *   );
 */
export default function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchFn(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
