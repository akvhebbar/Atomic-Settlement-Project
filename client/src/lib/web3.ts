import { ethers } from "ethers";

// Define Ganache network
export const GANACHE_NETWORK = {
  name: "Ganache",
  chainId: 1337,
  rpcUrl: "http://127.0.0.1:7545",
} as const;

// Get provider for Ganache
export const getGanacheProvider = () => {
  return new ethers.JsonRpcProvider(GANACHE_NETWORK.rpcUrl);
};

// Get signer from MetaMask
export const getMetaMaskSigner = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  // Request account access
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found");
  }

  // Create provider from MetaMask
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return { provider, signer, account: accounts[0] };
};

// Switch MetaMask to Ganache network
export const switchToGanacheNetwork = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    // Try to switch to existing Ganache network
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x539" }], // 1337 in hex
    });
  } catch (switchError: any) {
    // Network doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x539",
              chainName: "Ganache",
              rpcUrls: ["http://127.0.0.1:7545"],
              nativeCurrency: {
                name: "Ether",
                symbol: "ETH",
                decimals: 18,
              },
            },
          ],
        });
      } catch (addError) {
        console.error("Failed to add Ganache network:", addError);
        throw addError;
      }
    } else {
      throw switchError;
    }
  }
};

// Listen for account changes
export const onAccountsChanged = (callback: (accounts: string[]) => void) => {
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", callback);
  }
};

// Listen for network changes
export const onChainChanged = (callback: (chainId: string) => void) => {
  if (window.ethereum) {
    window.ethereum.on("chainChanged", callback);
  }
};

// Remove listeners
export const removeAccountsListener = (
  callback: (accounts: string[]) => void,
) => {
  if (window.ethereum) {
    window.ethereum.removeListener("accountsChanged", callback);
  }
};

export const removeChainListener = (callback: (chainId: string) => void) => {
  if (window.ethereum) {
    window.ethereum.removeListener("chainChanged", callback);
  }
};

// Get current network
export const getCurrentNetwork = async () => {
  const provider = getGanacheProvider();
  const network = await provider.getNetwork();
  return network;
};

// Declare global ethereum interface
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (
        event: string,
        callback: (...args: any[]) => void,
      ) => void;
      isMetaMask?: boolean;
    };
  }
}
