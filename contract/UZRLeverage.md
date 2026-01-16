# UZRLeverage Contract

## ⚠️ DISCLAIMER

**EXPERIMENTAL SOFTWARE - USE AT YOUR OWN RISK**

This software is experimental and has not been audited. It is provided "as is" without warranty of any kind. Use of this software may result in financial loss. The authors and contributors are not responsible for any losses, damages, or liabilities that may arise from the use of this software. **You use this software at your own risk.**

## Overview

The `UZRLeverage` contract enables recursive leverage and deleverage operations on the UZR Lending Market. It automates the process of supplying collateral, borrowing assets, and swapping between BUSD0 (collateral) and USD0 (loan token) using Uniswap Universal Router V4 to amplify or reduce leverage positions.

### Key Features

- **Recursive Leveraging**: Automatically performs multiple iterations of supplying collateral, borrowing, and swapping to increase leverage
- **Recursive Unleveraging**: Systematically repays debt, withdraws collateral, and swaps to reduce leverage
- **User Management**: Two-step user change process with pending user confirmation
- **Emergency Withdraw**: Allows users to withdraw remaining tokens from the contract
- **Slippage Protection**: Built-in slippage protection for Uniswap swaps
- **Authorization-Based Security**: All operations require explicit user authorization

## Technical Architecture

### Dependencies

- **Solidity**: `^0.8.30`
- **UZR Lending Market**: Interface for lending/borrowing operations
- **Uniswap Universal Router V4**: For token swaps with Permit2 integration
- **Permit2**: Standard token approval mechanism for Uniswap operations
- **OpenZeppelin SafeERC20**: Safe token transfer operations
- **MathLib**: Custom math library for precision calculations

### Contract Constants

All protocol addresses and parameters are hardcoded as constants:

```solidity
address constant UZR_LENDING_MARKET = 0xa428723eE8ffD87088C36121d72100B43F11fb6A;
address constant BUSD0 = 0x35D8949372D46B7a3D5A56006AE77B215fc69bC0;  // Collateral token
address constant USD0 = 0x73A15FeD60Bf67631dC6cd7Bc5B6e8da8190aCF5;    // Loan token
address constant ORACLE = 0x30Da78355FcEA04D1fa34AF3c318BE203C6F2145;
address constant IRM = 0xdfCF197B0B65066183b04B88d50ACDC0C4b01385;      // Interest Rate Model
address constant WHITELIST = 0xFE7C47895eDb12a990b311Df33B90Cfea1D44c24;
address constant UNISWAP_V4_SWAP_ROUTER = 0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af;
uint24 constant POOL_FEE = 100;  // 0.01% fee tier
address constant PERMIT2_ADDRESS = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
```

### Market Parameters

The contract operates on a fixed market with the following parameters:

```solidity
MarketParams({
    loanToken: USD0,              // 0x73A15FeD60Bf67631dC6cd7Bc5B6e8da8190aCF5
    collateralToken: BUSD0,       // 0x35D8949372D46B7a3D5A56006AE77B215fc69bC0
    oracle: ORACLE,               // 0x30Da78355FcEA04D1fa34AF3c318BE203C6F2145
    irm: IRM,                     // 0xdfCF197B0B65066183b04B88d50ACDC0C4b01385
    ltv: 88e16,                   // 88% Loan-to-Value ratio (0.88)
    lltv: 0.9999e18,              // Liquidation Loan-to-Value ratio (99.99%)
    whitelist: WHITELIST          // 0xFE7C47895eDb12a990b311Df33B90Cfea1D44c24
})
```

**Market ID**: `0xA597B5A36F6CC0EDE718BA58B2E23F5C747DA810BF8E299022D88123AB03340E`

## Deployment

The contract constructor takes a single parameter:

```solidity
constructor(address user_)
```

### Constructor Behavior

During deployment, the contract automatically:

1. **Sets the initial user**: Stores the user address that will control the contract
2. **Approves Lending Market**: Grants unlimited approval to the lending market for both BUSD0 and USD0
3. **Approves Permit2**: Grants unlimited ERC20 approval to Permit2 for both tokens
4. **Sets Permit2 Allowances**: Configures Permit2 allowances for the Universal Router with:
   - Maximum amount (`type(uint160).max`)
   - Maximum expiration (`type(uint48).max`)

This eliminates the need for manual token approvals after deployment.

### Example Deployment

```solidity
address user = 0xYourAddress;
UZRLeverage leverageContract = new UZRLeverage(user);
```

## Features

### 1. Leverage Position

The `leveragePosition` function executes recursive leverage operations to amplify a position.

#### Function Signature

```solidity
function leveragePosition(uint256 iterations) external
```

#### Parameters

- `iterations` (uint256): Number of leverage iterations to perform (must be > 0)

#### Execution Flow

1. **Authorization Check**: Verifies the contract is authorized by the user on the lending market
2. **Swap Existing USD0**: If the contract holds USD0, swaps it to BUSD0 first
3. **Iteration Loop**: For each iteration:
   - Checks if sufficient BUSD0 is available (> 1e18 wei minimum)
   - Supplies BUSD0 as collateral on behalf of the user
   - Calculates borrow amount: `(collateralValue * (LTV - 0.01))` (87% effective to prevent edge cases)
   - Borrows USD0 from the lending market
   - Swaps borrowed USD0 for BUSD0 on Uniswap
   - Continues with the newly acquired BUSD0

#### Technical Details

- **Borrow Calculation**: Uses oracle price to convert collateral amount to value, then applies LTV with a 1% buffer
- **Early Termination**: Stops if BUSD0 balance falls below 1e18 wei
- **Slippage Protection**: Swaps include 0.5% minimum output protection (`amountIn * 995 / 1000`)
- **Swap Path**: `USD0 -> BUSD0` through Uniswap V3 pool with 0.01% fee tier
- **Deadline**: 5 minutes from current block timestamp

#### Example Usage

```solidity
// Transfer BUSD0 or USD0 to the contract first
IERC20(busd0).transfer(address(leverageContract), amount);

// Authorize the contract
lendingMarket.setAuthorization(address(leverageContract), true);

// Execute 3 leverage iterations
leverageContract.leveragePosition(3);
```

### 2. Unleverage Position

The `unleveragePosition` function systematically reduces leverage by repaying debt and withdrawing collateral.

#### Function Signature

```solidity
function unleveragePosition(uint256 iterations) external
```

#### Parameters

- `iterations` (uint256): Number of deleverage iterations to perform (must be > 0)

#### Execution Flow

1. **Authorization Check**: Verifies the contract is authorized by the user
2. **Iteration Loop**: For each iteration:
   - Checks available USD0 balance in the contract
   - Compares with user's debt position; caps USD0 used at debt amount minus 1 wei
   - Repays debt using USD0
   - Calculates collateral to withdraw: `debtRepaid * 100 / 88` (inverse of LTV)
   - Withdraws collateral from the lending market
   - Swaps withdrawn BUSD0 for USD0 on Uniswap
   - Continues with the newly acquired USD0

#### Technical Details

- **Debt Cap**: If contract USD0 balance exceeds debt, uses `debt - 1` to avoid over-repayment
- **Collateral Calculation**: Assumes 88% LTV relationship: `collateral = debt / 0.88`
- **Slippage Protection**: Swaps use 10% minimum output protection (`amountInValue * 900 / 1000`) based on oracle price
- **Swap Path**: `BUSD0 -> USD0` through Uniswap V3 pool with 0.01% fee tier
- **Early Termination**: Stops if USD0 balance falls below 1e18 wei

#### Example Usage

```solidity
// Transfer USD0 to the contract to repay debt
IERC20(usd0).transfer(address(leverageContract), amount);

// Execute 5 deleverage iterations
leverageContract.unleveragePosition(5);
```

### 3. User Management

The contract implements a two-step user change process for security.

#### Change User (Initiate)

```solidity
function changeUser(address newUser) external
```

- **Access Control**: Only current user can initiate
- **Effect**: Sets `pendingUser` to the new address
- **User Not Changed**: Current user remains unchanged until confirmation

#### Confirm Change User

```solidity
function confirmChangeUser() external
```

- **Access Control**: Only pending user can confirm
- **Effect**: 
  - Sets `user` to `pendingUser`
  - Resets `pendingUser` to `address(0)`
- **Security**: Prevents unauthorized user changes

#### Example Usage

```solidity
// Step 1: Current user initiates change
vm.prank(USER);
leverageContract.changeUser(NEW_USER);

// Step 2: New user confirms
vm.prank(NEW_USER);
leverageContract.confirmChangeUser();
```

### 4. Emergency Withdraw

Allows the user to withdraw any remaining tokens from the contract.

#### Function Signature

```solidity
function emergencyWithdraw(address token, uint256 amount) external
```

#### Parameters

- `token` (address): Token contract address to withdraw
- `amount` (uint256): Amount to withdraw (0 = withdraw all balance)

#### Access Control

- Only the current user can call this function

#### Example Usage

```solidity
// Withdraw all BUSD0
leverageContract.emergencyWithdraw(address(busd0), 0);

// Withdraw specific amount of USD0
leverageContract.emergencyWithdraw(address(usd0), 100e18);
```

### 5. Pool Fee Getter

```solidity
function poolFee() external pure returns (uint24)
```

Returns the Uniswap pool fee tier (100 = 0.01%).

## Prerequisites

Before using the contract, users must complete the following:

### 1. Transfer Tokens to Contract

The contract needs tokens to operate. Users should transfer either:
- **BUSD0**: For leverage operations
- **USD0**: For unleverage operations or initial swap

```solidity
// Transfer BUSD0 to contract
IERC20(busd0).transfer(address(leverageContract), amount);

// Or transfer USD0 to contract
IERC20(usd0).transfer(address(leverageContract), amount);
```

**Note**: The contract does NOT require ERC20 approvals from users. It uses Permit2 with pre-approved allowances.

### 2. Authorize Contract on Lending Market

The contract must be authorized to manage positions on behalf of the user:

```solidity
lendingMarket.setAuthorization(address(leverageContract), true);
```

**Critical**: This authorization is checked at the beginning of `leveragePosition` and `unleveragePosition` functions. Operations will revert if not authorized.

## Technical Implementation Details

### Swap Implementation

#### Leverage Swap (USD0 -> BUSD0)

- **Command**: `V3_SWAP_EXACT_IN`
- **Path**: `USD0 (20 bytes) + POOL_FEE (3 bytes) + BUSD0 (20 bytes)`
- **Minimum Output**: `amountIn * 995 / 1000` (0.5% slippage tolerance)
- **Payer**: Contract itself (via Permit2)
- **Recipient**: Contract address
- **Deadline**: `block.timestamp + 300` (5 minutes)

#### Unleverage Swap (BUSD0 -> USD0)

- **Command**: `V3_SWAP_EXACT_IN`
- **Path**: `BUSD0 (20 bytes) + POOL_FEE (3 bytes) + USD0 (20 bytes)`
- **Price Calculation**: Uses oracle price to determine expected USD0 output
- **Minimum Output**: `(amountIn * oraclePrice / ORACLE_PRICE_SCALE) * 900 / 1000` (10% slippage tolerance)
- **Payer**: Contract itself (via Permit2)
- **Recipient**: Contract address
- **Deadline**: `block.timestamp + 300` (5 minutes)

### Borrow Calculation

During leverage iterations, the borrow amount is calculated as:

```solidity
collateralPrice = oracle.price();
collateralValue = collateralAmount * collateralPrice / ORACLE_PRICE_SCALE;
borrowAmount = collateralValue * (marketParams.ltv - 1e16) / 1e18;
```

The 1e16 subtraction (1%) provides a safety buffer to prevent potential edge cases with LTV limits.

### Withdrawal Calculation

During unleverage iterations, the collateral withdrawal amount is calculated as:

```solidity
assetsToBeWithdrawn = debtRepaid * 100 / 88;
```

This assumes the position was created with 88% LTV, allowing withdrawal of the full collateral backing the repaid debt.

## Security Considerations

### Access Control

- **User-Only Functions**: `leveragePosition`, `unleveragePosition`, `emergencyWithdraw`, and `changeUser` can only be called by the current user
- **Authorization Checks**: Leverage/unleverage operations verify lending market authorization before execution
- **Two-Step User Change**: Prevents unauthorized user changes

### Slippage Protection

- **Leverage Swaps**: 0.5% minimum output protection
- **Unleverage Swaps**: 10% minimum output protection (more conservative due to oracle-based calculation)
- **Transaction Deadlines**: All swaps include 5-minute deadline to prevent stale transactions

### Token Safety

- **SafeERC20**: All token transfers use OpenZeppelin's SafeERC20 library
- **Balance Checks**: Functions verify sufficient balances before operations
- **Early Termination**: Loops stop if insufficient tokens are available

### Interest Rate Risk

- Borrowed amounts accrue interest over time, increasing the debt position
- Users should monitor their health factor and avoid liquidation
- The contract does not include automatic liquidation protection

### Oracle Risk

- Borrow calculations and unleverage swap calculations depend on oracle prices
- Oracle manipulation or stale prices could affect calculations
- Users should verify oracle prices before large operations

## Testing

The contract includes comprehensive fork tests that verify:

- **Contract Deployment**: Correct initialization of all constants and approvals
- **Leverage Operations**: Multiple iterations with position verification
- **Unleverage Operations**: Debt repayment and collateral withdrawal
- **User Management**: Two-step user change process
- **Position Tracking**: Verification of lending market positions before and after operations
- **Prerequisites**: Checks for authorization and token balances

### Test Coverage

- `test_ContractDeployment`: Verifies all contract state variables
- `testFuzz_LeverageIterations`: Fuzz tests leverage with 1-1000 iterations
- `testFuzz_UnleverageIterations`: Fuzz tests unleverage with 1-1000 iterations
- `testFuzz_LeverageIterationTwice`: Tests sequential leverage calls
- `test_ChangeUser`: Tests user change workflow
- `test_CheckPrerequisites`: Validates setup requirements

## Important Notes

1. **Token Approvals**: The contract handles all token approvals internally. Users only need to transfer tokens and authorize the contract on the lending market.

2. **No Reentrancy Protection**: The contract does not include explicit reentrancy guards. It relies on external contract behavior and should be audited for reentrancy risks.

3. **Gas Costs**: Multiple iterations in a single transaction can be expensive. Consider gas costs when choosing iteration count.

4. **Market Liquidity**: Operations require sufficient liquidity in:
   - Lending market (for borrowing)
   - Uniswap pool (for swapping)

5. **Iteration Limits**: The contract stops early if token balances become too low (< 1e18 wei), preventing dust accumulation.

6. **Position Management**: The contract manages positions on behalf of users. Users retain full ownership but delegate management authority through authorization.

7. **Oracle Dependency**: Price calculations depend on the oracle contract. Verify oracle is functioning correctly before operations.

## Integration Example

```solidity
// 1. Deploy contract
UZRLeverage leverage = new UZRLeverage(userAddress);

// 2. User transfers tokens
IERC20(busd0).transfer(address(leverage), 1000e18);

// 3. User authorizes contract
lendingMarket.setAuthorization(address(leverage), true);

// 4. Execute leverage
leverage.leveragePosition(5);

// 5. Later, when ready to deleverage
IERC20(usd0).transfer(address(leverage), repaymentAmount);
leverage.unleveragePosition(5);

// 6. Withdraw remaining tokens if needed
leverage.emergencyWithdraw(address(busd0), 0);
leverage.emergencyWithdraw(address(usd0), 0);
```
