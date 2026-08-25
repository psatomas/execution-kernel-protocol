import type { Chain } from "viem";
import { sepolia as viemSepolia } from "viem/chains";

/**
 * The local anvil dev chain every sdk/execution-node/indexer example script
 * in this repo deploys to and connects against.
 */
export const localAnvil: Chain = {
  id: 31337,
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
};

/**
 * The one real EVM testnet this repo targets for infrastructure
 * validation (see docs/architecture/testnet-deployment.md) -- Ethereum's
 * standard, actively-maintained public testnet (Goerli is deprecated).
 * Re-exports viem's own built-in chain definition rather than redefining
 * one -- this is deliberately not the start of a general multi-chain
 * registry, just the one additional chain this task needs. Callers that
 * want a specific RPC (rather than viem's bundled default) pass their own
 * `transport` when constructing a client, same as for localAnvil.
 */
export const sepolia: Chain = viemSepolia;
