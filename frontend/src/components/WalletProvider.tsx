"use client";

import { FC, ReactNode, useMemo, useCallback } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletError } from "@solana/wallet-adapter-base";
import { HELIUS_CONFIG, QUICKNODE_CONFIG } from "@/lib/rpc-config";

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: ReactNode;
}

// RPC endpoints with fallback chain:
// 1. Helius (primary - $5k bounty + Photon indexer)
// 2. QuickNode (backup - $3k bounty)
// 3. Public devnet (last resort)
const RPC_ENDPOINTS = [
  HELIUS_CONFIG.rpcUrl,
  QUICKNODE_CONFIG.endpoint,
  "https://api.devnet.solana.com",
];

export const WalletProvider: FC<Props> = ({ children }) => {
  // Use Helius RPC as primary (Privacy Hack $5k bounty)
  const endpoint = useMemo(() => RPC_ENDPOINTS[0], []);

  // Empty wallets array - wallet-standard will auto-detect installed wallets
  const wallets = useMemo(() => [], []);

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
