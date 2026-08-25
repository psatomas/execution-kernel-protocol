import type { Chain } from "viem";
import { localAnvil } from "./chains.ts";
import { localAnvilAddresses, type DeployedKernelAddresses } from "./addresses.ts";

/**
 * The smallest configuration a consumer (apps/api, apps/frontend, a
 * customer's own tooling) needs to point itself at one specific kernel
 * deployment: which chain to talk to, and that deployment's 5 contract
 * addresses. Deliberately does not carry a "protocolOwner" field -- who
 * owns a deployment matters at provision time (see
 * script/Deploy.s.sol's PROTOCOL_OWNER), not as ongoing runtime
 * configuration for reading/predicting/submitting against it.
 *
 * Not a multi-chain registry or a lookup keyed by chain id -- just this one
 * shape, reused per deployment. Add a new instance (like localAnvilDeployment
 * below) per real deployment as they come to exist; don't build the
 * speculative infrastructure to look one up before there's a second one.
 */
export interface KernelDeploymentConfig {
  chain: Chain;
  addresses: DeployedKernelAddresses;
}

/** The local anvil dev deployment, bundled into the shape above. */
export const localAnvilDeployment: KernelDeploymentConfig = {
  chain: localAnvil,
  addresses: localAnvilAddresses,
};

/**
 * Every known kernel deployment, keyed by chain id -- lets a consumer that
 * only knows "which chain is this wallet/request on" (e.g. apps/frontend's
 * useKernelClient, reading wagmi's connected chain id) resolve the right
 * KernelDeploymentConfig without hardcoding one specific deployment. A
 * chain id with no entry means no kernel is known to be deployed there --
 * callers should treat that as "unsupported", not silently fall back to a
 * different chain's addresses.
 *
 * sepolia's entry is added here once its real deployment addresses exist
 * (see docs/architecture/testnet-deployment.md) -- deliberately not
 * populated with placeholder/guessed addresses ahead of that.
 */
export const deploymentsByChainId: Partial<Record<number, KernelDeploymentConfig>> = {
  [localAnvil.id]: localAnvilDeployment,
};
