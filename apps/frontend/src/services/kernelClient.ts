import type { PublicClient, WalletClient } from "viem";
import { createExecutionKernelClient, type ExecutionKernelClient } from "@execution-kernel-protocol/sdk";
import { localAnvilAddresses, type DeployedKernelAddresses } from "@execution-kernel-protocol/config";

/**
 * Pure wiring, kept separate from the React hook that calls it (see
 * hooks/useKernelClient.ts) -- same services/vs/hooks split apps/api uses
 * for services/vs/controllers. walletClient is optional: omit it for a
 * read-only client (no wallet connected yet).
 *
 * addresses defaults to localAnvilAddresses (this console's own local dev
 * chain, unchanged from before) but is an explicit parameter, not a hidden
 * import -- a customer adapting this same pattern for their own kernel
 * deployment points it at their own ExecutionKernelAddresses instead. This
 * app itself stays local-anvil-only by design (see docs/architecture/
 * b2b-integration.md): it's our own protocol console, not a customer
 * product meant to be repointed at arbitrary kernels at runtime.
 */
export function buildKernelClient(
  publicClient: PublicClient,
  walletClient?: WalletClient,
  addresses: DeployedKernelAddresses = localAnvilAddresses,
): ExecutionKernelClient {
  return createExecutionKernelClient({ addresses, publicClient, walletClient });
}
