// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../src/modules/ExecutionModuleBase.sol";

/// @notice Supports the intent, but simulate() always reverts -- e.g. an
/// honest bug in a module's simulation logic, not necessarily malice.
contract MockRevertingSimulateModule is ExecutionModuleBase {

    constructor()
        ExecutionModuleBase(
            keccak256("REVERTING_SIMULATE_MODULE"),
            "Reverting Simulate Module",
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
        return abi.encode("REVERTING_SIMULATE_EXECUTED");
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
        revert("simulate() broken");
    }

    function _supportsIntent(
        bytes32 intentType
    )
        internal
        pure
        override
        returns (bool)
    {
        return intentType == keccak256("ROUTE");
    }
}
