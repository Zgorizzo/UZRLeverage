// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.30;

import {Id, MarketParams} from "../interfaces/ILendingMarketBase.sol";

/// @title MarketParamsLib
/// @notice Library for MarketParams operations
library MarketParamsLib {
    /// @notice Computes the market ID from market parameters
    /// @param marketParams The market parameters
    /// @return The market ID
    function id(MarketParams memory marketParams) internal pure returns (Id) {
        return Id.wrap(keccak256(abi.encode(marketParams)));
    }
}
