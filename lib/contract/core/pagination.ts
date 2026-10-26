/** Contract page limit (AritohamDataReader.MAX_PAGE). */
export const MAX_PAGE_SIZE = 100;

export interface PageParams {
  /** 1-based page number (default 1) */
  page?: number;
  /** items per page (default 10, max 100) */
  pageSize?: number;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function toOffsetLimit({ page = 1, pageSize = 10 }: PageParams = {}) {
  const size = Math.min(Math.max(1, Math.floor(pageSize)), MAX_PAGE_SIZE);
  const p = Math.max(1, Math.floor(page));
  return { offset: (p - 1) * size, limit: size, page: p, pageSize: size };
}

export function buildPage<T>(items: T[], total: number | bigint, p: PageParams = {}): Paged<T> {
  const { page, pageSize } = toOffsetLimit(p);
  const t = Number(total);
  return { items, total: t, page, pageSize, totalPages: Math.max(1, Math.ceil(t / pageSize)) };
}

/**
 * Download EVERY record of a paginated reader call.
 * Use this when the website filters client-side (From/To date, Txn hash, User ID),
 * because the contract does not filter.
 */
export async function fetchAll<T>(
  fetchPage: (offset: number, limit: number) => Promise<{ items: T[]; total: number }>,
  opts: { concurrency?: number; max?: number } = {}
): Promise<T[]> {
  const { concurrency = 4, max = 10_000 } = opts;
  const first = await fetchPage(0, MAX_PAGE_SIZE);
  const total = Math.min(first.total, max);
  const out: T[] = [...first.items];
  const offsets: number[] = [];
  for (let o = MAX_PAGE_SIZE; o < total; o += MAX_PAGE_SIZE) offsets.push(o);
  for (let i = 0; i < offsets.length; i += concurrency) {
    const batch = await Promise.all(offsets.slice(i, i + concurrency).map((o) => fetchPage(o, MAX_PAGE_SIZE)));
    for (const b of batch) out.push(...b.items);
  }
  return out;
}
