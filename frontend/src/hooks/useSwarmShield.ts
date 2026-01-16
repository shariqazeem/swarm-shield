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
  isLoading: boolean;
  error: string | null;
}

export interface SwarmShieldActions {
  initialize: () => Promise<string>;
  registerAgent: () => Promise<string>;
  depositSol: (amount: number) => Promise<string>;
  withdrawSol: (amount: number) => Promise<string>;
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
    isLoading: true,
    error: null,
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

  // Fetch state
  const refresh = useCallback(async () => {
    if (!client || !wallet.publicKey) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

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

      setState({
        isInitialized,
        isAgentRegistered,
        config,
        agent,
        walletBalance,
        vaultBalance,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.error("Error fetching state:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || "Failed to fetch state",
      }));
    }
  }, [client, wallet.publicKey]);

  // Refresh on mount and when client changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Actions
  const initialize = useCallback(async (): Promise<string> => {
    if (!client || !wallet.publicKey) throw new Error("Wallet not connected");
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const tx = await client.initialize(wallet.publicKey, 3, 10);
      await refresh();
      return tx;
    } catch (err: any) {
      setState((prev) => ({ ...prev, isLoading: false, error: err.message }));
      throw err;
    }
  }, [client, wallet.publicKey, refresh]);

  const registerAgent = useCallback(async (): Promise<string> => {
    if (!client || !wallet.publicKey) throw new Error("Wallet not connected");
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const tx = await client.registerAgent(wallet.publicKey);
      await refresh();
      return tx;
    } catch (err: any) {
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
        const amountLamports = new BN(amount * LAMPORTS_PER_SOL);
        const minOutputLamports = new BN(minOutput * LAMPORTS_PER_SOL);

        // Submit intent - client now properly waits for confirmation
        const tx = await client.submitIntent(
          wallet.publicKey,
          type,
          amountLamports,
          minOutputLamports
        );

        // Refresh state to show updated nonce and balances
        await refresh();

        return tx;
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
      withdrawSol,
      submitIntent,
      refresh,
    },
  ];
}
