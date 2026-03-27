import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import NotFound from "@/pages/not-found";
import Home from "./pages/Home";
import { useMetaMask } from "@/hooks/use-metamask";
import { useStore } from "@/store/use-store";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function WalletInitializer() {
  const { address, isConnected } = useMetaMask();
  const { setWalletConnected } = useStore();

  useEffect(() => {
    console.log("[App] Wallet state changed:");
    console.log("[App]   - Connected:", isConnected);
    console.log("[App]   - Address:", address);

    if (isConnected && address) {
      console.log(
        "[App] ✅ Syncing wallet to store - Address will be used for balance queries",
      );
    } else {
      console.log("[App] ⚠️ Wallet not connected or no address");
    }

    setWalletConnected(isConnected, address);
  }, [isConnected, address, setWalletConnected]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WalletInitializer />
        <Router />
        <ShadcnToaster />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
              fontFamily: "var(--font-display)",
            },
            className: "backdrop-blur-xl",
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
