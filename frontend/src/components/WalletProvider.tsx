"use client";

import { FC, ReactNode, useMemo, useCallback } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletError } from "@solana/wallet-adapter-base";

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: ReactNode;
}

// Devnet RPC URL
const DEVNET_RPC = "https://api.devnet.solana.com";

export const WalletProvider: FC<Props> = ({ children }) => {
  // Use devnet
  const endpoint = useMemo(() => DEVNET_RPC, []);

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
