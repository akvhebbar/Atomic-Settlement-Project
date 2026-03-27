import { Activity, Wallet } from "lucide-react";
import { useStore } from "@/store/use-store";
import { useMetaMask } from "@/hooks/use-metamask";
import { motion } from "framer-motion";

export function Navbar() {
  const { isWalletConnected, walletAddress } = useStore();
  const { connect, disconnect, isConnecting, error } = useMetaMask();

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleClickConnect = async () => {
    try {
      console.log("[Navbar] Connect button clicked");
      await connect();
      console.log("[Navbar] Connect successful");
    } catch (err) {
      console.error("[Navbar] Connection failed:", err);
    }
  };

  const handleClickDisconnect = () => {
    console.log("[Navbar] Disconnect button clicked");
    disconnect();
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b-0 border-t-0 border-x-0 !rounded-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/30">
              <Activity className="w-5 h-5 text-primary text-glow" />
              <div className="absolute inset-0 rounded-xl glow-primary opacity-50"></div>
            </div>
            <span className="font-display font-bold text-2xl tracking-wider text-foreground">
              ATOMIC<span className="text-primary">VERIFY</span>
            </span>
          </div>

          {/* Wallet Connection */}
          <div className="flex flex-col items-end gap-2">
            {isWalletConnected ? (
              <div className="flex gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative"
                >
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary border border-primary/30 text-primary-foreground font-mono text-sm disabled">
                    <div className="w-2 h-2 rounded-full bg-success glow-success animate-pulse"></div>
                    <span className="text-primary font-medium">
                      {walletAddress ? formatAddress(walletAddress) : ""}
                    </span>
                  </button>
                  {/* Tooltip showing full address */}
                  <div className="absolute bottom-full right-0 mb-2 p-2 bg-background border border-primary/30 rounded-lg text-xs text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="text-primary font-mono break-all max-w-xs">
                      {walletAddress}
                    </p>
                  </div>
                </motion.div>
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleClickDisconnect}
                  className="px-4 py-2.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 font-bold text-sm hover:bg-red-500/30 transition-all duration-300"
                >
                  Disconnect
                </motion.button>
              </div>
            ) : (
              <button
                onClick={handleClickConnect}
                disabled={isConnecting}
                className="group relative flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <Wallet className="w-4 h-4 relative z-10" />
                <span className="relative z-10 uppercase tracking-wider text-sm">
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </span>
              </button>
            )}
            {error && (
              <p className="text-red-500 text-xs mt-1 max-w-xs text-right">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
