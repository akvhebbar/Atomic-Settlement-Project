import { create } from "zustand";

export type TxStep =
  | "idle"
  | "initiating"
  | "locked"
  | "verifying"
  | "success"
  | "error";

interface AppState {
  isWalletConnected: boolean;
  walletAddress: string | null;
  setWalletConnected: (connected: boolean, address: string | null) => void;

  txStep: TxStep;
  txId: string | null;
  txHash: string | null;
  setTxStep: (step: TxStep, id?: string, hash?: string) => void;
  resetTx: () => void;
}

export const useStore = create<AppState>((set) => ({
  isWalletConnected: false,
  walletAddress: null,
  setWalletConnected: (connected, address) =>
    set({
      isWalletConnected: connected,
      walletAddress: address,
      txStep: "idle",
      txId: null,
      txHash: null,
    }),

  txStep: "idle",
  txId: null,
  txHash: null,
  setTxStep: (step, id, hash) =>
    set((state) => ({
      txStep: step,
      txId: id !== undefined ? id : state.txId,
      txHash: hash !== undefined ? hash : state.txHash,
    })),
  resetTx: () => set({ txStep: "idle", txId: null, txHash: null }),
}));
