import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: number;
  transactionId: string;
  walletAddress: string;
  amount: string;
  gasFee: string;
  status: "pending" | "success" | "error";
  createdAt: string;
}

export function TransactionModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions");
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "success": return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "error": return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <div 
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              onMouseLeave={onClose}
              className="w-full max-w-5xl max-h-[85vh] glass-panel rounded-2xl overflow-hidden flex flex-col border border-primary/20 shadow-2xl bg-background/95 cursor-auto"
            >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
              <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                Transaction History
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">{transactions.length} Records</span>
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No transactions found.</p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="pb-4 px-4 font-semibold">Status</th>
                        <th className="pb-4 px-4 font-semibold">Transaction Hash</th>
                        <th className="pb-4 px-4 font-semibold">Wallet Address</th>
                        <th className="pb-4 px-4 font-semibold">Date & Time</th>
                        <th className="pb-4 px-4 font-semibold text-right">Amount (ETH)</th>
                        <th className="pb-4 px-4 font-semibold text-right">Gas Fee (ETH)</th>
                        <th className="pb-4 px-4 font-semibold text-right">Total (ETH)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-black/20 transition-colors">
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <StatusIcon status={tx.status} />
                              <span className="capitalize text-sm text-foreground">{tx.status}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-mono text-sm text-primary">{tx.transactionId.substring(0, 16)}...</span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-mono text-xs text-white">{tx.walletAddress.substring(0, 8)}...{tx.walletAddress.substring(tx.walletAddress.length - 6)}</span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap text-sm text-muted-foreground">
                            {format(new Date(tx.createdAt), "MMM d, yyyy HH:mm:ss")}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap text-right">
                            <span className="font-mono font-bold text-white">{tx.amount}</span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap text-right">
                            <span className="font-mono text-muted-foreground">{tx.gasFee}</span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap text-right">
                            <span className="font-mono font-bold text-primary">
                              {(parseFloat(tx.amount || "0") + parseFloat(tx.gasFee || "0")).toFixed(6)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        </>
      )}
    </AnimatePresence>
  );
}
