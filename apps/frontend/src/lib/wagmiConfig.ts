import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { localAnvil } from "@execution-kernel-protocol/config";

/**
 * Only chain configured is the local anvil dev chain packages/config
 * defines — no testnet/mainnet exists yet (see README). Connect a browser
 * wallet pointed at a local anvil node (chain id 31337) to use this app.
 *
 * ssr: true is required here, not optional — without it wagmi's hooks
 * report "disconnected, no connectors" on the server (no wallet exists
 * during SSR) but read the real injected wallet state on the client's
 * first render, and those two renders disagreeing is a React hydration
 * mismatch. Any real visitor with a wallet extension installed would hit
 * this, not just an injected test provider.
 */
export const wagmiConfig = createConfig({
  chains: [localAnvil],
  connectors: [injected()],
  transports: {
    [localAnvil.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
