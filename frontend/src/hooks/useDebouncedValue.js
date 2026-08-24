import { useEffect, useState } from "react";

/**
 * useDebouncedValue
 * Regresa "value" solo después de que pasen "delayMs" sin que cambie de
 * nuevo. Se usa en cajas de búsqueda que disparan una petición al backend
 * (como el filtro de usuarios en el panel admin), para no mandar una
 * llamada por cada tecla presionada.
 */
export default function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
