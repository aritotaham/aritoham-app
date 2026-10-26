import type { Address } from "viem";
import {
  readErc20,
  readProtocol,
  readReader,
  readStore,
} from "../core/contracts";
import { assertAddress, secToDate, toNum } from "../core/format";
import { config } from "../config/env";
import type { PricePoint, SystemInfo, WalletBalances } from "../types";

/** Liquidity pool, supply, burned, price - for the header / price cards. */
export async function getSystemInfo(): Promise<SystemInfo> {
  const r = await readProtocol("getSystemInfo");
  return {
    liquidityPool: toNum(r.liquidityPool ?? r[0]),
    totalSupply: toNum(r.totalSupply ?? r[1]),
    totalBurned: toNum(r.totalBurnedTokens ?? r[2]),
    price: toNum(r.currentPrice ?? r[3]),
    contractUsdtBalance: toNum(r.contractUsdtBalance ?? r[4]),
  };
}

export async function getCurrentPrice(): Promise<number> {
  return toNum(await readProtocol("currentPrice"));
}

/** Last `n` price points for the price chart. */
export async function getPriceHistory(n = 30): Promise<PricePoint[]> {
  const r = await readReader("getPriceHistory", [BigInt(n)]);
  const times: bigint[] = r.times ?? r[0];
  const prices: bigint[] = r.prices ?? r[1];
  return times.map((t, i) => ({ time: secToDate(t), price: toNum(prices[i]) }));
}

/** Global counters (total users, total deposits, cycles). */
export async function getGlobalStats() {
  const [
    totalUsers,
    totalDeposits,
    currentCycle,
    lastDistributedCycle,
    lifetimeHolders,
  ] = await Promise.all([
    readStore("totalUsers"),
    readStore("totalDeposits"),
    readStore("currentCycle"),
    readStore("lastDistributedCycle"),
    readStore("lifetimeHolders"),
  ]);
  return {
    totalUsers: Number(totalUsers),
    totalDeposits: toNum(totalDeposits),
    currentCycle: Number(currentCycle),
    lastDistributedCycle: Number(lastDistributedCycle),
    lifetimeHolders: Number(lifetimeHolders),
  };
}

/** Business rules shown on forms (min/max buy, withdraw limits...). */
export async function getLimits() {
  const [minBuy, maxBuy, buyStep, minWithdraw, maxWithdraw, dailySellLimit] =
    await Promise.all([
      readProtocol("MIN_BUY"),
      readProtocol("MAX_BUY"),
      readProtocol("BUY_STEP"),
      readProtocol("MIN_WITHDRAW"),
      readProtocol("MAX_WITHDRAW"),
      readProtocol("DAILY_SELL_LIMIT"),
    ]);
  return {
    minBuy: toNum(minBuy),
    maxBuy: toNum(maxBuy),
    buyStep: toNum(buyStep),
    minWithdraw: toNum(minWithdraw),
    maxWithdraw: toNum(maxWithdraw),
    dailySellLimit: toNum(dailySellLimit),
  };
}

/** Working cap card: total = earned + remaining. */
export async function getWorkingCap(address: string) {
  const u = await readProtocol("getUser", [assertAddress(address)]);
  const earned = toNum(u.totalIncome);
  const remaining = toNum(u.remainingCap);
  const total = earned + remaining;
  let totalCap = toNum(u.totalInvestment * u.maxPayout);
  let caEarned = totalCap - remaining;
  return {
    total,
    earned,
    remaining,
    usedPct: total ? Math.floor((caEarned / totalCap) * 100) : 0,
    maxPayoutMultiplier: Number(u.maxPayout),
    totalCap,
    caEarned
  };
}

/** Address of the ARITOHAM token (stored in the protocol contract). */
export async function getTokenAddress(): Promise<string> {
  return readProtocol("aritoham");
}

export async function isRegistered(address: string): Promise<boolean> {
  return readProtocol("isUserRegistered", [assertAddress(address)]);
}

export async function getPaused(): Promise<boolean> {
  return readProtocol("paused");
}

/** Resolve a numeric user id (e.g. 1000001 from "ARI1000001") to a wallet address. Returns null if unknown. */
export async function getAddressByUserId(id: number): Promise<Address | null> {
  const a: Address = await readStore("idToUser", [id]);
  return /^0x0{40}$/i.test(a) ? null : a;
}

/** USDT + ARITOHAM balances and allowances towards the protocol (for Buy / Sell buttons). */
export async function getWalletBalances(
  address: string
): Promise<WalletBalances> {
  const a = assertAddress(address);
  let [usdt, token]: Address[] = await Promise.all([
    readProtocol("usdt"),
    readProtocol("aritoham"),
  ]);
  const spender = config.addresses.protocol;
  const [ub, tb, ua, ta] = await Promise.all([
    readErc20(usdt, "balanceOf", [a]),
    readErc20(token, "balanceOf", [a]),
    readErc20(usdt, "allowance", [a, spender]),
    readErc20(token, "allowance", [a, spender]),
  ]);
  return {
    usdt: toNum(ub),
    aritoham: toNum(tb),
    usdtAllowance: toNum(ua),
    aritohamAllowance: toNum(ta),
  };
}
