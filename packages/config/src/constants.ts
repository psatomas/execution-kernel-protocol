import { keccak256, toBytes } from "viem";
import type { Bytes32 } from "@execution-kernel-protocol/types";

/**
 * intentType for the ROUTE intent script/Deploy.s.sol registers, matching
 * Solidity's keccak256("ROUTE") exactly (same hash function sdk's
 * intentBuilder.intentType() uses -- computed independently here, not
 * imported from sdk, so config has no dependency on sdk).
 */
export const ROUTE_INTENT_TYPE: Bytes32 = keccak256(toBytes("ROUTE"));
