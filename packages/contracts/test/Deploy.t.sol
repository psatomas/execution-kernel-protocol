// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../script/Deploy.s.sol";
import "../src/access/ProtocolRoles.sol";
import "../src/core/IntentRegistry.sol";
import "../src/registry/ModuleRegistry.sol";
import "../src/policy/ScorePolicy.sol";
import "../src/core/ExecutionEngine.sol";

/// @notice Exercises script/Deploy.s.sol directly, to prove out customer
/// kernel provisioning: a customer-owned core deployment with no demo
/// intent/modules by default, the demo flow still available opt-in, and two
/// customers' deployments staying fully isolated from each other -- the
/// actual property this task is about, not just "the script doesn't
/// revert".
///
/// Calls Deploy.deploy(...) directly with explicit parameters rather than
/// driving Deploy.run()'s env-var parsing via vm.setEnv: this sandbox's
/// forge does not round-trip vm.setEnv -> vm.envOr within a single test
/// (confirmed independently -- vm.envOr keeps returning the default value
/// immediately after vm.setEnv sets it), so these tests exercise the actual
/// deployment logic through the same explicit-parameter entry point run()
/// itself calls, rather than depend on that broken env round-trip.
contract DeployTest is Test {

    bytes32 constant ROUTE_INTENT = keccak256("ROUTE");

    function _deployCore(address owner, bool demo) internal returns (Deploy.KernelAddresses memory) {
        Deploy deploy = new Deploy();
        return deploy.deploy(Deploy.DeployParams({
            protocolOwner: owner,
            deployDemoModules: demo,
            qualityWeight: 1,
            costWeight: 1,
            mevWeight: 1,
            latencyWeight: 1,
            liquiditySources: new address[](0),
            mevProtectionPremium: 50
        }));
    }

    function testCoreDeploymentAssignsOwnerAndWiresContractsWithNoDemoState() public {
        address customerOwner = address(0xC0FFEE);
        Deploy.KernelAddresses memory addrs = _deployCore(customerOwner, false);

        // Ownership assigned correctly.
        ProtocolRoles roles = ProtocolRoles(addrs.protocolRoles);
        assertEq(roles.owner(), customerOwner);

        // Every governed contract defers to the SAME ProtocolRoles instance.
        IntentRegistry intentRegistry = IntentRegistry(addrs.intentRegistry);
        assertEq(address(intentRegistry.protocolRoles()), addrs.protocolRoles);

        ModuleRegistry moduleRegistry = ModuleRegistry(addrs.moduleRegistry);
        assertEq(address(moduleRegistry.protocolRoles()), addrs.protocolRoles);

        ScorePolicy scorePolicy = ScorePolicy(addrs.scorePolicy);
        assertEq(address(scorePolicy.protocolRoles()), addrs.protocolRoles);

        // ExecutionEngine wired to this deployment's own registries/policy.
        ExecutionEngine engine = ExecutionEngine(addrs.executionEngine);
        assertEq(address(engine.intentRegistry()), addrs.intentRegistry);
        assertEq(address(engine.moduleRegistry()), addrs.moduleRegistry);
        assertEq(address(engine.scorePolicy()), addrs.scorePolicy);

        // The core deployment must NOT carry our demo ROUTE intent/modules.
        assertEq(intentRegistry.getAllIntents().length, 0, "core deployment must not register any intent");
        assertFalse(intentRegistry.isIntentActive(ROUTE_INTENT));
        assertEq(moduleRegistry.getModules(ROUTE_INTENT).length, 0);
    }

    /// @notice Demo wiring is a local/self-owned convenience -- it must
    /// still work exactly as before when the owner is left to default to
    /// the broadcaster (protocolOwner = address(0)), which is how it's
    /// actually used for local dev (see quickstart.ts/the E2E test's own
    /// setup, neither of which hands ownership to a separate address).
    function testDemoFlagStillRegistersRouteIntentAndBothModules() public {
        Deploy.KernelAddresses memory addrs = _deployCore(address(0), true);

        IntentRegistry intentRegistry = IntentRegistry(addrs.intentRegistry);
        assertTrue(intentRegistry.isIntentActive(ROUTE_INTENT));

        ModuleRegistry moduleRegistry = ModuleRegistry(addrs.moduleRegistry);
        assertEq(moduleRegistry.getModules(ROUTE_INTENT).length, 2, "demo flow must still register both example modules");
    }

    /// @notice The bug this test guards against: requesting demo wiring
    /// alongside a PROTOCOL_OWNER that genuinely differs from whoever is
    /// broadcasting the deployment must fail loudly and specifically, not
    /// with ModuleRegistry's raw "Not owner" -- demo registration always
    /// executes as the broadcaster, so it can never honor a separate owner
    /// in the same run.
    function testDemoFlagWithDifferentOwnerRevertsWithClearMessage() public {
        Deploy deploy = new Deploy();

        vm.expectRevert(
            bytes(
                "DEPLOY_DEMO_MODULES requires PROTOCOL_OWNER to equal the broadcaster -- demo wiring registers on-chain as the broadcaster, so it cannot honor a different owner in the same run"
            )
        );
        deploy.deploy(Deploy.DeployParams({
            protocolOwner: address(0xDEC0DE),
            deployDemoModules: true,
            qualityWeight: 1,
            costWeight: 1,
            mevWeight: 1,
            latencyWeight: 1,
            liquiditySources: new address[](0),
            mevProtectionPremium: 50
        }));
    }

    /// @notice Covers the documented protocolOwner == address(0) fallback:
    /// it must resolve to some real broadcaster address, not stay
    /// address(0) or silently fail.
    function testProtocolOwnerDefaultsToBroadcasterWhenUnset() public {
        Deploy.KernelAddresses memory addrs = _deployCore(address(0), false);
        assertTrue(ProtocolRoles(addrs.protocolRoles).owner() != address(0));
    }

    /// @notice The actual property this task is about: two customers'
    /// deployments must share only the underlying contract code, never any
    /// state -- distinct addresses, distinct owners, distinct registries.
    /// Both get a bare core kernel (demo=false), exactly the recommended
    /// real customer flow -- demo wiring and a separate owner are mutually
    /// exclusive in one run, per the test above.
    function testTwoCustomerDeploymentsAreFullyIsolated() public {
        address ownerA = address(0xA11CE);
        address ownerB = address(0xB0B);

        Deploy.KernelAddresses memory a = _deployCore(ownerA, false);
        Deploy.KernelAddresses memory b = _deployCore(ownerB, false);

        // Fully distinct contract instances -- nothing shared.
        assertTrue(a.protocolRoles != b.protocolRoles);
        assertTrue(a.intentRegistry != b.intentRegistry);
        assertTrue(a.moduleRegistry != b.moduleRegistry);
        assertTrue(a.scorePolicy != b.scorePolicy);
        assertTrue(a.executionEngine != b.executionEngine);

        // Each owned independently.
        assertEq(ProtocolRoles(a.protocolRoles).owner(), ownerA);
        assertEq(ProtocolRoles(b.protocolRoles).owner(), ownerB);

        // Neither customer's core deployment carries any intent/module state.
        assertEq(IntentRegistry(a.intentRegistry).getAllIntents().length, 0);
        assertEq(IntentRegistry(b.intentRegistry).getAllIntents().length, 0);

        // Customer A's owner has no control over customer B's deployment, and vice versa.
        vm.prank(ownerA);
        vm.expectRevert(bytes("Not owner"));
        ModuleRegistry(b.moduleRegistry).registerModule(ROUTE_INTENT, address(0x1));
    }
}
