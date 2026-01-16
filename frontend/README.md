# UZR Leverage Frontend

A Next.js frontend for interacting with the UZRLeverage contract, featuring a futuristic dark theme with orange and yellow accents.

## ⚠️ DISCLAIMER

**EXPERIMENTAL SOFTWARE - USE AT YOUR OWN RISK**

This software is experimental and has not been audited. It is provided "as is" without warranty of any kind. Use of this software may result in financial loss. The authors and contributors are not responsible for any losses, damages, or liabilities that may arise from the use of this software. **You use this software at your own risk.**

## Features

- **Wallet Connection**: Connect using injected wallets like Rabby, MetaMask, etc.
- **Contract Deployment**: Deploy new UZRLeverage contracts directly from the UI
- **Leverage Operations**: Execute leverage positions with configurable iterations
- **Unleverage Operations**: Reduce leverage positions with configurable iterations
- **Position Display**: View real-time user position data from the lending market

## Prerequisites

- Node.js 18+ and npm/yarn
- A Web3 wallet (Rabby, MetaMask, etc.)
- Access to Ethereum Mainnet

## Installation

```bash
cd frontend
npm install
```

## Configuration

### Contract Bytecode

The frontend requires the compiled bytecode of the UZRLeverage contract. To get the bytecode:

1. Compile the contract using Foundry:
   ```bash
   cd ../contract
   forge build
   ```

2. Extract the bytecode from the artifact and update `lib/contracts.ts`:
   ```typescript
   export const UZRLeverageBytecode = "0x..." // Your compiled bytecode
   ```

**Note**: Until the bytecode is added, you can manually enter a deployed contract address in the UI.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection
2. **Deploy or Connect Contract**:
   - Option A: Deploy a new contract (requires bytecode configuration)
   - Option B: Enter an existing contract address manually
3. **View Position**: Your position data will automatically load and update
4. **Leverage/Unleverage**: Enter the number of iterations and execute transactions

## Important Notes

### Contract Authorization

Before leveraging or unleveraging, you must authorize the contract on the lending market:

```solidity
lendingMarket.setAuthorization(contractAddress, true);
```

This can be done directly through the lending market interface or programmatically.

### Token Transfers

Before leveraging, ensure you have transferred BUSD0 or USD0 to the contract:

```solidity
IERC20(busd0).transfer(contractAddress, amount);
// or
IERC20(usd0).transfer(contractAddress, amount);
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main page component
│   ├── providers.tsx       # Wagmi and React Query providers
│   └── globals.css         # Global styles and theme
├── components/
│   ├── WalletConnect.tsx   # Wallet connection component
│   ├── DeployContract.tsx  # Contract deployment component
│   ├── LeverageControl.tsx # Leverage operation component
│   ├── UnleverageControl.tsx # Unleverage operation component
│   └── UserPosition.tsx    # Position display component
├── lib/
│   └── contracts.ts        # Contract ABIs, addresses, and config
└── package.json
```

## Theme

The UI features a futuristic theme with:
- **Background**: Black (#000000)
- **Primary Color**: Orange (#FF6B35)
- **Secondary Color**: Yellow/Gold (#FFD700)
- **Effects**: Glowing borders, cyber grid background, animated shadows

## Build

```bash
npm run build
npm start
```

## License

Same as the main project.