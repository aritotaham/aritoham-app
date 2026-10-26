import type { Address, Hash } from "viem";
import { config } from "../config/env";
import { dataStoreAbi, erc20Abi, protocolAbi, readerAbi, readerTeamDaoAbi } from "../abi";
import { getClient, getWalletClient } from "./client";

/**
 * Thin typed wrappers: `reader.read("getDashboard", [addr])` etc.
 * Using one helper per contract keeps address + ABI wiring in a single place.
 */
const make = <A extends readonly unknown[]>(address: () => Address, abi: A) => ({
  address,
  abi,
});

export const contracts = {
  reader: make(() => config.addresses.reader, readerAbi),
  teamDao: make(() => config.addresses.readerTeamDao, readerTeamDaoAbi),
  protocol: make(() => config.addresses.protocol, protocolAbi),
  dataStore: make(() => config.addresses.dataStore, dataStoreAbi),
};

/* Individual, fully-typed read helpers (function names / args / results are inferred from the ABI). */

export const readReader = <F extends Extract<(typeof readerAbi)[number], { type: "function" }>["name"]>(
  functionName: F,
  args?: readonly unknown[]
) =>
  getClient().readContract({
    address: config.addresses.reader,
    abi: readerAbi,
    functionName: functionName as never,
    args: args as never,
  }) as Promise<any>;

export const readTeamDao = <F extends Extract<(typeof readerTeamDaoAbi)[number], { type: "function" }>["name"]>(
  functionName: F,
  args?: readonly unknown[]
) =>
  getClient().readContract({
    address: config.addresses.readerTeamDao,
    abi: readerTeamDaoAbi,
    functionName: functionName as never,
    args: args as never,
  }) as Promise<any>;

export const readProtocol = (functionName: string, args?: readonly unknown[]) =>
  getClient().readContract({
    address: config.addresses.protocol,
    abi: protocolAbi,
    functionName: functionName as never,
    args: args as never,
  }) as Promise<any>;

export const readStore = (functionName: string, args?: readonly unknown[]) =>
  getClient().readContract({
    address: config.addresses.dataStore,
    abi: dataStoreAbi,
    functionName: functionName as never,
    args: args as never,
  }) as Promise<any>;

export const readErc20 = (token: Address, functionName: string, args?: readonly unknown[]) =>
  getClient().readContract({ address: token, abi: erc20Abi, functionName: functionName as never, args: args as never }) as Promise<any>;




// ===================================================================================================
// =================================  Write functions  ==============================================
// ===================================================================================================


/* Wallet write helpers */



export const writeProtocol = async (
  functionName: string,
  args: readonly unknown[] = []
): Promise<Hash> => {
  const wallet = getWalletClient();
  const publicClient = getClient();

  const [account] = await wallet.requestAddresses();

  if (!account) {
    throw new Error("Please connect your wallet.");
  }

  const { request } = await publicClient.simulateContract({
    account,
    address: config.addresses.protocol,
    abi: protocolAbi,
    functionName: functionName as never,
    args: args as never,
  });

  return wallet.writeContract(request);
};


export const writeErc20 = async (
  token: Address,
  functionName: string,
  args: readonly unknown[] = []
): Promise<Hash> => {
  const wallet = getWalletClient();
  const [account] = await wallet.requestAddresses();

  if (!account) {
    throw new Error("Please connect your wallet.");
  }

  return wallet.writeContract({
    account,
    address: token,
    abi: erc20Abi,
    functionName: functionName as never,
    args: args as never,
  });
};
