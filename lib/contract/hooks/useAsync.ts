import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data?: T;
  error?: Error;
  loading: boolean;
  reload: () => void;
}

const cache = new Map<string, { at: number; data: unknown }>();

/**
 * Tiny data hook for any service function.
 *
 *   const { data, loading } = useAsync(["dash", address], () => getDashboard(address!), { enabled: !!address });
 *
 * `key` identifies the request (re-fetches when it changes); `staleMs` serves cached data
 * for that long (handy for heavy calls such as getTeam).
 */
export function useAsync<T>(
  key: readonly unknown[],
  fn: () => Promise<T>,
  opts: { enabled?: boolean; staleMs?: number; refreshMs?: number } = {}
): AsyncState<T> {
  const { enabled = true, staleMs = 0, refreshMs } = opts;
  const k = JSON.stringify(key, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  const [state, setState] = useState<{ data?: T; error?: Error; loading: boolean }>({ loading: enabled });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return setState({ loading: false });
    let alive = true;
    const hit = cache.get(k);
    if (hit && Date.now() - hit.at < staleMs && tick === 0) {
      setState({ data: hit.data as T, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: undefined }));
    fnRef.current()
      .then((data) => {
        cache.set(k, { at: Date.now(), data });
        if (alive) setState({ data, loading: false });
      })
      .catch((error) => alive && setState({ error, loading: false }));
    return () => {
      alive = false;
    };
  }, [k, enabled, tick, staleMs]);

  useEffect(() => {
    if (!refreshMs || !enabled) return;
    const id = setInterval(() => setTick((t) => t + 1), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
