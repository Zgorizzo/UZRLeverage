// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.30;

import {ILendingMarketBase} from "./ILendingMarketBase.sol";
import {Id, Market, MarketParams, Position} from "./ILendingMarketBase.sol";

/// @dev This interface is inherited by LendingMarket so that function signatures are checked by the
/// compiler.
/// @dev Consider using the ILendingMarket interface instead of this one.
interface ILendingMarketStaticTyping is ILendingMarketBase {
    /// @notice The state of the position of `user` on the market corresponding to `id`.
    /// @dev Warning: For `feeRecipient`, `supplyShares` does not contain the accrued shares since
    /// the last interest
    /// accrual.
    function position(Id id, address user)
        external
        view
        returns (uint256 supplyShares, uint128 borrowShares, uint128 collateral);

    /// @notice The state of the market corresponding to `id`.
    /// @dev Warning: `totalSupplyAssets` does not contain the accrued interest since the last
    /// interest accrual.
    /// @dev Warning: `totalBorrowAssets` does not contain the accrued interest since the last
    /// interest accrual.
    /// @dev Warning: `totalSupplyShares` does not contain the accrued shares by `feeRecipient`
    /// since the last interest
    /// accrual.
    function market(Id id)
        external
        view
        returns (
            uint128 totalSupplyAssets,
            uint128 totalSupplyShares,
            uint128 totalBorrowAssets,
            uint128 totalBorrowShares,
            uint128 lastUpdate,
            uint128 fee
        );

    /// @notice The constants of the market corresponding to `id`.
    /// @dev Warning: `maturityGracePeriod` is the grace period after the maturity of the bond token, after which
    /// liquidation is allowed. @dev Warning: `liquidationIncentive` is the liquidation incentive factor.
    function marketConstants(Id id) external view returns (uint128 maturityGracePeriod, uint128 liquidationIncentive);

    /// @notice The market params corresponding to `id`.
    /// @dev This mapping is not used in LendingMarket. It is there to enable reducing the cost associated
    /// to calldata on layer
    /// 2s by creating a wrapper contract with functions that take `id` as input instead of
    /// `marketParams`.
    function idToMarketParams(Id id)
        external
        view
        returns (
            address loanToken,
            address collateralToken,
            address oracle,
            address irm,
            uint256 ltv,
            uint256 lltv,
            address whitelist
        );
}

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
