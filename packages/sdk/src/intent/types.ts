import type { Bytes32, Hex } from "@execution-kernel-protocol/types";

/**
 * The two arguments ExecutionEngine.executeIntent(bytes32, bytes) takes,
 * bundled together. intentData is opaque to the engine — only the module
 * that ends up winning selection decodes it.
 */
export interface Intent {
  intentType: Bytes32;
  intentData: Hex;
}
