import { intentType, buildIntent } from "@execution-kernel-protocol/sdk";
import type { Intent } from "@execution-kernel-protocol/sdk";
import type { Hex } from "@execution-kernel-protocol/types";

/** A raw, not-yet-hashed intent request — what a caller (UI, API, CLI) actually has on hand. */
export interface IntentRequest {
  /** Human-readable label, e.g. "ROUTE" — hashed into the on-chain intentType. */
  label: string;
  /** Opaque payload the winning module will decode. Empty ("0x") if the module needs none. */
  intentData: Hex;
}

/**
 * Normalizes a raw IntentRequest into the Intent ExecutionEngine.executeIntent()
 * and the rest of this pipeline expect. Doesn't touch the chain — pure
 * label-hashing, so it's safe to call before the intent type is even known
 * to be registered on-chain.
 */
export function processIntent(request: IntentRequest): Intent {
  return buildIntent({
    intentType: intentType(request.label),
    intentData: request.intentData,
  });
}
