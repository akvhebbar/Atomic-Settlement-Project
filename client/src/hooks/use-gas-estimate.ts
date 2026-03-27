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

      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7546");

      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei");

      // Estimate gas for the depositFunds transaction
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ATOMIC_ESCROW_ABI,
        signer,
      );

      // Generate a mock transaction ID for estimation
      const mockTxId = ethers.encodeBytes32String("estimate");
      const merchantAddress = "0x70997970C51812e339d9B73b0245ad91F562aeB9";

      let gasLimit = ethers.toBigInt("100000"); // Default estimate

      try {
        // Try to estimate actual gas
        gasLimit = await contract.depositFunds.estimateGas(
          merchantAddress,
          mockTxId,
          { value: PAYMENT_AMOUNT },
        );
        // Add 20% buffer for safety
        gasLimit = (gasLimit * ethers.toBigInt("120")) / ethers.toBigInt("100");
      } catch (e) {
        // Use default if estimation fails
        console.log("Using default gas estimate");
      }

      // Calculate total gas cost
      const gasCost = gasPrice * gasLimit;
      const gasCostFormatted = parseFloat(ethers.formatEther(gasCost)).toFixed(
        6,
      );

      setState({
        gasLimit: gasLimit.toString(),
        gasPrice: ethers.formatUnits(gasPrice, "gwei"),
        gasCost: gasCost.toString(),
        gasCostFormatted,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to estimate gas";
      console.error("Gas estimation error:", err);

      // Set reasonable defaults on error
      setState({
        gasLimit: "100000",
        gasPrice: "1",
        gasCost: ethers.parseUnits("0.0001", "ether").toString(),
        gasCostFormatted: "0.0001",
        loading: false,
        error: null, // Don't show error to user, just use defaults
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
