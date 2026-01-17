"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { UZRLeverageABI } from "@/lib/contracts";

interface UnleverageControlProps {
  contractAddress: `0x${string}` | undefined;
}

export function UnleverageControl({ contractAddress }: UnleverageControlProps) {
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

  const handleUnleverage = async () => {
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
      functionName: "unleveragePosition",
      args: [iterationsNum],
      account: address,
      gas: calculatedGas,
    });
  };

  return (
    <div className="bg-background-card border border-secondary/30 rounded-xl p-6 shadow-glow-yellow">
      <h2 className="text-2xl font-bold text-secondary mb-4 glow-text-secondary">
        Unleverage Position
      </h2>
      <p className="text-gray-400 mb-6 text-sm">
        Reduce your leverage by repaying debt and withdrawing collateral
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
            className="w-full px-4 py-2 bg-background border border-secondary/50 rounded-lg text-white focus:outline-none focus:border-secondary focus:shadow-glow-yellow"
            placeholder="Number of unleverage iterations"
          />
        </div>

        <button
          onClick={handleUnleverage}
          disabled={!contractAddress || !address || isPending || isConfirming}
          className="w-full px-6 py-3 bg-secondary hover:bg-secondary-dark text-black font-bold rounded-lg transition-all duration-200 shadow-glow-yellow hover:shadow-glow-orange disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-secondary"
        >
          {isPending || isConfirming
            ? "Processing..."
            : isConfirmed
            ? "Success!"
            : "Unleverage Position"}
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
        <div className="mt-4 p-4 bg-background hover border border-secondary/30 rounded-lg">
          <p className="text-secondary text-sm font-mono break-all">
            Tx Hash: {hash}
          </p>
        </div>
      )}
    </div>
  );
}