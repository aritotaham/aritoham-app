"use client";

/**
 * Data layer for every page.
 *
 *  - Addresses configured (.env.local)  -> reads the real contracts through @/lib/contract
 *  - Addresses empty                    -> falls back to the demo data in lib/mock.ts
 *
 * Hooks return rows in the same shape the views already used (ts in ms, hash, uid, ...),
 * so the views only swap `MOCK_CONSTANT` for `useXxx(address)`.
 */
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import * as api from "@/lib/contract";
import * as M from "./mock";
import { BRAND } from "./brand";
import { DEMO_ADDRESS } from "./brand";
import { getStakeTimers, type StakeTimers } from "./contract/services/roiTimers";

export type Row = M.Row;

/** Live by default (BSC Testnet). Set NEXT_PUBLIC_DEMO_DATA=1 to run on the demo data in lib/mock.ts. */
export const LIVE = process.env.NEXT_PUBLIC_DEMO_DATA !== "1";
export const CHAIN_ID = api.config.chain.id;
export const EXPLORER = api.config.explorer;
const TX_LOOKUP = process.env.NEXT_PUBLIC_TX_LOOKUP !== "0";
const NOHASH = "—";

/* ───────────────────────── generic loader ───────────────────────── */

export interface Loaded<T> { data: T; loading: boolean; error?: Error; reload: () => void }

/* Errors from any live read, shown once in a banner (see <DataStatus/>). */
const errs = new Map<string, string>();
const subs = new Set<() => void>();
let snapshot = "";
const emit = () => { snapshot = [...new Set(errs.values())][0] ?? ""; subs.forEach((f) => f()); };
export function useDataError() {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => snapshot, () => "");
}

/** Same shape as `v`, but empty: arrays [], numbers 0, strings "", booleans false, dates null. */
function blank<T>(v: T): T {
  if (Array.isArray(v)) return [] as any;
  if (v instanceof Date) return null as any;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v as any).map(([k, x]) => [k, blank(x)])) as any;
  if (typeof v === "number") return 0 as any;
  if (typeof v === "string") return "" as any;
  if (typeof v === "boolean") return false as any;
  return v;
}

function useData<T>(
  key: readonly unknown[],
  live: () => Promise<T>,
  mock: T,
  opts: { enabled?: boolean; staleMs?: number; refreshMs?: number; placeholder?: "blank" | "mock" } = {}
): Loaded<T> {
  const enabled = LIVE && (opts.enabled ?? true);
  const q = api.useAsync<T>(["data", ...key], live, { ...opts, enabled });
  const k = JSON.stringify(key);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const placeholder = useMemo(() => (opts.placeholder === "mock" ? mock : blank(mock)), [k, opts.placeholder]);
  useEffect(() => {
    if (q.error) { errs.set(k, (q.error as any).shortMessage ?? q.error.message); emit(); }
    else if (errs.delete(k)) emit();
    return () => { if (errs.delete(k)) emit(); };
  }, [q.error, k]);
  if (!LIVE) return { data: mock, loading: false, reload: () => {} };
  return { data: q.data ?? placeholder, loading: q.loading && q.data === undefined, error: q.error, reload: q.reload };
}

/** Second phase: look up Txn hashes from event logs after the rows are on screen. */
function useTxHashes<R>(rows: R[], enrich: (rows: R[]) => Promise<R[]>): R[] {
  const [out, setOut] = useState<R[] | null>(null);
  useEffect(() => {
    setOut(null);
    if (!LIVE || !TX_LOOKUP || !rows.length) return;
    let alive = true;
    enrich(rows).then((r) => alive && setOut(r)).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);
  return out ?? rows;
}

const ms = (d: Date | null | undefined) => (d ? d.getTime() : 0);
const same = (a: number, b: number) => Math.abs(a - b) <= Math.max(1e-9, Math.abs(b) * 1e-9);

/* ───────────────────────── dashboard / market ───────────────────────── */

const MOCK_DASH: api.Dashboard = {
  userId: 1000001, userCode: BRAND.userPrefix + "1000001", referrer: "0x0000000000000000000000000000000000000000", referrerId: 0, referrerCode: "",
  joinedAt: null, totalMinted: M.PROFILE.minted, price: M.PRICE,
  income: { direct: M.PROFILE.directIncome, reward: M.PROFILE.rewardIncome, generation: M.PROFILE.generationIncome, dao: M.PROFILE.daoIncome, rankIncome: 0, rankIncentive: 0, total: M.PROFILE.totalIncome, today: 0 },
  business: { directBusiness: 0, teamBusiness: 0, matchingBusiness: 0, weeklyMatching: 0, dailyMatching: 0, directMembers: 21, activeDirects: 0, totalMembers: 0, contributingMembers: 0, levelEligibility: 20, todayDirectBusiness: 0, todayTeamBusiness: 0, todayNewMembers: 0 },
  rank: { current: 0, currentName: "No Rank", next: 1, nextName: "Spark", matchingNow: 0, matchingTarget: 5000, progressPct: 0, rewardOnCompletion: 0 },
  limits: { sellLimit: 3000, sellLeft: M.PROFILE.dailyLimitLeft, withdrawLimit: 3000, withdrawLeft: M.PROFILE.limitLeft24h, totalWithdrawn: M.PROFILE.totalWithdrawn, availableEstimate: 0 },
  dao: { cycle: 15, contractDeposit: M.DAO.deposit, pool: M.DAO.pool, lifetimeHolders: M.DAO.holders, weeklyEligible: M.DAO.eligible, totalShares: M.DAO.shares, valuePerShare: M.DAO.valuePerShare },
};

export function useDashboard(address: string | null | undefined) {
  return useData(["dash", address], () => api.getDashboard(address!), MOCK_DASH, { enabled: !!address, refreshMs: 60_000 });
}

export interface Market { price: number; liquidity: number; burn: number; pooledUsdt: number; supply: number; changePct: number; series: number[]; labels: string[] }
const MOCK_MARKET: Market = { price: M.PRICE, liquidity: M.MARKET.liquidity, burn: M.MARKET.burn, pooledUsdt: M.MARKET.pooledUsdt, supply: M.MARKET.supply, changePct: 0.18, series: M.PRICE_24H, labels: M.PRICE_LABELS };

const hourLabel = (d: Date) => { const h = d.getHours(); return `${h % 12 || 12} ${h >= 12 ? "PM" : "AM"}`; };

export function useMarket() {
  return useData<Market>(["market"], async () => {
    const [sys, hist] = await Promise.all([api.getSystemInfo(), api.getPriceHistory(25).catch(() => [])]);
    const series = hist.map((p) => p.price);
    const first = series[0] || sys.price;
    // hourly labels, every 2nd point (same density as the design)
    const labels = hist.filter((_, i) => i % 2 === 0).map((p) => hourLabel(p.time));
    return {
      price: sys.price,
      liquidity: sys.liquidityPool * 2,
      burn: sys.totalBurned,
      pooledUsdt: sys.liquidityPool,
      supply: sys.totalSupply,
      changePct: first ? ((sys.price - first) / first) * 100 : 0,
      series: series.length > 1 ? series : [sys.price, sys.price],
      labels: labels.length ? labels : ["Now"],
    };
  }, MOCK_MARKET, { refreshMs: 60_000 });
}

export function useBalances(address: string | null | undefined) {
  return useData<api.WalletBalances>(["bal", address], () => api.getWalletBalances(address!),
    { usdt: M.PROFILE.walletUSDT, aritoham: M.PROFILE.walletToken, usdtAllowance: 0, aritohamAllowance: 0 }, { enabled: !!address, refreshMs: 30_000 });
}

/** Protocol + token addresses (the token address is read from the protocol contract). */
export function useContracts() {
  return useData(["contracts"], async () => ({ protocol: api.config.addresses.protocol as string, token: await api.getTokenAddress() }),
    { protocol: BRAND.protocolContract, token: BRAND.tokenContract }, { staleMs: 600_000 });
}

export function useCap(address: string | null | undefined) {
  return useData(["cap", address], () => api.getWorkingCap(address!),
    { total: 8040, earned: 8040, remaining: 0, usedPct: 100, maxPayoutMultiplier: 3 , totalCap: 100, caEarned: 0}, { enabled: !!address, refreshMs: 60_000 });
}

export function useRules() {
  return useData(["rules"], () => api.getLimits(),
    { minBuy: 10, maxBuy: 1000, buyStep: 10, minWithdraw: 10, maxWithdraw: 3000, dailySellLimit: 3000 }, { staleMs: 300_000, placeholder: "mock" });
}

/* ───────────────────────── participation / withdraw / sell ───────────────────────── */

export function useParticipation(address: string | null | undefined) {
  const q = useData<Row[]>(["part", address], async () => {
    const rows = await api.fetchAll((o, l) => api.getParticipationHistory(address!, { page: o / l + 1, pageSize: l }));
    return rows.map<Row>((r) => ({ ts: ms(r.time), hash: NOHASH, blockNo: r.blockNo, minted: r.usdt, price: r.price, tokens: r.tokens, reward: r.rewardAmount }));
  }, M.PARTICIPATION, { enabled: !!address });
  const rows = useTxHashes(q.data, async (rows) => {
    const map = await api.getPurchaseTxHashes(address!, rows.map((r) => r.blockNo));
    return rows.map((r) => ({ ...r, hash: map.get(r.blockNo) ?? NOHASH }));
  });
  return { ...q, data: rows };
}

export function useWithdrawals(address: string | null | undefined) {
  const q = useData<Row[]>(["wd", address], async () => {
    const rows = await api.fetchAll((o, l) => api.getWithdrawHistory(address!, { page: o / l + 1, pageSize: l }));
    return rows.map<Row>((r) => ({ ts: ms(r.time), hash: NOHASH, amount: r.amount, wallet: api.shortAddress(address!), fee: r.fee, tokens: r.tokens }));
  }, M.WITHDRAWALS, { enabled: !!address });
  const rows = useTxHashes(q.data, async (rows) => {
    const { from, to } = await api.blockRangeForTimes(rows.map((r) => r.ts / 1000));
    const logs = await api.getWithdrawLogs(address!, from, to);
    return api.attachTxHashes(rows as any, logs, (r: any, l) => same(r.amount, api.toNum(l.args.amount)));
  });
  return { ...q, data: rows };
}

export function useSells(address: string | null | undefined) {
  const q = useData<Row[]>(["sell", address], async () => {
    const rows = await api.fetchAll((o, l) => api.getSellHistory(address!, { page: o / l + 1, pageSize: l }));
    return rows.map<Row>((r) => ({ ts: ms(r.time), hash: NOHASH, sold: r.aritoham, usdt: r.usdt, price: r.price }));
  }, M.SELLS, { enabled: !!address });
  const rows = useTxHashes(q.data, async (rows) => {
    const { from, to } = await api.blockRangeForTimes(rows.map((r) => r.ts / 1000));
    const logs = await api.getSellLogs(address!, from, to);
    return api.attachTxHashes(rows as any, logs, (r: any, l) => same(r.sold, api.toNum(l.args.tokens)));
  });
  return { ...q, data: rows };
}

export function useSellSummary(address: string | null | undefined) {
  return useData(["sellsum", address], () => api.getSellSummary(address!),
    { aritohamSold: 1170, usdtReceived: 111.5999, limitLeft: 3000, sales: M.SELLS.length }, { enabled: !!address });
}

/* ───────────────────────── income ───────────────────────── */

export function useDirectIncome(address: string | null | undefined) {
  const q = useData<{ rows: Row[]; total: number }>(["direct", address], async () => {
    const first = await api.getDirectIncomeHistory(address!, { page: 1, pageSize: 100 });
    const rest = first.total > 100
      ? await api.fetchAll((o, l) => api.getDirectIncomeHistory(address!, { page: o / l + 1, pageSize: l }))
      : first.items;
    const rows = rest.map<Row>((r) => ({
      ts: ms(r.time), uid: r.fromCode, wallet: api.shortAddress(r.from), from: r.from, minted: r.minted, income: r.income,
      commission: `${r.commissionPct}%`, hash: NOHASH,
      note: `Direct income of ${r.income} from user ${r.fromCode} for stake $${r.minted}`,
    }));
    return { rows, total: first.totalIncome };
  }, { rows: M.DIRECT_INCOME, total: M.DIRECT_INCOME.reduce((s, r) => s + r.income, 0) }, { enabled: !!address });
  const rows = useTxHashes(q.data.rows, async (rows) => {
    const { from, to } = await api.blockRangeForTimes(rows.map((r) => r.ts / 1000));
    const logs = await api.getDirectIncomeLogs(address!, from, to);
    return api.attachTxHashes(rows as any, logs, (r: any, l) => String(l.args.from).toLowerCase() === String(r.from).toLowerCase() && same(r.income, api.toNum(l.args.amount)));
  });
  return { ...q, data: rows, total: q.data.total };
}

export function useGenerationIncome(address: string | null | undefined) {
  const q = useData<{ rows: Row[]; total: number }>(["gen", address], async () => {
    const all = await api.fetchAll((o, l) => api.getGenerationHistory(address!, { page: o / l + 1, pageSize: l }), { max: 20_000 });
    const head = await api.getGenerationHistory(address!, { page: 1, pageSize: 1 });
    const rows = all.map<Row>((r) => ({
      ts: ms(r.time), uid: r.fromCode, wallet: api.shortAddress(r.from), from: r.from, level: r.level, base: r.base, income: r.income,
      pct: `${r.percent}%`, hash: NOHASH,
      comment: `You have received $${r.income} generation income (Level ${r.level}) from ${r.fromCode}'s ROI earnings of $${r.base}.`,
    }));
    return { rows, total: head.totalIncome };
  }, { rows: M.GENERATION, total: 511.3447 }, { enabled: !!address });
  const rows = useTxHashes(q.data.rows, async (rows) => {
    const { from, to } = await api.blockRangeForTimes(rows.map((r) => r.ts / 1000));
    const logs = await api.getGenerationLogs(address!, from, to);
    return api.attachTxHashes(rows as any, logs, (r: any, l) =>
      String(l.args.from).toLowerCase() === String(r.from).toLowerCase() && Number(l.args.level) === r.level && same(r.income, api.toNum(l.args.amount)));
  });
  return { ...q, data: rows, total: q.data.total };
}

export function useEmission(address: string | null | undefined) {
  const q = useData(["emis", address], async () => {
    const [hist, stakes] = await Promise.all([
      api.fetchAll((o, l) => api.getEmissionHistory(address!, { page: o / l + 1, pageSize: l })),
      api.fetchAll((o, l) => api.getStakes(address!, { page: o / l + 1, pageSize: l })),
    ]);
    const head = await api.getEmissionHistory(address!, { page: 1, pageSize: 1 });
    const rows = hist.map<Row>((r) => ({ ts: ms(r.time), d: r.time, a: r.earned, p: r.percent, stakeIndex: r.stakeIndex, hash: NOHASH, c: `Stake #${r.stakeIndex + 1}: ${r.periods} period(s) on $${r.base}` }));
    return { rows, stakes, totalClaimed: head.totalClaimed };
  }, { rows: [] as Row[], stakes: [] as api.Stake[], totalClaimed: 0 }, { enabled: !!address });
  const rows = useTxHashes(q.data.rows, async (rows) => {
    const { from, to } = await api.blockRangeForTimes(rows.map((r) => r.ts / 1000));
    const logs = await api.getRoiLogs(address!, from, to);
    return api.attachTxHashes(rows as any, logs, (r: any, l) => Number(l.args.stakeIndex) === r.stakeIndex && same(r.a, api.toNum(l.args.roiReward)));
  });
  return { ...q, data: { ...q.data, rows } };
}

const MOCK_ROADMAP: api.RoadmapRow[] = M.RANKS.map((k, i) => ({ rank: i + 1, name: k.name, selfMinted: k.self, directs: k.directs, matching: k.matching, incentivePct: k.pct, incomeAmount: k.income, achieved: false, isNext: i === 0 }));

export function useRank(address: string | null | undefined) {
  const roadmap = useData(["roadmap", address], () => api.getRankRoadmap(address!), MOCK_ROADMAP, { enabled: !!address });
  const incentive = useData<api.RankIncomeRow[]>(["rankinc", address], () => api.fetchAll((o, l) => api.getRankHistory(address!, true, { page: o / l + 1, pageSize: l })), [], { enabled: !!address });
  const reward = useData<api.RankIncomeRow[]>(["rankrew", address], () => api.fetchAll((o, l) => api.getRankHistory(address!, false, { page: o / l + 1, pageSize: l })), [], { enabled: !!address });
  return { roadmap: roadmap.data, incentive: incentive.data, reward: reward.data, loading: roadmap.loading };
}

/* ───────────────────────── DAO ───────────────────────── */

const MOCK_STATUS: api.DaoStatus = { lifetime: false, windowOpen: false, activatedAt: null, windowEnd: null, windowDirect: 0, directTarget: 3000, windowMatching: 0, matchingTarget: 10000, qualifiedByWindow: false, weeklyMatching: 0, qualifiedShares: 0, shortfall: 2500, weeklyProgressPct: 0, estWeeklyPayout: 0 };

export function useDaoOverview() {
  return useData<api.DaoOverview>(["dao"], () => api.getDaoOverview(), { cycle: 15, contractDeposit: M.DAO.deposit, pool: M.DAO.pool, lifetimeHolders: M.DAO.holders, weeklyEligible: M.DAO.eligible, totalShares: M.DAO.shares, valuePerShare: M.DAO.valuePerShare }, { refreshMs: 60_000 });
}
export function useMyDaoStatus(address: string | null | undefined) {
  return useData(["daostatus", address], () => api.getMyDaoStatus(address!), MOCK_STATUS, { enabled: !!address });
}

/** Cycles that have been paid, newest first. */
export function useCycles() {
  return useData<number[]>(["cycles"], async () => {
    const g = await api.getGlobalStats();
    const n = Math.min(g.lastDistributedCycle, 5000);
    return Array.from({ length: n }, (_, i) => n - i);
  }, M.CYCLES, { staleMs: 60_000 });
}

export interface CycleSummary { deposit: number; pool: number; members: number; shares: number; vps: number; ts: number }
export function useCycleSummary(cycle: number) {
  const mock = useMemo(() => M.cycleSummary(cycle), [cycle]);
  return useData<CycleSummary>(["cyclesum", cycle], async () => {
    const s = await api.getCycleSummary(cycle);
    return { deposit: s.totalDeposit, pool: s.pool, members: s.members, shares: s.totalShares, vps: s.valuePerShare, ts: ms(s.time) };
  }, mock, { enabled: cycle > 0, staleMs: 120_000 });
}

export function useCyclePayouts(cycle: number) {
  const mock = useMemo(() => M.payoutsFor(cycle), [cycle]);
  return useData<Row[]>(["cyclepay", cycle], async () => {
    const all = await api.fetchAll((o, l) => api.getCyclePayouts(cycle, { page: o / l + 1, pageSize: l }));
    return all.map<Row>((r) => ({ wallet: r.wallet, matching: r.weeklyMatching, shares: r.shares, value: r.shareValue, payout: r.payout, ts: ms(r.time) }));
  }, mock, { enabled: cycle > 0, staleMs: 120_000 });
}

export function useMyPayouts(address: string | null | undefined) {
  const q = useData<Row[]>(["mypay", address], async () => {
    const all = await api.fetchAll((o, l) => api.getMyDaoPayouts(address!, { page: o / l + 1, pageSize: l }));
    return all.map<Row>((r) => ({ cycle: r.cycle, ts: ms(r.time), shares: r.shares, value: r.shareValue, payout: r.payout, hash: NOHASH, status: r.payout > 0 ? "RECEIVED" : "MISSED" }));
  }, M.MY_PAYOUTS, { enabled: !!address });
  const rows = useTxHashes(q.data, async (rows) => {
    const { from, to } = await api.blockRangeForTimes(rows.map((r) => r.ts / 1000));
    const logs = await api.getDaoRewardLogs(address!, from, to);
    return api.attachTxHashes(rows.filter((r) => r.payout > 0) as any, logs, (r: any, l) => same(r.payout, api.toNum(l.args.amount)))
      .concat(rows.filter((r) => !(r.payout > 0)) as any)
      .sort((a: any, b: any) => b.cycle - a.cycle);
  });
  return { ...q, data: rows };
}

/** Members of the current cycle in the shape the DAO list expects. */
export function useDaoMembers(address: string | null | undefined, cycle: number | undefined) {
  return useData<Row[]>(["daomem", cycle, address], async () => {
    const all = await api.fetchAll((o, l) => api.getCycleMembers(cycle!, { page: o / l + 1, pageSize: l }));
    const me = (address ?? "").toLowerCase();
    return all.map<Row>((m) => {
      const tiers = Math.floor(m.weeklyMatching / 2500);
      return { wallet: api.shortAddress(m.wallet), matching: m.weeklyMatching, target: m.weeklyMatching + m.nextTierNeeded, tiers, toNext: m.nextTierNeeded, shares: m.shares, reward: m.estReward, lifetime: m.lifetime, mine: m.wallet.toLowerCase() === me };
    });
  }, M.DAO_MEMBERS, { enabled: !!cycle, staleMs: 60_000 });
}

/* ───────────────────────── team ───────────────────────── */

export function useTeamSummary(address: string | null | undefined) {
  return useData<api.TeamSummary>(["teamsum", address], () => api.getTeamSummary(address!),
    { directs: 0, directContribution: 0, totalMembers: 0, contributing: 0, teamBusiness: 0, visibleLevels: 20 }, { enabled: !!address, staleMs: 60_000 });
}

/** level 1 = direct team, level 0 = all levels, N = only that level */
export function useTeam(address: string | null | undefined, filter: api.TeamFilter, page: number, pageSize = 10) {
  return useData<api.Paged<Row>>(["team", address, filter, page, pageSize], async () => {
    const r = await api.getTeam(address!, filter, { page, pageSize });
    return { ...r, items: r.items.map<Row>((m) => ({
      id: m.userCode, wallet: api.shortAddress(m.wallet), level: `Level ${m.level}`, rank: m.rank ? M.RANKS[m.rank - 1]?.name ?? m.rank : "No Rank",
      minted: `$${m.selfStaked}`, joined: m.joinedAt ? m.joinedAt.toLocaleDateString("en-US") : "—", dao: m.daoPartner,
    })) };
  }, { items: [], total: 0, page, pageSize, totalPages: 1 }, { enabled: !!address, staleMs: 60_000 });
}

export { DEMO_ADDRESS };

/** Countdown data for every stake: next claim time + claimable amount. */
export function useStakeTimers(address: string | null | undefined, count: number) {
  return useData<StakeTimers>(
    ["stakeTimers", address, count],
    () => getStakeTimers(address!, count),
    { timers: [], offsetMs: 0 },
    { enabled: !!address && count > 0, refreshMs: 60_000 }
  );
}

/** Is this wallet registered in the protocol? data = true/false, loading = still checking. */
export function useRegistered(address: string | null | undefined) {
  return useData<boolean>(
    ["registered", address],
    () => api.isRegistered(address!),
    false,                          // demo-mode value (NEXT_PUBLIC_DEMO_DATA=1)
    { enabled: !!address, staleMs: 10_000 }
  );
}