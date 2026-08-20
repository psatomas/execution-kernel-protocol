import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { localAnvil } from "@execution-kernel-protocol/config";

/**
 * Only chain configured is the local anvil dev chain packages/config
 * defines — no testnet/mainnet exists yet (see README). Connect a browser
 * wallet pointed at a local anvil node (chain id 31337) to use this app.
 */
export const wagmiConfig = createConfig({
  chains: [localAnvil],
  connectors: [injected()],
  transports: {
    [localAnvil.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
