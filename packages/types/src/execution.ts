import type { Address, Bytes32, Hex } from "./primitives.js";

/**
 * Mirrors ExecutionQuote in packages/contracts/src/types/ExecutionQuote.sol.
 * The standardized output every module's simulate() returns and ScorePolicy
 * scores. Numeric fields are bigint (uint256 on-chain, can exceed
 * Number.MAX_SAFE_INTEGER).
 */
export interface ExecutionQuote {
  tag: string;
  /** Lower is better (cost efficiency). */
  executionCost: bigint;
  /** Higher is better (execution quality / success probability). */
  executionQuality: bigint;
  /** Lower is better (MEV exposure risk). */
  mevRisk: bigint;
  /** Lower is better (latency / time-to-finality). */
  latencyScore: bigint;
}

/**
 * Mirrors ScorePolicy.Weights in packages/contracts/src/policy/ScorePolicy.sol.
 * Set at deploy time and updatable post-deploy via ScorePolicy.updateWeights()
 * (ProtocolRoles-owner-gated, takes effect immediately, no timelock).
 */
export interface ScorePolicyWeights {
  qualityWeight: bigint;
  costWeight: bigint;
  mevWeight: bigint;
  latencyWeight: bigint;
}

/**
 * The result of ScorePolicy.evaluate(quote): a signed weighted score, higher
 * is better. Signed (not uint256) because a module whose penalty terms
 * outweigh its quality has a legitimately negative score — see the comment
 * on ScorePolicy.evaluate() for why this must not be allowed to underflow.
 */
export type ExecutionScore = bigint;

/**
 * Mirrors the IntentExecuted event emitted by ExecutionEngine.executeIntent()
 * in packages/contracts/src/core/ExecutionEngine.sol.
 */
export interface IntentExecutedEvent {
  user: Address;
  intentType: Bytes32;
  selectedModule: Address;
  result: Hex;
}
