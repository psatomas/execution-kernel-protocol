import { keccak256, toBytes } from "viem";
import type { Bytes32 } from "@execution-kernel-protocol/types";
import type { Intent } from "./types.ts";

/**
 * Computes the bytes32 intentType IntentRegistry/ModuleRegistry key on,
 * matching Solidity's keccak256("label") — i.e. the hash of the label's
 * raw UTF-8 bytes, not an ABI-encoded string. `keccak256("ROUTE")` on-chain
 * and `intentType("ROUTE")` here produce the identical bytes32.
 */
export function intentType(label: string): Bytes32 {
  return keccak256(toBytes(label));
}

/** Bundles an intentType and its opaque intentData into an Intent. */
export function buildIntent(params: Intent): Intent {
  return { intentType: params.intentType, intentData: params.intentData };
}
