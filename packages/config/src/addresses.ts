import type { Address } from "viem";

/**
 * Structurally identical to sdk's ExecutionKernelAddresses, defined here
 * independently (not imported from @execution-kernel-protocol/sdk) so
 * config has no dependency on sdk -- sdk's own examples import config,
 * and config -> sdk -> config would be circular.
 */
export interface DeployedKernelAddresses {
  protocolRoles: Address;
  intentRegistry: Address;
  moduleRegistry: Address;
  scorePolicy: Address;
  executionEngine: Address;
}

/**
 * Deployed kernel addresses on the localAnvil dev chain, produced by
 * deploying, in this order, from anvil's default account #0
 * (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266): ProtocolRoles ->
 * IntentRegistry -> ModuleRegistry -> ScorePolicy -> ExecutionEngine ->
 * RouterModule -> MevProtectionModule -- the same sequence every
 * sdk/execution-node/indexer example script in this repo uses (see
 * script/Deploy.s.sol for the equivalent forge-script version).
 *
 * Deterministic, not persistent: these addresses fall out of that exact
 * sequence on any FRESH anvil instance (nonces start at 0 every time). They
 * are not a real, standing deployment -- restart anvil and redeploy in this
 * order to get the same addresses back.
 */
export const localAnvilAddresses: DeployedKernelAddresses = {
  protocolRoles: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  intentRegistry: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  moduleRegistry: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  scorePolicy: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  executionEngine: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
};

/** The two modules script/Deploy.s.sol registers under the ROUTE intent, on localAnvil. */
export const localAnvilModules = {
  routerModule: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707" as Address,
  mevProtectionModule: "0x0165878A594ca255338adfa4d48449f69242Eb8F" as Address,
};
