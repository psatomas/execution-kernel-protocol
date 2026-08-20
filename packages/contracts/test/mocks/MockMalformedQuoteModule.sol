// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../src/modules/ExecutionModuleBase.sol";

/// @notice Supports the intent and simulate() doesn't revert, but the bytes
/// it returns don't decode as ExecutionQuote at all -- a module that's
/// simply wrong about the standardized return shape, not reverting but not
/// usable either.
contract MockMalformedQuoteModule is ExecutionModuleBase {

    constructor()
        ExecutionModuleBase(
            keccak256("MALFORMED_QUOTE_MODULE"),
            "Malformed Quote Module",
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
        return abi.encode("MALFORMED_EXECUTED");
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
        // Two uint256s -- nowhere near ExecutionQuote's
        // (string, uint256, uint256, uint256, uint256) shape.
        return abi.encode(uint256(1), uint256(2));
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
