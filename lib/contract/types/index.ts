import type { Address, Hex } from "viem";

/** Amounts are JS numbers in whole tokens/USDT (already divided by 1e18). */
export type Amount = number;

export interface IncomeBreakdown {
  direct: Amount; reward: Amount; generation: Amount; dao: Amount;
  rankIncome: Amount; rankIncentive: Amount; total: Amount; today: Amount;
}

export interface BusinessStats {
  directBusiness: Amount; teamBusiness: Amount; matchingBusiness: Amount;
  weeklyMatching: Amount; dailyMatching: Amount;
  directMembers: number; activeDirects: number; totalMembers: number; contributingMembers: number;
  levelEligibility: number;
  todayDirectBusiness: Amount; todayTeamBusiness: Amount; todayNewMembers: number;
}

export interface RankProgress {
  current: number; currentName: string; next: number; nextName: string;
  matchingNow: Amount; matchingTarget: Amount;
  /** 0-100 */
  progressPct: number;
  rewardOnCompletion: Amount;
}

export interface Limits {
  sellLimit: Amount; sellLeft: Amount;
  withdrawLimit: Amount; withdrawLeft: Amount;
  totalWithdrawn: Amount; availableEstimate: Amount;
}

export interface DaoOverview {
  cycle: number; contractDeposit: Amount; pool: Amount; lifetimeHolders: number;
  weeklyEligible: number; totalShares: number; valuePerShare: Amount;
}

export interface Dashboard {
  userId: number; userCode: string; referrer: Address; referrerId: number; referrerCode: string;
  joinedAt: Date | null; totalMinted: Amount; price: Amount;
  income: IncomeBreakdown; business: BusinessStats; rank: RankProgress; limits: Limits; dao: DaoOverview;
}

/** Common fields of every history row. `txHash` is only filled by the txhash service. */
export interface HistoryRow { time: Date; txHash?: Hex }

export interface Stake extends HistoryRow {
  /** 0-based index in the user's stake list (newest first from the contract, so index is computed against total) */
  index: number;
  usdt: Amount; tokens: Amount; claimed: Amount; claims: number; blockNo?: number;
}
export interface ParticipationRow extends HistoryRow {
  blockNo: number; usdt: Amount; tokens: Amount; price: Amount; rewardAmount: Amount;
}
export interface EmissionRow extends HistoryRow {
  stakeIndex: number; periods: number; base: Amount; earned: Amount; percent: number;
}
export interface DirectIncomeRow extends HistoryRow {
  from: Address; fromId: number; fromCode: string; minted: Amount; income: Amount; commissionPct: number;
}
export interface GenerationRow extends HistoryRow {
  from: Address; fromId: number; fromCode: string; level: number; base: Amount; income: Amount; percent: number;
}
export interface RankIncomeRow extends HistoryRow {
  rank: number; rankName: string; refId: string; amount: Amount;
}
export interface SellRow extends HistoryRow { aritoham: Amount; usdt: Amount; price: Amount }
export interface WithdrawRow extends HistoryRow { amount: Amount; fee: Amount; tokens: Amount; price: Amount }

export interface RoadmapRow {
  rank: number; name: string; selfMinted: Amount; directs: number; matching: Amount;
  incentivePct: number; incomeAmount: Amount; achieved: boolean; isNext: boolean;
}

export interface DaoStatus {
  lifetime: boolean; windowOpen: boolean; activatedAt: Date | null; windowEnd: Date | null;
  windowDirect: Amount; directTarget: Amount; windowMatching: Amount; matchingTarget: Amount;
  qualifiedByWindow: boolean; weeklyMatching: Amount; qualifiedShares: number; shortfall: Amount;
  weeklyProgressPct: number; estWeeklyPayout: Amount;
}
export interface DaoCycleSummary {
  cycle: number; totalDeposit: Amount; pool: Amount; members: number; totalShares: number;
  valuePerShare: Amount; time: Date | null; paid: boolean;
}
export interface DaoPayoutRow extends HistoryRow {
  cycle: number; wallet: Address; weeklyMatching: Amount; shares: number; shareValue: Amount; payout: Amount;
}
export interface DaoMemberRow {
  wallet: Address; id: number; userCode: string; lifetime: boolean;
  weeklyMatching: Amount; nextTierNeeded: Amount; shares: number; estReward: Amount;
}

export interface TeamMember {
  wallet: Address; id: number; userCode: string; level: number; rank: number; joinedAt: Date | null;
  selfStaked: Amount; directBusiness: Amount; teamBusiness: Amount;
  directCount: number; teamCount: number; daoPartner: boolean;
}
export interface TeamFilter {
  /** 0 = all levels, 1 = direct only, N = exactly level N */
  level?: number;
  onlyInvested?: boolean;
  daoOnly?: boolean;
  /** 0 = any rank */
  rank?: number;
}
export interface TeamSummary {
  directs: number; directContribution: Amount; totalMembers: number;
  contributing: number; teamBusiness: Amount; visibleLevels: number;
}

export interface SystemInfo {
  liquidityPool: Amount; totalSupply: Amount; totalBurned: Amount; price: Amount; contractUsdtBalance: Amount;
}
export interface PricePoint { time: Date; price: Amount }

export interface WalletBalances {
  usdt: Amount; aritoham: Amount; usdtAllowance: Amount; aritohamAllowance: Amount;
}
