import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value`. Useful for keeping the search input
 * responsive while we throttle re-renders that depend on the filtered list.
 */
export function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
