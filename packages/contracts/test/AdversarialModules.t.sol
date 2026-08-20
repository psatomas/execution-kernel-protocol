// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../src/core/ExecutionEngine.sol";
import "../src/core/IntentRegistry.sol";
import "../src/registry/ModuleRegistry.sol";
import "../src/policy/ScorePolicy.sol";
import "../src/access/ProtocolRoles.sol";

import "./mocks/MockHighScoreModule.sol";
import "./mocks/MockRevertingSimulateModule.sol";
import "./mocks/MockRevertingSupportsIntentModule.sol";
import "./mocks/MockMalformedQuoteModule.sol";

/// @notice Proves a single broken registered module (reverting or
/// malformed, not necessarily malicious) cannot block execution for an
/// entire intent type when a working module is also registered --
/// ExecutionEngine._selectBestModule must skip broken candidates, not let
/// them revert the whole selection.
contract AdversarialModulesTest is Test {

    ProtocolRoles protocolRoles;
    IntentRegistry intentRegistry;
    ModuleRegistry moduleRegistry;
    ScorePolicy scorePolicy;
    ExecutionEngine engine;

    MockHighScoreModule goodModule;

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

        goodModule = new MockHighScoreModule();
        moduleRegistry.registerModule(ROUTE_INTENT, address(goodModule));
    }

    function testExecutionSurvivesModuleThatRevertsInSimulate() public {
        MockRevertingSimulateModule brokenModule = new MockRevertingSimulateModule();
        moduleRegistry.registerModule(ROUTE_INTENT, address(brokenModule));

        bytes memory result = engine.executeIntent(ROUTE_INTENT, abi.encode("swap"));
        string memory tag = abi.decode(result, (string));

        assertEq(tag, "HIGH_EXECUTED");
    }

    function testExecutionSurvivesModuleThatRevertsInSupportsIntent() public {
        MockRevertingSupportsIntentModule brokenModule = new MockRevertingSupportsIntentModule();
        moduleRegistry.registerModule(ROUTE_INTENT, address(brokenModule));

        bytes memory result = engine.executeIntent(ROUTE_INTENT, abi.encode("swap"));
        string memory tag = abi.decode(result, (string));

        assertEq(tag, "HIGH_EXECUTED");
    }

    function testExecutionSurvivesModuleWithMalformedQuote() public {
        MockMalformedQuoteModule brokenModule = new MockMalformedQuoteModule();
        moduleRegistry.registerModule(ROUTE_INTENT, address(brokenModule));

        bytes memory result = engine.executeIntent(ROUTE_INTENT, abi.encode("swap"));
        string memory tag = abi.decode(result, (string));

        assertEq(tag, "HIGH_EXECUTED");
    }

    /// @notice If EVERY registered module is broken, executeIntent must
    /// still revert cleanly with "No compatible modules" -- not some other
    /// error surfaced from whichever broken module happened to run first.
    function testRevertsWithCleanMessageWhenAllModulesAreBroken() public {
        ModuleRegistry localRegistry = new ModuleRegistry(address(protocolRoles));
        ExecutionEngine localEngine = new ExecutionEngine(
            address(intentRegistry),
            address(localRegistry),
            address(scorePolicy)
        );

        localRegistry.registerModule(ROUTE_INTENT, address(new MockRevertingSimulateModule()));
        localRegistry.registerModule(ROUTE_INTENT, address(new MockRevertingSupportsIntentModule()));
        localRegistry.registerModule(ROUTE_INTENT, address(new MockMalformedQuoteModule()));

        vm.expectRevert(bytes("No compatible modules"));
        localEngine.executeIntent(ROUTE_INTENT, abi.encode("swap"));
    }
}
