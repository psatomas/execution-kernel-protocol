// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../src/modules/ExecutionModuleBase.sol";

contract MockUnsupportedModule is ExecutionModuleBase {

    constructor()
        ExecutionModuleBase(
            keccak256("UNSUPPORTED_MODULE"),
            "Unsupported Module",
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
        return abi.encode("UNSUPPORTED_EXECUTED");
    }

    function _simulate(
        address user,
        bytes calldata,
        bytes calldata
    )
        internal
        view
        override
        returns (bytes memory)
    {
        return abi.encode(
            "UNSUPPORTED_SIMULATION",
            uint256(100),
            uint256(9999),
            user
        );
    }

    function _estimateCost(
        bytes calldata
    )
        internal
        pure
        override
        returns (uint256)
    {
        return 100;
    }

    function _supportsIntent(
        bytes32
    )
        internal
        pure
        override
        returns (bool)
    {
        return false;
    }
}