"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import Header from "@/components/Header";
import IntentForm from "@/components/IntentForm";
import ActivityTerminal from "@/components/ActivityTerminal";
import BatchMonitor from "@/components/BatchMonitor";
import { Shield, Users, Lock, AlertCircle, CheckCircle2, Loader2, Database, TrendingUp, RefreshCw } from "lucide-react";
import { useSwarmShield } from "@/hooks/useSwarmShield";

interface LogEntry {
  id: number;
  timestamp: string;
  type: "info" | "success" | "warning" | "error" | "batch";
  message: string;
}

export default function Dashboard() {
  const { connected, publicKey } = useWallet();
  const [swarmState, swarmActions] = useSwarmShield();

  // Generate unique log IDs (start at 1 since initial log has id 1)
  const logIdRef = useRef(1);
  const getNextLogId = useCallback(() => {
    logIdRef.current += 1;
    return logIdRef.current;
  }, []);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      timestamp: "00:00:00",
      type: "info",
      message: "SwarmShield Dark Pool - Solana Devnet",
    },
  ]);

  // Track action in progress
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add log entry
  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString("en-US", { hour12: false });
    setLogs((prev) => [
      ...prev.slice(-50),
      { id: getNextLogId(), timestamp, type, message },
    ]);
  }, [getNextLogId]);

  // Log wallet connection
  useEffect(() => {
    if (connected && publicKey) {
      addLog("success", `Wallet connected: ${publicKey.toBase58().slice(0, 8)}...`);
    }
  }, [connected, publicKey, addLog]);

  // Log swarm state changes
  useEffect(() => {
    if (swarmState.isInitialized) {
      addLog("success", "SwarmShield protocol detected on-chain");
    }
    if (swarmState.isAgentRegistered) {
      addLog("success", "Agent registered in the swarm");
    }
  }, [swarmState.isInitialized, swarmState.isAgentRegistered, addLog]);

  // Initialize protocol
  const handleInitialize = useCallback(async () => {
    setActionInProgress("initialize");
    addLog("info", "Initializing SwarmShield protocol on-chain...");
    try {
      const tx = await swarmActions.initialize();
      if (tx === "already-initialized") {
        addLog("success", "Protocol was already initialized - ready to use!");
      } else {
        addLog("success", `Protocol initialized! TX: ${tx.slice(0, 16)}...`);
      }
      addLog("success", "State refreshed - protocol is now active!");
    } catch (err: any) {
      console.error("Initialize error:", err);
      addLog("error", `Initialize failed: ${err.message || err.toString()}`);
    } finally {
      setActionInProgress(null);
    }
  }, [swarmActions, addLog]);

  // Register agent
  const handleRegisterAgent = useCallback(async () => {
    setActionInProgress("register");
    addLog("info", "Registering agent in the swarm...");
    try {
      const tx = await swarmActions.registerAgent();
      if (tx === "already-registered") {
        addLog("success", "Agent was already registered - ready to use!");
      } else {
        addLog("success", `Agent registered! TX: ${tx.slice(0, 16)}...`);
      }
      addLog("success", "You can now deposit tokens and submit intents!");
    } catch (err: any) {
      addLog("error", `Registration failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  }, [swarmActions, addLog]);

  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    addLog("info", "Refreshing balances...");
    try {
      await swarmActions.refresh();
      addLog("success", "Balances updated!");
    } catch (err: any) {
      addLog("error", `Refresh failed: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [swarmActions, addLog]);

  // Deposit SOL
  const handleDeposit = useCallback(async (amount: number) => {
    setActionInProgress("deposit");
    addLog("info", `Depositing ${amount} SOL to shielded vault...`);
    try {
      const tx = await swarmActions.depositSol(amount);
      addLog("success", `Deposited ${amount} SOL! TX: ${tx.slice(0, 16)}...`);
      addLog("info", "Waiting for confirmation and updating balance...");
      addLog("info", "⚠️ If balance doesn't update, click the Refresh button");
    } catch (err: any) {
      addLog("error", `Deposit failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  }, [swarmActions, addLog]);

  // Withdraw SOL
  const handleWithdrawSol = useCallback(async () => {
    if (!swarmState.agent) return;
    const balance = swarmState.agent.solBalance.toNumber() / 1e9;
    if (balance <= 0) {
      addLog("error", "No SOL balance to withdraw");
      return;
    }
    setActionInProgress("withdraw");
    addLog("info", `Withdrawing ${balance.toFixed(4)} SOL from shielded vault...`);
    try {
      const tx = await swarmActions.withdrawSol(balance);
      addLog("success", `Withdrawn ${balance.toFixed(4)} SOL! TX: ${tx.slice(0, 16)}...`);
    } catch (err: any) {
      addLog("error", `Withdraw failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  }, [swarmActions, swarmState.agent, addLog]);

  // Handle intent submission - REAL on-chain transaction
  const handleIntentSubmit = useCallback(
    async (intent: { type: "buy" | "sell"; amount: number; slippage: number }) => {
      setActionInProgress("intent");
      const tokenLabel = intent.type === "buy" ? "USDC" : "SOL";
      addLog("info", `Submitting shielded ${intent.type.toUpperCase()} intent: ${intent.amount} ${tokenLabel}`);

      try {
        const minOutput = intent.amount * (1 - intent.slippage / 100);
        const tx = await swarmActions.submitIntent(intent.type, intent.amount, minOutput);

        addLog("success", `Intent submitted! TX: ${tx.slice(0, 16)}...`);
        addLog("info", "Intent queued for batch execution by keeper");
        addLog("info", `Keeper will batch when 3+ intents are pending (expires in ~4 min)`);
        addLog("info", "💡 TIP: Submit 2 more intents to trigger immediate batching");
      } catch (err: any) {
        console.error("Intent error:", err);
        if (err.message?.includes("InsufficientBalance")) {
          addLog("error", `Insufficient balance! Need ${intent.amount} ${tokenLabel} in vault.`);
        } else {
          addLog("error", `Intent submission failed: ${err.message}`);
        }
        throw err;
      } finally {
        setActionInProgress(null);
      }
    },
    [swarmActions, addLog]
  );

  // Show registration panel if not registered
  const showRegistrationPanel = connected && swarmState.isInitialized && !swarmState.isAgentRegistered;
  const showDepositPanel = connected && swarmState.isAgentRegistered && swarmState.agent && swarmState.agent.solBalance.toNumber() === 0;

  // Calculate stats from real on-chain data
  const totalAgents = swarmState.config?.totalAgents.toNumber() || 0;
  const totalBatches = swarmState.config?.totalBatches.toNumber() || 0;
  const totalVolume = swarmState.config?.totalVolumeProtected.toNumber() || 0;

  return (
    <div className="min-h-screen bg-void">
      <Header walletBalance={swarmState.walletBalance} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Connection Status Banner */}
        {!connected && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-mev-red/10 border border-mev-red/30 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-mev-red" />
            <div>
              <p className="text-sm text-mev-red font-mono">Wallet Not Connected</p>
              <p className="text-xs text-mev-red/60">
                Connect your Solana wallet to interact with SwarmShield on Devnet
              </p>
            </div>
          </motion.div>
        )}

        {/* Protocol Not Initialized Banner */}
        {connected && !swarmState.isLoading && !swarmState.isInitialized && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cyber/10 border border-cyber/30 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-cyber" />
              <div>
                <p className="text-sm text-cyber font-mono">Protocol Not Initialized</p>
                <p className="text-xs text-cyber/60">
                  Initialize the SwarmShield protocol on devnet to get started
                </p>
              </div>
            </div>
            <motion.button
              onClick={handleInitialize}
              disabled={actionInProgress !== null}
              className="px-4 py-2 bg-cyber/20 border border-cyber text-cyber rounded-lg text-sm font-mono
                       hover:bg-cyber/30 transition-colors disabled:opacity-50 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {actionInProgress === "initialize" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                "Initialize Protocol"
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Agent Registration Banner */}
        {showRegistrationPanel && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-matrix/10 border border-matrix/30 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-matrix" />
              <div>
                <p className="text-sm text-matrix font-mono">Register Your Agent</p>
                <p className="text-xs text-matrix/60">
                  Register to join the swarm and start submitting shielded intents
                </p>
              </div>
            </div>
            <motion.button
              onClick={handleRegisterAgent}
              disabled={actionInProgress !== null}
              className="px-4 py-2 bg-matrix/20 border border-matrix text-matrix rounded-lg text-sm font-mono
                       hover:bg-matrix/30 transition-colors disabled:opacity-50 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {actionInProgress === "register" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Agent"
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Deposit Required Banner */}
        {showDepositPanel && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-shield/10 border border-shield/30 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-shield" />
              <div>
                <p className="text-sm text-shield font-mono">Deposit SOL to Vault</p>
                <p className="text-xs text-shield/60">
                  Deposit SOL to your shielded balance to submit trade intents
                </p>
              </div>
            </div>
            <motion.button
              onClick={() => handleDeposit(0.1)}
              disabled={actionInProgress !== null}
              className="px-4 py-2 bg-shield/20 border border-shield text-shield rounded-lg text-sm font-mono
                       hover:bg-shield/30 transition-colors disabled:opacity-50 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {actionInProgress === "deposit" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Depositing...
                </>
              ) : (
                "Deposit 0.1 SOL"
              )}
            </motion.button>
          </motion.div>
        )}

        {/* On-Chain Stats - Real Data */}
        {connected && swarmState.isInitialized && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="bg-void border border-matrix/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-matrix" />
                <span className="text-xs text-matrix/60 uppercase tracking-wider">Total Agents</span>
              </div>
              <p className="text-2xl font-bold text-matrix">{totalAgents}</p>
            </div>

            <div className="bg-void border border-cyber/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-cyber" />
                <span className="text-xs text-cyber/60 uppercase tracking-wider">Batches Executed</span>
              </div>
              <p className="text-2xl font-bold text-cyber">{totalBatches}</p>
            </div>

            <div className="bg-void border border-shield/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-shield" />
                <span className="text-xs text-shield/60 uppercase tracking-wider">Volume Protected</span>
              </div>
              <p className="text-2xl font-bold text-shield">{(totalVolume / 1e9).toFixed(4)} SOL</p>
            </div>

            <div className="bg-void border border-matrix/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-matrix" />
                <span className="text-xs text-matrix/60 uppercase tracking-wider">Vault Balance</span>
              </div>
              <p className="text-2xl font-bold text-matrix">{swarmState.vaultBalance.toFixed(4)} SOL</p>
            </div>
          </motion.div>
        )}

        {/* Agent Status */}
        {connected && swarmState.isAgentRegistered && swarmState.agent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-matrix/5 border border-matrix/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-matrix" />
                <span className="text-sm text-matrix font-mono">Your Agent Status</span>
              </div>
              <motion.button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 bg-matrix/10 border border-matrix/30 text-matrix rounded-lg text-xs font-mono
                         hover:bg-matrix/20 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </motion.button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs font-mono">
              <div>
                <span className="text-matrix/40">Shielded SOL</span>
                <p className="text-matrix text-lg">{(swarmState.agent.solBalance.toNumber() / 1e9).toFixed(4)} SOL</p>
                {swarmState.agent.solBalance.toNumber() > 0 && (
                  <button
                    onClick={handleWithdrawSol}
                    disabled={actionInProgress === "withdraw"}
                    className="mt-1 px-2 py-0.5 bg-matrix/20 border border-matrix/40 text-matrix rounded text-[10px] hover:bg-matrix/30 disabled:opacity-50"
                  >
                    {actionInProgress === "withdraw" ? "..." : "Withdraw All"}
                  </button>
                )}
              </div>
              <div>
                <span className="text-shield/40">Shielded USDC</span>
                <p className="text-shield text-lg">{(swarmState.agent.usdcBalance.toNumber() / 1e6).toFixed(2)} USDC</p>
                <span className="text-[10px] text-shield/40">(simulated)</span>
              </div>
              <div>
                <span className="text-matrix/40">Agent Nonce</span>
                <p className="text-matrix text-lg">{swarmState.agent.nonce.toNumber()}</p>
              </div>
              <div>
                <span className="text-matrix/40">Status</span>
                <p className="text-matrix text-lg">{swarmState.agent.isActive ? "Active" : "Inactive"}</p>
              </div>
              <div>
                <span className="text-matrix/40">Wallet Balance</span>
                <p className="text-cyber text-lg">{swarmState.walletBalance.toFixed(4)} SOL</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Dark Pool Analytics */}
        {swarmState.isInitialized && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <BatchMonitor
              totalBatches={swarmState.config?.totalBatches.toNumber() || 0}
              totalVolumeProtected={(swarmState.config?.totalVolumeProtected.toNumber() || 0) / 1e9}
              totalAgents={swarmState.config?.totalAgents.toNumber() || 0}
            />
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Intent Submission Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-void border border-matrix/30 rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-matrix/20 bg-matrix/5">
                <Shield className="w-4 h-4 text-matrix" />
                <span className="text-sm text-matrix font-mono uppercase tracking-wider">
                  Submit Shielded Intent
                </span>
              </div>
              <div className="p-6">
                <IntentForm
                  onSubmit={handleIntentSubmit}
                  isConnected={connected && swarmState.isAgentRegistered}
                />
                <div className="mt-4 p-3 bg-cyber/5 border border-cyber/20 rounded-lg">
                  <p className="text-xs text-cyber/60 mb-2">How it works:</p>
                  <ul className="text-xs text-cyber/80 space-y-1">
                    <li>• Your intent is encrypted and stored on-chain</li>
                    <li>• A keeper batches multiple intents together</li>
                    <li>• Batch execution hides individual agent activity</li>
                    <li>• MEV bots cannot front-run your transaction</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Activity Terminal */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ActivityTerminal logs={logs} />
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-matrix/10 mt-8">
          <p className="text-xs text-matrix/30 font-mono">
            SwarmShield v0.1.0-alpha | Solana Privacy Hackathon 2026
          </p>
          <p className="text-xs text-matrix/20 font-mono mt-1">
            Dark Liquidity Pool for Autonomous AI Agents
          </p>
        </footer>
      </main>
    </div>
  );
}
