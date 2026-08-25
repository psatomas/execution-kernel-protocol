# Provisioning Execution Kernel for a B2B customer

"How we provision Execution Kernel for a B2B customer" — a concrete runbook,
not a restatement of `b2b-integration.md`'s architectural decision (read that
first for *why* this is the model). This document is the *how*, grounded in
what the code actually supports today.

## The sequence

1. **Choose a network** — an RPC URL and chain ID the customer's kernel will
   live on. No chain registry or multi-chain abstraction exists in this repo
   (deliberately — see `packages/config`'s own rule against speculative
   infrastructure); this is a value you supply per deployment, not something
   to look up.
2. **Provide the customer's owner address** — the address that should hold
   `ProtocolRoles` for this deployment (a customer's own key, or a
   kernel-operator/customer joint multisig for a transition period).
3. **Deploy the core kernel** — `forge script script/Deploy.s.sol --rpc-url
   <rpc> --private-key <deployer key> --broadcast`, with `PROTOCOL_OWNER` set
   to the customer's address from step 2. This deploys exactly 5 contracts —
   `ProtocolRoles → IntentRegistry → ModuleRegistry → ScorePolicy →
   ExecutionEngine` — with **zero** intents or modules registered. Leave
   `DEPLOY_DEMO_MODULES` unset (its default, `false`); see "Demo wiring" below
   for when that flag is appropriate instead.
4. **Record the addresses** — the script logs `chainId`, `owner`, and all 5
   contract addresses to stdout (human-readable), and its `run()`/`deploy()`
   return a `Deploy.KernelAddresses` struct (machine-readable, for any
   tooling composing on top of this script). When run via `forge script
   --broadcast`, Foundry additionally writes the full transaction/receipt
   record to `broadcast/Deploy.s.sol/<chainId>/run-latest.json` — the
   existing Foundry convention for this, not a new one invented here.
5. **Configure `api`/`indexer`** for this deployment — `apps/api` accepts a
   `KernelDeploymentConfig` (`{ chain, addresses }`, from `packages/config`)
   either as an explicit argument to `buildServer(config)` or via
   `KERNEL_RPC_URL`/`KERNEL_CHAIN_ID`/`KERNEL_PROTOCOL_ROLES_ADDRESS`/
   `KERNEL_INTENT_REGISTRY_ADDRESS`/`KERNEL_MODULE_REGISTRY_ADDRESS`/
   `KERNEL_SCORE_POLICY_ADDRESS`/`KERNEL_EXECUTION_ENGINE_ADDRESS` env vars at
   process start (all seven, or none — a partial set throws rather than
   silently falling back). `apps/indexer`'s `createIndexer({ publicClient,
   addresses, fromBlock })` already took addresses as a required parameter
   before this task — nothing to change there.
6. **Hand the customer their `ExecutionKernelAddresses` + SDK configuration**
   — the same shape `createExecutionKernelClient({ addresses, publicClient,
   walletClient? })` already accepts. Nothing about the SDK needed to change
   for this.
7. **Customer registers their own intent type(s) and module(s)** — now that
   they hold `ProtocolRoles`, `IntentRegistry.registerIntent`/
   `ModuleRegistry.registerModule` are theirs to call directly (via the SDK,
   their own tooling, or a kernel-operator-assisted transaction during a
   handoff period).
8. **Customer integrates the SDK** into their own frontend, wired to their
   own wagmi/viem config and the addresses from step 6 — see
   `apps/frontend/src/services/kernelClient.ts`'s `buildKernelClient` for the
   exact shape (its `addresses` parameter now defaults to this console's own
   local deployment but is explicit, not hardcoded — the pattern a customer's
   fork of that function would follow).

## Demo wiring — a separate, opt-in path

`DEPLOY_DEMO_MODULES=true` additionally registers the `ROUTE` intent and
deploys/registers `RouterModule`/`MevProtectionModule` as its two competing
candidates — the previous unconditional behavior, now explicit. This is a
**local development / demo convenience**, not part of customer provisioning:
a real customer kernel (step 3 above) should start with none of our example
modules registered.

`DEPLOY_DEMO_MODULES=true` requires `PROTOCOL_OWNER` to either be unset or to
equal the deploying/broadcasting address. Demo wiring registers on-chain as
the broadcaster (whoever runs the script), so it cannot also honor a
genuinely separate owner in the same run — attempting both together reverts
with an explicit message rather than a confusing `ModuleRegistry` "Not
owner". This is why step 3 above says to leave the flag unset for a real
customer deployment.

## What already worked, unchanged

- `packages/sdk`'s `createExecutionKernelClient` was already fully
  parameterized by `addresses`/`publicClient`/`walletClient` — no SDK change
  was needed.
- `apps/indexer`'s `createIndexer` and every listener/processor/metrics
  function already took `addresses`/`publicClient` as explicit parameters —
  no indexer change was needed.
- `apps/execution-node`'s `solve()`, `buildExecutionGraph()`, `executeIntent()`,
  `runIntent()` already took an already-constructed `ExecutionKernelClient`
  as a parameter — no execution-node change was needed. Its submission path
  (`execution/executor.ts`) is still not part of any hosted/relayer story —
  see `b2b-integration.md` for why: it forwards to a `walletClient`, and
  every real use of that path supplies a raw private key on a script, which
  is fine for admin tooling and wrong for a service acting on a real end
  user's behalf.

## What changed in this task

- `script/Deploy.s.sol` — split into a `run()` env-var-parsing entrypoint and
  a `deploy(DeployParams)` function holding the actual logic, callable
  directly (used by `test/Deploy.t.sol`, and reusable by any future tooling
  that wants to compose on top of it without shelling out to `forge script`).
  `DEPLOY_DEMO_MODULES` gates demo wiring (default `false`); the
  owner/broadcaster mismatch above is now an explicit `require()`.
- `packages/config/src/deployment.ts` (new) — `KernelDeploymentConfig`
  (`{ chain, addresses }`) and `localAnvilDeployment`, the smallest shape
  needed to describe "which deployment am I pointed at" for a consumer.
- `apps/api/src/services/kernelService.ts` — `createKernelService(config =
  localAnvilDeployment)` takes the deployment explicitly instead of
  importing `localAnvil`/`localAnvilAddresses` directly.
- `apps/api/src/index.ts` — `buildServer(config)` threads the above through;
  the process entrypoint additionally builds a config from the
  `KERNEL_*` env vars listed in step 5, falling back to the local default
  when none are set.
- `apps/frontend/src/services/kernelClient.ts` — `buildKernelClient` gained
  an optional `addresses` parameter (still defaulting to this console's own
  local deployment) — proof the pattern is trivially adaptable, not a change
  to this app's own runtime behavior.

## What did not change, and why

- No multi-chain registry, no per-deployment lookup table — `packages/config`
  still holds one named constant per real deployment (`localAnvilDeployment`
  today), not infrastructure to look one up generically.
- No authentication, no multi-tenancy, no request-scoped kernel selection in
  `apps/api` — one process still serves exactly one configured deployment.
- No relayer, no server-held private key anywhere in this flow — every
  on-chain write in the customer's own integration goes through their end
  user's own wallet, exactly as this console's own frontend already does.
- No billing, fees, staking, or governance timelock — unrelated to
  provisioning and explicitly out of scope for this task.
