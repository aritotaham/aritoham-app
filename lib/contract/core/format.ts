import { formatUnits, isAddress, type Address } from "viem";
import { config } from "../config/env";

/** 18-decimal on-chain amount -> JS number (for display; use the raw bigint for maths that must be exact). */
export const toNum = (v: bigint | number | undefined | null, decimals: number = config.decimals): number =>
  v == null ? 0 : Number(formatUnits(BigInt(v), decimals));

/** Basis points -> percent (1500 -> 15). */
export const bpsToPct = (bps: bigint | number): number => Number(bps) / 100;

/** Unix seconds -> Date. */
export const secToDate = (s: bigint | number): Date => new Date(Number(s) * 1000);

/** 1000001 -> "ARI1000001" */
export const userCode = (id: number | bigint): string => (Number(id) ? `${config.userPrefix}${id}` : "");

/** "ARI1000001" | "1000001" -> 1000001 (NaN when invalid) */
export const parseUserCode = (code: string): number => Number(code.trim().replace(new RegExp(`^${config.userPrefix}`, "i"), ""));

export const shortAddress = (a: string) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "");

export const isZeroAddress = (a: string) => /^0x0{40}$/i.test(a);

/** Accepts any address casing (wallets differ) and returns it lower-cased, which viem always accepts. */
export function assertAddress(a: string): Address {
  if (!isAddress(a, { strict: false })) throw new Error(`Invalid address: ${a}`);
  return a.toLowerCase() as Address;
}

/**
 * Make any result JSON-safe (bigint -> string). Use this in Next.js route handlers /
 * getServerSideProps, because JSON.stringify throws on bigint.
 */
export function serialize<T>(value: T): unknown {
  return JSON.parse(JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));
}
