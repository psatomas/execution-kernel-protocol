import type { Address } from "viem";
import type { ExecuteIntentResult, ExecutionKernelClient, Intent } from "@execution-kernel-protocol/sdk";

/**
 * Submits a processed Intent via the SDK's executionClient. Kept as its own
 * module (rather than inlined wherever intents get submitted) so retry/
 * queueing/logging around just the submission step has one place to live.
 */
export async function executeIntent(
  kernel: ExecutionKernelClient,
  intent: Intent,
  account?: Address,
): Promise<ExecuteIntentResult> {
  return kernel.execution.executeIntent(intent, account);
}
