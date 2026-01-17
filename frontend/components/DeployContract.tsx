"use client";

import { useState, useEffect } from "react";
import { useAccount, useWaitForTransactionReceipt, useConfig } from "wagmi";
import { deployContract, getTransactionReceipt } from "@wagmi/core";
import { UZRLeverageABI, UZRLeverageBytecode } from "@/lib/contracts";

interface DeployContractProps {
  onDeployed?: (address: string) => void;
}

export function DeployContract({ onDeployed }: DeployContractProps) {
  const { address } = useAccount();
  const config = useConfig();
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);

  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt, isError: receiptError, error: receiptErrorData } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Handle transaction receipt errors
  useEffect(() => {
    if (receiptError && receiptErrorData) {
      console.error("Transaction receipt error:", receiptErrorData);
      setError(receiptErrorData as Error);
      setIsDeploying(false);
    }
  }, [receiptError, receiptErrorData]);

  // Check receipt directly and retry fetching if contractAddress is missing
  useEffect(() => {
    const checkReceipt = async () => {
      if (hash && !deployedAddress && isConfirmed) {
        let finalReceipt = receipt;
        
        // Extract deployed contract address from transaction receipt
        if (receipt?.contractAddress) {
          setDeployedAddress(receipt.contractAddress);
          setIsDeploying(false);
          if (onDeployed) {
            onDeployed(receipt.contractAddress);
          }
          return;
        }

        // If receipt doesn't have contractAddress, try fetching it again with retries
        console.log("Receipt missing contractAddress, retrying fetch...");
        // Retry up to 3 times with delays
        for (let i = 0; i < 3; i++) {
          try {
            // Wait before retrying (increasing delay)
            await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
            finalReceipt = await getTransactionReceipt(config, { hash });
            if (finalReceipt?.contractAddress) {
              break;
            }
          } catch (err) {
            console.error(`Error fetching receipt (attempt ${i + 1}):`, err);
            if (i === 2) {
              // Last attempt failed, set error
              setError(new Error("Failed to retrieve contract address from transaction receipt after multiple attempts"));
              setIsDeploying(false);
              return;
            }
          }
        }
        
        if (finalReceipt?.contractAddress && !deployedAddress) {
          setDeployedAddress(finalReceipt.contractAddress);
          setIsDeploying(false);
          if (onDeployed) {
            onDeployed(finalReceipt.contractAddress);
          }
        } else if (!finalReceipt?.contractAddress && !error) {
          // If still no contract address after retries, set warning but don't set error yet
          console.warn("Contract address still not found after retries");
        }
      }
    };

    checkReceipt();
  }, [hash, receipt, deployedAddress, isConfirmed, config, onDeployed, error]);

  const handleDeploy = async () => {
    if (!address) return;

    setIsDeploying(true);
    setError(null);
    try {
      // Deploy contract using deployContract action
      const deployHash = await deployContract(config, {
        abi: UZRLeverageABI,
        bytecode: UZRLeverageBytecode as `0x${string}`,
        args: [address],
        account: address,
      });
      setHash(deployHash);
    } catch (err) {
      console.error("Deployment error:", err);
      setError(err as Error);
      setIsDeploying(false);
    }
  };

  const isPending = isDeploying || isConfirming;

  return (
    <div className="bg-background-card border border-primary/30 rounded-xl p-6 shadow-glow-orange">
      <h2 className="text-2xl font-bold text-primary mb-4 glow-text">
        Deploy Contract
      </h2>
      <p className="text-gray-400 mb-6 text-sm">
        Deploy a new UZRLeverage contract with your connected wallet as the user
      </p>

      {deployedAddress ? (
        <div className="space-y-4">
          <div className="p-4 bg-background hover border border-secondary/30 rounded-lg">
            <p className="text-secondary font-bold mb-2">Contract Deployed!</p>
            <p className="text-gray-300 font-mono text-sm break-all">
              {deployedAddress}
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={handleDeploy}
          disabled={!address || isPending || isConfirming || isDeploying}
          className="w-full px-6 py-3 bg-primary hover:bg-primary-dark text-black font-bold rounded-lg transition-all duration-200 shadow-glow-orange hover:shadow-glow-yellow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
        >
          {isPending || isConfirming || isDeploying
            ? "Deploying..."
            : "Deploy UZRLeverage Contract"}
        </button>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">
            Error: {error.message || "Deployment failed"}
          </p>
        </div>
      )}

      {hash && (
        <div className="mt-4 p-4 bg-background hover border border-primary/30 rounded-lg">
          <p className="text-primary text-sm font-mono break-all">
            Tx Hash: {hash}
          </p>
          {isConfirming && (
            <p className="text-yellow-400 text-xs mt-2">
              ⏳ Waiting for transaction confirmation...
            </p>
          )}
          {isConfirmed && receipt && !receipt.contractAddress && (
            <p className="text-yellow-400 text-xs mt-2">
              ⚠️ Transaction confirmed but contract address not found in receipt. Check transaction on explorer.
            </p>
          )}
        </div>
      )}
    </div>
  );
}