"use client";

import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ERC20ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";

interface ContractBalancesProps {
  contractAddress: `0x${string}` | undefined;
}

export function ContractBalances({ contractAddress }: ContractBalancesProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  // Get contract BUSD0 balance
  const { data: busd0Balance, isLoading: isLoadingBusd0 } = useReadContract({
    address: CONTRACT_ADDRESSES.BUSD0 as `0x${string}`,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: contractAddress ? [contractAddress] : undefined,
    query: {
      enabled: !!contractAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  // Get contract USD0 balance
  const { data: usd0Balance, isLoading: isLoadingUsd0 } = useReadContract({
    address: CONTRACT_ADDRESSES.USD0 as `0x${string}`,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: contractAddress ? [contractAddress] : undefined,
    query: {
      enabled: !!contractAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  if (!mounted || !contractAddress) {
    return null;
  }

  const formattedBusd0Balance = busd0Balance ? formatUnits(busd0Balance, 18) : "0";
  const formattedUsd0Balance = usd0Balance ? formatUnits(usd0Balance, 18) : "0";

  if (isLoadingBusd0 || isLoadingUsd0) {
    return (
      <div className="mb-8 bg-background-card border border-primary/30 rounded-xl p-4">
        <h3 className="text-lg font-bold text-primary mb-3">Contract Balances</h3>
        <p className="text-gray-400 text-sm">Loading balances...</p>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-background-card border border-primary/30 rounded-xl p-4">
      <h3 className="text-lg font-bold text-primary mb-3 glow-text">
        Contract Balances
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-background hover border border-primary/30 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">BUSD0 Balance</div>
          <div className="text-primary text-xl font-bold" suppressHydrationWarning>
            {parseFloat(formattedBusd0Balance).toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}{" "}
            BUSD0
          </div>
        </div>

        <div className="p-3 bg-background hover border border-secondary/30 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">USD0 Balance</div>
          <div className="text-secondary text-xl font-bold" suppressHydrationWarning>
            {parseFloat(formattedUsd0Balance).toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}{" "}
            USD0
          </div>
        </div>
      </div>
    </div>
  );
}