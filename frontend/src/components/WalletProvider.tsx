"use client";

import { FC, ReactNode, useMemo, useCallback } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletError } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { HELIUS_CONFIG, QUICKNODE_CONFIG } from "@/lib/rpc-config";

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: ReactNode;
}

// RPC endpoints with fallback chain:
// 1. QuickNode (primary for browser - $3k bounty, best CORS support)
// 2. Helius (Photon indexer - $5k bounty)
// 3. Public devnet (last resort)
const RPC_ENDPOINTS = [
  QUICKNODE_CONFIG.endpoint,
  HELIUS_CONFIG.rpcUrl,
  "https://api.devnet.solana.com",
];

export const WalletProvider: FC<Props> = ({ children }) => {
  // Use QuickNode RPC as primary connection (best browser/CORS support)
  const endpoint = useMemo(() => RPC_ENDPOINTS[0], []);

  // Explicitly include Phantom and Solflare adapters
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  // Error handler for wallet errors
  const onError = useCallback((error: WalletError) => {
    console.error("Wallet error:", error.message);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider
        wallets={wallets}
        autoConnect={false}
        onError={onError}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProvider;
