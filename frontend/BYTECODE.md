# Getting Contract Bytecode

## What is `0x608060405234801561001057600080fd5b50`?

These are the first bytes of the Solidity contract constructor initialization code. They represent:

- **`0x60806040`** - Solidity metadata prefix
- **`0x52`** - PUSH1 2 (push value 2 onto stack)
- **`0x34`** - CALLVALUE (get msg.value)
- **`0x80`** - DUP1 (duplicate top stack item)
- **`0x15`** - ISZERO (check if value is zero)
- **`0x61 0x0010`** - PUSH2 0x0010 (push 2-byte value 16)
- **`0x57`** - JUMPI (conditional jump if condition is true)
- **`0x600080fd5b50`** - Constructor code body

This is just the **beginning** of the constructor bytecode. For deployment, we need the **complete bytecode** including:
1. Constructor initialization code (starts with these bytes)
2. All constructor parameters encoding
3. Runtime bytecode (the actual contract code)

## How to Get the Full Bytecode

### Method 1: Using Foundry (Recommended)

1. **Compile the contract:**
   ```bash
   cd contract
   forge build
   ```

2. **Extract bytecode using the script:**
   ```bash
   cd ../frontend
   node scripts/get-bytecode.js
   ```

   This will output the full bytecode and a snippet to update `lib/contracts.ts`.

3. **Update `lib/contracts.ts`:**
   Copy the output bytecode string and replace the `UZRLeverageBytecode` constant.

### Method 2: Manual Extraction

1. **Find the artifact:**
   ```
   contract/out/UZRLeverage.sol/UZRLeverage.json
   ```

2. **Extract the `bytecode.object` field:**
   ```bash
   cat contract/out/UZRLeverage.sol/UZRLeverage.json | jq -r '.bytecode.object'
   ```

3. **Copy the output (should start with `0x` and be much longer)**

4. **Update `frontend/lib/contracts.ts`:**
   ```typescript
   export const UZRLeverageBytecode = "0x..." // Your full bytecode here
   ```

### Method 3: Using Forge Script

If you have a deployment script, you can also get it programmatically:

```solidity
// In a Foundry script
bytes memory bytecode = type(UZRLeverage).creationCode;
console.log("Bytecode:");
console.logBytes(bytecode);
```

## Verification

After updating the bytecode, verify:
- ✅ Bytecode starts with `0x`
- ✅ Bytecode length is reasonable (typically several thousand characters for a complex contract)
- ✅ First bytes should include `0x60806040` (Solidity prefix)

## Important Notes

- **`bytecode.object`** = Constructor bytecode (includes constructor args) - Use this for deployment
- **`deployedBytecode.object`** = Runtime bytecode (code stored on-chain) - Don't use this for deployment

Always use `bytecode.object` from the artifact for contract deployment!

## Bytecode Structure

```
Full Bytecode = Constructor Init Code + Constructor Args + Runtime Bytecode
                ↑                        ↑                  ↑
            (0x6080...)          (Encoded params)    (Contract code)
```

For UZRLeverage, the constructor takes one parameter (`address user_`), so the bytecode will encode this address after the initialization prefix.