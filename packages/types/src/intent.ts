import type { Bytes32 } from "./primitives.js";

/**
 * Mirrors IntentDefinition in packages/contracts/src/core/IntentRegistry.sol.
 * createdAt is a unix timestamp in seconds (block.timestamp on-chain).
 */
export interface IntentDefinition {
  intentType: Bytes32;
  name: string;
  active: boolean;
  createdAt: bigint;
}

/** Mirrors IntentRegistry.sol's IntentRegistered event. */
export interface IntentRegisteredEvent {
  intentType: Bytes32;
  name: string;
}

/** Mirrors IntentRegistry.sol's IntentStatusUpdated event. */
export interface IntentStatusUpdatedEvent {
  intentType: Bytes32;
  active: boolean;
}
