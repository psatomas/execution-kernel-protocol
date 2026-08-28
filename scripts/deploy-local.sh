#!/usr/bin/env bash
# Deploys the execution kernel to a local anvil chain and registers the demo
# ROUTE intent + both example modules -- exactly the sequence documented in
# packages/sdk/examples/quickstart.ts and apps/frontend/e2e/full-flow.spec.ts,
# now as one repeatable command instead of manual forge create/cast send
# calls. Without this, a fresh anvil has no registered intents, and every
# app in this repo that reads the registry (apps/frontend, apps/api,
# apps/indexer) has nothing to show.
#
# Usage:
#   ./scripts/deploy-local.sh
#
# Starts anvil itself if nothing is listening on 8545 (left running
# afterwards, for apps/frontend/apps/api/apps/indexer to connect to); reuses
# an already-running anvil otherwise. Either way, anvil must be FRESH (no
# prior transactions) for the deployed addresses to come out deterministic
# and match packages/config's localAnvilAddresses/localAnvilModules -- this
# script checks that and refuses to run against a non-fresh chain rather
# than silently deploying to addresses nothing else in the repo expects.
set -euo pipefail

RPC_URL="http://127.0.0.1:8545"
# anvil's default account #0 -- a well-known local-only test key, never use
# this anywhere real. Same key every other script/example/test in this repo
# uses (see packages/sdk/examples/quickstart.ts).
PK="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
OWNER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

CONTRACTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../packages/contracts" && pwd)"
cd "$CONTRACTS_DIR"

STARTED_ANVIL=false
if ! curl -sf -X POST "$RPC_URL" -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' >/dev/null 2>&1; then
  echo "==> No chain listening on $RPC_URL -- starting anvil"
  nohup anvil >/tmp/execution-kernel-anvil.log 2>&1 &
  STARTED_ANVIL=true
  for _ in $(seq 1 30); do
    curl -sf -X POST "$RPC_URL" -H "Content-Type: application/json" \
      -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' >/dev/null 2>&1 && break
    sleep 1
  done
else
  echo "==> Reusing chain already listening on $RPC_URL"
fi

NONCE=$(cast nonce "$OWNER" --rpc-url "$RPC_URL")
if [ "$NONCE" != "0" ]; then
  echo "error: $OWNER already has a nonce of $NONCE on $RPC_URL -- this chain"
  echo "is not fresh, so a deploy here would NOT produce the addresses"
  echo "packages/config's localAnvilAddresses/localAnvilModules expect."
  echo "Restart anvil (a fresh instance always starts at nonce 0) and re-run this script."
  if [ "$STARTED_ANVIL" = true ]; then
    echo "(the anvil instance this script just started is still running -- kill it before retrying)"
  fi
  exit 1
fi

echo "==> Building contracts"
forge build >/dev/null

deploy() {
  local contract="$1"; shift
  forge create "$contract" --rpc-url "$RPC_URL" --private-key "$PK" --broadcast "$@" \
    | grep -oP '(?<=Deployed to: )0x[a-fA-F0-9]{40}'
}

echo "==> Deploying core kernel"
PROTOCOL_ROLES=$(deploy src/access/ProtocolRoles.sol:ProtocolRoles --constructor-args "$OWNER")
INTENT_REGISTRY=$(deploy src/core/IntentRegistry.sol:IntentRegistry --constructor-args "$PROTOCOL_ROLES")
MODULE_REGISTRY=$(deploy src/registry/ModuleRegistry.sol:ModuleRegistry --constructor-args "$PROTOCOL_ROLES")
SCORE_POLICY=$(deploy src/policy/ScorePolicy.sol:ScorePolicy --constructor-args "$PROTOCOL_ROLES" 1 1 1 1)
EXECUTION_ENGINE=$(deploy src/core/ExecutionEngine.sol:ExecutionEngine --constructor-args "$INTENT_REGISTRY" "$MODULE_REGISTRY" "$SCORE_POLICY")

echo "==> Deploying demo modules"
ROUTER_ID=$(cast keccak "ROUTER")
MEV_ID=$(cast keccak "MEV_PROTECTION")
ROUTER_MODULE=$(deploy src/modules/RouterModule.sol:RouterModule --constructor-args "$ROUTER_ID" "Router Module" 1 "[]")
MEV_MODULE=$(deploy src/modules/MevProtectionModule.sol:MevProtectionModule --constructor-args "$MEV_ID" "MEV Protection Module" 1 50)

echo "==> Registering the ROUTE intent and both demo modules"
ROUTE_INTENT=$(cast keccak "ROUTE")
cast send "$INTENT_REGISTRY" "registerIntent(bytes32,string)" "$ROUTE_INTENT" "Route" \
  --rpc-url "$RPC_URL" --private-key "$PK" >/dev/null
cast send "$MODULE_REGISTRY" "registerModule(bytes32,address)" "$ROUTE_INTENT" "$ROUTER_MODULE" \
  --rpc-url "$RPC_URL" --private-key "$PK" >/dev/null
cast send "$MODULE_REGISTRY" "registerModule(bytes32,address)" "$ROUTE_INTENT" "$MEV_MODULE" \
  --rpc-url "$RPC_URL" --private-key "$PK" >/dev/null

cat <<EOF

==> Done. Deployed addresses (should match packages/config's
    localAnvilAddresses/localAnvilModules exactly):

  ProtocolRoles:        $PROTOCOL_ROLES
  IntentRegistry:       $INTENT_REGISTRY
  ModuleRegistry:       $MODULE_REGISTRY
  ScorePolicy:          $SCORE_POLICY
  ExecutionEngine:      $EXECUTION_ENGINE
  RouterModule:         $ROUTER_MODULE
  MevProtectionModule:  $MEV_MODULE

Registered intent: ROUTE ("Route"), with RouterModule and MevProtectionModule
as its two competing candidates.

Point apps/frontend/apps/api/apps/indexer at $RPC_URL (chain id 31337) and
they'll all see this. apps/frontend's wallet should be connected to the
same local anvil network.
EOF
