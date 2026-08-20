/**
 * End-to-end smoke test / usage example for @execution-kernel-protocol/sdk,
 * run against a real local anvil deployment (not mocked). Exercises every
 * client: intentBuilder, intentRegistry, moduleRegistry, moduleClient,
 * scorePolicy (including governance updateWeights), and executionClient.
 *
 * How to run:
 *   1. anvil
 *   2. From packages/contracts, `forge create` (in this order) ProtocolRoles,
 *      IntentRegistry, ModuleRegistry, ScorePolicy, ExecutionEngine,
 *      RouterModule, MevProtectionModule — see script/Deploy.s.sol for the
 *      exact constructor args each one takes. Deploying in this exact order
 *      from a fresh anvil reproduces the addresses hardcoded in
 *      packages/config/src/addresses.ts (localAnvilAddresses) -- update
 *      that file if you ever change the order or add a contract.
 *   3. `node packages/sdk/examples/quickstart.ts` from the repo root.
 */
import { createPublicClient, createWalletClient, http, decodeAbiParameters } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createExecutionKernelClient, intentType, buildIntent } from "../src/index.ts";
import { localAnvil, localAnvilAddresses, localAnvilModules, ROUTE_INTENT_TYPE } from "@execution-kernel-protocol/config";

// anvil's default account #0 — well-known local test key, never use in production.
const PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const { routerModule, mevProtectionModule: mevModule } = localAnvilModules;

const account = privateKeyToAccount(PK);
const publicClient = createPublicClient({ chain: localAnvil, transport: http() });
const walletClient = createWalletClient({ chain: localAnvil, transport: http(), account });

const kernel = createExecutionKernelClient({ addresses: localAnvilAddresses, publicClient, walletClient });

async function main() {
  // Computed independently by both sdk's intentBuilder and config's
  // ROUTE_INTENT_TYPE constant -- confirms they actually agree, not just
  // that each one individually "looks right".
  const ROUTE = intentType("ROUTE");
  console.log("intentType('ROUTE') =", ROUTE);
  if (ROUTE !== ROUTE_INTENT_TYPE) throw new Error("sdk's intentType('ROUTE') disagrees with config's ROUTE_INTENT_TYPE");

  // 1. Register the intent + both modules, entirely through the SDK.
  await kernel.intentRegistry.registerIntent(ROUTE, "Route");
  console.log("registered intent: ROUTE, active =", await kernel.intentRegistry.isIntentActive(ROUTE));

  await kernel.moduleRegistry.registerModule(ROUTE, routerModule);
  await kernel.moduleRegistry.registerModule(ROUTE, mevModule);
  console.log("registered modules:", await kernel.moduleRegistry.getModules(ROUTE));

  // 2. Preview both modules' quotes directly, without going through executeIntent.
  const intentData = "0x" as const;
  const context = "0x" as const;

  const routerQuote = await kernel.module.simulateQuote(routerModule, account.address, intentData, context);
  const mevQuote = await kernel.module.simulateQuote(mevModule, account.address, intentData, context);
  console.log("RouterModule quote:", routerQuote);
  console.log("MevProtectionModule quote:", mevQuote);

  // 3. Evaluate both quotes read-only via ScorePolicy, matching what
  // ExecutionEngine does internally.
  const routerScore = await kernel.scorePolicy.evaluate(routerQuote);
  const mevScore = await kernel.scorePolicy.evaluate(mevQuote);
  console.log("RouterModule score:", routerScore, "MevProtectionModule score:", mevScore);

  // 4. Run the real intent end to end. Equal weights -> RouterModule should win.
  const intent = buildIntent({ intentType: ROUTE, intentData });
  const { hash, result } = await kernel.execution.executeIntent(intent);
  console.log("executeIntent tx hash:", hash);

  const [tag] = decodeAbiParameters(
    [{ type: "string" }, { type: "address" }, { type: "bytes" }, { type: "uint256" }, { type: "bytes" }],
    result,
  );
  console.log("executeIntent result tag:", tag);
  if (tag !== "ROUTE_EXECUTED") throw new Error(`expected ROUTE_EXECUTED, got ${tag}`);

  // 5. Governance: reweight toward MEV protection via the SDK, then rerun.
  await kernel.scorePolicy.updateWeights({
    qualityWeight: 1n,
    costWeight: 1n,
    mevWeight: 50n,
    latencyWeight: 1n,
  });
  console.log("updated weights:", await kernel.scorePolicy.getWeights());

  const { result: result2 } = await kernel.execution.executeIntent(intent);
  const [tag2] = decodeAbiParameters(
    [{ type: "string" }, { type: "address" }, { type: "bytes" }, { type: "bytes" }],
    result2,
  );
  console.log("executeIntent result tag after reweight:", tag2);
  if (tag2 !== "MEV_PROTECTED_EXECUTED") throw new Error(`expected MEV_PROTECTED_EXECUTED, got ${tag2}`);

  console.log("\n✅ SDK smoke test passed end to end against live anvil deployment");
}

main().catch((err) => {
  console.error("❌ smoke test failed:", err);
  process.exit(1);
});
