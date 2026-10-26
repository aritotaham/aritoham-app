import { parseAbi } from "viem";
import { getClient } from "../core/client";
import { config } from "../config/env";
import { assertAddress, toNum } from "../core/format";

const abi = parseAbi([
  "function timeUnit() pure returns (uint256)",
  "function userStakes(address, uint256) view returns (uint256 totalInvestment, uint256 ecosystemFee, uint256 tokenPrice, uint256 mintedTokens, uint256 tokenUsdValue, uint256 dailyRoi, uint256 totalRoi, uint256 totalDays, uint256 claimedRoi, uint256 startTime, uint256 lastClaimTime, bool completed)",
]);

export interface StakeTimer {
  index: number;                 // same index as the stakes table (oldest = 0)
  state: "active" | "done";      // done = completed / fully claimed
  nextClaimAt: number;           // ms timestamp; <= chain now means "claimable"
  claimable: number;             // estimated USDT you get if you claim now
  lastClaimAt: number;           // ms
}
export interface StakeTimers {
  timers: StakeTimer[];
  offsetMs: number;              // chain clock - browser clock, so the countdown matches the contract
}

/** Next-claim time and claimable amount for every stake of a user (mirrors claimRoi() in the contract). */
export async function getStakeTimers(address: string, count: number): Promise<StakeTimers> {
  const user = assertAddress(address);
  const client = getClient();
  const addr = config.addresses.protocol;

  const [unitBig, block, stakes] = await Promise.all([
    client.readContract({ address: addr, abi, functionName: "timeUnit" }),
    client.getBlock(),
    Promise.all(
      Array.from({ length: count }, (_, i) =>
        client.readContract({ address: addr, abi, functionName: "userStakes", args: [user, BigInt(i)] })
      )
    ),
  ]);

  const unit = unitBig as bigint;
  const now = block.timestamp;                                   // chain time (seconds)
  const offsetMs = Number(now) * 1000 - Date.now();

  const timers = stakes.map((s, index): StakeTimer => {
    const [, , , , , dailyRoi, totalRoi, totalDays, claimedRoi, startTime, lastClaimTime, completed] = s as readonly [
      bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean
    ];
    const remaining = totalRoi - claimedRoi;
    const lastClaimAt = Number(lastClaimTime) * 1000;

    if (completed || remaining <= 0n) return { index, state: "done", nextClaimAt: 0, claimable: 0, lastClaimAt };

    const stakeEnd = startTime + totalDays * unit;
    const ended = now >= stakeEnd;
    const effNow = ended ? stakeEnd : now;
    const periods = effNow > lastClaimTime ? (effNow - lastClaimTime) / unit : 0n;
    const gross = periods * dailyRoi;
    const earned = ended ? remaining : gross > remaining ? remaining : gross;
    const ready = ended || periods > 0n;

    return {
      index,
      state: "active",
      nextClaimAt: ready ? Number(now) * 1000 : Number(lastClaimTime + unit) * 1000,
      claimable: ready ? toNum(earned) : 0,
      lastClaimAt,
    };
  });

  return { timers, offsetMs };
}