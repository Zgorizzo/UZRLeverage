// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.30;

import {IAllowanceTransfer} from "./interfaces/IAllowanceTransfer.sol";
import {ILendingMarket} from "./interfaces/ILendingMarket.sol";
import {MarketParams} from "./interfaces/ILendingMarketBase.sol";
import {IOracle} from "./interfaces/IOracle.sol";
import {ORACLE_PRICE_SCALE} from "./libraries/ConstantsLib.sol";
import {MathLib} from "./libraries/MathLib.sol";
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IUniversalRouter} from "@universal-router/interfaces/IUniversalRouter.sol";
import {Commands} from "@universal-router/libraries/Commands.sol";

/// @title UZRLeverage
/// @notice Contract to leverage a position on UZRLendingMarket by recursively supplying collateral and borrowing
contract UZRLeverage {
    using SafeERC20 for IERC20;
    using MathLib for uint256;

    /// @notice Permit2 address constant (same on all chains)
    address private _PERMIT2_ADDRESS = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    address constant _UZR_LENDING_MARKET = 0xa428723eE8ffD87088C36121d72100B43F11fb6A;
    address constant _BUSD0 = 0x35D8949372D46B7a3D5A56006AE77B215fc69bC0;
    address constant _USD0 = 0x73A15FeD60Bf67631dC6cd7Bc5B6e8da8190aCF5;
    address constant _ORACLE = 0x30Da78355FcEA04D1fa34AF3c318BE203C6F2145;
    address constant _IRM = 0xdfCF197B0B65066183b04B88d50ACDC0C4b01385;
    address constant _WHITELIST = 0xFE7C47895eDb12a990b311Df33B90Cfea1D44c24;
    address constant _UNISWAP_V4_SWAP_ROUTER = 0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af;
    uint24 constant _POOL_FEE = 100; // 0.01% fee tier (based on successful swap transaction)
    /// @notice Permit2 interface
    IAllowanceTransfer private _PERMIT2 = IAllowanceTransfer(_PERMIT2_ADDRESS);
    IUniversalRouter private _universalRouter = IUniversalRouter(_UNISWAP_V4_SWAP_ROUTER);

    ILendingMarket public immutable lendingMarket = ILendingMarket(_UZR_LENDING_MARKET);
    address public user;
    address public pendingUser;
    MarketParams public marketParams = MarketParams({
        loanToken: _USD0,
        collateralToken: _BUSD0,
        oracle: _ORACLE,
        irm: _IRM,
        ltv: 88e16,
        lltv: 0.9999e18,
        whitelist: _WHITELIST
    });
    IERC20 public immutable busd0 = IERC20(_BUSD0);
    IERC20 public immutable usd0 = IERC20(_USD0);
    IOracle public immutable oracle = IOracle(_ORACLE);

    constructor(address user_) {
        user = user_;

        // Approve lending market to spend tokens
        busd0.approve(address(lendingMarket), type(uint256).max);
        usd0.approve(address(lendingMarket), type(uint256).max);

        // Approve Permit2 to spend tokens (standard ERC20 approval)
        // Permit2 address is the same on all chains: 0x000000000022D473030F116dDEE9F6B43aC78BA3
        busd0.approve(_PERMIT2_ADDRESS, type(uint256).max);
        usd0.approve(_PERMIT2_ADDRESS, type(uint256).max);

        // Set up Permit2 allowances for Universal Router
        // Permit2 requires both ERC20 approval AND a Permit2 allowance with expiration
        // We set expiration to max uint48 (far future) and amount to max uint160 (unlimited)
        uint48 expiration = type(uint48).max; // Far future expiration
        uint160 maxAmount = type(uint160).max; // Unlimited amount

        _PERMIT2.approve(address(busd0), address(_universalRouter), maxAmount, expiration);
        _PERMIT2.approve(address(usd0), address(_universalRouter), maxAmount, expiration);
    }

    /// @notice Leverages the user's position by getting all BUSD0, supplying as collateral, borrowing 88%, swapping,
    /// and repeating @dev IMPORTANT: User must authorize this contract via
    /// lendingMarket.setAuthorization(address(this), true) before calling
    /// @param iterations Number of leverage iterations to perform
    function leveragePosition(uint256 iterations) external {
        // only user can call this function
        require(msg.sender == user, "UZRLeverage: only user can call this function");
        require(iterations > 0, "UZRLeverage: iterations must be > 0");

        // Check authorization
        require(
            lendingMarket.isAuthorized(user, address(this)),
            "UZRLeverage: contract not authorized. Call lendingMarket.setAuthorization(address(this), true)"
        );

        // Swap any existing USD0 to BUSD0 first (if any)
        uint256 usd0Balance = usd0.balanceOf(address(this));
        if (usd0Balance > 0) {
            _swapUsd0ToBusd0(usd0Balance);
        }

        // Get all BUSD0 balance from user
        uint256 busd0Balance = busd0.balanceOf(address(this));
        require(busd0Balance > 0, "UZRLeverage: no BUSD0 balance");

        // Perform leverage iterations
        for (uint256 i = 0; i < iterations; i++) {
            // Get new balance after swap for next iteration
            busd0Balance = busd0.balanceOf(address(this));
            if (busd0Balance <= 1e18) break; // Stop if no more BUSD0
            _leverageIteration(busd0Balance);
        }
    }

    /// @notice Performs a single leverage iteration: supply collateral, borrow, swap
    /// @param collateralAmount Amount of BUSD0 to supply as collateral
    function _leverageIteration(uint256 collateralAmount) internal {
        // 1. Supply collateral (no authorization needed)
        lendingMarket.supplyCollateral(marketParams, collateralAmount, user, "");

        // 2. Calculate borrow amount (88% of collateral value using LTV)
        uint256 collateralPrice = oracle.price();
        uint256 collateralValue = collateralAmount.mulDivDown(collateralPrice, ORACLE_PRICE_SCALE);
        uint256 borrowAmount = collateralValue.mulDivDown(marketParams.ltv - 1e16, 1e18);

        // Ensure we have liquidity to borrow
        if (borrowAmount <= 1e18) return;
        // 3. Borrow USD0 (requires authorization)
        lendingMarket.borrow(marketParams, borrowAmount, 0, user, address(this));

        // 4. Swap USD0 for BUSD0 on Uniswap
        uint256 usd0Balance = usd0.balanceOf(address(this));
        if (usd0Balance > 0) {
            _swapUsd0ToBusd0(usd0Balance);
        }
    }

    function unleveragePosition(uint256 iterations) external {
        require(msg.sender == user, "UZRLeverage: only user can call this function");
        require(iterations > 0, "UZRLeverage: iterations must be > 0");

        // Check authorization
        require(lendingMarket.isAuthorized(user, address(this)), "UZRLeverage: contract not authorized");
        uint256 usd0Balance;
        // Perform leverage iterations
        for (uint256 i = 0; i < iterations; i++) {
            // Get new balance after swap for next iteration
            usd0Balance = usd0.balanceOf(address(this));
            (,, uint256 borrowAssets,,) = lendingMarket.getUserPosition(marketParams, user);

            if (usd0Balance > borrowAssets) {
                usd0Balance = borrowAssets - 1;
            }
            if (usd0Balance <= 1e18) break; // Stop debt repayment if no more USD0
            _unleveragePosition(usd0Balance);
        }
    }

    /// @notice unleverage position: repay debt, withdraw collateral, swap
    function _unleveragePosition(uint256 debtAmount) internal {
        // get user debt position on this market
        // 1. Repay debt (requires authorization)
        (uint256 debtRepaid,) = lendingMarket.repay(marketParams, debtAmount, 0, user, hex"");
        // knowing that the debt was repaid, we can withdraw the collateral
        // the debt is 88% of the collateral, so we can withdraw 100% of the collateral
        uint256 assetsToBeWithdrawn = debtRepaid.mulDivDown(100, 88);
        // 2. Withdraw collateral
        lendingMarket.withdrawCollateral(marketParams, assetsToBeWithdrawn, user, address(this));

        // 3. Swap BUSD0 for USD0 on Uniswap
        uint256 busd0Balance = busd0.balanceOf(address(this));
        if (busd0Balance > 0) {
            _swapBusd0ToUsd0(busd0Balance);
        }
    }

    /// @notice Swaps BUSD0 for USD0 on Uniswap Universal Router using Permit2
    function _swapBusd0ToUsd0(uint256 amountIn) internal {
        require(amountIn > 0, "UZRLeverage: zero swap amount");
        uint256 balance = busd0.balanceOf(address(this));
        require(balance >= amountIn, "UZRLeverage: insufficient BUSD0 balance");

        bytes memory path = abi.encodePacked(address(busd0), _POOL_FEE, address(usd0));
        // divide the amountIn by the Busd0/USD0 price to get the right expected amount out

        uint256 collateralPrice = oracle.price();
        uint256 amountInValueInCollateral = amountIn.mulDivDown(collateralPrice, ORACLE_PRICE_SCALE);
        bytes memory input =
            abi.encode(address(this), amountIn, amountInValueInCollateral.mulDivDown(900, 1000), path, true);
        bytes memory commands = abi.encodePacked(uint8(Commands.V3_SWAP_EXACT_IN));
        bytes[] memory inputs = new bytes[](1);
        inputs[0] = input;
        _universalRouter.execute(commands, inputs, block.timestamp + 300);
    }

    /// @notice Swaps USD0 for BUSD0 on Uniswap Universal Router using Permit2
    /// @param amountIn Amount of USD0 to swap
    /// @dev This function uses V3_SWAP_EXACT_IN with Permit2. When payerIsUser=true, the router
    ///      uses Permit2 to pull tokens from this contract (which must have approved Permit2).
    function _swapUsd0ToBusd0(uint256 amountIn) internal {
        require(amountIn > 0, "UZRLeverage: zero swap amount");

        // Ensure we have enough balance
        uint256 balance = usd0.balanceOf(address(this));
        require(balance >= amountIn, "UZRLeverage: insufficient USD0 balance");

        /*  // Ensure Permit2 has sufficient allowance (approved in constructor, but check anyway)
         uint256 allowance = usd0.allowance(address(this), PERMIT2_ADDRESS);
         if (allowance < amountIn) {
             usd0.approve(PERMIT2_ADDRESS, type(uint256).max);
         } */

        // Encode the V3 path: tokenIn (20 bytes) + fee (3 bytes) + tokenOut (20 bytes)
        bytes memory path = abi.encodePacked(address(usd0), _POOL_FEE, address(busd0));

        // Encode the input parameters for V3_SWAP_EXACT_IN:
        // recipient (address), amountIn (uint256), amountOutMin (uint256), path (bytes), payerIsUser (bool)
        bytes memory input = abi.encode(
            address(this), // recipient
            amountIn, // amountIn
            amountIn.mulDivDown(995, 1000), // amountMin
            path, // path
            true // payerIsUser (true means router uses Permit2 to pull from this contract)
        );

        // Create commands array with V3_SWAP_EXACT_IN command
        bytes memory commands = abi.encodePacked(uint8(Commands.V3_SWAP_EXACT_IN));
        bytes[] memory inputs = new bytes[](1);
        inputs[0] = input;

        // Execute the swap with 5 minute deadline
        // The router will use Permit2 to pull USD0 from this contract
        _universalRouter.execute(commands, inputs, block.timestamp + 300);
    }

    /// @notice Emergency function to withdraw any remaining tokens
    /// @param token Token to withdraw
    /// @param amount Amount to withdraw (0 = all)
    function emergencyWithdraw(address token, uint256 amount) external {
        require(msg.sender == user, "UZRLeverage: only user");
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        uint256 withdrawAmount = amount == 0 ? balance : amount;
        require(withdrawAmount <= balance, "UZRLeverage: insufficient balance");
        tokenContract.safeTransfer(user, withdrawAmount);
    }

    /// @notice priviledged function to change the user. Will need a confirmation from the user to change the user.
    function changeUser(address newUser) external {
        require(msg.sender == user, "UZRLeverage: only current user can call this function");
        pendingUser = newUser;
    }

    /// @notice confirm the change of user
    function confirmChangeUser() external {
        require(msg.sender == pendingUser, "UZRLeverage: only pending user can call this function");
        user = pendingUser;
        pendingUser = address(0);
    }

    ///getter for POOL_FEE
    function poolFee() external pure returns (uint24) {
        return _POOL_FEE;
    }
}
