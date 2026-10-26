import { useState } from "react";
import type { Paged } from "../core/pagination";
import { useAsync } from "./useAsync";

/**
 * Pagination state + fetching in one hook.
 *
 *   const t = usePaged(["direct", address], (p) => getDirectIncomeHistory(address!, p), { enabled: !!address });
 *   t.data?.items, t.page, t.setPage, t.pageSize, t.setPageSize
 */
export function usePaged<T>(
  key: readonly unknown[],
  fetchPage: (p: { page: number; pageSize: number }) => Promise<Paged<T>>,
  opts: { enabled?: boolean; initialPageSize?: number; staleMs?: number } = {}
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(opts.initialPageSize ?? 10);
  const q = useAsync([...key, page, pageSize], () => fetchPage({ page, pageSize }), opts);
  return {
    ...q,
    page,
    pageSize,
    setPage,
    setPageSize: (n: number) => {
      setPageSizeState(n);
      setPage(1);
    },
  };
}
