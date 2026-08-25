# Testnet customer deployment — runbook

Infrastructure validation, not a production launch: proving the "one
dedicated kernel deployment per customer" architecture
(`b2b-integration.md`, `provisioning.md`) actually works against a real EVM
network, not just a local `anvil` instance. This document is the runbook;
see those two documents for the architectural decision and the general
provisioning sequence this one specializes for a real testnet.

**Status: repository-side preparation complete. The live deployment itself
is pending a funded deployer account — nothing in this repo requires one to
review or continue this work.** Network reachability and tooling were
verified directly (see below); only an actual funded private key was
missing, and generating one myself would just produce an empty account
that can't pay gas.

## 1. Network selected: Sepolia

Ethereum's standard, actively-maintained public testnet (Goerli is
deprecated). Verified reachable directly from this environment, not
assumed:

```
$ cast chain-id --rpc-url https://ethereum-sepolia-rpc.publicnode.com
11155111
```

`packages/config` now exports `sepolia` (`packages/config/src/chains.ts`) —
a re-export of viem's own built-in Sepolia chain definition, not a
hand-rolled one, and not the start of a general multi-chain registry: this
is the one additional chain this task needs, alongside `localAnvil`.

## 2. Required environment variables (for the live deployment step)

| Variable | Purpose |
|---|---|
| `PRIVATE_KEY` | The deployer's Sepolia private key — testnet deployment only, never committed, never used for end-user transactions. |
| `RPC_URL` | A Sepolia RPC endpoint. `https://ethereum-sepolia-rpc.publicnode.com` was verified reachable from this environment and needs no API key. |
| `PROTOCOL_OWNER` | The intended customer owner address (defaults to the deployer if unset — see `script/Deploy.s.sol`; leave unset for a self-owned validation deployment, or set explicitly to simulate a real customer handoff). |

`DEPLOY_DEMO_MODULES` is deliberately **not** set (defaults to `false`) —
per `provisioning.md`, a customer kernel starts with zero registered
intents/modules. A minimal demo intent + module is registered as a
*separate, explicit* step after core deployment (step 4 below), through the
customer-owner account, exactly like a real customer would.

## 3. Required wallet/funding

One Sepolia account, funded with a small amount of testnet ETH — a rough
core-deployment cost estimate from this repo's own local gas measurements
(5 contracts, no demo wiring) is on the order of ~3.4M gas total; at typical
Sepolia gas prices (low single-digit gwei) that's a small fraction of
0.01 ETH. **0.02–0.05 Sepolia ETH is comfortably enough**, funded via any
public Sepolia faucet (e.g. a wallet provider's built-in faucet, or
Alchemy's/Google Cloud's public Sepolia faucets — whichever is reachable
without needing an account you don't already have).

This key is for the **deployment transactions only**. It is never used in
the runtime/user transaction model, which stays exactly as documented in
`b2b-integration.md`: `end user's own wallet → customer frontend → signed
transaction → ExecutionEngine`. No execution-node key, no relayer, no
change to that model anywhere in this task.

## 4. Deployment command (to run once funded)

```bash
# from packages/contracts/
PRIVATE_KEY=<deployer key> \
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com \
PROTOCOL_OWNER=<customer owner address, or omit to self-own> \
forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

This produces the 5 core kernel contracts with zero registered state,
exactly as validated locally in the customer-provisioning task (see
`test/Deploy.t.sol`). The script logs `chainId`, `owner`, and all 5
addresses to stdout, and Foundry additionally writes the full broadcast
record to `broadcast/Deploy.s.sol/11155111/run-latest.json` — the existing
Foundry convention, not a new one invented here.

A minimal follow-up intent + module registration (to have something to
actually execute in step 9's test transaction) is then done as the
customer owner — via `cast send` or the SDK directly — registering one
`ROUTE`-equivalent intent and deploying/registering a single
`RouterModule` instance. Not via `DEPLOY_DEMO_MODULES`, deliberately: this
mirrors what a real customer does after receiving their kernel, not a
built-in demo shortcut.

## 5. Resulting contract addresses

**TBD — recorded here once the deployment above actually runs.** Not
fabricated ahead of time; see `b2b-integration.md`'s data-integrity
principle, which applies here too.

## 6–9. SDK / API / indexer / frontend configuration

No code changes were needed for the SDK, API, or indexer — confirmed by
reading every file in each, not assumed:

- **SDK**: `createExecutionKernelClient({ addresses, publicClient,
  walletClient? })` was already fully parameterized. Point it at the
  addresses from step 5 and a `publicClient` built against
  `packages/config`'s new `sepolia` chain + the RPC from step 2.
- **API**: `apps/api`'s `KERNEL_RPC_URL`/`KERNEL_CHAIN_ID`/5×
  `KERNEL_*_ADDRESS` env vars (added in the customer-provisioning task)
  already build an arbitrary `KernelDeploymentConfig` at process start —
  set them to the Sepolia RPC, chain id `11155111`, and the step-5
  addresses, and start `apps/api` exactly as for a local customer
  deployment.
- **Indexer**: `createIndexer({ publicClient, addresses, fromBlock })`
  already took `addresses`/`publicClient` as required explicit
  parameters — point it at the Sepolia `publicClient` and the step-5
  addresses, with `fromBlock` set to the deployment's own block number
  (from the broadcast record) rather than `0n`, since Sepolia already has
  a long, irrelevant transaction history before that point.
- **Frontend**: `apps/frontend/src/lib/wagmiConfig.ts` now lists `sepolia`
  alongside `localAnvil`, and `useKernelClient` resolves which kernel
  deployment's addresses to use from the wallet's connected chain id via
  `packages/config`'s new `deploymentsByChainId` map (returning `undefined`
  — the console's existing "Connecting to chain..." state — for any chain
  with no known deployment). **`deploymentsByChainId`'s Sepolia entry is
  added once step 5's real addresses exist** — deliberately not populated
  with placeholder addresses ahead of that; adding it is a two-line change
  once they do.

## 10. Executing the test intent and verifying the event (once deployed)

1. Register one intent type + one module (step 4) as the customer owner.
2. Connect a wallet (funded with a small amount of Sepolia ETH for gas) to
   the frontend, switched to Sepolia.
3. Select the registered intent; the console shows the one registered
   module's real quote/score (see `apps/frontend`'s `ExecutionConsole`).
4. Execute — the transaction is signed and submitted by the connected
   wallet, exactly as in the local E2E flow, landing on real Sepolia.
5. **Record the resulting transaction hash here** once run (TBD, pending
   the live deployment).
6. Confirm the indexer observes the `IntentExecuted` event from that real
   transaction, and that `apps/api`'s `/executions`/`/metrics/executions`
   endpoints reflect it — the same `testnet transaction → Kernel event →
   indexer → API → customer-facing read` path already proven locally, now
   against a real chain.

## Problems discovered so far

None in the code — every off-chain package (`sdk`, `indexer`,
`execution-node`, and `api` after the provisioning task) was already
chain-agnostic by construction, confirmed by reading their source rather
than assumed. The one code gap found and fixed: `apps/frontend`'s
`useKernelClient` unconditionally used `localAnvilAddresses` regardless of
the wallet's connected chain — harmless while only one chain existed, a
real bug the moment a second one does. Fixed via `deploymentsByChainId`
(see above).

The one non-code blocker: **no funded Sepolia account was available in
this environment**, and none was fabricated to work around it.
