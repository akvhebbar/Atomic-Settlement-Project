import { useStore } from "@/store/use-store";
import { useMetaMask } from "@/hooks/use-metamask";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { useGasEstimate } from "@/hooks/use-gas-estimate";
import { useContractInteraction } from "@/hooks/use-contract-interaction";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Lock,
  ShieldCheck,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useVerifyTransaction } from "@/hooks/use-simulation";
import { PAYMENT_AMOUNT } from "@/lib/contract";
import { ethers } from "ethers";

export function InitiatePanel() {
  const { isWalletConnected, walletAddress } = useStore();
  const { isConnecting } = useMetaMask();
  const {
    balanceFormatted,
    loading: balanceLoading,
    refetch: refetchBalance,
  } = useWalletBalance(walletAddress);
  const { gasCostFormatted, loading: gasLoading } = useGasEstimate();
  const {
    depositFunds,
    refundUser,
    loading: txLoading,
    error: txError,
  } = useContractInteraction();
  const { txStep, setTxStep } = useStore();
  const verifyMutation = useVerifyTransaction();

  const paymentAmountFormatted = ethers.formatEther(PAYMENT_AMOUNT);
  const totalCost = (
    parseFloat(paymentAmountFormatted) + parseFloat(gasCostFormatted)
  ).toFixed(6);

  const isBusy =
    txStep !== "idle" && txStep !== "success" && txStep !== "error";
  const hasEnoughBalance =
    parseFloat(balanceFormatted) >= parseFloat(totalCost);

  const handlePayment = async () => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!hasEnoughBalance) {
      toast.error(
        `Insufficient balance. You need ${totalCost} ETH (${paymentAmountFormatted} payment + ${gasCostFormatted} gas)`,
      );
      return;
    }

    try {
      // Generate transaction ID - use keccak256 hash for bytes32 compatibility
      const txId = ethers.keccak256(
        ethers.toUtf8Bytes(`payment-${Date.now()}-${Math.random()}`),
      );

      // Step 1: Initiating - Send funds to escrow
      setTxStep("initiating", txId);
      toast.info("Broadcasting transaction to Ganache...");

      await depositFunds(txId);

      // Step 2: Locked - Funds are now locked
      setTxStep("locked", txId);
      toast.success("Funds securely locked in Escrow Contract!");

      await new Promise((r) => setTimeout(r, 1500));

      // Step 3: Verifying (Oracle)
      setTxStep("verifying", txId);
      toast.info("Verifying transaction...");

      try {
        // Step 4: Resolution via API
        const result = await verifyMutation.mutateAsync({
          transactionId: txId,
        });

        if (result.status === "success") {
          setTxStep("success", txId);
          toast.success(
            "Settlement verified and executed! Funds released to merchant.",
          );
        } else if (result.status === "error") {
          // Server has already processed the refund automatically
          setTxStep("error", txId);
          // Refresh balance to show refunded amount
          await new Promise((r) => setTimeout(r, 1000));
          refetchBalance();
          toast.error(
            `Verification failed: ${result.message}. Funds have been automatically refunded to your wallet.`,
          );
        }
      } catch (error: any) {
        // Network or API error - this shouldn't happen with our new server logic
        console.error("Unexpected verification error:", error);
        toast.error(`Unexpected error: ${error.message || "Unknown error"}`);
        setTxStep("error", txId);
      }
    } catch (error: any) {
      setTxStep("error");
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to initialize payment");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel p-6 lg:p-8 rounded-3xl relative overflow-hidden flex flex-col h-full"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

      <div className="relative z-10 flex flex-col h-full">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Initiate Contract
        </h2>

        <div className="space-y-6 flex-1">
          {/* Wallet Status */}
          {isWalletConnected && (
            <>
              <div className="bg-background/50 rounded-2xl p-4 border border-white/5">
                <div className="text-xs text-muted-foreground mb-1">
                  Connected Account
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <code className="text-xs break-all text-white font-mono">
                      {walletAddress}
                    </code>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse ml-2 flex-shrink-0"></div>
                </div>
              </div>

              <div className="bg-background/50 rounded-2xl p-4 border border-white/5">
                <div className="text-xs text-muted-foreground mb-1">
                  Your Balance
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-mono font-bold text-white">
                      {balanceLoading ? "..." : balanceFormatted}
                    </span>
                    <span className="text-primary font-bold mb-0.5">ETH</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                </div>
              </div>

              {/* Warning if balance is 0 */}
              {parseFloat(balanceFormatted) === 0 && !balanceLoading && (
                <div className="bg-yellow-500/10 rounded-2xl p-4 border border-yellow-500/30">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-200">
                      <p className="font-semibold mb-3">
                        ⚠️ This account has 0 ETH on Ganache
                      </p>

                      <p className="text-xs font-semibold mb-2">
                        📌 To connect your account with 100 ETH:
                      </p>
                      <ol className="text-xs space-y-1 mb-3 list-decimal list-inside">
                        <li>Disconnect wallet (click the Disconnect button)</li>
                        <li>In MetaMask, open account menu (top right)</li>
                        <li>Click "Import Account"</li>
                        <li>Paste this private key:</li>
                      </ol>
                      <code className="text-xs bg-background/50 p-2 rounded block break-all mb-3">
                        0xe4b362bb38b8b5472a27ecda5d7069d4369c7e5980b0979adc9875c2c02fc72d
                      </code>
                      <p className="text-xs font-semibold mb-2">
                        5. With the imported account selected, click "Connect
                        Wallet" again
                      </p>
                      <p className="text-xs text-yellow-300 mt-2">
                        The imported account address will be:
                      </p>
                      <code className="text-xs bg-background/50 p-2 rounded block break-all">
                        0xd724BDfEC35D1eE7BcC14C92A2A2785F8AE7977b
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Amount Box */}
          <div className="bg-background/50 rounded-2xl p-5 border border-white/5">
            <div className="text-sm text-muted-foreground mb-2">
              Amount to Lock
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-mono font-bold text-white">
                {paymentAmountFormatted}
              </span>
              <span className="text-primary font-bold mb-1">ETH</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2 font-mono">
              Gas Fee: {gasLoading ? "..." : gasCostFormatted} ETH
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-mono font-bold">
              Total: {totalCost} ETH
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network</span>
              <span className="font-mono text-white flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                Ganache (Chain ID: 1337)
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Smart Contract</span>
              <span className="font-mono text-primary text-xs truncate">
                0xe78A0F7E...8d6a8Ab
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Escrow Type</span>
              <span className="text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Atomic Trustless
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Est. Gas</span>
              <span className="font-mono text-white">
                {gasLoading ? "..." : gasCostFormatted} ETH
              </span>
            </div>
          </div>

          {/* Warnings */}
          {isWalletConnected && !hasEnoughBalance && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-500">
                Insufficient balance. You need {totalCost} ETH to complete this
                transaction.
              </div>
            </div>
          )}

          {txError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-500">{txError}</div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-6 mt-auto space-y-2">
          <button
            onClick={handlePayment}
            disabled={
              isBusy ||
              txLoading ||
              isConnecting ||
              !isWalletConnected ||
              !hasEnoughBalance
            }
            className={`
              w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300
              ${
                isBusy || txLoading || !hasEnoughBalance
                  ? "bg-muted text-muted-foreground cursor-not-allowed border border-white/5"
                  : "bg-primary text-primary-foreground hover:glow-primary hover:-translate-y-1 active:translate-y-0"
              }
            `}
          >
            {!isWalletConnected ? (
              <>Connect MetaMask to Pay</>
            ) : txLoading || isBusy ? (
              <span className="animate-pulse flex items-center gap-2">
                Processing <span className="font-mono">...</span>
              </span>
            ) : !hasEnoughBalance ? (
              <>Insufficient Balance</>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                PAY NOW & LOCK FUNDS
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>

          {isWalletConnected && (
            <div className="text-xs text-muted-foreground text-center">
              ✓ Connected to Ganache | Balance:{" "}
              {balanceLoading ? "..." : balanceFormatted} ETH
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
