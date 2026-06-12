// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IExecutionModule.sol";

abstract contract ExecutionModuleBase is IExecutionModule {

    /// @notice Unique identifier for the module
    bytes32 public immutable override moduleId;

    /// @notice Human-readable name
    string public override name;

    /// @notice Version of the module implementation
    uint256 public override version;

    constructor(
        bytes32 _moduleId,
        string memory _name,
        uint256 _version
    ) {
        moduleId = _moduleId;
        name = _name;
        version = _version;
    }

    /// @notice Default execution flow (can be overridden)
    function execute(
        address user,
        bytes calldata intentData,
        bytes calldata context
    )
        external
        virtual
        override
        returns (bytes memory executionResult)
    {
        return _execute(user, intentData, context);
    }

    /// @notice Default simulation flow (can be overridden)
    function simulate(
        address user,
        bytes calldata intentData,
        bytes calldata context
    )
        external
        view
        virtual
        override
        returns (bytes memory simulationResult)
    {
        return _simulate(user, intentData, context);
    }

    /// @notice Default cost estimation
    function estimateCost(
        bytes calldata intentData
    )
        external
        view
        virtual
        override
        returns (uint256)
    {
        return _estimateCost(intentData);
    }

    /// @notice Default intent support check (override in modules)
    function supportsIntent(bytes32 intentType)
        external
        view
        virtual
        override
        returns (bool)
    {
        return _supportsIntent(intentType);
    }

    // -----------------------------
    // INTERNAL API (MODULE LOGIC)
    // -----------------------------

    function _execute(
        address user,
        bytes calldata intentData,
        bytes calldata context
    )
        internal
        virtual
        returns (bytes memory);

    function _simulate(
        address user,
        bytes calldata intentData,
        bytes calldata context
    )
        internal
        view
        virtual
        returns (bytes memory);

    function _estimateCost(
        bytes calldata intentData
    )
        internal
        view
        virtual
        returns (uint256)
    {
        return 0;
    }

    function _supportsIntent(bytes32 intentType)
        internal
        view
        virtual
        returns (bool)
    {
        return false;
    }
}