import type { Address } from "viem";
import { readReader } from "../core/contracts";
import { assertAddress, bpsToPct, secToDate, toNum, userCode, isZeroAddress } from "../core/format";
import type { Dashboard, DaoOverview } from "../types";

export const mapDao = (o: any): DaoOverview => ({
  cycle: Number(o.cycle),
  contractDeposit: toNum(o.contractDeposit),
  pool: toNum(o.pool),
  lifetimeHolders: Number(o.lifetimeHolders),
  weeklyEligible: Number(o.weeklyEligible),
  totalShares: Number(o.totalShares),
  valuePerShare: toNum(o.valuePerShare),
});

/** Everything on the Dashboard page, one RPC call (AritohamDataReader.getDashboard). */
export async function getDashboard(address: string): Promise<Dashboard> {
  const a = assertAddress(address);
  const d = await readReader("getDashboard", [a]);
  const i = d.income, b = d.business, r = d.rank, l = d.limits;
  return {
    userId: Number(d.userId),
    userCode: userCode(d.userId),
    referrer: d.referrer as Address,
    referrerId: Number(d.referrerId),
    referrerCode: isZeroAddress(d.referrer) ? "" : userCode(d.referrerId),
    joinedAt: Number(d.joinedAt) ? secToDate(d.joinedAt) : null,
    totalMinted: toNum(d.totalMinted),
    price: toNum(d.price),
    income: {
      direct: toNum(i.direct), reward: toNum(i.reward), generation: toNum(i.generation), dao: toNum(i.dao),
      rankIncome: toNum(i.rankIncome), rankIncentive: toNum(i.rankIncentive), total: toNum(i.total), today: toNum(i.today),
    },
    business: {
      directBusiness: toNum(b.directBusiness), teamBusiness: toNum(b.teamBusiness),
      matchingBusiness: toNum(b.matchingBusiness), weeklyMatching: toNum(b.weeklyMatching), dailyMatching: toNum(b.dailyMatching),
      directMembers: Number(b.directMembers), activeDirects: Number(b.activeDirects),
      totalMembers: Number(b.totalMembers), contributingMembers: Number(b.contributingMembers),
      levelEligibility: Number(b.levelEligibility),
      todayDirectBusiness: toNum(b.todayDirectBusiness), todayTeamBusiness: toNum(b.todayTeamBusiness),
      todayNewMembers: Number(b.todayNewMembers),
    },
    rank: {
      current: Number(r.current), currentName: r.currentName, next: Number(r.next), nextName: r.nextName,
      matchingNow: toNum(r.matchingNow), matchingTarget: toNum(r.matchingTarget),
      progressPct: bpsToPct(r.progressBps), rewardOnCompletion: toNum(r.rewardOnCompletion),
    },
    limits: {
      sellLimit: toNum(l.sellLimit), sellLeft: toNum(l.sellLeft),
      withdrawLimit: toNum(l.withdrawLimit), withdrawLeft: toNum(l.withdrawLeft),
      totalWithdrawn: toNum(l.totalWithdrawn), availableEstimate: toNum(l.availableEstimate),
    },
    dao: mapDao(d.dao),
  };
}
