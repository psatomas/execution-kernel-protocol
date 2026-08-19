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

/// @notice Deploys the execution kernel: ProtocolRoles, IntentRegistry,
/// ModuleRegistry, ScorePolicy and ExecutionEngine, then wires up
/// RouterModule and MevProtectionModule as competing ROUTE modules.
///
/// Usage:
///   forge script script/Deploy.s.sol \
///     --rpc-url <rpc_url> \
///     --private-key $PRIVATE_KEY \
///     --broadcast
///
/// ProtocolRoles' owner defaults to the deploying/broadcasting address;
/// override via PROTOCOL_OWNER to hand ownership to a multisig immediately.
/// ScorePolicy weights are configurable via env vars (default: 1 each,
/// i.e. quality/cost/mevRisk/latencyScore weighted equally) and can be
/// updated later by the ProtocolRoles owner via updateWeights(). RouterModule's
/// liquidity sources default to none — its constructor has no setter to add
/// sources after deployment, so pass real addresses via LIQUIDITY_SOURCES
/// (comma-separated) before deploying anywhere beyond a local dry run.
/// MevProtectionModule's relay premium defaults to 50 (see
/// MEV_PROTECTION_PREMIUM) and, like RouterModule, has no post-deploy
/// setter either.
contract Deploy is Script {

    bytes32 constant ROUTE_INTENT = keccak256("ROUTE");

    function run() external {
        uint256 qualityWeight = vm.envOr("QUALITY_WEIGHT", uint256(1));
        uint256 costWeight = vm.envOr("COST_WEIGHT", uint256(1));
        uint256 mevWeight = vm.envOr("MEV_WEIGHT", uint256(1));
        uint256 latencyWeight = vm.envOr("LATENCY_WEIGHT", uint256(1));

        address[] memory liquiditySources =
            vm.envOr("LIQUIDITY_SOURCES", ",", new address[](0));

        uint256 mevProtectionPremium = vm.envOr("MEV_PROTECTION_PREMIUM", uint256(50));

        address protocolOwner = vm.envOr("PROTOCOL_OWNER", address(0));

        vm.startBroadcast();

        if (protocolOwner == address(0)) {
            protocolOwner = msg.sender;
        }

        ProtocolRoles protocolRoles = new ProtocolRoles(protocolOwner);

        IntentRegistry intentRegistry = new IntentRegistry(address(protocolRoles));
        ModuleRegistry moduleRegistry = new ModuleRegistry(address(protocolRoles));
        ScorePolicy scorePolicy = new ScorePolicy(
            address(protocolRoles),
            qualityWeight,
            costWeight,
            mevWeight,
            latencyWeight
        );

        ExecutionEngine engine = new ExecutionEngine(
            address(intentRegistry),
            address(moduleRegistry),
            address(scorePolicy)
        );

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

        vm.stopBroadcast();

        console2.log("ProtocolRoles:       ", address(protocolRoles));
        console2.log("IntentRegistry:      ", address(intentRegistry));
        console2.log("ModuleRegistry:      ", address(moduleRegistry));
        console2.log("ScorePolicy:         ", address(scorePolicy));
        console2.log("ExecutionEngine:     ", address(engine));
        console2.log("RouterModule:        ", address(routerModule));
        console2.log("MevProtectionModule: ", address(mevModule));
    }
}
