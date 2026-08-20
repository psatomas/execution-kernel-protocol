import type { Address, PublicClient } from "viem";
import type { ExecutionKernelAddresses } from "@execution-kernel-protocol/sdk";
import type { Bytes32 } from "@execution-kernel-protocol/types";
import { createMemoryStore } from "./db/memoryStore.ts";
import { backfillKernelEvents } from "./processors/kernelEventProcessor.ts";
import { executionsByModule, moduleWinRate, totalExecutions } from "./metrics/executionMetrics.ts";

export * from "./db/memoryStore.ts";
export * from "./listeners/eventListener.ts";
export * from "./processors/kernelEventProcessor.ts";
export * from "./metrics/executionMetrics.ts";

export interface CreateIndexerParams {
  publicClient: PublicClient;
  addresses: ExecutionKernelAddresses;
  fromBlock: bigint;
}

/**
 * Backfills every kernel event from fromBlock to the current head into a
 * fresh in-memory store, and returns it alongside the metrics helpers bound
 * to it. Call backfillKernelEvents(...) yourself again (with a later
 * fromBlock) to pick up anything emitted since, or use
 * listeners/eventListener's watchEvents for a live subscription instead of
 * periodic backfills.
 */
export async function createIndexer(params: CreateIndexerParams) {
  const { publicClient, addresses, fromBlock } = params;
  const store = createMemoryStore();

  await backfillKernelEvents({ publicClient, addresses, store, fromBlock });

  return {
    store,
    totalExecutions: (intentType?: Bytes32) => totalExecutions(store, intentType),
    executionsByModule: (intentType?: Bytes32) => executionsByModule(store, intentType),
    moduleWinRate: (module: Address, intentType: Bytes32) => moduleWinRate(store, module, intentType),
  };
}

export type Indexer = Awaited<ReturnType<typeof createIndexer>>;
