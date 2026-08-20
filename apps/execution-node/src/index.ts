import type { Address } from "viem";
import type { ExecuteIntentResult, ExecutionKernelClient } from "@execution-kernel-protocol/sdk";
import { processIntent, type IntentRequest } from "./engine/intentProcessor.ts";
import { solve, type SolveResult } from "./solvers/solver.ts";
import { executeIntent } from "./execution/executor.ts";

export * from "./engine/intentProcessor.ts";
export * from "./engine/executionGraphBuilder.ts";
export * from "./solvers/solver.ts";
export * from "./execution/executor.ts";

export interface RunIntentResult {
  prediction: SolveResult;
  submission: ExecuteIntentResult;
}

/**
 * The full off-chain pipeline CLAUDE.md's execution-node description names:
 * intent processing -> execution-graph building/solving -> submission.
 * Previews the predicted winner before spending any gas (throws if no
 * module currently supports the intent, same as executeIntent() would
 * revert), then actually submits.
 *
 * Note "graph" here means the current one-round competing-modules model
 * (see engine/executionGraphBuilder.ts) — not chained multi-module
 * execution, which isn't implemented on-chain yet.
 */
export async function runIntent(
  kernel: ExecutionKernelClient,
  request: IntentRequest,
  user: Address,
): Promise<RunIntentResult> {
  const intent = processIntent(request);
  const prediction = await solve(kernel, intent.intentType, user, intent.intentData);
  const submission = await executeIntent(kernel, intent, user);

  return { prediction, submission };
}
