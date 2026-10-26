import { parseAbiItem, type Hex } from "viem";
import { getClient } from "../core/client";
import { config } from "../config/env";
import { assertAddress } from "../core/format";

/**
 * The contracts do NOT store transaction hashes. When the UI needs a "Txn Hash"
 * column, look the hash up from the event logs.
 *
 *  - Purchases carry `blockNo`, so the match is exact.
 *  - Everything else is matched by amount / counterparty in the same order.
 *
 * Logs are read in chunks (NEXT_PUBLIC_LOG_CHUNK) because most RPCs cap eth_getLogs ranges.
 * Set NEXT_PUBLIC_DEPLOY_BLOCK so the scan does not start at block 0.
 */

const EV = {
  purchase: parseAbiItem("event TokensPurchased(address indexed user, uint256 usdtAmount, uint256 tokens, uint256 price)"),
  sold: parseAbiItem("event TokensSold(address indexed user, uint256 tokens, uint256 usdtPayout, uint256 price)"),
  withdraw: parseAbiItem("event Withdraw(address user, uint256 amount, uint256 tokens, uint256 fee, uint256 price)"),
  roi: parseAbiItem("event StakeRoiClaimed(address indexed user, uint256 indexed stakeIndex, uint256 stakeAmount, uint256 roiReward, uint256 forPeriods)"),
  direct: parseAbiItem("event DirectIncomeDistributed(address indexed from, address indexed to, uint256 amount)"),
  generation: parseAbiItem("event GenerationIncomeDistributed(address indexed from, address indexed to, uint256 level, uint256 amount)"),
  rank: parseAbiItem("event RankIncentiveUpdated(bytes32 indexed id, address indexed user, uint256 amount, uint256 rank, uint256 timestamp)"),
  dao: parseAbiItem("event DaoRewardCredited(address indexed user, uint256 amount)"),
} as const;

export type TxKind = keyof typeof EV;

export interface TxLog {
  txHash: Hex;
  blockNumber: number;
  logIndex: number;
  args: Record<string, any>;
}

/** Find the first block whose timestamp is >= `tsSec` (binary search, ~25 RPC calls). */
export async function blockForTimestamp(tsSec: number, fromBlock: bigint = config.deployBlock): Promise<bigint> {
  const client = getClient();
  let lo = fromBlock;
  let hi = await client.getBlockNumber();
  while (lo < hi) {
    const mid = (lo + hi) / 2n;
    const b = await client.getBlock({ blockNumber: mid, includeTransactions: false });
    if (Number(b.timestamp) < tsSec) lo = mid + 1n;
    else hi = mid;
  }
  return lo;
}

/**
 * Scan [fromBlock, toBlock] in chunks (NEXT_PUBLIC_LOG_CHUNK), `concurrency` requests at a time.
 * `args` filters indexed params server-side.
 */
export async function getLogsChunked(
  kind: TxKind,
  args: Record<string, unknown>,
  fromBlock: bigint = config.deployBlock,
  toBlock?: bigint,
  concurrency = 6
): Promise<TxLog[]> {
  const client = getClient();
  const end = toBlock ?? (await client.getBlockNumber());
  const ranges: [bigint, bigint][] = [];
  for (let start = fromBlock; start <= end; start += config.logChunk) {
    const stop = start + config.logChunk - 1n < end ? start + config.logChunk - 1n : end;
    ranges.push([start, stop]);
  }
  const out: TxLog[] = [];
  for (let i = 0; i < ranges.length; i += concurrency) {
    const batch = await Promise.all(
      ranges.slice(i, i + concurrency).map(([a, b]) =>
        client.getLogs({ address: config.addresses.protocol, event: EV[kind] as any, args: args as any, fromBlock: a, toBlock: b })
      )
    );
    for (const logs of batch)
      for (const l of logs as any[])
        out.push({ txHash: l.transactionHash, blockNumber: Number(l.blockNumber), logIndex: l.logIndex, args: l.args });
  }
  return out;
}

/**
 * Block range that covers a set of history rows (by their unix-second timestamps),
 * so log scans do not have to start at the deploy block.
 */
export async function blockRangeForTimes(timesSec: number[]): Promise<{ from: bigint; to: bigint }> {
  if (!timesSec.length) return { from: config.deployBlock, to: config.deployBlock };
  const [from, to] = await Promise.all([
    blockForTimestamp(Math.min(...timesSec) - 3),
    blockForTimestamp(Math.max(...timesSec) + 3),
  ]);
  return { from, to: to + 5n };
}

/** Participation rows -> Map<blockNo, txHash>. Use `row.blockNo` to look up. */
export async function getPurchaseTxHashes(user: string, blockNos: number[]): Promise<Map<number, Hex>> {
  if (!blockNos.length) return new Map();
  const from = BigInt(Math.min(...blockNos));
  const to = BigInt(Math.max(...blockNos));
  const logs = await getLogsChunked("purchase", { user: assertAddress(user) }, from, to);
  return new Map(logs.map((l) => [l.blockNumber, l.txHash]));
}

/** Withdraw logs for one wallet (the `user` arg is NOT indexed, so we filter after decoding). */
export async function getWithdrawLogs(user: string, fromBlock?: bigint, toBlock?: bigint): Promise<TxLog[]> {
  const u = assertAddress(user).toLowerCase();
  const logs = await getLogsChunked("withdraw", {}, fromBlock, toBlock);
  return logs.filter((l) => String(l.args.user).toLowerCase() === u);
}

export const getSellLogs = (user: string, fromBlock?: bigint, toBlock?: bigint) =>
  getLogsChunked("sold", { user: assertAddress(user) }, fromBlock, toBlock);
export const getRoiLogs = (user: string, fromBlock?: bigint, toBlock?: bigint) =>
  getLogsChunked("roi", { user: assertAddress(user) }, fromBlock, toBlock);
export const getDirectIncomeLogs = (to: string, fromBlock?: bigint, toBlock?: bigint) =>
  getLogsChunked("direct", { to: assertAddress(to) }, fromBlock, toBlock);
export const getGenerationLogs = (to: string, fromBlock?: bigint, toBlock?: bigint) =>
  getLogsChunked("generation", { to: assertAddress(to) }, fromBlock, toBlock);
export const getRankIncentiveLogs = (user: string, fromBlock?: bigint, toBlock?: bigint) =>
  getLogsChunked("rank", { user: assertAddress(user) }, fromBlock, toBlock);
export const getDaoRewardLogs = (user: string, fromBlock?: bigint, toBlock?: bigint) =>
  getLogsChunked("dao", { user: assertAddress(user) }, fromBlock, toBlock);

/**
 * Attach txHash to history rows, in order, by predicate.
 * Rows and logs are both consumed newest-first; each log can be used once.
 *
 *   attachTxHashes(rows, logs, (row, log) => row.amount === toNum(log.args.amount))
 */
export function attachTxHashes<R extends { txHash?: Hex }>(
  rows: R[],
  logs: TxLog[],
  match: (row: R, log: TxLog) => boolean
): R[] {
  const pool = [...logs].sort((a, b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex);
  const used = new Set<number>();
  return rows.map((row) => {
    const i = pool.findIndex((l, idx) => !used.has(idx) && match(row, l));
    if (i === -1) return row;
    used.add(i);
    return { ...row, txHash: pool[i].txHash };
  });
}
