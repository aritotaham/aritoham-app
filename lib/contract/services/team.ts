import { readTeamDao } from "../core/contracts";
import { assertAddress, secToDate, toNum, userCode } from "../core/format";
import { buildPage, toOffsetLimit, type PageParams, type Paged } from "../core/pagination";
import type { TeamFilter, TeamMember, TeamSummary } from "../types";

/**
 * Team → Direct (level: 1) and Team → All (level: 0 or any N).
 *
 * WARNING: the contract walks the tree on-chain (bounded by MAX_SCAN), so this is a
 * heavy eth_call. Cache it (see hooks/useAsync `staleMs`) and keep pageSize small.
 */
export async function getTeam(root: string, filter: TeamFilter = {}, p: PageParams = {}): Promise<Paged<TeamMember>> {
  const { offset, limit } = toOffsetLimit(p);
  const f = {
    level: BigInt(filter.level ?? 0),
    onlyInvested: filter.onlyInvested ?? false,
    daoOnly: filter.daoOnly ?? false,
    rank: BigInt(filter.rank ?? 0),
  };
  const r = await readTeamDao("getTeam", [assertAddress(root), f, BigInt(offset), BigInt(limit)]);
  const items: TeamMember[] = (r.page ?? r[0]).map((m: any) => ({
    wallet: m.wallet, id: Number(m.id), userCode: userCode(m.id), level: Number(m.level), rank: Number(m.rank),
    joinedAt: Number(m.joinedAt) ? secToDate(m.joinedAt) : null, selfStaked: toNum(m.selfStaked),
    directBusiness: toNum(m.directBusiness), teamBusiness: toNum(m.teamBusiness),
    directCount: Number(m.directCount), teamCount: Number(m.teamCount), daoPartner: m.daoPartner,
  }));
  return buildPage(items, r.total ?? r[1], p);
}

export const getDirectTeam = (root: string, p: PageParams = {}) => getTeam(root, { level: 1 }, p);
export const getAllTeam = (root: string, p: PageParams = {}) => getTeam(root, { level: 0 }, p);

/** Summary cards on the Team pages. */
export async function getTeamSummary(address: string): Promise<TeamSummary> {
  const r = await readTeamDao("getTeamSummary", [assertAddress(address)]);
  return {
    directs: Number(r.directs ?? r[0]), directContribution: toNum(r.directContribution ?? r[1]),
    totalMembers: Number(r.totalMembers ?? r[2]), contributing: Number(r.contributing ?? r[3]),
    teamBusiness: toNum(r.teamBusiness ?? r[4]), visibleLevels: Number(r.visibleLevels ?? r[5]),
  };
}
