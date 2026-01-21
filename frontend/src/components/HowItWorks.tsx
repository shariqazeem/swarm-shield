"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Submit Intent",
    description: "Your trade intent is encrypted and submitted to the shielded pool. MEV bots can't see what you're trading.",
    icon: "🔒",
  },
  {
    number: "02",
    title: "Join the Swarm",
    description: "Your intent is batched with other traders. Individual trades become invisible in the crowd.",
    icon: "🐝",
  },
  {
    number: "03",
    title: "Batch Execution",
    description: "Once 3+ intents accumulate, they execute as ONE transaction. MEV bots see a single large trade.",
    icon: "⚡",
  },
  {
    number: "04",
    title: "Fair Settlement",
    description: "Outputs are distributed proportionally. You receive real tokens to your wallet, protected from extraction.",
    icon: "✅",
  },
];

export function HowItWorks() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-white/30 hover:text-white/50 transition-colors underline underline-offset-2"
      >
        How does it work?
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                         md:max-w-2xl md:w-full z-50 overflow-auto"
            >
              <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-white/10 p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-extralight tracking-tight">How SwarmShield Works</h2>
                    <p className="text-white/40 mt-2">MEV protection through collective anonymity</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full border border-white/20 text-white/40
                             hover:border-white/40 hover:text-white transition-colors
                             flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                {/* Steps */}
                <div className="space-y-6">
                  {steps.map((step, i) => (
                    <motion.div
                      key={step.number}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/5 border border-white/10
                                    flex items-center justify-center text-xl">
                        {step.icon}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-white/30 text-xs font-mono">{step.number}</span>
                          <h3 className="text-lg font-light">{step.title}</h3>
                        </div>
                        <p className="text-sm text-white/50 leading-relaxed">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Visual diagram */}
                <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between text-center">
                    <div>
                      <div className="text-2xl mb-2">👤</div>
                      <p className="text-xs text-white/40">You</p>
                    </div>
                    <div className="flex-1 mx-4 border-t border-dashed border-white/20 relative">
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs text-white/30 bg-black px-2">
                        encrypted
                      </span>
                    </div>
                    <div>
                      <div className="text-2xl mb-2">🛡️</div>
                      <p className="text-xs text-white/40">Shield</p>
                    </div>
                    <div className="flex-1 mx-4 border-t border-dashed border-white/20 relative">
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs text-white/30 bg-black px-2">
                        batched
                      </span>
                    </div>
                    <div>
                      <div className="text-2xl mb-2">💱</div>
                      <p className="text-xs text-white/40">DEX</p>
                    </div>
                  </div>
                  <p className="text-center text-xs text-white/30 mt-4">
                    MEV bots see one large trade, not your individual intent
                  </p>
                </div>

                {/* Tech stack */}
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs text-purple-400">
                    Solana
                  </span>
                  <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400">
                    Real Token Transfers
                  </span>
                  <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400">
                    On-Chain Settlement
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
