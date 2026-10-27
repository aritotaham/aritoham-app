import { createPublicClient, fallback, http, type PublicClient } from "viem";
import { assertConfigured, config } from "../config/env";

let _client: PublicClient | null = null;

/**
 * Shared read-only client. `multicall` batching is on, so several readContract
 * calls issued in the same tick are merged into one RPC request.
 */
export function getClient(): PublicClient {
  if (!_client) {
    assertConfigured();
    _client = createPublicClient({
      chain: config.chain,
      transport: fallback(config.rpcUrls.map((u) => http(u, { batch: true, retryCount: 1, timeout: 20_000 })), { rank: false }),
      batch: { multicall: true },
    }) as PublicClient;
  }
  return _client;
}




import { createWalletClient, custom } from "viem";

export function getWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Please connect a wallet first.");
  }

  return createWalletClient({
    chain: config.chain,
    transport: custom(window.ethereum),
  });
}
