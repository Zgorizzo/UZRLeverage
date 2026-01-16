// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.30;

import {ILendingMarketBase} from "./ILendingMarketBase.sol";
import {Id, Market, MarketParams, Position} from "./ILendingMarketBase.sol";

/// @title ILendingMarket
/// @author Fira Labs
/// @dev Use this interface for LendingMarket to have access to all the functions with the appropriate
/// function signatures.
interface ILendingMarket is ILendingMarketBase {
    /// @notice The state of the position of `user` on the market corresponding to `id`.
    /// @dev Warning: For `feeRecipient`, `p.supplyShares` does not contain the accrued shares since
    /// the last interest
    /// accrual.
    function position(Id id, address user) external view returns (Position memory p);

    /// @notice The state of the market corresponding to `id`.
    /// @dev Warning: `m.totalSupplyAssets` does not contain the accrued interest since the last
    /// interest accrual.
    /// @dev Warning: `m.totalBorrowAssets` does not contain the accrued interest since the last
    /// interest accrual.
    /// @dev Warning: `m.totalSupplyShares` does not contain the accrued shares by `feeRecipient`
    /// since the last
    /// interest accrual.
    function market(Id id) external view returns (Market memory m);

    /// @notice The market params corresponding to `id`.
    /// @dev This mapping is not used in LendingMarket. It is there to enable reducing the cost associated
    /// to calldata on layer
    /// 2s by creating a wrapper contract with functions that take `id` as input instead of
    /// `marketParams`.
    function idToMarketParams(Id id) external view returns (MarketParams memory);
}
