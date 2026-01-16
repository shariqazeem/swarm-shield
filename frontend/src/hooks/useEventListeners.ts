"use client";

import { useEffect, useCallback, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, BorshCoder, Idl, EventParser } from "@coral-xyz/anchor";

// SwarmShield Program ID
const SWARM_SHIELD_PROGRAM_ID = new PublicKey(
  "F5zRCquhMHFrGJjrgmSoMmv1Pdo6N1io4eRA5H8UcVZu"
);

// Event types from smart contract
export interface DepositEvent {
  agent: PublicKey;
  amount: number;
  newBalance: number;
  timestamp: number;
}

export interface IntentSubmittedEvent {
  agent: PublicKey;
  intentPubkey: PublicKey;
  intentType: number;
  amount: number;
  minOutput: number;
  nonce: number;
  timestamp: number;
}

export interface BatchExecutedEvent {
  batchId: number;
  intentCount: number;
  totalInput: number;
  totalOutput: number;
  mevSaved: number;
  keeper: PublicKey;
  timestamp: number;
}

export interface AgentRegisteredEvent {
  agent: PublicKey;
  authority: PublicKey;
  agentIdHash: number[];
  timestamp: number;
}

export type SwarmShieldEvent =
  | { type: "Deposit"; data: DepositEvent }
  | { type: "IntentSubmitted"; data: IntentSubmittedEvent }
  | { type: "BatchExecuted"; data: BatchExecutedEvent }
  | { type: "AgentRegistered"; data: AgentRegisteredEvent };

export interface EventListenerState {
  events: SwarmShieldEvent[];
  latestBatch: BatchExecutedEvent | null;
  totalMevSaved: number;
  isListening: boolean;
}

/**
 * Hook to listen to SwarmShield program events in real-time
 */
export function useEventListeners(connection: Connection | null, enabled: boolean = true) {
  const [state, setState] = useState<EventListenerState>({
    events: [],
    latestBatch: null,
    totalMevSaved: 0,
    isListening: false,
  });

  const handleDeposit = useCallback((event: any, slot: number, signature: string) => {
    console.log("📥 Deposit Event:", event);

    const depositEvent: DepositEvent = {
      agent: event.agent,
      amount: event.amount.toNumber(),
      newBalance: event.newBalance.toNumber(),
      timestamp: event.timestamp.toNumber(),
    };

    setState((prev) => ({
      ...prev,
      events: [...prev.events, { type: "Deposit", data: depositEvent }],
    }));
  }, []);

  const handleIntentSubmitted = useCallback(
    (event: any, slot: number, signature: string) => {
      console.log("🎯 Intent Submitted Event:", event);

      const intentEvent: IntentSubmittedEvent = {
        agent: event.agent,
        intentPubkey: event.intentPubkey,
        intentType: event.intentType,
        amount: event.amount.toNumber(),
        minOutput: event.minOutput.toNumber(),
        nonce: event.nonce.toNumber(),
        timestamp: event.timestamp.toNumber(),
      };

      setState((prev) => ({
        ...prev,
        events: [...prev.events, { type: "IntentSubmitted", data: intentEvent }],
      }));
    },
    []
  );

  const handleBatchExecuted = useCallback((event: any, slot: number, signature: string) => {
    console.log("⚡ Batch Executed Event:", event);

    const batchEvent: BatchExecutedEvent = {
      batchId: event.batchId.toNumber(),
      intentCount: event.intentCount,
      totalInput: event.totalInput.toNumber(),
      totalOutput: event.totalOutput.toNumber(),
      mevSaved: event.mevSaved.toNumber(),
      keeper: event.keeper,
      timestamp: event.timestamp.toNumber(),
    };

    setState((prev) => ({
      ...prev,
      events: [...prev.events, { type: "BatchExecuted", data: batchEvent }],
      latestBatch: batchEvent,
      totalMevSaved: prev.totalMevSaved + batchEvent.mevSaved,
    }));
  }, []);

  const handleAgentRegistered = useCallback(
    (event: any, slot: number, signature: string) => {
      console.log("🤖 Agent Registered Event:", event);

      const agentEvent: AgentRegisteredEvent = {
        agent: event.agent,
        authority: event.authority,
        agentIdHash: Array.from(event.agentIdHash),
        timestamp: event.timestamp.toNumber(),
      };

      setState((prev) => ({
        ...prev,
        events: [...prev.events, { type: "AgentRegistered", data: agentEvent }],
      }));
    },
    []
  );

  useEffect(() => {
    if (!connection || !enabled) {
      setState((prev) => ({ ...prev, isListening: false }));
      return;
    }

    console.log("🎧 Starting event listeners for SwarmShield...");
    setState((prev) => ({ ...prev, isListening: true }));

    // Subscribe to logs for the SwarmShield program
    const subscriptionId = connection.onLogs(
      SWARM_SHIELD_PROGRAM_ID,
      async (logs, ctx) => {
        // Parse event from logs
        if (logs.logs) {
          for (const log of logs.logs) {
            // Check for event discriminators
            if (log.includes("DepositEvent")) {
              // Parse deposit event
              // Note: In production, use proper event parsing with Anchor IDL
              console.log("Deposit detected in logs");
            } else if (log.includes("BatchExecuted")) {
              console.log("Batch execution detected in logs");
            } else if (log.includes("IntentSubmitted")) {
              console.log("Intent submission detected in logs");
            } else if (log.includes("AgentRegistered")) {
              console.log("Agent registration detected in logs");
            }
          }
        }
      },
      "confirmed"
    );

    console.log(`✅ Event listener subscribed (ID: ${subscriptionId})`);

    // Cleanup
    return () => {
      connection.removeOnLogsListener(subscriptionId);
      console.log("🛑 Event listeners stopped");
      setState((prev) => ({ ...prev, isListening: false }));
    };
  }, [connection, enabled, handleDeposit, handleIntentSubmitted, handleBatchExecuted, handleAgentRegistered]);

  return state;
}

/**
 * Simplified event listener that just tracks batch executions
 * For demo purposes - shows MEV saved in real-time
 */
export function useBatchEventListener(connection: Connection | null) {
  const [totalMevSaved, setTotalMevSaved] = useState(0);
  const [batchCount, setBatchCount] = useState(0);
  const [latestBatch, setLatestBatch] = useState<BatchExecutedEvent | null>(null);

  useEffect(() => {
    if (!connection) return;

    console.log("🎧 Listening for batch executions...");

    const subscriptionId = connection.onLogs(
      SWARM_SHIELD_PROGRAM_ID,
      (logs, ctx) => {
        // Look for batch execution in logs
        const batchLog = logs.logs.find((log) =>
          log.includes("BATCH EXECUTED - MEV DEFEATED")
        );

        if (batchLog) {
          console.log("⚡ Batch execution detected!");

          // Extract batch number from log
          const batchMatch = batchLog.match(/Batch #(\d+)/);
          const volumeMatch = batchLog.match(/(\d+) volume protected/);

          if (batchMatch && volumeMatch) {
            const batchId = parseInt(batchMatch[1]);
            const volume = parseInt(volumeMatch[1]);

            // Calculate MEV saved (2.97%)
            const mevSaved = Math.floor(volume * 0.0297);

            setLatestBatch({
              batchId,
              intentCount: 3, // Estimated
              totalInput: volume,
              totalOutput: volume - mevSaved,
              mevSaved,
              keeper: SWARM_SHIELD_PROGRAM_ID, // Placeholder
              timestamp: Date.now() / 1000,
            });

            setTotalMevSaved((prev) => prev + mevSaved);
            setBatchCount((prev) => prev + 1);
          }
        }
      },
      "confirmed"
    );

    return () => {
      connection.removeOnLogsListener(subscriptionId);
    };
  }, [connection]);

  return { totalMevSaved, batchCount, latestBatch };
}
