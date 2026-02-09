"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "bn.js";
import {
  SwarmShieldClient,
  SwarmConfig,
  ShieldedAgent,
  findVaultPDA,
} from "@/lib/swarmshield";

export interface SwarmShieldState {
  isInitialized: boolean;
  isAgentRegistered: boolean;
  config: SwarmConfig | null;
  agent: ShieldedAgent | null;
  walletBalance: number;
  vaultBalance: number;
  realUsdcBalance: number; // REAL SwarmUSDC tokens in wallet
  isLoading: boolean;
  error: string | null;
  lastTxSignature: string | null; // For Solscan links
  lastEncryptedPreview: string | null; // Shows encrypted bytes for privacy proof
}

export interface SwarmShieldActions {
  initialize: () => Promise<string>;
  registerAgent: () => Promise<string>;
  depositSol: (amount: number) => Promise<string>;
  depositUsdc: (amount: number) => Promise<string>; // Deposit USDC to shielded vault
  withdrawSol: (amount: number) => Promise<string>;
  withdrawUsdc: (amount: number) => Promise<string>; // REAL token withdrawal
  submitIntent: (
    type: "buy" | "sell",
    amount: number,
    minOutput: number
  ) => Promise<string>;
  refresh: () => Promise<void>;
}

export function useSwarmShield(): [SwarmShieldState, SwarmShieldActions] {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [state, setState] = useState<SwarmShieldState>({
    isInitialized: false,
    isAgentRegistered: false,
    config: null,
    agent: null,
    walletBalance: 0,
    vaultBalance: 0,
    realUsdcBalance: 0,
    isLoading: true,
    error: null,
    lastTxSignature: null,
    lastEncryptedPreview: null,
  });

  const [client, setClient] = useState<SwarmShieldClient | null>(null);
  const submissionLockRef = useRef<boolean>(false);

  // Initialize client when wallet connects
  useEffect(() => {
    if (wallet.publicKey && wallet.signTransaction && wallet.signAllTransactions) {
      const newClient = new SwarmShieldClient(connection);
      // Set wallet adapter for signing
      newClient.setWallet(wallet as any);
      setClient(newClient);
    } else {
      setClient(null);
    }
  }, [connection, wallet, wallet.publicKey]);

  // Fetch state - silent parameter prevents showing loading spinner for background refreshes
  const refresh = useCallback(async (silent = false) => {
    if (!client || !wallet.publicKey) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    // Only show loading on initial fetch, not background refreshes
    if (!silent) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      // Check if initialized
      const isInitialized = await client.isInitialized();
      console.log("Protocol initialized:", isInitialized);

      // Get config if initialized
      let config: SwarmConfig | null = null;
      if (isInitialized) {
        config = await client.getConfig();
        console.log("Config:", config);
      }

      // Check if agent registered
      const isAgentRegistered = await client.isAgentRegistered(wallet.publicKey);

      // Get agent data if registered
      let agent: ShieldedAgent | null = null;
      if (isAgentRegistered) {
        agent = await client.getAgent(wallet.publicKey);
      }

      // Get wallet balance
      const walletBalance = await client.getSolBalance(wallet.publicKey);

      // Get vault balance
      const [vaultPDA] = findVaultPDA();
      let vaultBalance = 0;
      try {
        vaultBalance = await client.getSolBalance(vaultPDA);
      } catch {
        vaultBalance = 0;
      }

      // Get real SwarmUSDC token balance
      let realUsdcBalance = 0;
      try {
        realUsdcBalance = await client.getSwarmUsdcBalance(wallet.publicKey);
      } catch {
        realUsdcBalance = 0;
      }

      setState((prev) => ({
        ...prev,
        isInitialized,
        isAgentRegistered,
        config,
        agent,
        walletBalance,
        vaultBalance,
        realUsdcBalance,
        isLoading: false,
        error: null,
      }));
    } catch (err: any) {
      console.error("Error fetching state:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || "Failed to fetch state",
      }));
    }
  }, [client, wallet.publicKey]);

  // Refresh on mount and when client changes (delayed to avoid rate limits)
  useEffect(() => {
    const timeout = setTimeout(() => refresh(), 1500);
    return () => clearTimeout(timeout);
  }, [refresh]);

  // Background polling every 30 seconds (silent - no loading spinner)
  useEffect(() => {
    if (!client || !wallet.publicKey) return;

    const interval = setInterval(() => {
      refresh(true); // Silent refresh - don't show loading spinner
    }, 30000);

    return () => clearInterval(interval);
  }, [client, wallet.publicKey, refresh]);

  // Actions
  const initialize = useCallback(async (): Promise<string> => {
    if (!client || !wallet.publicKey) throw new Error("Wallet not connected");
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const tx = await client.initialize(wallet.publicKey, 3, 10);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for confirmation
      await refresh();
      return tx;
    } catch (err: any) {
      // Check if already initialized (this is actually success)
      if (err.message?.includes("already been processed") ||
          err.message?.includes("AlreadyProcessed") ||
          err.message?.includes("already initialized")) {
        console.log("Protocol already initialized, refreshing state...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refresh();
        return "already-initialized";
      }
      setState((prev) => ({ ...prev, isLoading: false, error: err.message }));
      throw err;
    }
  }, [client, wallet.publicKey, refresh]);

  const registerAgent = useCallback(async (): Promise<string> => {
    if (!client || !wallet.publicKey) throw new Error("Wallet not connected");
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const tx = await client.registerAgent(wallet.publicKey);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for confirmation
      await refresh();
      return tx;
    } catch (err: any) {
      // Check if already registered (this is actually success)
      if (err.message?.includes("already been processed") ||
          err.message?.includes("AlreadyProcessed") ||
          err.message?.includes("already in use")) {
        console.log("Agent already registered, refreshing state...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refresh();
        return "already-registered";
      }
      setState((prev) => ({ ...prev, isLoading: false, error: err.message }));
      throw err;
    }
  }, [client, wallet.publicKey, refresh]);

  const depositSol = useCallback(
    async (amount: number): Promise<string> => {
      if (!client || !wallet.publicKey) throw new Error("Wallet not connected");
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const tx = await client.depositSol(wallet.publicKey, amount);
        // Multiple refresh attempts for reliability
        await new Promise(resolve => setTimeout(resolve, 3000));
        await refresh();
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refresh();
        return tx;
      } catch (err: any) {
        setState((prev) => ({ ...prev, isLoading: false, error: err.message }));
        throw err;
      }
    },
    [client, wallet.publicKey, refresh]
  );

  // Deposit USDC from wallet to shielded vault (for USDC→SOL trades)
  const depositUsdc = useCallback(
    async (amount: number): Promise<string> => {
      if (!client || !wallet.publicKey) throw new Error("Wallet not connected");
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const tx = await client.depositUsdc(wallet.publicKey, amount);
        setState((prev) => ({ ...prev, lastTxSignature: tx }));
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refresh();
        return tx;
      } catch (err: any) {
        setState((prev) => ({ ...prev, isLoading: false, error: err.message }));
        throw err;
      }
    },
    [client, wallet.publicKey, refresh]
  );

  const withdrawSol = useCallback(
    async (amount: number): Promise<string> => {
      if (!client || !wallet.publicKey) throw new Error("Wallet not connected");
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const tx = await client.withdrawSol(wallet.publicKey, amount);
        setState((prev) => ({ ...prev, lastTxSignature: tx }));
        await refresh();
        return tx;
      } catch (err: any) {
        setState((prev) => ({ ...prev, isLoading: false, error: err.message }));
        throw err;
      }
    },
    [client, wallet.publicKey, refresh]
  );

  // Withdraw REAL SwarmUSDC tokens to wallet
  const withdrawUsdc = useCallback(
    async (amount: number): Promise<string> => {
      if (!client || !wallet.publicKey) throw new Error("Wallet not connected");
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const tx = await client.withdrawUsdc(wallet.publicKey, amount);
        setState((prev) => ({ ...prev, lastTxSignature: tx }));
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refresh();
        return tx;
      } catch (err: any) {
        setState((prev) => ({ ...prev, isLoading: false, error: err.message }));
        throw err;
      }
    },
    [client, wallet.publicKey, refresh]
  );

  const submitIntent = useCallback(
    async (
      type: "buy" | "sell",
      amount: number,
      minOutput: number
    ): Promise<string> => {
      if (!client || !wallet.publicKey) throw new Error("Wallet not connected");

      // Prevent concurrent submissions
      if (submissionLockRef.current) {
        throw new Error("Another transaction is in progress. Please wait.");
      }

      submissionLockRef.current = true;
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // For sell: amount is in SOL → convert to lamports
        // For buy: amount is in USDC → convert to USDC units (6 decimals)
        const amountUnits = type === "sell"
          ? new BN(amount * LAMPORTS_PER_SOL)
          : new BN(amount * 1e6); // USDC has 6 decimals
        const minOutputUnits = type === "sell"
          ? new BN(minOutput * 1e6) // Output is USDC (6 decimals)
          : new BN(minOutput * LAMPORTS_PER_SOL); // Output is SOL (lamports)

        // Submit ENCRYPTED shielded intent - TRUE PRIVACY
        // Intent data is encrypted client-side before going on-chain
        const { signature, encryptedData } = await client.submitShieldedIntent(
          wallet.publicKey,
          type,
          amountUnits,
          minOutputUnits
        );

        // Store encrypted preview for UI display
        const hex = Buffer.from(encryptedData).toString("hex");
        const preview = `${hex.slice(0, 16)}...${hex.slice(-16)}`;
        setState((prev) => ({
          ...prev,
          lastTxSignature: signature,
          lastEncryptedPreview: preview,
        }));

        // Refresh state to show updated nonce and balances
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refresh();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refresh();

        return signature;
      } catch (err: any) {
        setState((prev) => ({ ...prev, isLoading: false, error: err.message }));
        throw err;
      } finally {
        submissionLockRef.current = false;
      }
    },
    [client, wallet.publicKey, refresh]
  );

  return [
    state,
    {
      initialize,
      registerAgent,
      depositSol,
      depositUsdc,
      withdrawSol,
      withdrawUsdc,
      submitIntent,
      refresh,
    },
  ];
}
