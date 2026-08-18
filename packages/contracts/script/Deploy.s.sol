// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console2.sol";

import "../src/core/IntentRegistry.sol";
import "../src/registry/ModuleRegistry.sol";
import "../src/policy/ScorePolicy.sol";
import "../src/core/ExecutionEngine.sol";
import "../src/modules/RouterModule.sol";

/// @notice Deploys the execution kernel: IntentRegistry, ModuleRegistry,
/// ScorePolicy and ExecutionEngine, then wires up RouterModule as the
/// initial ROUTE module.
///
/// Usage:
///   forge script script/Deploy.s.sol \
///     --rpc-url <rpc_url> \
///     --private-key $PRIVATE_KEY \
///     --broadcast
///
/// ScorePolicy weights are configurable via env vars (default: 1 each,
/// i.e. quality/cost/mevRisk/latencyScore weighted equally). RouterModule's
/// liquidity sources default to none — its constructor has no setter to add
/// sources after deployment, so pass real addresses via LIQUIDITY_SOURCES
/// (comma-separated) before deploying anywhere beyond a local dry run.
contract Deploy is Script {

    bytes32 constant ROUTE_INTENT = keccak256("ROUTE");

    function run() external {
        uint256 qualityWeight = vm.envOr("QUALITY_WEIGHT", uint256(1));
        uint256 costWeight = vm.envOr("COST_WEIGHT", uint256(1));
        uint256 mevWeight = vm.envOr("MEV_WEIGHT", uint256(1));
        uint256 latencyWeight = vm.envOr("LATENCY_WEIGHT", uint256(1));

        address[] memory liquiditySources =
            vm.envOr("LIQUIDITY_SOURCES", ",", new address[](0));

        vm.startBroadcast();

        IntentRegistry intentRegistry = new IntentRegistry();
        ModuleRegistry moduleRegistry = new ModuleRegistry();
        ScorePolicy scorePolicy = new ScorePolicy(
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

        intentRegistry.registerIntent(ROUTE_INTENT, "Route");
        moduleRegistry.registerModule(ROUTE_INTENT, address(routerModule));

        vm.stopBroadcast();

        console2.log("IntentRegistry:  ", address(intentRegistry));
        console2.log("ModuleRegistry:  ", address(moduleRegistry));
        console2.log("ScorePolicy:     ", address(scorePolicy));
        console2.log("ExecutionEngine: ", address(engine));
        console2.log("RouterModule:    ", address(routerModule));
    }
}
