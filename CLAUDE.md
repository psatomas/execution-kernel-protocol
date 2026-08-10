# Execution Kernel Protocol

Composable execution infrastructure for Web3 intents. Intents are resolved by an on-chain `ExecutionEngine` that scores competing `IExecutionModule` implementations (via `ScorePolicy`) and executes the best one, rather than routing through a single monolithic solver.

## Project overview

The repo is a monorepo with one implemented package (`packages/contracts`) and three scaffolded packages/apps that currently contain only `.gitkeep` placeholders. Treat the latter as intentional stubs, not missing work, unless a task asks you to build them out.

- **`packages/contracts`** (Foundry/Solidity, the only package with real code) — the on-chain execution core.
  - `src/core/` — `ExecutionEngine.sol` (entrypoint: `executeIntent`, module selection loop) and `IntentRegistry.sol` (owner-gated intent-type registration).
  - `src/modules/` — `ExecutionModuleBase.sol` (abstract base implementing `IExecutionModule`) and `RouterModule.sol` (example/reference module).
  - `src/policy/` — `ScorePolicy.sol`, the pluggable weighted-scoring contract `ExecutionEngine` calls to rank module simulation results.
  - `src/registry/` — `ModuleRegistry.sol`, owner-gated intent-type → active-module-address mapping.
  - `src/types/` — `ExecutionQuote.sol`, the canonical struct modules return from `simulate()` and `ScorePolicy` scores.
  - `src/interfaces/` — `IExecutionModule.sol`, `IExecutionQuote.sol`.
  - `src/access/`, `src/settlement/` — currently empty (`.gitkeep`); planned owner/role-based access control and settlement-routing logic per the root README's design.
  - `test/` — Foundry tests plus `test/mocks/` (mock modules used to exercise `ExecutionEngine` selection logic).
- **`packages/types`** — shared TypeScript definitions for intents, execution quotes, and modules, meant to mirror the on-chain types (`ExecutionQuote.sol` etc.) so `sdk` and `execution-node` share one vocabulary. Not yet populated.
- **`packages/sdk`** — the developer integration layer (`intent/`, `execution/`, `registry/` subdirs). Wraps `packages/contracts` (ABIs/addresses, contract calls) behind a typed client (`intentBuilder`, `executionClient`, `moduleClient` per the README's intended layout) and consumes `packages/types` for shared shapes. Not yet populated.
- **`apps/execution-node`** — the off-chain execution engine (`engine/`, `execution/`, `solvers/` subdirs: intent processing, execution-graph building, per-module solvers). Consumes `packages/sdk` to build and submit execution graphs against the on-chain kernel, and `packages/types` for shared definitions. Not yet populated.

**Dependency direction:** `packages/types` → `packages/contracts` (mirrors on-chain types) → `packages/sdk` (wraps contract bindings) → `apps/execution-node` (consumes the SDK to orchestrate execution). Never point a dependency the other way (e.g. `contracts` must not import from `sdk`).

## Scan / audit scope rules

- **Priority for security review**, in order: `packages/contracts/src/core`, `packages/contracts/src/modules`, `packages/contracts/src/policy`, `packages/contracts/src/access`. These hold the intent-execution and module-selection trust boundary.
- Do **not** read `packages/contracts/test/mocks` or `docs/` unless the task explicitly asks for them — mocks are test fixtures, not production logic, and `docs/` is currently just a placeholder.
- `packages/contracts/out/` and `packages/contracts/cache/` are Foundry build artifacts, gitignored — never read or grep them; if they're missing, that's expected, not an error.
- Before any analysis of the contracts, run `forge build` (from `packages/contracts/`) first to surface compile errors before reasoning about the code.

## Development workflow

- After editing anything under `packages/contracts/src/core/`, `packages/contracts/src/modules/`, or `packages/contracts/src/settlement/`, always run `forge test` (from `packages/contracts/`) before considering the task done.
- Never commit changes touching `packages/contracts/src/core/`, `packages/contracts/src/access/`, or `packages/contracts/src/settlement/` without first showing and getting explicit review of the diff — these are the trust-boundary and settlement paths.

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
- Ask before committing if the diff touches `settlement/` or `access/`, even if tests pass.
