import { encodeAbiParameters } from "viem";
import type { Address } from "viem";
import type { ExecutionKernelClient } from "@execution-kernel-protocol/sdk";
import type { Bytes32, ExecutionQuote, ExecutionScore, Hex } from "@execution-kernel-protocol/types";

/**
 * One registered module's live standing for an intent, as ExecutionEngine
 * would compute it right now: its ExecutionQuote and the ScorePolicy score
 * evaluate() gives that quote under the CURRENT on-chain weights.
 */
export interface ExecutionCandidate {
  module: Address;
  supportsIntent: boolean;
  /** Present only when supportsIntent is true — ExecutionEngine skips simulate() otherwise. */
  quote?: ExecutionQuote;
  score?: ExecutionScore;
}

export interface ExecutionGraph {
  intentType: Bytes32;
  candidates: ExecutionCandidate[];
  /**
   * The module ExecutionEngine._selectBestModule would currently pick:
   * highest score among supporting candidates, first-registered wins ties
   * (matches `score > bestScore`, not `>=`, in ExecutionEngine.sol).
   * undefined if no registered module supports this intent, or none are
   * registered at all — executeIntent() would revert in either case.
   */
  predictedWinner?: ExecutionCandidate;
}

/**
 * Fetches every module ModuleRegistry has registered for intentType, and for
 * each one that supportsIntent, gets its live quote (moduleClient.simulateQuote)
 * and score (scorePolicyClient.evaluate) — reproducing, off-chain and gas-free,
 * exactly what ExecutionEngine.executeIntent() would compute on-chain right now.
 *
 * This is a flat one-round scoring pass, matching the actually-implemented
 * "competing modules, single winner" selection model — not a multi-step
 * execution pipeline. See the README's Core Concept section for why: chained
 * multi-module graphs are a future direction, not built yet, so this builder
 * doesn't pretend to compose one.
 */
export async function buildExecutionGraph(
  kernel: ExecutionKernelClient,
  intentType: Bytes32,
  user: Address,
  intentData: Hex,
): Promise<ExecutionGraph> {
  const modules = await kernel.moduleRegistry.getModules(intentType);
  const context = encodeAbiParameters([{ type: "bytes32" }], [intentType]);

  const candidates: ExecutionCandidate[] = await Promise.all(
    modules.map(async (module): Promise<ExecutionCandidate> => {
      const supportsIntent = await kernel.module.supportsIntent(module, intentType);
      if (!supportsIntent) {
        return { module, supportsIntent };
      }

      const quote = await kernel.module.simulateQuote(module, user, intentData, context);
      const score = await kernel.scorePolicy.evaluate(quote);

      return { module, supportsIntent, quote, score };
    }),
  );

  let predictedWinner: ExecutionCandidate | undefined;
  for (const candidate of candidates) {
    if (candidate.score === undefined) continue;
    if (!predictedWinner || candidate.score > predictedWinner.score!) {
      predictedWinner = candidate;
    }
  }

  return { intentType, candidates, predictedWinner };
}
