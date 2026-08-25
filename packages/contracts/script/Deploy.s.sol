// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console2.sol";

import "../src/access/ProtocolRoles.sol";
import "../src/core/IntentRegistry.sol";
import "../src/registry/ModuleRegistry.sol";
import "../src/policy/ScorePolicy.sol";
import "../src/core/ExecutionEngine.sol";
import "../src/modules/RouterModule.sol";
import "../src/modules/MevProtectionModule.sol";

/// @notice Deploys the core execution kernel -- ProtocolRoles, IntentRegistry,
/// ModuleRegistry, ScorePolicy, ExecutionEngine -- for a specified owner, on
/// whichever chain this is broadcast to. This is the only part every real
/// deployment (ours or a customer's) needs.
///
/// Demo wiring (registering the ROUTE intent and RouterModule/
/// MevProtectionModule as its competing candidates) is a separate, opt-in
/// step gated by DEPLOY_DEMO_MODULES -- a customer kernel should start with
/// zero registered intents/modules, not our example ones. Set
/// DEPLOY_DEMO_MODULES=true to get the previous unconditional behavior back
/// for local development.
///
/// Usage:
///   forge script script/Deploy.s.sol \
///     --rpc-url <rpc_url> \
///     --private-key $PRIVATE_KEY \
///     --broadcast
///
/// ProtocolRoles' owner defaults to the deploying/broadcasting address;
/// override via PROTOCOL_OWNER to hand ownership to a customer or multisig
/// immediately -- this is how a customer-owned kernel gets provisioned, see
/// docs/architecture/provisioning.md. Demo wiring and a PROTOCOL_OWNER that
/// differs from the broadcaster are mutually exclusive in one run (see the
/// require() in deploy() below) -- a single broadcast can't register the
/// demo intent/modules as an owner it isn't. ScorePolicy weights are
/// configurable via env vars (default: 1 each, i.e. quality/cost/mevRisk/
/// latencyScore weighted equally) and can be updated later by the
/// ProtocolRoles owner via updateWeights(). RouterModule's liquidity
/// sources default to none -- its constructor has no setter to add sources
/// after deployment, so pass real addresses via LIQUIDITY_SOURCES
/// (comma-separated) before deploying anywhere beyond a local dry run.
/// MevProtectionModule's relay premium defaults to 50 (see
/// MEV_PROTECTION_PREMIUM) and, like RouterModule, has no post-deploy
/// setter either. Both are only deployed at all when DEPLOY_DEMO_MODULES=true.
///
/// run() itself only parses env vars into a DeployParams struct and
/// delegates to deploy(...), which holds the actual deployment logic behind
/// one explicit-parameter struct -- deploy(...) is what test/Deploy.t.sol
/// calls directly, so those tests don't depend on process env vars
/// (vm.setEnv) at all. Bundled into one struct (rather than 8 separate
/// parameters) to avoid a "stack too deep" compile error.
contract Deploy is Script {

    bytes32 constant ROUTE_INTENT = keccak256("ROUTE");

    /// @notice The 5 core kernel contract addresses this script produces --
    /// returned for composability (e.g. tests instantiating this script
    /// directly) and printed as the human-readable deployment record below.
    struct KernelAddresses {
        address protocolRoles;
        address intentRegistry;
        address moduleRegistry;
        address scorePolicy;
        address executionEngine;
    }

    struct DeployParams {
        /// @dev address(0) to default to the broadcaster/caller.
        address protocolOwner;
        bool deployDemoModules;
        uint256 qualityWeight;
        uint256 costWeight;
        uint256 mevWeight;
        uint256 latencyWeight;
        address[] liquiditySources;
        uint256 mevProtectionPremium;
    }

    function run() external returns (KernelAddresses memory) {
        return deploy(DeployParams({
            protocolOwner: vm.envOr("PROTOCOL_OWNER", address(0)),
            deployDemoModules: vm.envOr("DEPLOY_DEMO_MODULES", false),
            qualityWeight: vm.envOr("QUALITY_WEIGHT", uint256(1)),
            costWeight: vm.envOr("COST_WEIGHT", uint256(1)),
            mevWeight: vm.envOr("MEV_WEIGHT", uint256(1)),
            latencyWeight: vm.envOr("LATENCY_WEIGHT", uint256(1)),
            liquiditySources: vm.envOr("LIQUIDITY_SOURCES", ",", new address[](0)),
            mevProtectionPremium: vm.envOr("MEV_PROTECTION_PREMIUM", uint256(50))
        }));
    }

    /// @notice The actual deployment logic, as an explicit parameter struct
    /// rather than env vars -- callable directly (from `run()` above, or
    /// from a test) without any dependency on process environment state.
    function deploy(DeployParams memory params) public returns (KernelAddresses memory) {
        vm.startBroadcast();

        // Whoever this script is transacting as -- captured before
        // protocolOwner is possibly reassigned below, so demo wiring (which
        // registers on-chain as this same broadcaster, not as protocolOwner)
        // can check the two actually match. vm.startBroadcast() attributes
        // every subsequent call/creation to tx.origin (the actual signing
        // EOA, whether that's `forge script --broadcast`'s configured
        // --private-key or a test's default sender) -- NOT msg.sender,
        // which here would just be whichever contract happens to call
        // deploy() (e.g. a test contract), and diverges from the true
        // broadcaster when deploy() is invoked directly rather than via
        // run().
        address broadcaster = tx.origin;
        address protocolOwner = params.protocolOwner;

        if (protocolOwner == address(0)) {
            protocolOwner = broadcaster;
        }

        // -----------------------------
        // CORE KERNEL (every deployment)
        // -----------------------------

        ProtocolRoles protocolRoles = new ProtocolRoles(protocolOwner);

        IntentRegistry intentRegistry = new IntentRegistry(address(protocolRoles));
        ModuleRegistry moduleRegistry = new ModuleRegistry(address(protocolRoles));
        ScorePolicy scorePolicy = new ScorePolicy(
            address(protocolRoles),
            params.qualityWeight,
            params.costWeight,
            params.mevWeight,
            params.latencyWeight
        );

        ExecutionEngine engine = new ExecutionEngine(
            address(intentRegistry),
            address(moduleRegistry),
            address(scorePolicy)
        );

        // -----------------------------
        // DEMO WIRING (opt-in only)
        // -----------------------------

        if (params.deployDemoModules) {
            // The demo intent/module registrations below execute as
            // `broadcaster` (whoever this script transacts as), not as
            // `protocolOwner` -- a single broadcast can't sign as two
            // different addresses. Demo wiring is a local/self-owned
            // convenience: it only makes sense when the deployer IS the
            // owner. Handing ownership to a genuinely separate customer
            // address (the real PROTOCOL_OWNER use case) must not also
            // request demo wiring in the same run -- deploy the core kernel
            // for them, then let the customer register their own
            // intents/modules once they hold ProtocolRoles.
            require(
                protocolOwner == broadcaster,
                "DEPLOY_DEMO_MODULES requires PROTOCOL_OWNER to equal the broadcaster -- demo wiring registers on-chain as the broadcaster, so it cannot honor a different owner in the same run"
            );
            _deployDemoRouteModules(intentRegistry, moduleRegistry, params.liquiditySources, params.mevProtectionPremium);
        }

        vm.stopBroadcast();

        console2.log("chainId:            ", block.chainid);
        console2.log("owner:              ", protocolOwner);
        console2.log("ProtocolRoles:      ", address(protocolRoles));
        console2.log("IntentRegistry:     ", address(intentRegistry));
        console2.log("ModuleRegistry:     ", address(moduleRegistry));
        console2.log("ScorePolicy:        ", address(scorePolicy));
        console2.log("ExecutionEngine:    ", address(engine));

        return KernelAddresses({
            protocolRoles: address(protocolRoles),
            intentRegistry: address(intentRegistry),
            moduleRegistry: address(moduleRegistry),
            scorePolicy: address(scorePolicy),
            executionEngine: address(engine)
        });
    }

    /// @dev Registers the ROUTE intent and deploys/registers RouterModule +
    /// MevProtectionModule as its two competing candidates -- exactly the
    /// previous unconditional behavior, now opt-in via DEPLOY_DEMO_MODULES so
    /// a customer's core kernel deployment doesn't inherit our example
    /// intent/modules by default.
    function _deployDemoRouteModules(
        IntentRegistry intentRegistry,
        ModuleRegistry moduleRegistry,
        address[] memory liquiditySources,
        uint256 mevProtectionPremium
    ) internal {
        RouterModule routerModule = new RouterModule(
            keccak256("ROUTER"),
            "Router Module",
            1,
            liquiditySources
        );

        MevProtectionModule mevModule = new MevProtectionModule(
            keccak256("MEV_PROTECTION"),
            "MEV Protection Module",
            1,
            mevProtectionPremium
        );

        intentRegistry.registerIntent(ROUTE_INTENT, "Route");
        moduleRegistry.registerModule(ROUTE_INTENT, address(routerModule));
        moduleRegistry.registerModule(ROUTE_INTENT, address(mevModule));

        console2.log("RouterModule:       ", address(routerModule));
        console2.log("MevProtectionModule:", address(mevModule));
    }
}
