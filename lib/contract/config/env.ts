import { bsc, bscTestnet } from "viem/chains";
import type { Address, Chain } from "viem";

/**
 * All runtime configuration lives here. Defaults point at the BSC Testnet deployment,
 * so the site works with no .env file. Override any value with NEXT_PUBLIC_* variables.
 *
 * NOTE: Next.js only inlines NEXT_PUBLIC_* variables when they are referenced
 * literally (process.env.NEXT_PUBLIC_X), so do not refactor these into a loop.
 */
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 97);

const CHAINS: Record<number, Chain> = { 56: bsc, 97: bscTestnet };

export const chain: Chain = CHAINS[chainId] ?? bscTestnet;

/** Public RPCs tried in order (viem `fallback`). A custom NEXT_PUBLIC_RPC_URL goes first. */
const PUBLIC_RPCS: Record<number, string[]> = {
  97: [
    "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
    "https://data-seed-prebsc-2-s1.bnbchain.org:8545",
    "https://bsc-testnet-rpc.publicnode.com",
    "https://bsc-testnet.drpc.org",
  ],
  56: ["https://bsc-dataseed.bnbchain.org", "https://bsc-rpc.publicnode.com", "https://bsc.drpc.org"],
};

const custom = process.env.NEXT_PUBLIC_RPC_URL;

export const config = {
  chain,
  rpcUrls: [...(custom ? [custom] : []), ...(PUBLIC_RPCS[chain.id] ?? chain.rpcUrls.default.http)],
  explorer: chain.blockExplorers?.default.url ?? "https://testnet.bscscan.com",
  addresses: {
    protocol: (process.env.NEXT_PUBLIC_PROTOCOL_ADDRESS || "0x9d261167aF37Da41e543e5a1352E0bCE6dAC3534") as Address,
    dataStore: (process.env.NEXT_PUBLIC_DATASTORE_ADDRESS || "0xD56fabC51df40789889cBa979E6d698E085A9Fec") as Address,
    reader: (process.env.NEXT_PUBLIC_READER_ADDRESS || "0xAEbd131f2A6688BCCD98a68b8e3E1a24DfbCc838") as Address,
    readerTeamDao: (process.env.NEXT_PUBLIC_READER_TEAMDAO_ADDRESS || "0xd4014A0837fd3BC5D4E40cae2c46Ca9f74F6Aa95") as Address,
    usdt: (process.env.NEXT_PUBLIC_USDT || "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd") as Address,
    aritoham: (process.env.NEXT_PUBLIC_ARITOHAM || "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd") as Address,
  },
  deployBlock: BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK || 0),
  logChunk: BigInt(process.env.NEXT_PUBLIC_LOG_CHUNK || 5000),
  userPrefix: process.env.NEXT_PUBLIC_USER_PREFIX || "ARI",
  decimals: 18,
} as const;

export function assertConfigured() {
  const missing = Object.entries(config.addresses).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) throw new Error(`Missing contract address env var(s): ${missing.join(", ")}. See .env.example`);
}
