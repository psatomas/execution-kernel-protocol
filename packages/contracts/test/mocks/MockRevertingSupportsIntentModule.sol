// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../src/modules/ExecutionModuleBase.sol";
import "../../src/types/ExecutionQuote.sol";

/// @notice supportsIntent() itself reverts, before ExecutionEngine even gets
/// to ask whether this module is relevant.
contract MockRevertingSupportsIntentModule is ExecutionModuleBase {

    constructor()
        ExecutionModuleBase(
            keccak256("REVERTING_SUPPORTS_MODULE"),
            "Reverting SupportsIntent Module",
            1
        )
    {}

    function _execute(
        address,
        bytes calldata,
        bytes calldata
    )
        internal
        override
        returns (bytes memory)
    {
        return abi.encode("REVERTING_SUPPORTS_EXECUTED");
    }

    function _simulate(
        address,
        bytes calldata,
        bytes calldata
    )
        internal
        pure
        override
        returns (bytes memory)
    {
        ExecutionQuote memory quote = ExecutionQuote({
            tag: "UNREACHABLE",
            executionCost: 0,
            executionQuality: 0,
            mevRisk: 0,
            latencyScore: 0
        });

        return abi.encode(quote);
    }

    function _supportsIntent(
        bytes32
    )
        internal
        pure
        override
        returns (bool)
    {
        revert("supportsIntent() broken");
    }
}
