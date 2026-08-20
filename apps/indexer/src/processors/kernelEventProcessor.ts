import type { PublicClient } from "viem";
import {
  executionEngineAbi,
  intentRegistryAbi,
  moduleRegistryAbi,
  scorePolicyAbi,
  protocolRolesAbi,
  type ExecutionKernelAddresses,
} from "@execution-kernel-protocol/sdk";
import { backfillEvents } from "../listeners/eventListener.ts";
import type { MemoryStore } from "../db/memoryStore.ts";

export interface BackfillKernelEventsParams {
  publicClient: PublicClient;
  addresses: ExecutionKernelAddresses;
  store: MemoryStore;
  fromBlock: bigint;
  toBlock?: bigint | "latest";
}

/**
 * Backfills every event this repo's contracts emit, across all 5 kernel
 * contracts, and normalizes each into the shape MemoryStore expects.
 *
 * ModuleRegistry emits both ModuleRegistered/ModuleRemoved (which carry
 * intentType) and ModuleStatusUpdated (which doesn't) for the same calls —
 * Registered/Removed alone are enough to reconstruct
 * {intentType, module, active}, so ModuleStatusUpdated isn't indexed
 * separately here.
 */
export async function backfillKernelEvents(params: BackfillKernelEventsParams): Promise<void> {
  const { publicClient, addresses, store, fromBlock, toBlock } = params;

  const [
    executedLogs,
    moduleRegisteredLogs,
    moduleRemovedLogs,
    intentRegisteredLogs,
    intentStatusLogs,
    weightsLogs,
    ownershipLogs,
  ] = await Promise.all([
    backfillEvents({ publicClient, address: addresses.executionEngine, abi: executionEngineAbi, eventName: "IntentExecuted", fromBlock, toBlock }),
    backfillEvents({ publicClient, address: addresses.moduleRegistry, abi: moduleRegistryAbi, eventName: "ModuleRegistered", fromBlock, toBlock }),
    backfillEvents({ publicClient, address: addresses.moduleRegistry, abi: moduleRegistryAbi, eventName: "ModuleRemoved", fromBlock, toBlock }),
    backfillEvents({ publicClient, address: addresses.intentRegistry, abi: intentRegistryAbi, eventName: "IntentRegistered", fromBlock, toBlock }),
    backfillEvents({ publicClient, address: addresses.intentRegistry, abi: intentRegistryAbi, eventName: "IntentStatusUpdated", fromBlock, toBlock }),
    backfillEvents({ publicClient, address: addresses.scorePolicy, abi: scorePolicyAbi, eventName: "WeightsUpdated", fromBlock, toBlock }),
    backfillEvents({ publicClient, address: addresses.protocolRoles, abi: protocolRolesAbi, eventName: "OwnershipTransferred", fromBlock, toBlock }),
  ]);

  for (const log of executedLogs) {
    store.recordExecution({
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      user: log.args.user!,
      intentType: log.args.intentType!,
      selectedModule: log.args.selectedModule!,
      result: log.args.result!,
    });
  }

  for (const log of moduleRegisteredLogs) {
    store.recordModuleRegistration({
      blockNumber: log.blockNumber,
      intentType: log.args.intentType!,
      module: log.args.module!,
      active: true,
    });
  }

  for (const log of moduleRemovedLogs) {
    store.recordModuleRegistration({
      blockNumber: log.blockNumber,
      intentType: log.args.intentType!,
      module: log.args.module!,
      active: false,
    });
  }

  for (const log of intentRegisteredLogs) {
    store.recordIntentRegistration({
      blockNumber: log.blockNumber,
      intentType: log.args.intentType!,
      name: log.args.name,
      active: true,
    });
  }

  for (const log of intentStatusLogs) {
    store.recordIntentRegistration({
      blockNumber: log.blockNumber,
      intentType: log.args.intentType!,
      active: log.args.active!,
    });
  }

  for (const log of weightsLogs) {
    store.recordWeightsUpdate({
      blockNumber: log.blockNumber,
      qualityWeight: log.args.qualityWeight!,
      costWeight: log.args.costWeight!,
      mevWeight: log.args.mevWeight!,
      latencyWeight: log.args.latencyWeight!,
    });
  }

  for (const log of ownershipLogs) {
    store.recordOwnershipTransfer({
      blockNumber: log.blockNumber,
      previousOwner: log.args.previousOwner!,
      newOwner: log.args.newOwner!,
    });
  }
}
