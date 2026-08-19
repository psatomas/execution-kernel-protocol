// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Single shared owner for protocol-governed contracts (ModuleRegistry,
/// IntentRegistry, ScorePolicy, ...), replacing each contract's own hand-rolled
/// owner/onlyOwner. One owner, one place to reason about protocol control.
/// Deliberately not multi-role RBAC — revisit only if different registries
/// genuinely need independent operators.
contract ProtocolRoles {

    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _owner) {
        require(_owner != address(0), "Invalid owner");
        owner = _owner;
    }

    /// @notice Transfers protocol ownership, and with it control of every
    /// contract that defers to isOwner().
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");

        address previousOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(previousOwner, newOwner);
    }

    /// @notice Read-only check other protocol contracts gate their own
    /// onlyOwner logic on, instead of holding their own owner state.
    function isOwner(address account) external view returns (bool) {
        return account == owner;
    }
}
