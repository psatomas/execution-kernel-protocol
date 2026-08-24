// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "../src/access/ProtocolRoles.sol";
import "../src/core/ExecutionEngine.sol";
import "../src/core/IntentRegistry.sol";
import "../src/registry/ModuleRegistry.sol";
import "../src/policy/ScorePolicy.sol";

import "./mocks/MockConfigurableModule.sol";

/// @notice Every real run of this protocol so far -- the Foundry unit/
/// adversarial tests, the SDK quickstart, the full Playwright E2E flow --
/// has only ever exercised ExecutionEngine._selectBestModule with exactly
/// two registered candidates (RouterModule, MevProtectionModule). The module
/// list per intent type is unbounded, so this suite measures what actually
/// happens -- correctness and gas -- as that count grows to the sizes named
/// in the engineering brief (1/2/5/10/20/50/100), plus adversarial mixes at
/// a representative scale. See BENCHMARKS.md for the resulting numbers and
/// their read on the architecture; this file is the measurement, not the
/// conclusion.
///
/// No production behavior changes here -- this is exclusively new test
/// coverage plus one new configurable mock (MockConfigurableModule) that
/// makes deploying dozens-to-hundreds of distinctly-behaved candidates
/// practical without a bespoke contract per behavior.
contract ModuleScalabilityTest is Test {

    ProtocolRoles protocolRoles;
    IntentRegistry intentRegistry;
    ScorePolicy scorePolicy;

    bytes32 constant INTENT = keccak256("BENCH");

    function setUp() public {
        protocolRoles = new ProtocolRoles(address(this));

        intentRegistry = new IntentRegistry(address(protocolRoles));
        intentRegistry.registerIntent(INTENT, "Bench");

        // Equal weights, same as every other test in this repo.
        scorePolicy = new ScorePolicy(address(protocolRoles), 1, 1, 1, 1);
    }

    function _freshEngine() internal returns (ModuleRegistry registry, ExecutionEngine engine) {
        registry = new ModuleRegistry(address(protocolRoles));
        engine = new ExecutionEngine(address(intentRegistry), address(registry), address(scorePolicy));
    }

    /// @dev Registers `n` valid, supported, distinctly-scored candidates with
    /// strictly increasing executionQuality, so the winner is always the
    /// last-registered module regardless of n -- deterministic and cheap to
    /// assert on at any scale.
    function _registerIncreasingQuality(ModuleRegistry registry, uint256 n) internal {
        for (uint256 i = 0; i < n; i++) {
            MockConfigurableModule m = new MockConfigurableModule(
                string.concat("candidate-", vm.toString(i)),
                10,             // executionCost
                (i + 1) * 100,  // executionQuality -- strictly increasing
                1,              // mevRisk
                1,              // latencyScore
                true,           // supported
                false,          // revertsOnSimulate
                false,          // revertsOnSupportsIntent
                false           // malformedQuote
            );
            registry.registerModule(INTENT, address(m));
        }
    }

    function _benchmarkCandidateCount(uint256 n) internal {
        (ModuleRegistry registry, ExecutionEngine engine) = _freshEngine();
        _registerIncreasingQuality(registry, n);

        uint256 gasBefore = gasleft();
        bytes memory result = engine.executeIntent(INTENT, abi.encode("bench"));
        uint256 gasUsed = gasBefore - gasleft();

        string memory tag = abi.decode(result, (string));
        assertEq(tag, string.concat("candidate-", vm.toString(n - 1)), "winner mismatch");

        console2.log("candidates=%s executeIntent_gas=%s", n, gasUsed);
    }

    // -----------------------------
    // 1. CANDIDATE COUNT SCALING (happy path)
    // -----------------------------

    function testGas_1Candidate() public { _benchmarkCandidateCount(1); }
    function testGas_2Candidates() public { _benchmarkCandidateCount(2); }
    function testGas_5Candidates() public { _benchmarkCandidateCount(5); }
    function testGas_10Candidates() public { _benchmarkCandidateCount(10); }
    function testGas_20Candidates() public { _benchmarkCandidateCount(20); }
    function testGas_50Candidates() public { _benchmarkCandidateCount(50); }
    function testGas_100Candidates() public { _benchmarkCandidateCount(100); }

    /// @notice Isolates ModuleRegistry.getModules()'s own cost (the O(n)
    /// storage-array copy plus the two-pass active-count/active-fill loop)
    /// from the rest of executeIntent's per-candidate external-call cost.
    function _benchmarkGetModulesOnly(uint256 n) internal {
        (ModuleRegistry registry, ) = _freshEngine();
        _registerIncreasingQuality(registry, n);

        uint256 gasBefore = gasleft();
        registry.getModules(INTENT);
        uint256 gasUsed = gasBefore - gasleft();

        console2.log("candidates=%s getModules_only_gas=%s", n, gasUsed);
    }

    function testGas_GetModulesOnly_1Candidate() public { _benchmarkGetModulesOnly(1); }
    function testGas_GetModulesOnly_100Candidates() public { _benchmarkGetModulesOnly(100); }

    /// @notice Registration itself, at the point of adding the nth module --
    /// the "deployment/registration implications" half of the brief, as
    /// distinct from the read-path (getModules/executeIntent) cost above.
    function testGas_RegisterModule_MarginalCostAt100th() public {
        (ModuleRegistry registry, ) = _freshEngine();
        _registerIncreasingQuality(registry, 99);

        MockConfigurableModule m = new MockConfigurableModule(
            "candidate-99", 10, 10_000, 1, 1, true, false, false, false
        );

        uint256 gasBefore = gasleft();
        registry.registerModule(INTENT, address(m));
        uint256 gasUsed = gasBefore - gasleft();

        console2.log("registerModule_marginal_gas_at_n=100 gas=%s", gasUsed);
    }

    /// @dev Registers `count` candidates that all share one uniform failure
    /// mode (all reverting-in-simulate, all unsupported, or all
    /// malformed-quote) under a common tag prefix -- shared by the three
    /// "one valid module among many uniformly-broken ones" cases below,
    /// which differ only in which failure mode they're exercising.
    function _registerBrokenBatch(
        ModuleRegistry registry,
        string memory tagPrefix,
        uint256 count,
        bool supported,
        bool revertsOnSimulate,
        bool revertsOnSupportsIntent,
        bool malformedQuote
    ) internal {
        for (uint256 i = 0; i < count; i++) {
            MockConfigurableModule m = new MockConfigurableModule(
                string.concat(tagPrefix, vm.toString(i)),
                0, 0, 0, 0,
                supported, revertsOnSimulate, revertsOnSupportsIntent, malformedQuote
            );
            registry.registerModule(INTENT, address(m));
        }
    }

    // -----------------------------
    // 2. ADVERSARIAL MIXES (at a representative scale, n=20)
    // -----------------------------

    /// @notice One valid module plus many candidates that revert in
    /// simulate() -- confirms AdversarialModulesTest's single-broken-module
    /// property still holds, and measures the "wasted work" cost of
    /// try/catching past a larger batch of broken candidates.
    function testAdversarial_OneValidAmongManyRevertingSimulate() public {
        (ModuleRegistry registry, ExecutionEngine engine) = _freshEngine();

        MockConfigurableModule good = new MockConfigurableModule(
            "the-good-one", 10, 1000, 1, 1, true, false, false, false
        );
        registry.registerModule(INTENT, address(good));

        // supported = true -- so each one gets as far as simulate() before failing.
        _registerBrokenBatch(registry, "broken-simulate-", 19, true, true, false, false);

        uint256 gasBefore = gasleft();
        bytes memory result = engine.executeIntent(INTENT, abi.encode("bench"));
        uint256 gasUsed = gasBefore - gasleft();

        assertEq(abi.decode(result, (string)), "the-good-one");
        console2.log("adversarial=1_valid_19_reverting_simulate gas=%s", gasUsed);
    }

    /// @notice One valid module plus many candidates that simply don't
    /// support the intent -- the cheaper failure path (short-circuits at
    /// supportsIntent(), never reaches simulate()/evaluateQuoteBytes()).
    function testAdversarial_OneValidAmongManyUnsupported() public {
        (ModuleRegistry registry, ExecutionEngine engine) = _freshEngine();

        MockConfigurableModule good = new MockConfigurableModule(
            "the-good-one", 10, 1000, 1, 1, true, false, false, false
        );
        registry.registerModule(INTENT, address(good));

        _registerBrokenBatch(registry, "unsupported-", 19, false, false, false, false);

        uint256 gasBefore = gasleft();
        bytes memory result = engine.executeIntent(INTENT, abi.encode("bench"));
        uint256 gasUsed = gasBefore - gasleft();

        assertEq(abi.decode(result, (string)), "the-good-one");
        console2.log("adversarial=1_valid_19_unsupported gas=%s", gasUsed);
    }

    /// @notice A mix of valid and malformed-quote candidates -- confirms a
    /// batch of decode failures doesn't block the honest candidates from
    /// still competing against each other correctly.
    function testAdversarial_MalformedQuoteMixedIn() public {
        (ModuleRegistry registry, ExecutionEngine engine) = _freshEngine();

        _registerBrokenBatch(registry, "malformed-", 10, true, false, false, true);
        _registerIncreasingQuality(registry, 10); // candidate-0..9, winner = candidate-9

        uint256 gasBefore = gasleft();
        bytes memory result = engine.executeIntent(INTENT, abi.encode("bench"));
        uint256 gasUsed = gasBefore - gasleft();

        assertEq(abi.decode(result, (string)), "candidate-9");
        console2.log("adversarial=10_malformed_10_valid gas=%s", gasUsed);
    }

    /// @notice Scales AdversarialModulesTest's "every registered module is
    /// broken" property up from 3 mocks to 20 -- must still fail with the
    /// same clean, specific revert reason, not run out of gas or surface a
    /// different error first.
    function testAdversarial_AllModulesBrokenAtScale_RevertsCleanly() public {
        (ModuleRegistry registry, ExecutionEngine engine) = _freshEngine();

        for (uint256 i = 0; i < 20; i++) {
            bool revertsOnSimulate = i % 2 == 0;
            MockConfigurableModule broken = new MockConfigurableModule(
                string.concat("broken-", vm.toString(i)),
                0, 0, 0, 0,
                true,
                revertsOnSimulate,
                !revertsOnSimulate, // the other half revert in supportsIntent instead
                false
            );
            registry.registerModule(INTENT, address(broken));
        }

        vm.expectRevert(bytes("No compatible modules"));
        engine.executeIntent(INTENT, abi.encode("bench"));
    }

    /// @notice Ties must resolve deterministically: ExecutionEngine keeps
    /// its running best only on a strict `score > bestScore`, so among equal
    /// scores the first-registered candidate wins, never the last or an
    /// arbitrary one.
    function testEqualScoreCandidates_FirstRegisteredWins() public {
        (ModuleRegistry registry, ExecutionEngine engine) = _freshEngine();

        for (uint256 i = 0; i < 5; i++) {
            MockConfigurableModule m = new MockConfigurableModule(
                string.concat("tied-", vm.toString(i)),
                10, 500, 1, 1, // identical quote on every one -- identical score
                true, false, false, false
            );
            registry.registerModule(INTENT, address(m));
        }

        bytes memory result = engine.executeIntent(INTENT, abi.encode("bench"));
        assertEq(abi.decode(result, (string)), "tied-0", "first-registered candidate must win ties");
    }

    /// @notice Same registered set, called twice: selection must be
    /// deterministic run to run, not just correct once.
    function testDeterministicWinnerSelection_RepeatedCalls() public {
        (ModuleRegistry registry, ExecutionEngine engine) = _freshEngine();
        _registerIncreasingQuality(registry, 20);

        bytes memory first = engine.executeIntent(INTENT, abi.encode("bench"));
        bytes memory second = engine.executeIntent(INTENT, abi.encode("bench"));

        assertEq(abi.decode(first, (string)), abi.decode(second, (string)));
        assertEq(abi.decode(first, (string)), "candidate-19");
    }
}
