import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import {
  switchToGanacheNetwork,
  getMetaMaskSigner,
  onAccountsChanged,
  onChainChanged,
  removeAccountsListener,
  removeChainListener,
} from "@/lib/web3";
import { useStore } from "@/store/use-store";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  chainId: string | null;
}

export const useMetaMask = () => {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    chainId: null,
  });

  const { setWalletConnected } = useStore();

  // Store listener refs so we can clean them up properly
  const listenersRef = useRef<{
    accounts: ((accounts: string[]) => void) | null;
    chain: ((chainId: string) => void) | null;
  }>({ accounts: null, chain: null });

  // Connect to MetaMask
  const connect = useCallback(async () => {
    try {
      // Clear any previous error and listeners
      console.log("[MetaMask] Clearing previous listeners...");
      if (listenersRef.current.accounts) {
        removeAccountsListener(listenersRef.current.accounts);
        listenersRef.current.accounts = null;
      }
      if (listenersRef.current.chain) {
        removeChainListener(listenersRef.current.chain);
        listenersRef.current.chain = null;
      }

      setState((prev) => ({ ...prev, isConnecting: true, error: null }));

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed. Please install MetaMask extension.",
        );
      }

      console.log("[MetaMask] Starting connection...");
      console.log(
        "[MetaMask] 📌 A popup will appear - SELECT YOUR ACCOUNT WITH 100 ETH BALANCE",
      );

      // Switch to Ganache network
      await switchToGanacheNetwork();
      console.log("[MetaMask] Switched to Ganache network");

      // Request accounts - MetaMask will show account picker popup
      // User should select the account with 100 ETH balance (0xd724BDfEC35D1eE7BcC14C92A2A2785F8AE7977b)
      console.log("[MetaMask] Requesting account access - select your account with 100 ETH");
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      console.log("[MetaMask] Available accounts from MetaMask:", accounts);
      console.log("[MetaMask] Selected account:", accounts[0]);

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts selected in MetaMask");
      }

      const account = accounts[0];

      // Verify we're on the correct network
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      if (currentChainId !== "0x539") {
        console.log("[MetaMask] Wrong network, switching to Ganache...");
        await switchToGanacheNetwork();
      }

      // Get signer and account
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log("[MetaMask] Connected account:", account);

      // Get current chain ID
      const chainId = await window.ethereum!.request({
        method: "eth_chainId",
      });
      console.log("[MetaMask] Chain ID:", chainId);

      setState({
        address: account,
        isConnected: true,
        isConnecting: false,
        error: null,
        chainId,
      });

      // Set up listeners
      const handleAccountsChanged = (accounts: string[]) => {
        console.log("[MetaMask] Accounts changed:", accounts);
        if (accounts.length === 0) {
          setState((prev) => ({
            ...prev,
            address: null,
            isConnected: false,
          }));
          setWalletConnected(false, null);
        } else {
          setState((prev) => ({
            ...prev,
            address: accounts[0],
          }));
          setWalletConnected(true, accounts[0]);
        }
      };

      const handleChainChanged = (chainId: string) => {
        console.log("[MetaMask] Chain changed:", chainId);
        setState((prev) => ({
          ...prev,
          chainId,
        }));

        // Reload page on chain change
        window.location.reload();
      };

      // Store listeners in ref so we can clean them up on disconnect
      listenersRef.current.accounts = handleAccountsChanged;
      listenersRef.current.chain = handleChainChanged;

      onAccountsChanged(handleAccountsChanged);
      onChainChanged(handleChainChanged);

      // Update store
      setWalletConnected(true, account);

      console.log("[MetaMask] Connection successful!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect wallet";
      console.error("[MetaMask] Connection error:", errorMessage, err);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, [setWalletConnected]);

  // Disconnect from MetaMask
  const disconnect = useCallback(() => {
    console.log("[MetaMask] Disconnecting wallet...");

    // Clean up listeners
    if (listenersRef.current.accounts) {
      console.log("[MetaMask] Removing accounts listener...");
      removeAccountsListener(listenersRef.current.accounts);
      listenersRef.current.accounts = null;
    }
    if (listenersRef.current.chain) {
      console.log("[MetaMask] Removing chain listener...");
      removeChainListener(listenersRef.current.chain);
      listenersRef.current.chain = null;
    }

    // Clear state
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      chainId: null,
    });

    // Update store
    setWalletConnected(false, null);
    console.log("[MetaMask] Wallet disconnected successfully!");
  }, [setWalletConnected]);

  // Check if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts && accounts.length > 0) {
          const chainId = await window.ethereum.request({
            method: "eth_chainId",
          });

          setState({
            address: accounts[0],
            isConnected: true,
            isConnecting: false,
            error: null,
            chainId,
          });
        }
      } catch (err) {
        console.error("Error checking wallet connection:", err);
      }
    };

    checkConnection();
  }, []);

  return {
    ...state,
    connect,
    disconnect,
  };
};
