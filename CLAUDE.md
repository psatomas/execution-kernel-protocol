# Execution Kernel Protocol

Composable execution infrastructure for Web3 intents. Intents are resolved by an on-chain `ExecutionEngine` that scores competing `IExecutionModule` implementations (via `ScorePolicy`) and executes the best one, rather than routing through a single monolithic solver.

## Project overview

The repo is a monorepo. `packages/contracts`, `packages/types`, `packages/sdk`, `apps/execution-node`, and `apps/indexer` are implemented (see below). `packages/config` and `apps/api`/`apps/frontend` don't exist on disk at all yet — they're named in the README's repository-structure diagram as intended future layout, not actual `.gitkeep` stubs. Don't assume they exist; check before referencing a path under them.

- **`packages/contracts`** (Foundry/Solidity) — the on-chain execution core.
  - `src/core/` — `ExecutionEngine.sol` (entrypoint: `executeIntent`, module selection loop) and `IntentRegistry.sol` (owner-gated intent-type registration).
  - `src/modules/` — `ExecutionModuleBase.sol` (abstract base implementing `IExecutionModule`), `RouterModule.sol` and `MevProtectionModule.sol` (two competing modules registered for the same `ROUTE` intent type, proving out real module-selection behavior beyond test mocks).
  - `src/policy/` — `ScorePolicy.sol`, the pluggable weighted-scoring contract `ExecutionEngine` calls to rank module simulation results. Scores are signed (`int256`) — a module whose penalties outweigh its quality legitimately scores negative rather than reverting. Weights are governable post-deploy via the owner-gated `updateWeights()`, effective immediately.
  - `src/registry/` — `ModuleRegistry.sol`, owner-gated intent-type → active-module-address mapping.
  - `src/types/` — `ExecutionQuote.sol`, the canonical struct modules return from `simulate()` and `ScorePolicy` scores.
  - `src/interfaces/` — `IExecutionModule.sol`, `IExecutionQuote.sol`.
  - `src/access/` — `ProtocolRoles.sol`, the single shared owner (`owner`/`transferOwnership`/`isOwner`) that `ModuleRegistry`, `IntentRegistry`, and `ScorePolicy` all defer to instead of each holding their own `owner` state. Deliberately not multi-role RBAC for now.
  - There is no `src/settlement/` — a standalone settlement layer was dropped from the design (see README). The winning module's `execute()` call is the on-chain settlement; there's no separate settlement step.
  - `test/` — Foundry tests (`ExecutionEngine.t.sol`, `ModuleCompetition.t.sol` — real competing modules, not mocks, exercising `ScorePolicy` weighting — and `Governance.t.sol` — `ProtocolRoles`/`ScorePolicy` governance) plus `test/mocks/` (mock modules used in `ExecutionEngine.t.sol`).
  - `script/Deploy.s.sol` — deploys and wires up the whole kernel (`ProtocolRoles` → registries/`ScorePolicy` → `ExecutionEngine` → both modules).
- **`packages/types`** — zero-runtime-dependency TypeScript mirrors of the on-chain types: `ExecutionQuote`, `ScorePolicy.Weights`, module/intent registration shapes and events. `uint256` fields are `bigint`; the `ScorePolicy.evaluate()` score is signed (`ExecutionScore`). Consumed as TS source (no build step) — see `sdk`/`execution-node` below.
- **`packages/sdk`** — a `viem`-based typed client (`intent/`, `execution/`, `registry/`, `abi/` subdirs). `createExecutionKernelClient(...)` bundles one client per contract (`intentRegistry`, `moduleRegistry`, `scorePolicy`, `execution`, `module`); `intentBuilder.intentType(label)` hashes a label exactly like Solidity's `keccak256("label")`. Every `onlyOwner`/mutating call simulates via `publicClient.simulateContract` before submitting. `examples/quickstart.ts` is a runnable, verified end-to-end example against a local `anvil` deployment — read it before writing new sdk code.
- **`apps/execution-node`** — the off-chain pipeline consuming `packages/sdk`: `engine/intentProcessor.ts` (raw request → `Intent`), `engine/executionGraphBuilder.ts` (gas-free off-chain preview of what `ExecutionEngine` would currently select — reproduces the on-chain scoring exactly via read calls, doesn't reimplement it), `solvers/solver.ts` (one generic solver, not per-module — every module is scored identically, so a `routerSolver`/`mevSolver` split would be redundant boilerplate today), `execution/executor.ts` (submission). `index.ts`'s `runIntent(...)` ties process → solve → submit together. "Execution graph" here means the current one-round competing-modules model, not chained multi-module execution (still just a future direction — see README).

- **`apps/indexer`** — off-chain observability, also consuming `packages/sdk`. `listeners/eventListener.ts` is generic over `(address, abi, eventName)` (backfill via `getContractEvents` + a live `watchContractEvent` variant) rather than one listener per contract — every contract's events decode the same way through viem. `processors/kernelEventProcessor.ts` backfills all 5 kernel contracts' events into `db/memoryStore.ts` (deliberately in-memory — no real DB dependency until persistence across restarts actually matters). `metrics/executionMetrics.ts` derives `totalExecutions`/`executionsByModule`/`moduleWinRate` from the store. `index.ts`'s `createIndexer(...)` backfills into a fresh store and returns it with the metrics bound.

**Dependency direction:** `packages/types` → `packages/contracts` (mirrors on-chain types) → `packages/sdk` (wraps contract bindings) → `apps/execution-node`/`apps/indexer` (both consume the SDK: one to orchestrate execution, the other to observe it). Never point a dependency the other way (e.g. `contracts` must not import from `sdk`).

## Scan / audit scope rules

- **Priority for security review**, in order: `packages/contracts/src/core`, `packages/contracts/src/modules`, `packages/contracts/src/policy`, `packages/contracts/src/access`. These hold the intent-execution and module-selection trust boundary.
- Do **not** read `packages/contracts/test/mocks` or `docs/` unless the task explicitly asks for them — mocks are test fixtures, not production logic, and `docs/` is currently just a placeholder.
- `packages/contracts/out/` and `packages/contracts/cache/` are Foundry build artifacts, gitignored — never read or grep them; if they're missing, that's expected, not an error.
- `node_modules/` anywhere in the repo is gitignored and never worth reading/grepping — same rule as `out/`/`cache/`.
- Before any analysis of the contracts, run `forge build` (from `packages/contracts/`) first to surface compile errors before reasoning about the code.

## Development workflow

- After editing anything under `packages/contracts/src/core/` or `packages/contracts/src/modules/`, always run `forge test` (from `packages/contracts/`) before considering the task done.
- After editing anything under `packages/types/`, `packages/sdk/`, or `apps/execution-node/`, run `npm run typecheck` (from the repo root) before considering the task done. None of these three have a build step — they're consumed as source, so a clean typecheck is the bar, not a successful build.
- Never commit changes touching `packages/contracts/src/core/` or `packages/contracts/src/access/` without first showing and getting explicit review of the diff — these are the trust-boundary paths.

## Commit conventions

Conventional Commits, scoped to this repo's packages:

```
<type>(<scope>): <description>
```

- **Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`
- **Scopes:** `contracts`, `sdk`, `execution-node`, `types`
- One logical change per commit — don't bundle unrelated edits across scopes.
- Never use `--no-verify`.
- Squash WIP commits before merging.
- Ask before committing if the diff touches `access/`, even if tests pass.
