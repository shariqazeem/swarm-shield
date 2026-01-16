"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { AlertTriangle, Shield, Eye, EyeOff } from "lucide-react";

interface Transaction {
  id: number;
  type: "user" | "frontrun" | "backrun" | "swap";
  label: string;
  amount: number;
}

export default function MEVRadar() {
  // Public side state (getting sandwiched)
  const [publicTxs, setPublicTxs] = useState<Transaction[]>([]);
  const [publicFlash, setPublicFlash] = useState(false);
  const [lossAmount, setLossAmount] = useState(0);

  // Shielded side state
  const [shieldedActive, setShieldedActive] = useState(false);
  const [shieldedGlow, setShieldedGlow] = useState(false);

  // Simulate public side sandwich attack
  useEffect(() => {
    const runPublicDemo = () => {
      // Clear previous
      setPublicTxs([]);
      setPublicFlash(false);

      // User submits transaction (visible)
      setTimeout(() => {
        setPublicTxs([{ id: 1, type: "user", label: "User A: Buy 10 SOL", amount: 1000 }]);
      }, 500);

      // MEV bot front-runs
      setTimeout(() => {
        setPublicTxs((prev) => [
          { id: 2, type: "frontrun", label: "🤖 MEV: Front-run Buy", amount: 5000 },
          ...prev,
        ]);
        setPublicFlash(true);
      }, 1500);

      // User's tx executes (at worse price)
      setTimeout(() => {
        setPublicFlash(false);
      }, 2000);

      // MEV bot back-runs
      setTimeout(() => {
        setPublicTxs((prev) => [
          ...prev,
          { id: 3, type: "backrun", label: "🤖 MEV: Back-run Sell", amount: 5050 },
        ]);
        setLossAmount((prev) => prev + 47.50);
      }, 2500);

      // Clear and restart
      setTimeout(() => {
        setPublicTxs([]);
      }, 5000);
    };

    const interval = setInterval(runPublicDemo, 6000);
    runPublicDemo();
    return () => clearInterval(interval);
  }, []);

  // Simulate shielded side
  useEffect(() => {
    const runShieldedDemo = () => {
      setShieldedActive(true);
      setShieldedGlow(true);

      setTimeout(() => {
        setShieldedGlow(false);
      }, 2000);

      setTimeout(() => {
        setShieldedActive(false);
      }, 4000);
    };

    const interval = setInterval(runShieldedDemo, 6000);
    setTimeout(runShieldedDemo, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* LEFT SIDE: Public (Vulnerable) */}
      <div className="relative">
        <motion.div
          className="bg-void border border-mev-red/30 rounded-xl p-4 h-[300px] overflow-hidden"
          animate={{
            boxShadow: publicFlash
              ? "0 0 30px rgba(255, 0, 0, 0.5), inset 0 0 30px rgba(255, 0, 0, 0.1)"
              : "0 0 10px rgba(255, 0, 0, 0.1)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-mev-red" />
              <span className="text-sm text-mev-red uppercase tracking-wider">
                Public Mempool
              </span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-mev-red" />
              <span className="text-xs text-mev-red">VULNERABLE</span>
            </div>
          </div>

          {/* Transaction Flow */}
          <div className="space-y-2 mb-4">
            <AnimatePresence mode="popLayout">
              {publicTxs.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className={`p-2 rounded-lg text-xs font-mono ${
                    tx.type === "user"
                      ? "bg-white/10 border border-white/20 text-white"
                      : tx.type === "frontrun"
                      ? "bg-mev-red/20 border border-mev-red/50 text-mev-red"
                      : "bg-mev-red/20 border border-mev-red/50 text-mev-red"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{tx.label}</span>
                    <span className="opacity-60">${tx.amount}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Loss Counter */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-mev-red/10 border border-mev-red/30 rounded-lg p-3">
              <div className="text-xs text-mev-red/60 uppercase mb-1">
                Value Lost to MEV
              </div>
              <motion.div
                className="text-2xl font-bold text-mev-red font-mono"
                key={lossAmount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                -${lossAmount.toFixed(2)}
              </motion.div>
            </div>
          </div>

          {/* Scan Effect (Red) */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: publicFlash ? 1 : 0 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-mev-red/20 to-transparent" />
          </motion.div>

          {/* Watching Eye */}
          <motion.div
            className="absolute top-4 right-4"
            animate={{
              scale: publicTxs.length > 0 ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            <Eye className="w-6 h-6 text-mev-red/50" />
          </motion.div>
        </motion.div>

        {/* Label */}
        <div className="text-center mt-2 text-xs text-mev-red/60">
          Without SwarmShield
        </div>
      </div>

      {/* RIGHT SIDE: Shielded (Protected) */}
      <div className="relative">
        <motion.div
          className="bg-void border border-matrix/30 rounded-xl p-4 h-[300px] overflow-hidden"
          animate={{
            boxShadow: shieldedGlow
              ? "0 0 30px rgba(0, 255, 0, 0.5), inset 0 0 30px rgba(0, 255, 0, 0.1)"
              : "0 0 10px rgba(0, 255, 0, 0.1)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-matrix" />
              <span className="text-sm text-matrix uppercase tracking-wider">
                Shielded Pool
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-matrix" />
              <span className="text-xs text-matrix">PROTECTED</span>
            </div>
          </div>

          {/* Shielded Visualization */}
          <div className="flex items-center justify-center h-32 relative">
            {/* Shield Icon */}
            <motion.div
              className="relative"
              animate={{
                scale: shieldedActive ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 1, repeat: shieldedActive ? Infinity : 0 }}
            >
              <div className="w-20 h-20 rounded-full bg-matrix/10 border-2 border-matrix/50 flex items-center justify-center">
                <Shield className="w-10 h-10 text-matrix" />
              </div>

              {/* Orbiting Agents */}
              <AnimatePresence>
                {shieldedActive && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute w-3 h-3 bg-matrix rounded-full"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 1,
                          rotate: 360,
                        }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{
                          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                          delay: i * 0.3,
                        }}
                        style={{
                          top: "50%",
                          left: "50%",
                          transformOrigin: `${40 + i * 10}px 0`,
                          boxShadow: "0 0 10px #00FF00",
                        }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Status Text */}
            <motion.div
              className="absolute bottom-0 text-center"
              animate={{ opacity: shieldedActive ? 1 : 0.5 }}
            >
              <div className="text-xs text-matrix/60">
                {shieldedActive ? "Batching 3 Agents..." : "Awaiting Intents"}
              </div>
            </motion.div>
          </div>

          {/* Protected Stats */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-matrix/10 border border-matrix/30 rounded-lg p-3">
              <div className="text-xs text-matrix/60 uppercase mb-1">
                MEV Visibility
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-void rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-matrix"
                    animate={{ width: "0%" }}
                  />
                </div>
                <span className="text-sm font-bold text-matrix">0%</span>
              </div>
              <div className="text-xs text-matrix/40 mt-1">
                Bots see nothing
              </div>
            </div>
          </div>

          {/* Scan Effect (Green) */}
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            animate={{ opacity: shieldedGlow ? 0.5 : 0.2 }}
          >
            <motion.div
              className="absolute w-full h-1 bg-gradient-to-r from-transparent via-matrix to-transparent"
              animate={{ y: [-10, 300] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </motion.div>

        {/* Label */}
        <div className="text-center mt-2 text-xs text-matrix/60">
          With SwarmShield
        </div>
      </div>
    </div>
  );
}
