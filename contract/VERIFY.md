# UZRLeverage Contract Verification

## Contract Details

- **Contract Address**: `0x359af289ba865d0860f43c22879c80ab0b817070`
- **Constructor Parameter (user)**: `0x10693e86f2e7151B3010469E33b6C1C2dA8887d6`
- **Encoded Constructor Args**: `0x00000000000000000000000010693e86f2e7151b3010469e33b6c1c2da8887d6`
- **Compiler Version**: `0.8.30`
- **Optimizer**: Enabled with 200 runs
- **Via IR**: false
- **Chain**: Mainnet (Chain ID: 1)

## Verification Command

```bash
forge verify-contract \
  0x359af289ba865d0860f43c22879c80ab0b817070 \
  src/UZRLeverage.sol:UZRLeverage \
  --constructor-args 0x00000000000000000000000010693e86f2e7151b3010469e33b6c1c2da8887d6 \
  --compiler-version 0.8.30 \
  --num-of-optimizations 200 \
  --chain-id 1 \
  --rpc-url $MAINNET_RPC_URL \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --watch
```

## Prerequisites

Before running the verification command, ensure you have:

1. **Environment Variables Set**:
   ```bash
   export MAINNET_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
   export ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"
   ```

2. **Contract Compiled**: Make sure the contract is compiled with the same settings:
   ```bash
   forge build
   ```

3. **Source Files Available**: Ensure `src/UZRLeverage.sol` and all dependencies are in the expected locations.

## Quick Verification Script

You can also use the provided script:

```bash
cd contract
./verify-uzrleverage.sh
```

Make sure to set the required environment variables before running the script.

## Alternative: Using Cast to Encode Constructor Args

If you need to regenerate the constructor args encoding:

```bash
cast abi-encode "constructor(address)" "0x10693e86f2e7151B3010469E33b6C1C2dA8887d6"
```

This outputs: `0x00000000000000000000000010693e86f2e7151b3010469e33b6c1c2da8887d6`

## Verification Settings

The contract was compiled with:
- **Solc Version**: 0.8.30
- **Optimizer Enabled**: Yes
- **Optimizer Runs**: 200
- **Via IR**: No (for this contract)
- **Libraries**: All dependencies from `lib/` directory

## Troubleshooting

If verification fails, check:

1. The contract address matches the deployed contract
2. Constructor arguments are correctly encoded
3. Compiler version matches (0.8.30)
4. Optimizer settings match (200 runs)
5. All source files and dependencies are available
6. The contract was compiled with the same foundry.toml settings
