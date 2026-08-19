// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../src/access/ProtocolRoles.sol";
import "../src/core/ExecutionEngine.sol";
import "../src/core/IntentRegistry.sol";
import "../src/registry/ModuleRegistry.sol";
import "../src/policy/ScorePolicy.sol";
import "../src/modules/RouterModule.sol";
import "../src/modules/MevProtectionModule.sol";

/// @notice Exercises ExecutionEngine's selection logic against two real
/// (non-mock) competing modules for the same intent type, to prove out
/// ScorePolicy's weighting rather than just the mock-driven unit tests in
/// ExecutionEngine.t.sol.
contract ModuleCompetitionTest is Test {

    ProtocolRoles protocolRoles;
    IntentRegistry intentRegistry;
    ModuleRegistry moduleRegistry;

    RouterModule routerModule;
    MevProtectionModule mevModule;

    bytes32 constant ROUTE_INTENT = keccak256("ROUTE");

    function setUp() public {
        protocolRoles = new ProtocolRoles(address(this));

        intentRegistry = new IntentRegistry(address(protocolRoles));
        intentRegistry.registerIntent(ROUTE_INTENT, "Route");

        moduleRegistry = new ModuleRegistry(address(protocolRoles));

        // RouterModule quote (2 liquidity sources):
        //   executionCost = 200, executionQuality = 1000, mevRisk = 10, latencyScore = 10
        address[] memory sources = new address[](2);
        sources[0] = address(0x1);
        sources[1] = address(0x2);

        routerModule = new RouterModule(
            keccak256("ROUTER"),
            "Router Module",
            1,
            sources
        );

        // MevProtectionModule quote (premium = 50):
        //   executionCost = 150, executionQuality = 900, mevRisk = 1, latencyScore = 20
        mevModule = new MevProtectionModule(
            keccak256("MEV_PROTECTION"),
            "MEV Protection Module",
            1,
            50
        );

        moduleRegistry.registerModule(ROUTE_INTENT, address(routerModule));
        moduleRegistry.registerModule(ROUTE_INTENT, address(mevModule));
    }

    function _deployEngine(ScorePolicy policy) internal returns (ExecutionEngine) {
        return new ExecutionEngine(
            address(intentRegistry),
            address(moduleRegistry),
            address(policy)
        );
    }

    /// @notice Under equal weights, RouterModule's higher quality and lower
    /// cost outweigh its higher MEV risk: 1000-200-10-10=780 vs 900-150-1-20=729.
    function testRouterWinsUnderEqualWeights() public {
        ScorePolicy policy = new ScorePolicy(address(protocolRoles), 1, 1, 1, 1);
        ExecutionEngine engine = _deployEngine(policy);

        bytes memory result = engine.executeIntent(ROUTE_INTENT, abi.encode("swap"));

        (string memory tag, , , , ) =
            abi.decode(result, (string, address, bytes, uint256, bytes));

        assertEq(tag, "ROUTE_EXECUTED");
    }

    /// @notice Once MEV risk is weighted heavily, MevProtectionModule's much
    /// lower mevRisk flips the outcome: 1000-200-500-10=290 vs 900-150-50-20=680.
    function testMevProtectionWinsWhenMevWeightDominates() public {
        ScorePolicy policy = new ScorePolicy(address(protocolRoles), 1, 1, 50, 1);
        ExecutionEngine engine = _deployEngine(policy);

        bytes memory result = engine.executeIntent(ROUTE_INTENT, abi.encode("swap"));

        (string memory tag, , , ) =
            abi.decode(result, (string, address, bytes, bytes));

        assertEq(tag, "MEV_PROTECTED_EXECUTED");
    }
}
