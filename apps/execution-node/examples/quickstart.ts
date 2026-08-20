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
import { runIntent, solve } from "../src/index.ts";

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
  // Wire the intent + both modules through the SDK, same as
  // packages/sdk/examples/quickstart.ts.
  const ROUTE = "0xd476de970836ba6738337e7a59c56ffb0d5302903fa1bc30901e8d94456305b1" as const;
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
