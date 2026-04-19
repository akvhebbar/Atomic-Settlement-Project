import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  ATOMIC_ESCROW_ABI,
  MERCHANT_ADDRESS,
} from "@/lib/contract";

interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  gasCost: string;
  gasCostFormatted: string;
  loading: boolean;
  error: string | null;
}

export const useGasEstimate = (amountInEther: string) => {
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
      if (!amountInEther || isNaN(parseFloat(amountInEther)) || parseFloat(amountInEther) <= 0) {
         setState(prev => ({ ...prev, loading: false }));
         return;
      }
      
      setState((prev) => ({ ...prev, loading: true, error: null }));

      let gasLimit = 100000n;
      let gasPrice = 4000000000n; // 4 gwei default

      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          gasPrice = (await provider.getFeeData()).gasPrice || 4000000000n;
          const signer = await provider.getSigner();
          
          // Fast check contract to estimate the gas required for depositFunds
          const contract = new ethers.Contract(CONTRACT_ADDRESS, ATOMIC_ESCROW_ABI, signer);
          const fakeTxId = ethers.keccak256(ethers.toUtf8Bytes("estimate-gas-test-" + Date.now()));
          gasLimit = await contract.depositFunds.estimateGas(MERCHANT_ADDRESS, fakeTxId, {
             value: ethers.parseEther(amountInEther)
          });
        } catch (e) {
          console.log("Could not estimate transaction gas exactly, using default limit", e);
        }
      }

      const totalGasCost = gasLimit * gasPrice;
      const gasCostFormatted = ethers.formatEther(totalGasCost);

      setState({
        gasLimit: gasLimit.toString(),
        gasPrice: ethers.formatUnits(gasPrice, "gwei"),
        gasCost: totalGasCost.toString(),
        gasCostFormatted: Number(gasCostFormatted).toFixed(6),
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to estimate gas";
      console.error("Gas estimation error:", err);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  }, [amountInEther]);

  useEffect(() => {
    estimateGas();

    // Re-estimate gas every 10 seconds
    const interval = setInterval(estimateGas, 10000);
    return () => clearInterval(interval);
  }, [estimateGas]);

  return {
    ...state,
    refetch: estimateGas,
  };
};
