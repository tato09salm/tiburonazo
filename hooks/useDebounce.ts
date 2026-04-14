"use client";

import { useEffect, useState } from "react";

/**
 * Hook para retrasar la actualización de un valor.
 * Útil para evitar llamadas excesivas a la API en inputs de búsqueda.
 * * @param value El valor a debitear (ej. el string del input)
 * @param delay El tiempo de espera en milisegundos (por defecto 500ms)
 * @returns El valor actualizado solo después de que el tiempo haya transcurrido
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Establecemos un temporizador para actualizar el valor después del delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Si el valor cambia antes de que termine el delay (el usuario sigue escribiendo), 
    // limpiamos el temporizador anterior y empezamos de nuevo.
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}