 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IExecutionModule {
    /// @notice Unique identifier for the module (used in registry + graphs)
    function moduleId() external view returns (bytes32);

    /// @notice Human-readable name (off-chain use, indexing, debugging)
    function name() external view returns (string memory);

    /// @notice Version of the module (enables upgradeability and comparisons)
    function version() external view returns (uint256);

    /// @notice Executes the module logic within an execution graph context
    /// @dev Must return standardized execution output for composition
    function execute(
        address user,
        bytes calldata intentData,
        bytes calldata context
    )
        external
        returns (bytes memory executionResult);

    /// @notice Simulates execution without state mutation (critical for routing optimization)
    function simulate(
        address user,
        bytes calldata intentData,
        bytes calldata context
    )
        external
        view
        returns (bytes memory simulationResult);

    /// @notice Returns execution cost estimate (gas / fees / abstract cost unit)
    function estimateCost(
        bytes calldata intentData
    )
        external
        view
        returns (uint256);

    /// @notice Optional: indicates whether module supports a given intent type
    function supportsIntent(bytes32 intentType) external view returns (bool);
}