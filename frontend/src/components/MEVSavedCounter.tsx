"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { Shield, TrendingUp, Zap } from "lucide-react";

interface MEVSavedCounterProps {
  totalSaved: number;
  attacksPrevented: number;
  lastSaveAmount?: number;
}

function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (latest) =>
    `${prefix}${latest.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

export default function MEVSavedCounter({
  totalSaved,
  attacksPrevented,
  lastSaveAmount,
}: MEVSavedCounterProps) {
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (lastSaveAmount && lastSaveAmount > 0) {
      setShowFlash(true);
      const timeout = setTimeout(() => setShowFlash(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [lastSaveAmount, totalSaved]);

  return (
    <div className="relative">
      {/* Main Counter Card */}
      <motion.div
        className="relative bg-void border border-matrix/30 rounded-xl p-6 overflow-hidden"
        animate={{
          boxShadow: showFlash
            ? "0 0 40px rgba(0, 255, 0, 0.5)"
            : "0 0 20px rgba(0, 255, 0, 0.1)",
        }}
      >
        {/* Background Pulse */}
        <motion.div
          className="absolute inset-0 bg-matrix/5"
          animate={{
            opacity: showFlash ? [0, 0.3, 0] : 0,
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-matrix" />
          <span className="text-sm text-matrix/60 uppercase tracking-wider">
            MEV Protection Active
          </span>
          <motion.div
            className="w-2 h-2 rounded-full bg-matrix ml-auto"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>

        {/* Main Value */}
        <div className="mb-6">
          <div className="text-xs text-matrix/40 uppercase tracking-wider mb-1">
            Total Value Protected from MEV
          </div>
          <div className="text-4xl md:text-5xl font-bold text-matrix text-glow font-mono">
            <AnimatedNumber value={totalSaved} prefix="$" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Attacks Prevented */}
          <div className="bg-void-light border border-matrix/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-mev-red" />
              <span className="text-xs text-matrix/40 uppercase">
                Attacks Blocked
              </span>
            </div>
            <div className="text-2xl font-bold text-matrix font-mono">
              {attacksPrevented}
            </div>
          </div>

          {/* Savings Rate */}
          <div className="bg-void-light border border-matrix/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-cyber" />
              <span className="text-xs text-matrix/40 uppercase">
                Avg Saved/Trade
              </span>
            </div>
            <div className="text-2xl font-bold text-cyber font-mono">
              ${attacksPrevented > 0 ? (totalSaved / attacksPrevented).toFixed(0) : 0}
            </div>
          </div>
        </div>

        {/* Last Save Notification */}
        <motion.div
          className="absolute top-2 right-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: showFlash ? 1 : 0,
            y: showFlash ? 0 : -20,
          }}
        >
          <div className="bg-matrix/20 border border-matrix/50 rounded-lg px-3 py-1">
            <span className="text-xs text-matrix font-mono">
              +${lastSaveAmount?.toFixed(2)} saved
            </span>
          </div>
        </motion.div>

        {/* Scan Line Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-matrix/30 to-transparent"
            animate={{ y: [0, 200] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </motion.div>

      {/* Side Decoration */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-20 bg-gradient-to-b from-transparent via-matrix to-transparent rounded-full" />
    </div>
  );
}
