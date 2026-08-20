import type { PublicClient, WalletClient } from "viem";
import { createExecutionKernelClient, type ExecutionKernelClient } from "@execution-kernel-protocol/sdk";
import { localAnvilAddresses } from "@execution-kernel-protocol/config";

/**
 * Pure wiring, kept separate from the React hook that calls it (see
 * hooks/useKernelClient.ts) -- same services/vs/hooks split apps/api uses
 * for services/vs/controllers. walletClient is optional: omit it for a
 * read-only client (no wallet connected yet).
 */
export function buildKernelClient(publicClient: PublicClient, walletClient?: WalletClient): ExecutionKernelClient {
  return createExecutionKernelClient({ addresses: localAnvilAddresses, publicClient, walletClient });
}
