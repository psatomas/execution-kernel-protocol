import type { Address } from "viem";
import type { Bytes32, Hex } from "@execution-kernel-protocol/types";

export interface IntentExecutionRecord {
  blockNumber: bigint;
  transactionHash: Hex;
  user: Address;
  intentType: Bytes32;
  selectedModule: Address;
  result: Hex;
}

export interface ModuleRegistrationRecord {
  blockNumber: bigint;
  intentType: Bytes32;
  module: Address;
  active: boolean;
}

export interface IntentRegistrationRecord {
  blockNumber: bigint;
  intentType: Bytes32;
  name?: string;
  active: boolean;
}

export interface WeightsUpdateRecord {
  blockNumber: bigint;
  qualityWeight: bigint;
  costWeight: bigint;
  mevWeight: bigint;
  latencyWeight: bigint;
}

export interface OwnershipTransferRecord {
  blockNumber: bigint;
  previousOwner: Address;
  newOwner: Address;
}

/**
 * In-memory store: enough to prove the indexing pipeline end to end without
 * committing to a real database dependency (SQLite/Postgres/etc.) before
 * there's a concrete need for one. Swap this for a real backend behind the
 * same interface once persistence across restarts actually matters.
 */
export function createMemoryStore() {
  const executions: IntentExecutionRecord[] = [];
  const moduleRegistrations: ModuleRegistrationRecord[] = [];
  const intentRegistrations: IntentRegistrationRecord[] = [];
  const weightsUpdates: WeightsUpdateRecord[] = [];
  const ownershipTransfers: OwnershipTransferRecord[] = [];

  return {
    recordExecution(record: IntentExecutionRecord): void {
      executions.push(record);
    },
    recordModuleRegistration(record: ModuleRegistrationRecord): void {
      moduleRegistrations.push(record);
    },
    recordIntentRegistration(record: IntentRegistrationRecord): void {
      intentRegistrations.push(record);
    },
    recordWeightsUpdate(record: WeightsUpdateRecord): void {
      weightsUpdates.push(record);
    },
    recordOwnershipTransfer(record: OwnershipTransferRecord): void {
      ownershipTransfers.push(record);
    },

    getExecutions(): readonly IntentExecutionRecord[] {
      return executions;
    },
    getModuleRegistrations(): readonly ModuleRegistrationRecord[] {
      return moduleRegistrations;
    },
    getIntentRegistrations(): readonly IntentRegistrationRecord[] {
      return intentRegistrations;
    },
    getWeightsUpdates(): readonly WeightsUpdateRecord[] {
      return weightsUpdates;
    },
    getOwnershipTransfers(): readonly OwnershipTransferRecord[] {
      return ownershipTransfers;
    },
  };
}

export type MemoryStore = ReturnType<typeof createMemoryStore>;
