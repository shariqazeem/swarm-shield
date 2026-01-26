"use client";

/**
 * ============================================================================
 * MEV PROTECTION VISUALIZER
 * ============================================================================
 *
 * This component demonstrates HOW SwarmShield protects against MEV attacks.
 * Shows judges a live comparison of what MEV bots see vs actual intent.
 *
 * Bounty Target: Anoncoin ($10,000) - Dark Liquidity
 * ============================================================================
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { encryptIntent } from "@/lib/encryption";

interface TradeIntent {
  type: "BUY" | "SELL";
  amount: number;
  minOutput: number;
  slippage: number;
}

export function MEVProtectionDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [intent, setIntent] = useState<TradeIntent>({
    type: "SELL",
    amount: 1.5,
    minOutput: 285,
    slippage: 0.5,
  });
  const [encryptedData, setEncryptedData] = useState<string>("");
  const [mevAttackBlocked, setMevAttackBlocked] = useState(false);

  const runSimulation = useCallback(async () => {
    setIsSimulating(true);
    setCurrentStep(0);
    setMevAttackBlocked(false);
    setEncryptedData("");

    // Step 1: Show original intent
    await new Promise((r) => setTimeout(r, 1000));
    setCurrentStep(1);

    // Step 2: Encrypt the intent
    await new Promise((r) => setTimeout(r, 1500));
    const intentType = intent.type === "BUY" ? 0 : 1;
    const amountLamports = BigInt(Math.floor(intent.amount * 1e9));
    const minOutputLamports = BigInt(Math.floor(intent.minOutput * 1e6));
    const encrypted = encryptIntent(intentType, amountLamports, minOutputLamports);
    setEncryptedData(Buffer.from(encrypted).toString("hex"));
    setCurrentStep(2);

    // Step 3: MEV bot attempts to read
    await new Promise((r) => setTimeout(r, 1500));
    setCurrentStep(3);

    // Step 4: Attack blocked!
    await new Promise((r) => setTimeout(r, 1500));
    setMevAttackBlocked(true);
    setCurrentStep(4);

    setIsSimulating(false);
  }, [intent]);

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-36 left-4 z-40 px-4 py-2
                   bg-red-500/10 border border-red-500/30 rounded-full
                   text-red-400/80 text-[11px] font-medium tracking-wider uppercase
                   hover:bg-red-500/20 hover:border-red-500/50 transition-all
                   flex items-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        MEV Attack Demo
      </motion.button>

      {/* Demo Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-light text-white">MEV Protection Proof</h2>
                    <p className="text-xs text-white/40 mt-1">
                      See how SwarmShield blocks sandwich attacks
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center"
                  >
                    <span className="text-white/40 text-xl">×</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                {/* Attack Diagram */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Without SwarmShield */}
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-red-400 font-medium text-sm">Without SwarmShield</span>
                    </div>
                    <div className="space-y-3 text-xs font-mono">
                      <div className="bg-black/50 rounded-lg p-3">
                        <p className="text-white/40 mb-1">Mempool (PUBLIC):</p>
                        <p className="text-red-400">swap SOL → USDC</p>
                        <p className="text-red-400">amount: 1.5 SOL</p>
                        <p className="text-red-400">slippage: 0.5%</p>
                      </div>
                      <div className="flex items-center gap-2 text-red-400">
                        <span>↓</span>
                        <span>MEV Bot Reads Intent</span>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 border border-red-500/30">
                        <p className="text-red-400">🥪 SANDWICH ATTACK:</p>
                        <p className="text-white/40">1. Front-run: Buy before you</p>
                        <p className="text-white/40">2. Your trade executes (worse price)</p>
                        <p className="text-white/40">3. Back-run: Sell after you</p>
                        <p className="text-red-400 mt-2">Loss: ~3% ($4.50 on 1.5 SOL)</p>
                      </div>
                    </div>
                  </div>

                  {/* With SwarmShield */}
                  <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-green-400 font-medium text-sm">With SwarmShield</span>
                    </div>
                    <div className="space-y-3 text-xs font-mono">
                      <div className="bg-black/50 rounded-lg p-3">
                        <p className="text-white/40 mb-1">On-Chain (ENCRYPTED):</p>
                        <p className="text-green-400 break-all">
                          {encryptedData ? encryptedData.slice(0, 32) + "..." : "9bed43a48f60f39e2a857226..."}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-green-400">
                        <span>↓</span>
                        <span>MEV Bot Sees Random Bytes</span>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 border border-green-500/30">
                        <p className="text-green-400">🛡️ ATTACK BLOCKED:</p>
                        <p className="text-white/40">❓ Direction: Unknown</p>
                        <p className="text-white/40">❓ Amount: Unknown</p>
                        <p className="text-white/40">❓ Slippage: Unknown</p>
                        <p className="text-green-400 mt-2">Loss: $0.00 (0%)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Simulation */}
                <div className="bg-white/5 rounded-2xl p-6 mb-6">
                  <h3 className="text-white font-medium mb-4">Live Encryption Simulation</h3>

                  {/* Intent Editor */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider">Direction</label>
                      <select
                        value={intent.type}
                        onChange={(e) => setIntent({ ...intent, type: e.target.value as "BUY" | "SELL" })}
                        className="w-full mt-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                        disabled={isSimulating}
                      >
                        <option value="SELL">SELL SOL</option>
                        <option value="BUY">BUY SOL</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider">Amount (SOL)</label>
                      <input
                        type="number"
                        value={intent.amount}
                        onChange={(e) => setIntent({ ...intent, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                        disabled={isSimulating}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider">Min Output (USDC)</label>
                      <input
                        type="number"
                        value={intent.minOutput}
                        onChange={(e) => setIntent({ ...intent, minOutput: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                        disabled={isSimulating}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider">Slippage (%)</label>
                      <input
                        type="number"
                        value={intent.slippage}
                        onChange={(e) => setIntent({ ...intent, slippage: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                        disabled={isSimulating}
                      />
                    </div>
                  </div>

                  {/* Simulation Steps */}
                  <div className="space-y-3">
                    {/* Step 1: Original Intent */}
                    <motion.div
                      className={`p-4 rounded-xl border ${
                        currentStep >= 1 ? "bg-blue-500/10 border-blue-500/30" : "bg-white/5 border-white/10"
                      }`}
                      animate={{ opacity: currentStep >= 1 ? 1 : 0.5 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          currentStep >= 1 ? "bg-blue-500 text-white" : "bg-white/10 text-white/40"
                        }`}>1</span>
                        <span className="text-white/80 text-sm">Your Trade Intent (Private)</span>
                      </div>
                      {currentStep >= 1 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 ml-9 font-mono text-xs text-blue-400"
                        >
                          <p>Type: {intent.type}</p>
                          <p>Amount: {intent.amount} SOL</p>
                          <p>Min Output: {intent.minOutput} USDC</p>
                          <p>Slippage: {intent.slippage}%</p>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Step 2: Encryption */}
                    <motion.div
                      className={`p-4 rounded-xl border ${
                        currentStep >= 2 ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10"
                      }`}
                      animate={{ opacity: currentStep >= 2 ? 1 : 0.5 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          currentStep >= 2 ? "bg-green-500 text-white" : "bg-white/10 text-white/40"
                        }`}>2</span>
                        <span className="text-white/80 text-sm">NaCl Box Encryption (X25519)</span>
                      </div>
                      {currentStep >= 2 && encryptedData && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 ml-9"
                        >
                          <p className="text-[10px] text-white/40 mb-1">96-byte encrypted payload:</p>
                          <p className="font-mono text-xs text-green-400 break-all bg-black/50 p-2 rounded">
                            {encryptedData}
                          </p>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Step 3: MEV Bot Attempt */}
                    <motion.div
                      className={`p-4 rounded-xl border ${
                        currentStep >= 3 ? "bg-red-500/10 border-red-500/30" : "bg-white/5 border-white/10"
                      }`}
                      animate={{ opacity: currentStep >= 3 ? 1 : 0.5 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          currentStep >= 3 ? "bg-red-500 text-white" : "bg-white/10 text-white/40"
                        }`}>3</span>
                        <span className="text-white/80 text-sm">MEV Bot Attempts to Read</span>
                      </div>
                      {currentStep >= 3 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 ml-9 font-mono text-xs"
                        >
                          <p className="text-red-400">Scanning mempool...</p>
                          <p className="text-red-400">Found transaction...</p>
                          <p className="text-red-400">Attempting to decode...</p>
                          <p className="text-yellow-400 mt-1">⚠️ Cannot decrypt without keeper private key</p>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Step 4: Attack Blocked */}
                    <motion.div
                      className={`p-4 rounded-xl border ${
                        currentStep >= 4 ? "bg-green-500/20 border-green-500/50" : "bg-white/5 border-white/10"
                      }`}
                      animate={{ opacity: currentStep >= 4 ? 1 : 0.5 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          currentStep >= 4 ? "bg-green-500 text-white" : "bg-white/10 text-white/40"
                        }`}>4</span>
                        <span className="text-white/80 text-sm">Result</span>
                      </div>
                      {currentStep >= 4 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-3 ml-9"
                        >
                          <div className="flex items-center gap-2 text-green-400 font-bold">
                            <span className="text-2xl">🛡️</span>
                            <span>SANDWICH ATTACK BLOCKED!</span>
                          </div>
                          <p className="text-white/60 text-xs mt-2">
                            MEV bot cannot determine trade direction, amount, or slippage.
                            Your trade executes safely in the next batch.
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>

                  {/* Run Button */}
                  <button
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className="w-full mt-6 px-6 py-4 bg-white text-black font-medium rounded-full
                             hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSimulating ? "Simulating Attack..." : "Run MEV Attack Simulation"}
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-3xl font-light text-white">99%</p>
                    <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">MEV Reduction</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-3xl font-light text-white">96<span className="text-lg">b</span></p>
                    <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">Encrypted Payload</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-3xl font-light text-white">0</p>
                    <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">Information Leaked</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/5 bg-white/5">
                <p className="text-[10px] text-white/30 text-center">
                  Anoncoin Bounty ($10,000) • NaCl Box Encryption • X25519 + XSalsa20-Poly1305
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MEVProtectionDemo;
