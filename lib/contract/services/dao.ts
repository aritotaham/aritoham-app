import { readReader, readTeamDao } from "../core/contracts";
import { assertAddress, bpsToPct, secToDate, toNum, userCode } from "../core/format";
import { buildPage, toOffsetLimit, type PageParams, type Paged } from "../core/pagination";
import type { DaoCycleSummary, DaoMemberRow, DaoOverview, DaoPayoutRow, DaoStatus } from "../types";
import { mapDao } from "./dashboard";

const date = (s: any) => (Number(s) ? secToDate(s) : null);

/** Live DAO numbers (current cycle, pool, shares ...). */
export async function getDaoOverview(): Promise<DaoOverview> {
  return mapDao(await readReader("getDaoOverview"));
}

/** "My DAO status" card: window progress, qualification, estimated payout. */
export async function getMyDaoStatus(address: string): Promise<DaoStatus> {
  const s = await readTeamDao("getMyDaoStatus", [assertAddress(address)]);
  return {
    lifetime: s.lifetime, windowOpen: s.windowOpen, activatedAt: date(s.activatedAt), windowEnd: date(s.windowEnd),
    windowDirect: toNum(s.windowDirect), directTarget: toNum(s.directTarget),
    windowMatching: toNum(s.windowMatching), matchingTarget: toNum(s.matchingTarget),
    qualifiedByWindow: s.qualifiedByWindow, weeklyMatching: toNum(s.weeklyMatching),
    qualifiedShares: Number(s.qualifiedShares), shortfall: toNum(s.shortfall),
    weeklyProgressPct: bpsToPct(s.weeklyProgressBps), estWeeklyPayout: toNum(s.estWeeklyPayout),
  };
}

/** Header of one payout cycle (pool, members, value per share ...). */
export async function getCycleSummary(cycle: number): Promise<DaoCycleSummary> {
  const s = await readTeamDao("getCycleSummary", [BigInt(cycle)]);
  return {
    cycle: Number(s.cycle), totalDeposit: toNum(s.totalDeposit), pool: toNum(s.pool), members: Number(s.members),
    totalShares: Number(s.totalShares), valuePerShare: toNum(s.valuePerShare), time: date(s.time), paid: s.paid,
  };
}

const mapPayout = (r: any): DaoPayoutRow => ({
  cycle: Number(r.cycle), wallet: r.wallet, time: secToDate(r.time), weeklyMatching: toNum(r.weeklyMatching),
  shares: Number(r.shares), shareValue: toNum(r.shareValue), payout: toNum(r.payout),
});

/**
 * DAO Payouts page - every payout of one cycle.
 * NOTE: the contract returns these in the order they were paid (oldest first).
 */
export async function getCyclePayouts(cycle: number, p: PageParams = {}): Promise<Paged<DaoPayoutRow>> {
  const { offset, limit } = toOffsetLimit(p);
  const r = await readTeamDao("getCyclePayouts", [BigInt(cycle), BigInt(offset), BigInt(limit)]);
  return buildPage((r.page ?? r[0]).map(mapPayout), r.total ?? r[1], p);
}

/** Payouts received by one wallet, across all cycles. */
export async function getMyDaoPayouts(address: string, p: PageParams = {}): Promise<Paged<DaoPayoutRow>> {
  const { offset, limit } = toOffsetLimit(p);
  const r = await readTeamDao("getMyDaoPayouts", [assertAddress(address), BigInt(offset), BigInt(limit)]);
  return buildPage((r.page ?? r[0]).map(mapPayout), r.total ?? r[1], p);
}

/** DAO members of one cycle with their shares and estimated reward. */
export async function getCycleMembers(cycle: number, p: PageParams = {}): Promise<Paged<DaoMemberRow>> {
  const { offset, limit } = toOffsetLimit(p);
  const r = await readTeamDao("getCycleMembers", [BigInt(cycle), BigInt(offset), BigInt(limit)]);
  const items: DaoMemberRow[] = (r.page ?? r[0]).map((m: any) => ({
    wallet: m.wallet, id: Number(m.id), userCode: userCode(m.id), lifetime: m.lifetime,
    weeklyMatching: toNum(m.weeklyMatching), nextTierNeeded: toNum(m.nextTierNeeded),
    shares: Number(m.shares), estReward: toNum(m.estReward),
  }));
  return buildPage(items, r.total ?? r[1], p);
}
