/**
 * End-to-end example for @execution-kernel-protocol/execution-node, run
 * against a real local anvil deployment (not mocked) — see
 * packages/sdk/examples/quickstart.ts for the exact deploy steps and
 * addresses this expects. Exercises the full pipeline: intentProcessor ->
 * solver (off-chain prediction, no gas spent) -> executor (real submission).
 *
 * How to run: same anvil + forge create setup as
 * packages/sdk/examples/quickstart.ts, then:
 *   node apps/execution-node/examples/quickstart.ts
 */
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createExecutionKernelClient } from "@execution-kernel-protocol/sdk";
import { localAnvil, localAnvilAddresses, localAnvilModules, ROUTE_INTENT_TYPE } from "@execution-kernel-protocol/config";
import { runIntent, solve } from "../src/index.ts";

const PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const { routerModule, mevProtectionModule: mevModule } = localAnvilModules;

const account = privateKeyToAccount(PK);
const publicClient = createPublicClient({ chain: localAnvil, transport: http() });
const walletClient = createWalletClient({ chain: localAnvil, transport: http(), account });
const kernel = createExecutionKernelClient({ addresses: localAnvilAddresses, publicClient, walletClient });

async function main() {
  // Wire the intent + both modules through the SDK, same as
  // packages/sdk/examples/quickstart.ts.
  const ROUTE = ROUTE_INTENT_TYPE;
  await kernel.intentRegistry.registerIntent(ROUTE, "Route");
  await kernel.moduleRegistry.registerModule(ROUTE, routerModule);
  await kernel.moduleRegistry.registerModule(ROUTE, mevModule);

  // 1. Solve (off-chain prediction, zero gas): who wins under equal weights?
  const prediction = await solve(kernel, ROUTE, account.address, "0x");
  console.log("predicted winner:", prediction.winner.module, prediction.winner.quote?.tag);
  if (prediction.winner.module.toLowerCase() !== routerModule.toLowerCase()) {
    throw new Error("expected RouterModule to be predicted winner under equal weights");
  }

  // 2. Full pipeline: process -> solve -> submit, in one call.
  const { prediction: pred2, submission } = await runIntent(
    kernel,
    { label: "ROUTE", intentData: "0x" },
    account.address,
  );
  console.log("runIntent predicted:", pred2.winner.module);
  console.log("runIntent tx hash:", submission.hash);
  if (submission.result !== undefined) {
    console.log("runIntent submitted successfully");
  }

  console.log("\n✅ execution-node smoke test passed end to end against live anvil deployment");
}

main().catch((err) => {
  console.error("❌ smoke test failed:", err);
  process.exit(1);
});
