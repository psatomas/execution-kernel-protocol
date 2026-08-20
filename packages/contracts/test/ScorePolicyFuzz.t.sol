// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../src/access/ProtocolRoles.sol";
import "../src/policy/ScorePolicy.sol";
import "../src/types/ExecutionQuote.sol";

/// @notice Fuzzes ScorePolicy.evaluate() with the full uint256 range Solidity
/// allows for ExecutionQuote fields, to check whether extreme (but
/// type-valid) inputs from a module cause silent corruption or unexpected
/// reverts, rather than just trusting the "reasonable-looking" numbers used
/// in ModuleCompetition.t.sol/Governance.t.sol.
contract ScorePolicyFuzzTest is Test {

    ScorePolicy scorePolicy;

    function setUp() public {
        ProtocolRoles protocolRoles = new ProtocolRoles(address(this));
        scorePolicy = new ScorePolicy(address(protocolRoles), 1, 1, 1, 1);
    }

    /// @notice A field beyond int256's range must be rejected explicitly
    /// (via the require in _toInt256), never silently bit-reinterpreted
    /// into a negative number the way a raw int256(uint256) cast would.
    function testFuzz_ExtremeExecutionQualityRevertsInsteadOfWrapping(uint256 executionQuality) public {
        vm.assume(executionQuality > uint256(type(int256).max));

        ExecutionQuote memory q = ExecutionQuote({
            tag: "FUZZ",
            executionCost: 0,
            executionQuality: executionQuality,
            mevRisk: 0,
            latencyScore: 0
        });

        vm.expectRevert(bytes("Value exceeds int256 range"));
        scorePolicy.evaluate(q);
    }

    /// @notice Same property for a penalty field.
    function testFuzz_ExtremeExecutionCostRevertsInsteadOfWrapping(uint256 executionCost) public {
        vm.assume(executionCost > uint256(type(int256).max));

        ExecutionQuote memory q = ExecutionQuote({
            tag: "FUZZ",
            executionCost: executionCost,
            executionQuality: 0,
            mevRisk: 0,
            latencyScore: 0
        });

        vm.expectRevert(bytes("Value exceeds int256 range"));
        scorePolicy.evaluate(q);
    }

    /// @notice Within int256's range, "more quality" must never score worse
    /// than less quality, for any in-range value -- the actual property the
    /// scoring model promises, now checked across the full valid domain
    /// instead of just the handful of fixed numbers other tests use.
    function testFuzz_MoreQualityNeverScoresWorse(uint256 lowQuality, uint256 highQuality) public {
        lowQuality = bound(lowQuality, 0, uint256(type(int256).max));
        highQuality = bound(highQuality, lowQuality, uint256(type(int256).max));

        ExecutionQuote memory low = ExecutionQuote({
            tag: "LOW", executionCost: 0, executionQuality: lowQuality, mevRisk: 0, latencyScore: 0
        });
        ExecutionQuote memory high = ExecutionQuote({
            tag: "HIGH", executionCost: 0, executionQuality: highQuality, mevRisk: 0, latencyScore: 0
        });

        assertGe(scorePolicy.evaluate(high), scorePolicy.evaluate(low));
    }
}
