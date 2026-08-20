import type { Address } from "viem";
import type { Bytes32 } from "@execution-kernel-protocol/types";
import type { MemoryStore } from "../db/memoryStore.ts";

/** Total number of executeIntent() calls indexed, optionally filtered to one intentType. */
export function totalExecutions(store: MemoryStore, intentType?: Bytes32): number {
  const executions = store.getExecutions();
  if (!intentType) return executions.length;
  return executions.filter((e) => e.intentType === intentType).length;
}

/** Execution count per selected module, optionally filtered to one intentType — the "performance tracking of execution outcomes" the README's Observability Layer describes. */
export function executionsByModule(store: MemoryStore, intentType?: Bytes32): Map<Address, number> {
  const counts = new Map<Address, number>();

  for (const execution of store.getExecutions()) {
    if (intentType && execution.intentType !== intentType) continue;
    counts.set(execution.selectedModule, (counts.get(execution.selectedModule) ?? 0) + 1);
  }

  return counts;
}

/** Fraction of executions (0-1) a given module won, among those indexed for intentType. */
export function moduleWinRate(store: MemoryStore, module: Address, intentType: Bytes32): number {
  const total = totalExecutions(store, intentType);
  if (total === 0) return 0;

  const wins = executionsByModule(store, intentType).get(module) ?? 0;
  return wins / total;
}
