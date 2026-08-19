import type { Address, Bytes32 } from "./primitives.ts";

/**
 * Mirrors the on-chain identity fields exposed by IExecutionModule.sol
 * (moduleId/name/version) plus the module's own address, as read off-chain
 * by sdk/execution-node — not the module's execute()/simulate()/
 * estimateCost()/supportsIntent() behavior, which only makes sense as a
 * live on-chain call.
 */
export interface ExecutionModuleInfo {
  address: Address;
  moduleId: Bytes32;
  name: string;
  version: bigint;
}

/**
 * Mirrors one (intentType, module) pairing tracked by ModuleRegistry.sol —
 * the registry's own module <-> intentType <-> active-status state, not the
 * module's identity (see ExecutionModuleInfo above).
 */
export interface ModuleRegistration {
  intentType: Bytes32;
  module: Address;
  active: boolean;
}

/** Mirrors ModuleRegistry.sol's ModuleRegistered event. */
export interface ModuleRegisteredEvent {
  intentType: Bytes32;
  module: Address;
}

/** Mirrors ModuleRegistry.sol's ModuleRemoved event. */
export interface ModuleRemovedEvent {
  intentType: Bytes32;
  module: Address;
}

/** Mirrors ModuleRegistry.sol's ModuleStatusUpdated event. */
export interface ModuleStatusUpdatedEvent {
  module: Address;
  active: boolean;
}
