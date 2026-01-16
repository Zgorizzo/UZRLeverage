"use client";

import { useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import {
  LendingMarketABI,
  ERC20ABI,
  CONTRACT_ADDRESSES,
  MARKET_PARAMS,
} from "@/lib/contracts";

interface UserPositionProps {
  contractAddress: `0x${string}` | undefined;
}

export function UserPosition({ contractAddress }: UserPositionProps) {
  const { address } = useAccount();

  // Get user BUSD0 balance
  const { data: busd0Balance, refetch: refetchBusd0 } = useReadContract({
    address: CONTRACT_ADDRESSES.BUSD0 as `0x${string}`,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  // Get user USD0 balance
  const { data: usd0Balance, refetch: refetchUsd0 } = useReadContract({
    address: CONTRACT_ADDRESSES.USD0 as `0x${string}`,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  // Get user position from lending market
  const { data: position, isLoading, error, refetch: refetchPosition } = useReadContract({
    address: CONTRACT_ADDRESSES.UZR_LENDING_MARKET as `0x${string}`,
    abi: LendingMarketABI,
    functionName: "getUserPosition",
    args: address
      ? [
          {
            loanToken: MARKET_PARAMS.loanToken,
            collateralToken: MARKET_PARAMS.collateralToken,
            oracle: MARKET_PARAMS.oracle,
            irm: MARKET_PARAMS.irm,
            ltv: MARKET_PARAMS.ltv,
            lltv: MARKET_PARAMS.lltv,
            whitelist: MARKET_PARAMS.whitelist,
          },
          address,
        ]
      : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  // Refetch when address or contract address changes
  useEffect(() => {
    if (address) {
      refetchPosition();
      refetchBusd0();
      refetchUsd0();
    }
  }, [address, contractAddress, refetchPosition, refetchBusd0, refetchUsd0]);

  if (!address) {
    return (
      <div className="bg-background-card border border-primary/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-primary mb-4">User Position</h2>
        <p className="text-gray-400">Connect your wallet to view position</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-background-card border border-primary/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-primary mb-4">User Position</h2>
        <p className="text-gray-400">Loading position data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-card border border-red-500/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-red-500 mb-4">User Position</h2>
        <p className="text-red-400">Error loading position: {error.message}</p>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="bg-background-card border border-primary/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-primary mb-4">User Position</h2>
        <p className="text-gray-400">No position found</p>
      </div>
    );
  }

  const [
    supplyAssets,
    supplyShares,
    borrowAssets,
    borrowShares,
    collateralAssets,
  ] = position;

  const formattedSupplyAssets = formatUnits(supplyAssets, 18);
  const formattedBorrowAssets = formatUnits(borrowAssets, 18);
  const formattedCollateralAssets = formatUnits(collateralAssets, 18);

  // Format token balances
  const formattedBusd0Balance = busd0Balance ? formatUnits(busd0Balance, 18) : "0";
  const formattedUsd0Balance = usd0Balance ? formatUnits(usd0Balance, 18) : "0";

  // Calculate health factor (simplified - assuming 88% LTV)
  const collateralValue = parseFloat(formattedCollateralAssets);
  const borrowValue = parseFloat(formattedBorrowAssets);
  const healthFactor =
    borrowValue > 0 ? (collateralValue * 0.88) / borrowValue : Infinity;

  return (
    <div className="bg-background-card border border-primary/30 rounded-xl p-6 shadow-inner-glow">
      <h2 className="text-2xl font-bold text-primary mb-6 glow-text">
        User Position
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-background hover border border-primary/30 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Collateral Assets</div>
            <div className="text-primary text-2xl font-bold">
              {parseFloat(formattedCollateralAssets).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}{" "}
              BUSD0
            </div>
          </div>

          <div className="p-4 bg-background hover border border-primary/30 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Borrow Assets</div>
            <div className="text-secondary text-2xl font-bold">
              {parseFloat(formattedBorrowAssets).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}{" "}
              USD0
            </div>
          </div>

          <div className="p-4 bg-background hover border border-secondary/30 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Supply Assets</div>
            <div className="text-secondary text-lg font-semibold">
              {parseFloat(formattedSupplyAssets).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}{" "}
              USD0
            </div>
          </div>

          <div className="p-4 bg-background hover border border-secondary/30 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Health Factor</div>
            <div
              className={`text-lg font-bold ${
                healthFactor > 1.5
                  ? "text-green-400"
                  : healthFactor > 1.1
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {healthFactor === Infinity
                ? "∞"
                : healthFactor.toFixed(4)}
            </div>
          </div>

          <div className="p-4 bg-background hover border border-primary/30 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Wallet BUSD0 Balance</div>
            <div className="text-primary text-xl font-bold">
              {parseFloat(formattedBusd0Balance).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}{" "}
              BUSD0
            </div>
          </div>

          <div className="p-4 bg-background hover border border-secondary/30 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Wallet USD0 Balance</div>
            <div className="text-secondary text-xl font-bold">
              {parseFloat(formattedUsd0Balance).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}{" "}
              USD0
            </div>
          </div>
        </div>

        <div className="p-4 bg-background hover border border-primary/20 rounded-lg">
          <div className="text-gray-400 text-xs font-mono break-all">
            Contract: {contractAddress || "Not deployed"}
          </div>
          <div className="text-gray-400 text-xs font-mono break-all mt-2">
            User: {address}
          </div>
        </div>
      </div>
    </div>
  );
}