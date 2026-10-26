import type { Address, Hash } from "viem";
import { parseUnits } from "viem";
import {
  readProtocol,
  writeProtocol as writeProtocolContract,
  writeErc20,
} from "../core/contracts";
import { assertAddress } from "../core/format";
import { config } from "../config/env";

export async function registerUser(referrer: string): Promise<Hash> {
  return writeProtocolContract("register", [assertAddress(referrer)]);
}

export async function approveUSDT(
  amount: string,
  decimals: number
): Promise<Hash> {
  const usdt = (await readProtocol("usdt")) as Address;

  return writeErc20(usdt, "approve", [
    config.addresses.protocol,
    parseUnits(amount, decimals),
  ]);
}

export async function approveARITOHEM(
  amount: string,
  decimals: number
): Promise<Hash> {
  const usdt = (await readProtocol("aritoham")) as Address;

  return writeErc20(usdt, "approve", [
    config.addresses.protocol,
    parseUnits(amount, decimals),
  ]);
}

export async function stakeTokens(
  amount: string,
  usdtDecimals: number,
  minTokensOut: bigint = 0n
): Promise<Hash> {
  return writeProtocolContract("stakeTokens", [
    parseUnits(amount, usdtDecimals),
    minTokensOut,
  ]);
}

export async function sellTokens(
  amount: string,
  tokenDecimals: number
): Promise<Hash> {
  return writeProtocolContract("sellTokens", [
    parseUnits(amount, tokenDecimals),
  ]);
}

export async function claimRoi(): Promise<Hash> {
  return writeProtocolContract("claimRoi");
}

export async function withdraw(
  amount: string,
  tokenDecimals: number
): Promise<Hash> {
  return writeProtocolContract("withdraw", [
    parseUnits(amount, tokenDecimals),
  ]);
}