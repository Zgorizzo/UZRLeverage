"use client";

import { useState, useEffect } from "react";
import { useAccount, useDisconnect, useConnect } from "wagmi";

export function WalletConnect() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Render consistent structure during SSR
  if (!mounted) {
    return (
      <div className="flex items-center gap-4">
        <button
          disabled
          className="px-6 py-2 bg-primary/50 text-black/50 font-bold rounded-lg cursor-not-allowed"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <div className="px-4 py-2 bg-background-card border border-primary/50 rounded-lg">
          <span className="text-primary font-mono text-sm" suppressHydrationWarning>
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-6 py-2 bg-primary hover:bg-primary-dark text-black font-bold rounded-lg transition-all duration-200 shadow-glow-orange hover:shadow-glow-yellow"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => {
          const injected = connectors.find((c) => c.id === "injected");
          if (injected) {
            connect({ connector: injected });
          }
        }}
        className="px-6 py-2 bg-primary hover:bg-primary-dark text-black font-bold rounded-lg transition-all duration-200 shadow-glow-orange hover:shadow-glow-yellow"
      >
        Connect Wallet
      </button>
    </div>
  );
}