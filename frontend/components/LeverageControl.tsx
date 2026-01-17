"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { UZRLeverageABI } from "@/lib/contracts";

interface LeverageControlProps {
  contractAddress: `0x${string}` | undefined;
}

export function LeverageControl({ contractAddress }: LeverageControlProps) {
  const { address } = useAccount();
  const [iterations, setIterations] = useState<string>("1");
  const queryClient = useQueryClient();

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Invalidate all queries to refetch user position and balances after successful transaction
  useEffect(() => {
    if (isConfirmed) {
      queryClient.invalidateQueries();
    }
  }, [isConfirmed, queryClient]);

  const handleLeverage = async () => {
    if (!contractAddress || !address || !iterations) return;

    const iterationsNum = BigInt(parseInt(iterations) || 1);
    if (iterationsNum <= 0n) return;

    // Calculate gas linearly with iterations
    // Base gas: 250,000 + (120,000 per iteration)
    const baseGas = 250000n;
    const perIterationGas = 120000n;
    const calculatedGas = baseGas + (iterationsNum * perIterationGas);

    writeContract({
      address: contractAddress,
      abi: UZRLeverageABI,
      functionName: "leveragePosition",
      args: [iterationsNum],
      account: address,
      gas: calculatedGas,
    });
  };

  return (
    <div className="bg-background-card border border-primary/30 rounded-xl p-6 shadow-glow-orange">
      <h2 className="text-2xl font-bold text-primary mb-4 glow-text">
        Leverage Position
      </h2>
      <p className="text-gray-400 mb-6 text-sm">
        Increase your leverage by recursively supplying collateral and borrowing
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-secondary font-semibold mb-2">
            Iterations
          </label>
          <input
            type="number"
            value={iterations}
            onChange={(e) => setIterations(e.target.value)}
            min="1"
            className="w-full px-4 py-2 bg-background border border-primary/50 rounded-lg text-white focus:outline-none focus:border-primary focus:shadow-glow-orange"
            placeholder="Number of leverage iterations"
          />
        </div>

        <button
          onClick={handleLeverage}
          disabled={!contractAddress || !address || isPending || isConfirming}
          className="w-full px-6 py-3 bg-primary hover:bg-primary-dark text-black font-bold rounded-lg transition-all duration-200 shadow-glow-orange hover:shadow-glow-yellow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
        >
          {isPending || isConfirming
            ? "Processing..."
            : isConfirmed
            ? "Success!"
            : "Leverage Position"}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">
            Error: {error.message || "Transaction failed"}
          </p>
        </div>
      )}

      {hash && (
        <div className="mt-4 p-4 bg-background hover border border-primary/30 rounded-lg">
          <p className="text-primary text-sm font-mono break-all">
            Tx Hash: {hash}
          </p>
        </div>
      )}
    </div>
  );
}