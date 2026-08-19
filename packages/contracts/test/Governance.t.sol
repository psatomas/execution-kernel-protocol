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

/// @notice Proves ProtocolRoles actually gates every contract that defers to
/// it, that ownership transfer takes effect immediately with no redeploy,
/// and that ScorePolicy.updateWeights() changes real ExecutionEngine
/// selection outcomes on an already-deployed policy, not just a state
/// variable nobody reads.
contract GovernanceTest is Test {

    ProtocolRoles protocolRoles;
    IntentRegistry intentRegistry;
    ModuleRegistry moduleRegistry;
    ScorePolicy scorePolicy;
    ExecutionEngine engine;

    RouterModule routerModule;
    MevProtectionModule mevModule;

    address stranger = address(0xBEEF);
    address newOwner = address(0xCAFE);

    bytes32 constant ROUTE_INTENT = keccak256("ROUTE");

    function setUp() public {
        protocolRoles = new ProtocolRoles(address(this));

        intentRegistry = new IntentRegistry(address(protocolRoles));
        intentRegistry.registerIntent(ROUTE_INTENT, "Route");

        moduleRegistry = new ModuleRegistry(address(protocolRoles));

        scorePolicy = new ScorePolicy(address(protocolRoles), 1, 1, 1, 1);

        engine = new ExecutionEngine(
            address(intentRegistry),
            address(moduleRegistry),
            address(scorePolicy)
        );

        address[] memory sources = new address[](2);
        sources[0] = address(0x1);
        sources[1] = address(0x2);

        routerModule = new RouterModule(keccak256("ROUTER"), "Router Module", 1, sources);
        mevModule = new MevProtectionModule(keccak256("MEV_PROTECTION"), "MEV Protection Module", 1, 50);

        moduleRegistry.registerModule(ROUTE_INTENT, address(routerModule));
        moduleRegistry.registerModule(ROUTE_INTENT, address(mevModule));
    }

    // -----------------------------
    // onlyOwner enforcement across every contract that defers to ProtocolRoles
    // -----------------------------

    function testStrangerCannotRegisterIntent() public {
        vm.prank(stranger);
        vm.expectRevert(bytes("Not owner"));
        intentRegistry.registerIntent(keccak256("OTHER"), "Other");
    }

    function testStrangerCannotRegisterModule() public {
        vm.prank(stranger);
        vm.expectRevert(bytes("Not owner"));
        moduleRegistry.registerModule(ROUTE_INTENT, address(0x1234));
    }

    function testStrangerCannotUpdateWeights() public {
        vm.prank(stranger);
        vm.expectRevert(bytes("Not owner"));
        scorePolicy.updateWeights(1, 1, 1, 1);
    }

    function testStrangerCannotTransferOwnership() public {
        vm.prank(stranger);
        vm.expectRevert(bytes("Not owner"));
        protocolRoles.transferOwnership(stranger);
    }

    // -----------------------------
    // Ownership transfer takes effect immediately, with no redeploy
    // -----------------------------

    function testOwnershipTransferMovesControlToNewOwner() public {
        protocolRoles.transferOwnership(newOwner);

        // Old owner immediately loses access on an already-deployed ScorePolicy...
        vm.expectRevert(bytes("Not owner"));
        scorePolicy.updateWeights(2, 2, 2, 2);

        // ...and the new owner immediately gains it, same contract, no redeploy.
        vm.prank(newOwner);
        scorePolicy.updateWeights(2, 2, 2, 2);

        (uint256 quality, , , ) = scorePolicy.weights();
        assertEq(quality, 2);
    }

    // -----------------------------
    // updateWeights() changes real ExecutionEngine selection outcomes
    // -----------------------------

    /// @notice Mirrors ModuleCompetition.t.sol's two scenarios, but proves
    /// the flip happens via governance on ONE already-deployed ScorePolicy —
    /// not by deploying a second, differently-weighted ScorePolicy.
    function testUpdateWeightsFlipsSelectionOutcome() public {
        // Equal weights: RouterModule wins (1000-200-10-10=780 vs 900-150-1-20=729).
        bytes memory result = engine.executeIntent(ROUTE_INTENT, abi.encode("swap"));

        (string memory tag, , , , ) =
            abi.decode(result, (string, address, bytes, uint256, bytes));

        assertEq(tag, "ROUTE_EXECUTED");

        // Governance reweights toward MEV protection, in place.
        scorePolicy.updateWeights(1, 1, 50, 1);

        // Same engine, same modules, same ScorePolicy address — new outcome.
        result = engine.executeIntent(ROUTE_INTENT, abi.encode("swap"));

        (string memory tag2, , , ) =
            abi.decode(result, (string, address, bytes, bytes));

        assertEq(tag2, "MEV_PROTECTED_EXECUTED");
    }
}
