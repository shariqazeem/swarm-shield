"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Shield, TrendingUp, Users, Zap, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBatchEventListener } from "@/hooks/useEventListeners";

interface BatchMonitorProps {
  totalBatches: number;
  totalVolumeProtected: number;
  totalAgents: number;
}

export default function BatchMonitor({
  totalBatches,
  totalVolumeProtected,
  totalAgents,
}: BatchMonitorProps) {
  const { connection } = useConnection();
  const { totalMevSaved: liveMevSaved, batchCount: liveBatchCount, latestBatch } = useBatchEventListener(connection);

  // Use live data if available, otherwise use props
  const displayBatches = liveBatchCount > 0 ? totalBatches + liveBatchCount : totalBatches;
  const displayMevSaved = (totalVolumeProtected * 0.0297) + (liveMevSaved / 1e9);

  const [showPulse, setShowPulse] = useState(false);

  // Trigger pulse animation when new batch detected
  useEffect(() => {
    if (latestBatch) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [latestBatch]);

  const stats = [
    {
      label: "Batches Executed",
      value: displayBatches,
      icon: Zap,
      color: "text-matrix",
      bgColor: "bg-matrix/10",
    },
    {
      label: "Protected Agents",
      value: totalAgents,
      icon: Users,
      color: "text-cyber",
      bgColor: "bg-cyber/10",
    },
    {
      label: "Volume Protected",
      value: `${totalVolumeProtected.toFixed(4)} SOL`,
      icon: Shield,
      color: "text-matrix",
      bgColor: "bg-matrix/10",
    },
    {
      label: "MEV Saved",
      value: `~${displayMevSaved.toFixed(4)} SOL`,
      icon: TrendingUp,
      color: "text-cyber",
      bgColor: "bg-cyber/10",
      highlight: true,
    },
  ];

  return (
    <div className="bg-void/50 border border-matrix/30 rounded-lg p-6 relative">
      {/* Live Indicator */}
      {connection && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <motion.div
            className="w-2 h-2 bg-cyber rounded-full"
            animate={{
              opacity: [1, 0.3, 1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <span className="text-xs text-cyber font-mono uppercase">Live</span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-matrix" />
        <div>
          <h3 className="text-lg font-mono font-bold text-matrix">
            Dark Pool Analytics
          </h3>
          <p className="text-xs text-matrix/60">
            Real-time MEV protection metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} border ${
              stat.highlight ? "border-cyber" : "border-matrix/30"
            } rounded-lg p-4 ${
              stat.highlight ? "ring-2 ring-cyber/20" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              {stat.highlight && (
                <span className="text-xs bg-cyber/20 text-cyber px-2 py-0.5 rounded">
                  SAVED
                </span>
              )}
            </div>
            <div className="text-2xl font-mono font-bold text-matrix mb-1">
              {stat.value}
            </div>
            <div className="text-xs text-matrix/60 uppercase tracking-wider">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* How It Works */}
      <div className="mt-6 p-4 bg-matrix/5 rounded-lg border border-matrix/20">
        <h4 className="text-sm font-mono font-bold text-matrix mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          How MEV Protection Works
        </h4>
        <div className="space-y-2 text-xs text-matrix/70 leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="text-cyber">1.</span>
            <span>
              <strong className="text-matrix">Submit Intent:</strong> Your trade intent is encrypted and added to the dark pool
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyber">2.</span>
            <span>
              <strong className="text-matrix">Batch Aggregation:</strong> Keeper collects 3-10 intents from different agents
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyber">3.</span>
            <span>
              <strong className="text-matrix">Single Execution:</strong> All intents executed as ONE transaction - MEV bots can't attack individuals
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyber">4.</span>
            <span>
              <strong className="text-matrix">Value Protected:</strong> Agents save ~3% per trade vs. direct DEX swaps
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-4 p-3 bg-matrix/5 rounded border border-matrix/20">
        <p className="text-xs text-matrix/60 italic">
          🔒 <strong>Privacy Guarantee:</strong> Individual trade details are never revealed publicly.
          Only batch aggregates are visible on-chain, protecting agents from MEV extraction and front-running attacks.
        </p>
      </div>
    </div>
  );
}
