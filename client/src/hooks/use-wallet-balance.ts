import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

interface WalletBalance {
  balance: string;
  balanceFormatted: string;
  loading: boolean;
  error: string | null;
}

export const useWalletBalance = (walletAddress: string | null) => {
  const [state, setState] = useState<WalletBalance>({
    balance: "0",
    balanceFormatted: "0.00",
    loading: false,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      console.log("[Balance] No wallet address provided");
      setState({
        balance: "0",
        balanceFormatted: "0.00",
        loading: false,
        error: null,
      });
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const rpcUrl = "http://127.0.0.1:7545";
      console.log("[Balance] RPC URL:", rpcUrl);
      console.log("[Balance] Wallet address received:", walletAddress);

      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Test connection first
      let network;
      try {
        network = await provider.getNetwork();
        console.log(
          "[Balance] ✅ Connected to network:",
          network.name,
          "- Chain ID:",
          network.chainId,
        );
      } catch (networkErr) {
        console.error("[Balance] ❌ Failed to get network:", networkErr);
        throw networkErr;
      }

      // Normalize address with checksum
      let checksumAddress;
      try {
        checksumAddress = ethers.getAddress(walletAddress);
        console.log(
          "[Balance] ✅ Address normalized to checksum:",
          checksumAddress,
        );
      } catch (addrErr) {
        console.error(
          "[Balance] ❌ Invalid address format:",
          walletAddress,
          addrErr,
        );
        throw new Error("Invalid wallet address");
      }

      // Get balance with detailed logging
      console.log("[Balance] 🔄 Calling getBalance for:", checksumAddress);
      const balance = await provider.getBalance(checksumAddress);
      const formatted = ethers.formatEther(balance);
      const rounded = parseFloat(formatted).toFixed(4);

      console.log("[Balance] ✅ Raw balance (wei):", balance.toString());
      console.log("[Balance] ✅ Formatted balance (ETH):", formatted);
      console.log("[Balance] ✅ Rounded balance (ETH):", rounded);

      // If balance is 0, debug further
      if (balance.toString() === "0") {
        console.warn("[Balance] ⚠️ Balance is 0 for address:", checksumAddress);
        console.warn("[Balance] This means either:");
        console.warn("[Balance]   1. The address doesn't exist on Ganache");
        console.warn("[Balance]   2. The address has been used but drained");
        console.warn(
          "[Balance] Check MetaMask to verify the address and try another account",
        );
      }

      setState({
        balance: balance.toString(),
        balanceFormatted: rounded,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch balance";
      console.error("[Balance] Fetch error:", errorMessage, err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [walletAddress]);

  // Fetch balance on mount and when wallet address changes
  useEffect(() => {
    fetchBalance();

    // Poll balance every 3 seconds when wallet is connected
    const interval = walletAddress
      ? setInterval(fetchBalance, 3000)
      : undefined;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [walletAddress, fetchBalance]);

  return {
    ...state,
    refetch: fetchBalance,
  };
};
