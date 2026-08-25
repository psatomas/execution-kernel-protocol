# B2B integration architecture

This document captures one architectural decision: how an external B2B
customer integrates with, deploys, and operates the Execution Kernel
Protocol. It reflects what the current code actually supports, not a
speculative future design — every claim below traces to a specific file in
this repository. No production code changed as part of writing this; see
"Required repository changes" for the (currently unimplemented) gaps it
surfaces.

## The decision

**One dedicated kernel deployment per customer, owned by that customer,
with kernel-operator-hosted off-chain services and a customer-owned
frontend that embeds the SDK.** Not a shared multi-tenant kernel, not a
kernel-operator-owned frontend customers redirect users to, not a
kernel-operator-run submission relayer.

This falls directly out of three facts already true in the code, not out of
a preference:

1. **`IntentRegistry`/`ModuleRegistry` have no per-tenant namespacing.**
   `intentType` is `keccak256(label)` with no customer prefix
   (`packages/sdk/src/intent/intentBuilder.ts`), and `IntentRegistry.
   registerIntent` reverts on collision (`"Already exists"`,
   `packages/contracts/src/core/IntentRegistry.sol:47`). Two customers each
   registering a `"ROUTE"` intent on one shared deployment would collide, or
   worse, unintentionally compete against each other's modules for the same
   intent type. A shared kernel needs a namespacing scheme that does not
   exist today; a dedicated deployment per customer sidesteps the problem
   entirely, for free.
2. **Registration is gated by one single owner, protocol-wide.**
   `ModuleRegistry.registerModule`/`IntentRegistry.registerIntent` are both
   `onlyOwner`, deferring to one shared `ProtocolRoles.owner`
   (`packages/contracts/src/access/ProtocolRoles.sol`) — not a per-intent or
   per-customer owner. On a shared kernel, this means one party controls
   every customer's registrations. On a dedicated per-customer kernel,
   `ProtocolRoles.transferOwnership` (already implemented, no code change)
   lets that one owner be the customer's own address — self-service module
   registration, scoped only to their own deployment, at their own users'
   expense, without reopening the permissionless-registration question at
   all.
3. **`script/Deploy.s.sol` already supports handing ownership to the
   deploying party at deploy time** via `PROTOCOL_OWNER`
   (`packages/contracts/script/Deploy.s.sol:26,51`) — defaulting to the
   broadcasting address if unset. Provisioning a customer's own dedicated
   kernel with them as owner is a deploy-time argument, not new code.

## What the customer owns vs. what the kernel operator runs

| | Customer-owned | Kernel-operator-run | Shared |
|---|---|---|---|
| Frontend / UX | ✅ embeds `packages/sdk` directly | — | — |
| End-user wallet interaction | ✅ (`useWalletClient`-equivalent, their own wagmi/viem) | — | — |
| `ProtocolRoles` ownership (their deployment) | ✅ via `transferOwnership` | (initially, until handed off) | — |
| Kernel contracts (`ExecutionEngine`, registries, `ScorePolicy`) | one dedicated instance per customer | deployed/operated by kernel operator | code, not instance |
| Custom `IExecutionModule` implementations | ✅ customer deploys, then registers (once they own `ProtocolRoles`) | — | — |
| `execution-node`'s solve/predict path | can self-host | can consume ours as a hosted read endpoint | either |
| `execution-node`'s executor/submission path | **not used by anyone as a relayer** — see below | — | — |
| `indexer` + `api` | — | ✅ hosted, one instance per customer's kernel addresses | infra pattern, not data |
| End-user private keys | ✅ always the end user's own wallet | never | never |

**`execution-node`'s submission half is deliberately excluded from the
integration model.** `executor.ts`'s `executeIntent` (`apps/execution-node/
src/execution/executor.ts`) just forwards to `kernel.execution.
executeIntent(intent, account)`, which requires a `walletClient`
(`packages/sdk/src/execution/executionClient.ts:53-61`). Every real runnable
use of that path (`packages/sdk/examples/quickstart.ts`) supplies a raw
private key on a script — fine for admin/test tooling, wrong for a hosted
service acting on a real end user's behalf, since that would mean the host
custodying a key. This repo's frontend already proves the correct pattern:
the end user's own connected wallet calls `executeIntent()` directly
(`apps/frontend/src/hooks/useKernelClient.ts` + `services/kernelClient.ts`).
A customer's frontend does the same, with their own wagmi/viem wiring
around the same SDK — never a customer backend, never ours. Only
`execution-node`'s `solve()`/`buildExecutionGraph()` (read-only, gas-free)
are safe to run as a hosted or embedded service for anyone.

## Integration sequence (concrete, for a real DeFi protocol tomorrow)

1. **Kernel operator deploys a dedicated kernel** for the customer:
   `ProtocolRoles → IntentRegistry → ModuleRegistry → ScorePolicy →
   ExecutionEngine`, via the same sequence `script/Deploy.s.sol` already
   encodes, with `PROTOCOL_OWNER` set to the customer's own address (or a
   kernel-operator/customer joint multisig, if a transition period is
   wanted before full handoff).
2. **Kernel operator hands the customer their `ExecutionKernelAddresses`**
   (the same shape `packages/sdk`'s `createExecutionKernelClient` already
   takes — no new type needed) and hosts (or the customer self-hosts) an
   `execution-node`-solve-backed prediction endpoint and an `indexer`+`api`
   instance pointed at those addresses.
3. **Customer registers their intent type(s)** (`IntentRegistry.
   registerIntent`) and any modules they want in initial competition
   (`ModuleRegistry.registerModule`) — either directly, once they hold
   `ProtocolRoles` ownership, or via the kernel operator during a
   pre-handoff period.
4. **Customer builds and deploys any custom `IExecutionModule`**
   (extending `ExecutionModuleBase`, same as `RouterModule`/
   `MevProtectionModule`) to the same chain, then registers it themselves.
5. **Customer's own frontend embeds `@execution-kernel-protocol/sdk`**,
   wired to their own wagmi/viem config and the addresses from step 2 —
   the same shape `apps/frontend/src/services/kernelClient.ts` already
   demonstrates.
6. **End user connects their own wallet** to the customer's app (never
   ours) and submits an intent.
7. **Customer's frontend calls `kernel.execution.executeIntent(intent)`**
   through the end user's own connected wallet — the transaction
   originates from, and gas is paid by, that end user, exactly as in this
   repo's own E2E flow.
8. **`ExecutionEngine` discovers candidates, simulates, scores via
   `ScorePolicy`, selects, and executes** — entirely existing on-chain
   logic, untouched.
9. **The customer's hosted (or self-hosted) `indexer`/`api` observe the
   resulting event** and expose metrics/history back to the customer's own
   application — the same `apps/indexer` → `apps/api` path this repo
   already runs for itself.

## Required repository changes this decision surfaces

Not implemented here — analysis only, per this phase's scope.

- **Small change:** `apps/api/src/services/kernelService.ts` hardcodes
  `localAnvilAddresses`/`localAnvil` (lines 17-18). Hosting one `api`
  instance per customer kernel needs this parameterized (env var or
  request-scoped config), not a new architecture.
- **Small change:** `script/Deploy.s.sol` always deploys and wires
  `RouterModule`/`MevProtectionModule` under `ROUTE` unconditionally
  (lines 73-89) — correct for local dev/demo, but a real customer
  deployment wants the 5 core kernel contracts deployable on their own,
  without our example modules attached. Splitting "deploy the kernel" from
  "wire up the demo `ROUTE` intent + example modules" is a script-level
  change, not a contract change.
- **New component (not yet built):** a documented, repeatable
  "provision a customer kernel" runbook/script wrapping the `forge create`
  sequence with a customer-supplied `PROTOCOL_OWNER`, distinct from the
  local-anvil-only `Deploy.s.sol` demo path.
- **Future, explicitly deferred:** authentication/rate-limiting on hosted
  `api`/`execution-node`-predict endpoints if multiple customers share
  kernel-operator-hosted infrastructure; tenant-aware observability;
  billing. None of these block the first customer integration above.

## What is not changing

No multi-tenant kernel, no permissionless module registration, no
protocol fee/billing/staking, no governance timelock, no production
authentication. Those remain explicitly out of scope until their own
economic/security design is done — this decision does not require any of
them.
