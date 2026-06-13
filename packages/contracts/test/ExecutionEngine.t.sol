// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../src/core/ExecutionEngine.sol";
import "../src/registry/ModuleRegistry.sol";

import "./mocks/MockHighScoreModule.sol";
import "./mocks/MockLowScoreModule.sol";
import "./mocks/MockUnsupportedModule.sol";

contract ExecutionEngineTest is Test {

    ExecutionEngine engine;
    ModuleRegistry registry;

    MockHighScoreModule highModule;
    MockLowScoreModule lowModule;
    MockUnsupportedModule unsupportedModule;

    bytes32 constant ROUTE_INTENT =
        keccak256("ROUTE");

    function setUp() public {

        registry = new ModuleRegistry();

        engine = new ExecutionEngine(
            address(registry)
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
        bytes32 unknownIntent =
            keccak256("UNKNOWN");

        vm.expectRevert(
            bytes("No modules available")
        );

        engine.executeIntent(
            unknownIntent,
            abi.encode("data")
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
        ModuleRegistry localRegistry =
            new ModuleRegistry();

        ExecutionEngine localEngine =
            new ExecutionEngine(
                address(localRegistry)
            );

        unsupportedModule =
            new MockUnsupportedModule();

        localRegistry.registerModule(
            ROUTE_INTENT,
            address(unsupportedModule)
        );

        vm.expectRevert(
            bytes("No compatible module")
        );

        localEngine.executeIntent(
            ROUTE_INTENT,
            abi.encode("swap")
        );
    }
}