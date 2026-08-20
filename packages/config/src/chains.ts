import type { Chain } from "viem";

/**
 * The local anvil dev chain every sdk/execution-node/indexer example script
 * in this repo deploys to and connects against. Not a testnet/mainnet entry
 * -- no real deployment exists yet (see the README's "stay local for now"
 * decision). Add a real chain profile here once that changes.
 */
export const localAnvil: Chain = {
  id: 31337,
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
};
