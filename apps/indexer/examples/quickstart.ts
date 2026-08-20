/**
 * End-to-end example for @execution-kernel-protocol/indexer, run against a
 * real local anvil deployment — see packages/sdk/examples/quickstart.ts for
 * the exact deploy steps and addresses this expects.
 *
 * Runs two executeIntent() calls (one before, one after a governance
 * reweight, so each module wins once), then backfills every emitted event
 * and checks the derived metrics match.
 *
 * How to run: same anvil + forge create setup as
 * packages/sdk/examples/quickstart.ts, then:
 *   node apps/indexer/examples/quickstart.ts
 */
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createExecutionKernelClient } from "@execution-kernel-protocol/sdk";
import { createIndexer } from "../src/index.ts";

const PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const RPC = "http://127.0.0.1:8545";

const addresses = {
  protocolRoles: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  intentRegistry: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  moduleRegistry: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  scorePolicy: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  executionEngine: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
} as const;

const routerModule = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707" as const;
const mevModule = "0x0165878A594ca255338adfa4d48449f69242Eb8F" as const;
const ROUTE = "0xd476de970836ba6738337e7a59c56ffb0d5302903fa1bc30901e8d94456305b1" as const;

const account = privateKeyToAccount(PK);
const chain = {
  id: 31337,
  name: "anvil",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
} as const;

const publicClient = createPublicClient({ chain, transport: http(RPC) });
const walletClient = createWalletClient({ chain, transport: http(RPC), account });
const kernel = createExecutionKernelClient({ addresses, publicClient, walletClient });

async function main() {
  await kernel.intentRegistry.registerIntent(ROUTE, "Route");
  await kernel.moduleRegistry.registerModule(ROUTE, routerModule);
  await kernel.moduleRegistry.registerModule(ROUTE, mevModule);

  // Router wins under equal weights.
  await kernel.execution.executeIntent({ intentType: ROUTE, intentData: "0x" });

  // Reweight toward MEV protection, then MevProtectionModule wins.
  await kernel.scorePolicy.updateWeights({ qualityWeight: 1n, costWeight: 1n, mevWeight: 50n, latencyWeight: 1n });
  await kernel.execution.executeIntent({ intentType: ROUTE, intentData: "0x" });

  const indexer = await createIndexer({ publicClient, addresses, fromBlock: 0n });

  console.log("total executions:", indexer.totalExecutions());
  console.log("executions by module:", indexer.executionsByModule());
  console.log("intent registrations:", indexer.store.getIntentRegistrations());
  console.log("module registrations:", indexer.store.getModuleRegistrations());
  console.log("weights updates:", indexer.store.getWeightsUpdates());

  if (indexer.totalExecutions() !== 2) throw new Error(`expected 2 executions, got ${indexer.totalExecutions()}`);
  if (indexer.moduleWinRate(routerModule, ROUTE) !== 0.5) throw new Error("expected RouterModule to have won exactly 1 of 2");
  if (indexer.moduleWinRate(mevModule, ROUTE) !== 0.5) throw new Error("expected MevProtectionModule to have won exactly 1 of 2");
  if (indexer.store.getModuleRegistrations().length !== 2) throw new Error("expected 2 module registrations indexed");
  if (indexer.store.getIntentRegistrations().length !== 1) throw new Error("expected 1 intent registration indexed");
  if (indexer.store.getWeightsUpdates().length !== 1) throw new Error("expected 1 weights update indexed");

  console.log("\n✅ indexer smoke test passed end to end against live anvil deployment");
}

main().catch((err) => {
  console.error("❌ smoke test failed:", err);
  process.exit(1);
});
