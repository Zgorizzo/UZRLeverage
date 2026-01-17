"use client";

import { useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { LendingMarketABI, CONTRACT_ADDRESSES } from "@/lib/contracts";

interface AuthorizeContractProps {
  contractAddress: `0x${string}` | undefined;
}

export function AuthorizeContract({ contractAddress }: AuthorizeContractProps) {
  const { address } = useAccount();

  // Check if contract is already authorized
  const { data: authorized, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.UZR_LENDING_MARKET as `0x${string}`,
    abi: LendingMarketABI,
    functionName: "isAuthorized",
    args: address && contractAddress ? [address, contractAddress] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
      refetchInterval: 5000,
    },
  });

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Refetch authorization status after successful transaction
  useEffect(() => {
    if (isConfirmed) {
      refetch();
    }
  }, [isConfirmed, refetch]);

  const handleAuthorize = () => {
    if (!contractAddress || !address) return;

    writeContract({
      address: CONTRACT_ADDRESSES.UZR_LENDING_MARKET as `0x${string}`,
      abi: LendingMarketABI,
      functionName: "setAuthorization",
      args: [contractAddress, true],
      account: address,
    });
  };

  // Only show when contract address is set
  if (!contractAddress) {
    return null;
  }

  // Check authorization status
  const isCurrentlyAuthorized = authorized ?? false;

  return (
    <div className="mb-8 bg-background-card border border-secondary/30 rounded-xl p-6 shadow-glow-yellow">
      <h3 className="text-xl font-bold text-secondary mb-4 glow-text-secondary">
        Contract Authorization
      </h3>
      <p className="text-gray-400 mb-4 text-sm">
        Authorize the UZRLeverage contract to manage positions on your behalf.
        This is required before using leverage or unleverage functions.
      </p>

      <button
        onClick={handleAuthorize}
        disabled={!address || isPending || isConfirming || isCurrentlyAuthorized}
        className="w-full px-6 py-3 bg-secondary hover:bg-secondary-dark text-black font-bold rounded-lg transition-all duration-200 shadow-glow-yellow hover:shadow-glow-orange disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-secondary"
      >
        {isCurrentlyAuthorized
          ? "✓ Contract is Authorized"
          : isPending || isConfirming
          ? "Authorizing..."
          : isConfirmed
          ? "Authorized!"
          : "Authorize Contract"}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">
            Error: {error.message || "Authorization failed"}
          </p>
        </div>
      )}

      {hash && (
        <div className="mt-4 p-4 bg-background hover border border-secondary/30 rounded-lg">
          <p className="text-secondary text-sm font-mono break-all">
            Tx Hash: {hash}
          </p>
        </div>
      )}
    </div>
  );
}