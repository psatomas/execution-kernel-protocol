# Execution Kernel Protocol

A composable execution infrastructure layer for Web3 intents. Instead of routing every intent through one monolithic solver, competing execution modules are simulated, scored, and the best-scoring one executes on-chain — a market of execution strategies rather than static execution logic.

Built with production intent: explicit trust boundaries, auditable access control, and rigor over speculative scope.

---

## System Overview

The Execution Kernel Protocol defines a standardized execution layer for Web3, where user intents are resolved by an on-chain kernel that ranks interchangeable execution strategies and runs the winner.

### Core Layers

- **Intent Layer** — standardized, owner-registered intent types that requests are declared against
- **Execution Layer** — the on-chain kernel (`ExecutionEngine`) that fetches candidate modules for an intent type, scores their simulated output, and executes the winner
- **Execution Modules** — composable, independently deployed strategy units (routing, MEV protection, liquidity selection, ...) that compete for selection
- **Observability Layer** — indexing and performance tracking of execution outcomes
- **SDK Layer** — developer interface for intent creation and execution integration

There is no separate settlement layer: the selected module's `execute()` call *is* the on-chain settlement — it performs the swap/route/transfer directly. A prior draft of this document named a standalone `SettlementRouter`; that idea is dropped until a concrete need for a settlement step distinct from module execution actually appears (e.g. batching or netting across multiple executed intents).

---

## Core Concept: Competitive Module Selection

Execution is not performed by a single solver, and — as currently implemented — not by a static pipeline either. Each registered intent type has a pool of candidate modules; every intent execution re-runs the competition:

```text
Intent (intentType, intentData)
  ↓
IntentRegistry.isIntentActive(intentType)?  — reject if not
  ↓
ModuleRegistry.getModules(intentType) — fetch active candidates
  ↓
for each candidate that supportsIntent(intentType):
    simulate() → ExecutionQuote → ScorePolicy.evaluate() → signed score
  ↓
highest-scoring module wins
  ↓
winning module .execute() — this *is* settlement, no separate step
```

Each module is:
- independently deployed and replaceable, without touching `ExecutionEngine`
- scored on the same standardized `ExecutionQuote` (cost, quality, MEV risk, latency)
- free to lose the competition on one call and win it on the next, as weights or on-chain conditions change

**Future direction, not yet built:** chaining multiple winning modules into a single execution graph (e.g. MEV-protect *then* route) rather than picking exactly one. Don't treat pipeline chaining as implemented until `ExecutionEngine` actually composes more than one module per intent.

---

## Repository Structure

```text
execution-kernel-protocol/

├── packages/
│
│   ├── contracts/                         # On-chain execution core
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── ExecutionEngine.sol
│   │   │   │   └── IntentRegistry.sol
│   │   │   │
│   │   │   ├── modules/                   # Execution primitives
│   │   │   │   ├── ExecutionModuleBase.sol
│   │   │   │   ├── RouterModule.sol
│   │   │   │   └── MevProtectionModule.sol
│   │   │   │
│   │   │   ├── policy/
│   │   │   │   └── ScorePolicy.sol
│   │   │   │
│   │   │   ├── registry/
│   │   │   │   └── ModuleRegistry.sol
│   │   │   │
│   │   │   ├── access/
│   │   │   │   └── ProtocolRoles.sol      # single shared owner, see below
│   │   │   │
│   │   │   └── interfaces/
│   │   │
│   │   ├── test/
│   │   ├── script/
│   │   │   └── Deploy.s.sol
│   │   ├── foundry.toml
│   │   └── remappings.txt
│   │
│   ├── sdk/                               # Developer integration layer
│   │   ├── src/
│   │   │   ├── intent/
│   │   │   │   ├── intentBuilder.ts
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── execution/
│   │   │   │   ├── executionClient.ts
│   │   │   │   └── moduleClient.ts
│   │   │   │
│   │   │   ├── registry/
│   │   │   │
│   │   │   └── index.ts
│   │
│   ├── types/                              # Shared protocol definitions (zero runtime deps)
│   │   ├── src/
│   │   │   ├── primitives.ts               # Address/Bytes32/Hex aliases
│   │   │   ├── intent.ts                   # mirrors IntentRegistry.sol
│   │   │   ├── execution.ts                # mirrors ExecutionQuote.sol, ScorePolicy.Weights
│   │   │   ├── module.ts                   # mirrors IExecutionModule.sol, ModuleRegistry.sol
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── config/
│       ├── chains.ts
│       ├── addresses.ts
│       └── constants.ts
│
├── apps/
│
│   ├── execution-node/                    # Off-chain execution engine
│   │   ├── src/
│   │   │   ├── engine/
│   │   │   │   ├── intentProcessor.ts
│   │   │   │   └── executionGraphBuilder.ts
│   │   │   │
│   │   │   ├── solvers/
│   │   │   │   ├── routerSolver.ts
│   │   │   │   └── mevSolver.ts
│   │   │   │
│   │   │   ├── execution/
│   │   │   │   └── executor.ts
│   │   │   │
│   │   │   └── index.ts
│   │
│   ├── indexer/                           # Execution observability layer
│   │   ├── src/
│   │   │   ├── listeners/
│   │   │   ├── processors/
│   │   │   ├── metrics/
│   │   │   ├── db/
│   │   │   └── index.ts
│   │
│   ├── api/                               # Integration API layer
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── controllers/
│   │   │   └── index.ts
│   │
│   └── frontend/                          # Intent-based UI layer
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── state/
│       │   ├── services/
│       │   └── lib/
│
├── scripts/
│   ├── deploy.ts
│   ├── simulate-intents.ts
│   └── benchmark-execution.ts             # Execution performance validation
│
├── docs/
│   ├── architecture.md
│   ├── intents.md
│   ├── execution-graph.md
│   └── threat-model.md
│
├── package.json                           # npm workspaces root
├── tsconfig.base.json                     # shared strict TS config, extended per-package
├── .gitignore
└── README.md
```

---

## Access Control

`ModuleRegistry` and `IntentRegistry` each currently hand-roll their own `owner` / `onlyOwner`. `ProtocolRoles` replaces that duplication with a single shared owner contract both registries defer to — one owner, one place to reason about protocol control, not independent per-registry admins. This is deliberately the simple model for now, not multi-role RBAC (distinct module-manager / intent-manager / protocol-admin roles) — revisit that split if and when different registries genuinely need independent operators.

---

## Build Order

1. Smart Contracts: Execution Modules + Registry + Engine
2. Execution Node: intent processing + module-selection orchestration
3. Indexer: execution metrics + performance feedback loop
4. SDK: developer integration surface
5. Frontend: intent-based interaction layer

---

## Core Design Principles

- Execution is modular, not monolithic
- Competing modules are scored transparently (`ScorePolicy`) and the best one wins — no hidden routing
- Trust boundaries are explicit: intent-type activation, module registration, and protocol ownership are each a single, auditable control point
- Built toward production: prefer explicit, tested logic over cleverness; expand scope (settlement, multi-role access, graph pipelining) only when a concrete need appears, not speculatively
- System performance is measured and observable by design
- SDK is the primary integration surface for external adoption

---

## Final Note

This protocol is an execution abstraction layer for Web3 applications: it lets a decentralized system express an intent once and have competing, independently deployed execution strategies fight for the right to fulfill it — with the trust boundary that governs *which* strategies are eligible kept small, explicit, and centrally owned.
