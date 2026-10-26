import { readReader } from "../core/contracts";
import { assertAddress, bpsToPct, secToDate, toNum, userCode } from "../core/format";
import { buildPage, toOffsetLimit, type PageParams, type Paged } from "../core/pagination";
import type {
  DirectIncomeRow, EmissionRow, GenerationRow, ParticipationRow, RankIncomeRow, RoadmapRow,
  SellRow, Stake, WithdrawRow,
} from "../types";

/**
 * Generic helper: every reader history call has the shape
 *   (address, offset, limit) -> (page[], total, ...extras)
 * and returns newest first.
 */
async function paged<Row, Extra = {}>(
  fn: Parameters<typeof readReader>[0],
  address: string,
  params: PageParams,
  mapRow: (r: any, i: number, total: number, offset: number) => Row,
  mapExtra?: (res: any) => Extra,
  leadingArgs: unknown[] = []
): Promise<Paged<Row> & Extra> {
  const a = assertAddress(address);
  const { offset, limit } = toOffsetLimit(params);
  const res = await readReader(fn, [a, ...leadingArgs, BigInt(offset), BigInt(limit)]);
  const page: any[] = res.page ?? res[0];
  const total = res.total ?? res[1];
  const items = page.map((r, i) => mapRow(r, i, Number(total), offset));
  return { ...buildPage(items, total, params), ...((mapExtra ? mapExtra(res) : {}) as Extra) };
}

/* ── Participation (Staking page) ─────────────────────────────── */

export const getParticipationHistory = (address: string, p: PageParams = {}) =>
  paged<ParticipationRow>("getParticipationHistory", address, p, (r) => ({
    time: secToDate(r.time), blockNo: Number(r.blockNo), usdt: toNum(r.usdt), tokens: toNum(r.tokens),
    price: toNum(r.price), rewardAmount: toNum(r.rewardAmount),
  }));

/** Stakes with their claimed emission (used by "My stakes" / ROI cards). */
export const getStakes = (address: string, p: PageParams = {}) =>
  paged<Stake>("getStakes", address, p, (r, i, total, offset) => ({
    index: total - 1 - (offset + i), // contract is newest-first; stakeIndex is oldest-first
    time: secToDate(r.time), usdt: toNum(r.usdt), tokens: toNum(r.tokens),
    claimed: toNum(r.claimed), claims: Number(r.claims),
  }));

/* ── Income pages ─────────────────────────────────────────────── */

/** Income → ROI / Emission */
export const getEmissionHistory = (address: string, p: PageParams = {}) =>
  paged<EmissionRow, { totalClaimed: number }>(
    "getEmissionHistory", address, p,
    (r) => ({
      time: secToDate(r.time), stakeIndex: Number(r.stakeIndex), periods: Number(r.periods),
      base: toNum(r.base), earned: toNum(r.earned), percent: bpsToPct(r.percentBps),
    }),
    (res) => ({ totalClaimed: toNum(res.totalClaimed ?? res[2]) })
  );

/** Income → Direct */
export const getDirectIncomeHistory = (address: string, p: PageParams = {}) =>
  paged<DirectIncomeRow, { totalIncome: number }>(
    "getDirectIncomeHistory", address, p,
    (r) => ({
      time: secToDate(r.time), from: r.from, fromId: Number(r.fromId), fromCode: userCode(r.fromId),
      minted: toNum(r.minted), income: toNum(r.income), commissionPct: bpsToPct(r.commissionBps),
    }),
    (res) => ({ totalIncome: toNum(res.totalIncome ?? res[2]) })
  );

/** Income → Generation */
export const getGenerationHistory = (address: string, p: PageParams = {}) =>
  paged<GenerationRow, { totalIncome: number }>(
    "getGenerationHistory", address, p,
    (r) => ({
      time: secToDate(r.time), from: r.from, fromId: Number(r.fromId), fromCode: userCode(r.fromId),
      level: Number(r.level), base: toNum(r.base), income: toNum(r.income), percent: bpsToPct(r.percentBps),
    }),
    (res) => ({ totalIncome: toNum(res.totalIncome ?? res[2]) })
  );

/**
 * Income → Rank
 * @param incentive false = rank income table, true = rank incentive table
 */
export const getRankHistory = (address: string, incentive: boolean, p: PageParams = {}) =>
  paged<RankIncomeRow>(
    "getRankHistory", address, p,
    (r) => ({
      time: secToDate(r.time), rank: Number(r.rank), rankName: r.rankName, refId: r.refId.toString(), amount: toNum(r.amount),
    }),
    undefined,
    [incentive]
  );

/** Rank roadmap (9 rows) for the "Rank" page header / progress table. */
export async function getRankRoadmap(address: string): Promise<RoadmapRow[]> {
  const rows: any[] = await readReader("getRankRoadmap", [assertAddress(address)]);
  return rows.map((r) => ({
    rank: Number(r.rank), name: r.name, selfMinted: toNum(r.selfMinted), directs: Number(r.directs),
    matching: toNum(r.matching), incentivePct: bpsToPct(r.incentiveBps), incomeAmount: toNum(r.incomeAmount),
    achieved: r.achieved, isNext: r.next,
  }));
}

/* ── Wallet pages ─────────────────────────────────────────────── */

/** Sell Tokens → Sell report */
export const getSellHistory = (address: string, p: PageParams = {}) =>
  paged<SellRow>("getSellHistory", address, p, (r) => ({
    time: secToDate(r.time), aritoham: toNum(r.aritoham), usdt: toNum(r.usdt), price: toNum(r.price),
  }));

/** Sell Tokens → summary cards */
export async function getSellSummary(address: string) {
  const r = await readReader("getSellSummary", [assertAddress(address)]);
  return {
    aritohamSold: toNum(r.aritohamSold ?? r[0]), usdtReceived: toNum(r.usdtReceived ?? r[1]),
    limitLeft: toNum(r.limitLeft ?? r[2]), sales: Number(r.sales ?? r[3]),
  };
}

/** Withdraw → history */
export const getWithdrawHistory = (address: string, p: PageParams = {}) =>
  paged<WithdrawRow>("getWithdrawHistory", address, p, (r) => ({
    time: secToDate(r.time), amount: toNum(r.amount), fee: toNum(r.fee), tokens: toNum(r.tokens), price: toNum(r.price),
  }));
