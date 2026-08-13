// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../src/core/ExecutionEngine.sol";
import "../src/core/IntentRegistry.sol";
import "../src/registry/ModuleRegistry.sol";
import "../src/policy/ScorePolicy.sol";

import "./mocks/MockHighScoreModule.sol";
import "./mocks/MockLowScoreModule.sol";
import "./mocks/MockUnsupportedModule.sol";

contract ExecutionEngineTest is Test {

    ExecutionEngine engine;
    IntentRegistry intentRegistry;
    ModuleRegistry registry;
    ScorePolicy scorePolicy;

    MockHighScoreModule highModule;
    MockLowScoreModule lowModule;
    MockUnsupportedModule unsupportedModule;

    bytes32 constant ROUTE_INTENT =
        keccak256("ROUTE");

    function setUp() public {

        intentRegistry = new IntentRegistry();
        intentRegistry.registerIntent(ROUTE_INTENT, "Route");

        registry = new ModuleRegistry();

        // Equal weights: score = quality - cost - mevRisk - latencyScore
        scorePolicy = new ScorePolicy(1, 1, 1, 1);

        engine = new ExecutionEngine(
            address(intentRegistry),
            address(registry),
            address(scorePolicy)
        );

        highModule = new MockHighScoreModule();
        lowModule = new MockLowScoreModule();

        registry.registerModule(
            ROUTE_INTENT,
            address(lowModule)
        );

        registry.registerModule(
            ROUTE_INTENT,
            address(highModule)
        );
    }

    function testModuleRegistration() public {

        address[] memory modules =
            registry.getModules(ROUTE_INTENT);

        assertEq(modules.length, 2);
    }

    function testEngineSelectsHighestScoreModule()
        public
    {
        bytes memory result =
            engine.executeIntent(
                ROUTE_INTENT,
                abi.encode("swap")
            );

        string memory executionTag =
            abi.decode(result, (string));

        assertEq(
            executionTag,
            "HIGH_EXECUTED"
        );

    }

    function testEngineRevertsWhenNoModules()
        public
    {
        // Registered and active, but no modules assigned to it yet.
        bytes32 emptyIntent =
            keccak256("EMPTY");

        intentRegistry.registerIntent(emptyIntent, "Empty");

        vm.expectRevert(
            bytes("No modules available")
        );

        engine.executeIntent(
            emptyIntent,
            abi.encode("data")
        );
    }

    function testEngineRevertsWhenIntentNotRegistered()
        public
    {
        bytes32 unknownIntent =
            keccak256("UNKNOWN");

        vm.expectRevert(
            bytes("Intent not active")
        );

        engine.executeIntent(
            unknownIntent,
            abi.encode("data")
        );
    }

    function testEngineRevertsWhenIntentDeactivated()
        public
    {
        intentRegistry.setIntentStatus(ROUTE_INTENT, false);

        vm.expectRevert(
            bytes("Intent not active")
        );

        engine.executeIntent(
            ROUTE_INTENT,
            abi.encode("swap")
        );
    }

    function testRemoveModule()
        public
    {
        registry.removeModule(
            ROUTE_INTENT,
            address(highModule)
        );

        address[] memory modules =
            registry.getModules(ROUTE_INTENT);

        assertEq(modules.length, 1);
    }
    function testRevertWhenNoModuleSupportsIntent()
        public
    {
        IntentRegistry localIntentRegistry =
            new IntentRegistry();
        localIntentRegistry.registerIntent(ROUTE_INTENT, "Route");

        ModuleRegistry localRegistry =
            new ModuleRegistry();

        ExecutionEngine localEngine =
            new ExecutionEngine(
                address(localIntentRegistry),
                address(localRegistry),
                address(scorePolicy)
            );

        unsupportedModule =
            new MockUnsupportedModule();

        localRegistry.registerModule(
            ROUTE_INTENT,
            address(unsupportedModule)
        );

        vm.expectRevert(
            bytes("No compatible modules")
        );

        localEngine.executeIntent(
            ROUTE_INTENT,
            abi.encode("swap")
        );
    }
}