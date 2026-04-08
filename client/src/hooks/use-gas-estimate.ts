import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  ATOMIC_ESCROW_ABI,
  PAYMENT_AMOUNT,
} from "@/lib/contract";

interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  gasCost: string;
  gasCostFormatted: string;
  loading: boolean;
  error: string | null;
}

export const useGasEstimate = () => {
  const [state, setState] = useState<GasEstimate>({
    gasLimit: "0",
    gasPrice: "0",
    gasCost: "0",
    gasCostFormatted: "0.00",
    loading: true,
    error: null,
  });

  const estimateGas = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Set fixed gas cost as requested
      const fixedGasCost = "0.0004";

      setState({
        gasLimit: "100000", // Default gas limit
        gasPrice: "4", // 4 gwei to give 0.0004 ETH for 100k gas
        gasCost: ethers.parseUnits(fixedGasCost, "ether").toString(),
        gasCostFormatted: fixedGasCost,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to estimate gas";
      console.error("Gas estimation error:", err);

      // Set fixed defaults on error
      setState({
        gasLimit: "100000",
        gasPrice: "4",
        gasCost: ethers.parseUnits("0.0004", "ether").toString(),
        gasCostFormatted: "0.0004",
        loading: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    estimateGas();

    // Re-estimate gas every 10 seconds (gas prices change)
    const interval = setInterval(estimateGas, 10000);

    return () => clearInterval(interval);
  }, [estimateGas]);

  return {
    ...state,
    refetch: estimateGas,
  };
};
