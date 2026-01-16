// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.30;

/// @notice Permit2 IAllowanceTransfer interface (minimal version for approve function)
interface IAllowanceTransfer {
    function approve(address token, address spender, uint160 amount, uint48 expiration) external;
}
