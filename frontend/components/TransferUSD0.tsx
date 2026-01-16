"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { formatUnits, parseUnits } from "viem";
import { ERC20ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";

interface TransferUSD0Props {
  contractAddress: `0x${string}` | undefined;
}

export function TransferUSD0({ contractAddress }: TransferUSD0Props) {
  const { address } = useAccount();
  const [amount, setAmount] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user's USD0 balance
  const { data: usd0Balance } = useReadContract({
    address: CONTRACT_ADDRESSES.USD0 as `0x${string}`,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
      onSuccess: () => {
        setAmount(""); // Clear amount after successful transfer
        // Invalidate all queries to refetch balances and positions
        queryClient.invalidateQueries();
      },
    });

  const handleTransfer = () => {
    if (!contractAddress || !address || !amount) return;

    const amountNum = parseFloat(amount);
    if (amountNum <= 0 || isNaN(amountNum)) return;

    // Convert to wei (18 decimals)
    const amountWei = parseUnits(amount, 18);

    writeContract({
      address: CONTRACT_ADDRESSES.USD0 as `0x${string}`,
      abi: ERC20ABI,
      functionName: "transfer",
      args: [contractAddress, amountWei],
      account: address,
    });
  };

  // Only show when contract address is set and mounted
  if (!mounted || !contractAddress || !address) {
    return null;
  }

  const userBalance = usd0Balance ? formatUnits(usd0Balance, 18) : "0";
  const hasBalance = parseFloat(userBalance) > 0;

  // Only show button if user has USD0 balance
  if (!hasBalance) {
    return null;
  }

  const amountNum = parseFloat(amount || "0");
  const isValidAmount = amountNum > 0 && amountNum <= parseFloat(userBalance);

  return (
    <div className="mb-8 bg-background-card border border-secondary/30 rounded-xl p-6 shadow-glow-yellow">
      <h3 className="text-xl font-bold text-secondary mb-4 glow-text-secondary">
        Transfer USD0 to Contract
      </h3>
      <p className="text-gray-400 mb-4 text-sm">
        Transfer USD0 from your wallet to the UZRLeverage contract. Your current balance:{" "}
        <span className="text-secondary font-semibold" suppressHydrationWarning>
          {parseFloat(userBalance).toLocaleString(undefined, {
            maximumFractionDigits: 4,
          })}{" "}
          USD0
        </span>
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-secondary font-semibold mb-2">
            Amount (USD0)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.0001"
            max={userBalance}
            className="w-full px-4 py-2 bg-background border border-secondary/50 rounded-lg text-white focus:outline-none focus:border-secondary focus:shadow-glow-yellow"
            placeholder="Enter amount to transfer"
          />
          {amount && (
            <p className="text-gray-400 text-xs mt-1" suppressHydrationWarning>
              Maximum: {parseFloat(userBalance).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}{" "}
              USD0
            </p>
          )}
        </div>

        <button
          onClick={handleTransfer}
          disabled={!isValidAmount || isPending || isConfirming}
          className="w-full px-6 py-3 bg-secondary hover:bg-secondary-dark text-black font-bold rounded-lg transition-all duration-200 shadow-glow-yellow hover:shadow-glow-orange disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-secondary"
        >
          {isPending || isConfirming
            ? "Transferring..."
            : isConfirmed
            ? "Transferred!"
            : "Transfer USD0 to Contract"}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">
            Error: {error.message || "Transfer failed"}
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