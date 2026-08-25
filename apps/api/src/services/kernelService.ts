import { createPublicClient, http, type PublicClient } from "viem";
import { createExecutionKernelClient, type ExecutionKernelClient } from "@execution-kernel-protocol/sdk";
import { localAnvilDeployment, type KernelDeploymentConfig } from "@execution-kernel-protocol/config";

/**
 * One shared, read-only ExecutionKernelClient (and the underlying
 * publicClient, which the metrics endpoints need directly for
 * indexer.createIndexer()) for the whole API process.
 *
 * Takes the kernel deployment (chain + addresses) explicitly rather than
 * importing localAnvil/localAnvilAddresses directly -- one API process
 * serves one configured customer deployment, not necessarily the local one.
 * Defaults to localAnvilDeployment purely for local-dev convenience: run
 * this with no config and you get exactly today's behavior.
 *
 * No walletClient/account -- this API serves read-only registry/
 * prediction/metrics endpoints only, deliberately. Submitting transactions
 * on a caller's behalf would mean the API custodying a private key, with
 * its own auth/rate-limiting design to work out first -- a separate
 * decision from "build the API", not folded in here.
 */
export function createKernelService(
  config: KernelDeploymentConfig = localAnvilDeployment,
): { kernel: ExecutionKernelClient; publicClient: PublicClient } {
  const publicClient = createPublicClient({ chain: config.chain, transport: http() });
  const kernel = createExecutionKernelClient({ addresses: config.addresses, publicClient });

  return { kernel, publicClient };
}
