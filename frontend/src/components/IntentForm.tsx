"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRightLeft, Shield, Loader2, Lock } from "lucide-react";

interface IntentFormProps {
  onSubmit: (intent: {
    type: "buy" | "sell";
    amount: number;
    slippage: number;
  }) => Promise<void>;
  isConnected: boolean;
}

export default function IntentForm({ onSubmit, isConnected }: IntentFormProps) {
  const [intentType, setIntentType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        type: intentType,
        amount: parseFloat(amount),
        slippage: parseFloat(slippage),
      });
      setAmount("");
    } catch (err) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Intent Type Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setIntentType("buy")}
          className={`py-3 px-2 rounded-lg font-mono text-sm transition-all ${
            intentType === "buy"
              ? "bg-matrix/20 border border-matrix text-matrix"
              : "bg-void border border-matrix/30 text-matrix/60 hover:border-matrix/50"
          }`}
        >
          <div className="font-bold">Buy SOL</div>
          <div className="text-xs opacity-60">Spend USDC</div>
        </button>
        <button
          type="button"
          onClick={() => setIntentType("sell")}
          className={`py-3 px-2 rounded-lg font-mono text-sm transition-all ${
            intentType === "sell"
              ? "bg-cyber/20 border border-cyber text-cyber"
              : "bg-void border border-matrix/30 text-matrix/60 hover:border-matrix/50"
          }`}
        >
          <div className="font-bold">Sell SOL</div>
          <div className="text-xs opacity-60">Get USDC</div>
        </button>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-xs text-matrix/40 uppercase tracking-wider mb-2">
          {intentType === "buy" ? "Amount (USDC to spend)" : "Amount (SOL to sell)"}
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-void border border-matrix/30 rounded-lg px-4 py-3 text-matrix font-mono text-lg
                     focus:outline-none focus:border-matrix placeholder:text-matrix/20"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-matrix/60 font-mono">
            {intentType === "buy" ? "USDC" : "SOL"}
          </div>
        </div>
        <p className="mt-1 text-xs text-matrix/40">
          {intentType === "buy"
            ? "Swap USDC → SOL at best rate"
            : "Swap SOL → USDC at best rate"}
        </p>
      </div>

      {/* Slippage */}
      <div>
        <label className="block text-xs text-matrix/40 uppercase tracking-wider mb-2">
          Max Slippage Tolerance
        </label>
        <div className="grid grid-cols-4 gap-2">
          {["0.5", "1", "2", "3"].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setSlippage(val)}
              className={`py-2 rounded-lg font-mono text-xs transition-all ${
                slippage === val
                  ? "bg-matrix/20 border border-matrix text-matrix"
                  : "bg-void border border-matrix/30 text-matrix/60 hover:border-matrix/50"
              }`}
            >
              {val}%
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-start gap-3 p-3 bg-matrix/5 rounded-lg border border-matrix/20">
        <Shield className="w-4 h-4 text-matrix shrink-0 mt-0.5" />
        <div className="text-xs text-matrix/70 leading-relaxed">
          <strong>Privacy Enabled:</strong> Your intent will be encrypted and batched with other agents.
          MEV bots cannot see your individual trade until batch execution.
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={!isConnected || !amount || isSubmitting}
        className={`w-full py-4 rounded-lg font-mono text-sm font-bold transition-all flex items-center justify-center gap-2
                 ${
                   isConnected && amount && !isSubmitting
                     ? "bg-matrix/20 border-2 border-matrix text-matrix hover:bg-matrix/30"
                     : "bg-matrix/5 border-2 border-matrix/20 text-matrix/40 cursor-not-allowed"
                 }`}
        whileHover={isConnected && amount && !isSubmitting ? { scale: 1.02 } : {}}
        whileTap={isConnected && amount && !isSubmitting ? { scale: 0.98 } : {}}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting Intent to Dark Pool...
          </>
        ) : !isConnected ? (
          <>
            <Lock className="w-4 h-4" />
            Connect Wallet & Register First
          </>
        ) : (
          <>
            <ArrowRightLeft className="w-4 h-4" />
            Submit Shielded Intent
          </>
        )}
      </motion.button>
    </form>
  );
}
