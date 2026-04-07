import { useState, useCallback } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  ATOMIC_ESCROW_ABI,
  MERCHANT_ADDRESS,
  PAYMENT_AMOUNT,
} from "@/lib/contract";
import { toast } from "sonner";

interface TransactionState {
  hash: string | null;
  status: "idle" | "pending" | "success" | "error";
  error: string | null;
  loading: boolean;
}

export const useContractInteraction = () => {
  const [state, setState] = useState<TransactionState>({
    hash: null,
    status: "idle",
    error: null,
    loading: false,
  });

  // Deposit funds into escrow
  const depositFunds = useCallback(async (transactionId: string) => {
    try {
      setState({
        hash: null,
        status: "pending",
        error: null,
        loading: true,
      });

      // Get MetaMask signer (not provider signer)
      if (!window.ethereum) {
        throw new Error("MetaMask not available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Get contract instance
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ATOMIC_ESCROW_ABI,
        signer,
      );

      // Encode transaction ID (already a bytes32 hash from frontend)
      const txIdEncoded = transactionId;

      console.log("Depositing funds:", {
        merchant: MERCHANT_ADDRESS,
        txId: txIdEncoded,
        amount: PAYMENT_AMOUNT.toString(),
      });

      // Call depositFunds
      const tx = await contract.depositFunds(MERCHANT_ADDRESS, txIdEncoded, {
        value: PAYMENT_AMOUNT,
      });

      console.log("Transaction sent:", tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        setState({
          hash: tx.hash,
          status: "success",
          error: null,
          loading: false,
        });
        console.log("Deposit successful:", receipt);
        return { success: true, hash: tx.hash, receipt };
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Deposit failed";
      console.error("Deposit error:", err);

      setState({
        hash: null,
        status: "error",
        error: errorMessage,
        loading: false,
      });

      throw err;
    }
  }, []);

  // Finalize transaction (release funds to merchant)
  const finalizeTransaction = useCallback(async (transactionId: string) => {
    try {
      setState({
        hash: null,
        status: "pending",
        error: null,
        loading: true,
      });

      // Get MetaMask signer
      if (!window.ethereum) {
        throw new Error("MetaMask not available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ATOMIC_ESCROW_ABI,
        signer,
      );

      const txIdEncoded = transactionId;

      console.log("Finalizing transaction:", txIdEncoded);

      const tx = await contract.finalizeTransaction(txIdEncoded);
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        setState({
          hash: tx.hash,
          status: "success",
          error: null,
          loading: false,
        });
        return { success: true, hash: tx.hash, receipt };
      } else {
        throw new Error("Finalize transaction failed");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Finalize failed";
      console.error("Finalize error:", err);

      setState({
        hash: null,
        status: "error",
        error: errorMessage,
        loading: false,
      });

      throw err;
    }
  }, []);

  // Refund user
  const refundUser = useCallback(async (transactionId: string) => {
    try {
      setState({
        hash: null,
        status: "pending",
        error: null,
        loading: true,
      });

      // Get MetaMask signer
      if (!window.ethereum) {
        throw new Error("MetaMask not available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ATOMIC_ESCROW_ABI,
        signer,
      );

      const txIdEncoded = transactionId;

      console.log("Refunding transaction:", txIdEncoded);

      const tx = await contract.refundUser(txIdEncoded);
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        setState({
          hash: tx.hash,
          status: "success",
          error: null,
          loading: false,
        });
        return { success: true, hash: tx.hash, receipt };
      } else {
        throw new Error("Refund failed");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Refund failed";
      console.error("Refund error:", err);

      setState({
        hash: null,
        status: "error",
        error: errorMessage,
        loading: false,
      });

      throw err;
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      hash: null,
      status: "idle",
      error: null,
      loading: false,
    });
  }, []);

  return {
    ...state,
    depositFunds,
    finalizeTransaction,
    refundUser,
    reset,
  };
};
