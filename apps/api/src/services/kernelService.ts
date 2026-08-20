import { createPublicClient, http, type PublicClient } from "viem";
import { createExecutionKernelClient, type ExecutionKernelClient } from "@execution-kernel-protocol/sdk";
import { localAnvil, localAnvilAddresses } from "@execution-kernel-protocol/config";

/**
 * One shared, read-only ExecutionKernelClient (and the underlying
 * publicClient, which the metrics endpoints need directly for
 * indexer.createIndexer()) for the whole API process.
 *
 * No walletClient/account -- this API serves read-only registry/
 * prediction/metrics endpoints only, deliberately. Submitting transactions
 * on a caller's behalf would mean the API custodying a private key, with
 * its own auth/rate-limiting design to work out first -- a separate
 * decision from "build the API", not folded in here.
 */
export function createKernelService(): { kernel: ExecutionKernelClient; publicClient: PublicClient } {
  const publicClient = createPublicClient({ chain: localAnvil, transport: http() });
  const kernel = createExecutionKernelClient({ addresses: localAnvilAddresses, publicClient });

  return { kernel, publicClient };
}
