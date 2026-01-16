"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

interface Agent {
  id: number;
  x: number;
  y: number;
  angle: number;
  type: "buy" | "sell";
}

interface DarkPoolVisualizerProps {
  onBatchExecuted?: (agentCount: number, volume: number) => void;
}

export default function DarkPoolVisualizer({ onBatchExecuted }: DarkPoolVisualizerProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [poolSize, setPoolSize] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionBeam, setExecutionBeam] = useState(false);
  const [pulseRing, setPulseRing] = useState(false);

  // Spawn new agents periodically
  const spawnAgent = useCallback(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 200 + Math.random() * 100;
    const newAgent: Agent = {
      id: Date.now() + Math.random(),
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      angle: angle,
      type: Math.random() > 0.3 ? "buy" : "sell",
    };
    setAgents((prev) => [...prev, newAgent]);
    setPoolSize((prev) => prev + 1);
  }, []);

  // Remove agent when it reaches the pool
  const removeAgent = useCallback((id: number) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Execute batch
  const executeBatch = useCallback(() => {
    if (poolSize >= 3 && !isExecuting) {
      setIsExecuting(true);
      setPulseRing(true);

      setTimeout(() => {
        setExecutionBeam(true);
        const volume = poolSize * (500 + Math.random() * 1000);
        onBatchExecuted?.(poolSize, volume);

        setTimeout(() => {
          setExecutionBeam(false);
          setPoolSize(0);
          setIsExecuting(false);
          setPulseRing(false);
        }, 1500);
      }, 500);
    }
  }, [poolSize, isExecuting, onBatchExecuted]);

  // Spawn agents on interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isExecuting && agents.length < 8) {
        spawnAgent();
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [spawnAgent, isExecuting, agents.length]);

  // Auto-execute when threshold reached
  useEffect(() => {
    if (poolSize >= 5 && !isExecuting) {
      const timeout = setTimeout(executeBatch, 1000);
      return () => clearTimeout(timeout);
    }
  }, [poolSize, executeBatch, isExecuting]);

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#00FF00"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Radial Glow */}
      <div className="absolute inset-0 bg-radial-glow opacity-50" />

      {/* The Dark Pool (Central Circle) */}
      <div className="relative">
        {/* Outer Pulse Ring */}
        <AnimatePresence>
          {pulseRing && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-matrix"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                width: 200,
                height: 200,
                left: -100,
                top: -100,
              }}
            />
          )}
        </AnimatePresence>

        {/* Pool Rings */}
        <motion.div
          className="absolute rounded-full border border-matrix/30"
          style={{ width: 180, height: 180, left: -90, top: -90 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute rounded-full border border-matrix/20"
          style={{ width: 160, height: 160, left: -80, top: -80 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />

        {/* Main Pool */}
        <motion.div
          className="relative w-32 h-32 rounded-full bg-void border-2 border-matrix/50 flex items-center justify-center"
          animate={{
            boxShadow: isExecuting
              ? [
                  "0 0 30px rgba(0, 255, 0, 0.5)",
                  "0 0 60px rgba(0, 255, 0, 0.8)",
                  "0 0 30px rgba(0, 255, 0, 0.5)",
                ]
              : "0 0 20px rgba(0, 255, 0, 0.3)",
          }}
          transition={{ duration: 0.5 }}
        >
          {/* Pool Interior */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-void to-matrix/10 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                className="text-3xl font-bold text-matrix text-glow"
                key={poolSize}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
              >
                {poolSize}
              </motion.div>
              <div className="text-xs text-matrix/60 uppercase tracking-wider">
                Agents
              </div>
            </div>
          </div>

          {/* Scan Effect */}
          <motion.div
            className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
          >
            <motion.div
              className="absolute w-full h-1 bg-gradient-to-r from-transparent via-matrix to-transparent"
              animate={{ y: [-64, 64] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </motion.div>

        {/* Execution Beam */}
        <AnimatePresence>
          {executionBeam && (
            <motion.div
              className="absolute left-1/2 top-1/2 origin-left"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="relative">
                {/* Main Beam */}
                <motion.div
                  className="h-2 bg-gradient-to-r from-matrix via-cyber to-matrix rounded-full"
                  style={{ width: 300 }}
                  animate={{
                    boxShadow: [
                      "0 0 20px #00FF00",
                      "0 0 40px #00FFFF",
                      "0 0 20px #00FF00",
                    ],
                  }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                />
                {/* Beam Label */}
                <motion.div
                  className="absolute -top-8 right-0 text-sm text-cyber font-mono"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  BATCH EXECUTED →
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agents Flying In */}
        <AnimatePresence>
          {agents.map((agent) => (
            <motion.div
              key={agent.id}
              className={`absolute w-3 h-3 rounded-full ${
                agent.type === "buy" ? "bg-matrix" : "bg-cyber"
              }`}
              initial={{
                x: agent.x,
                y: agent.y,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 0,
              }}
              transition={{
                duration: 2,
                ease: "easeIn",
              }}
              onAnimationComplete={() => removeAgent(agent.id)}
              style={{
                boxShadow: `0 0 10px ${agent.type === "buy" ? "#00FF00" : "#00FFFF"}`,
              }}
            >
              {/* Trail */}
              <motion.div
                className={`absolute w-8 h-0.5 origin-right ${
                  agent.type === "buy" ? "bg-matrix/50" : "bg-cyber/50"
                }`}
                style={{
                  right: 0,
                  top: "50%",
                  transform: `rotate(${agent.angle + Math.PI}rad) translateY(-50%)`,
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        <div className="text-xs text-matrix/60 uppercase tracking-widest mb-1">
          Dark Liquidity Pool
        </div>
        <div className="text-sm text-matrix/80">
          Anonymity Set: <span className="text-matrix font-bold">{poolSize} Agents</span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-matrix" />
          <span className="text-matrix/60">Buy Intent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyber" />
          <span className="text-matrix/60">Sell Intent</span>
        </div>
      </div>

      {/* Status */}
      <div className="absolute top-4 left-4">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-matrix"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-xs text-matrix/60 uppercase tracking-wider">
            {isExecuting ? "Executing Batch..." : "Collecting Intents"}
          </span>
        </div>
      </div>
    </div>
  );
}
