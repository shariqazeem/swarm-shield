"use client";

import { motion } from "framer-motion";
import { Activity, Users, Zap, DollarSign, Clock, Shield } from "lucide-react";

interface StatsPanelProps {
  stats: {
    totalVolume: number;
    activeAgents: number;
    batchesExecuted: number;
    avgBatchSize: number;
    uptime: string;
    successRate: number;
  };
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  const statItems = [
    {
      icon: DollarSign,
      label: "Total Volume",
      value: `$${stats.totalVolume.toLocaleString()}`,
      color: "text-matrix",
    },
    {
      icon: Users,
      label: "Active Agents",
      value: stats.activeAgents.toString(),
      color: "text-cyber",
    },
    {
      icon: Zap,
      label: "Batches Executed",
      value: stats.batchesExecuted.toString(),
      color: "text-matrix",
    },
    {
      icon: Activity,
      label: "Avg Batch Size",
      value: `${stats.avgBatchSize} agents`,
      color: "text-shield",
    },
    {
      icon: Clock,
      label: "Uptime",
      value: stats.uptime,
      color: "text-matrix",
    },
    {
      icon: Shield,
      label: "Success Rate",
      value: `${stats.successRate}%`,
      color: "text-matrix",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-void border border-matrix/20 rounded-lg p-3 hover:border-matrix/40 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <item.icon className={`w-4 h-4 ${item.color} opacity-60`} />
            <span className="text-xs text-matrix/40 uppercase tracking-wider truncate">
              {item.label}
            </span>
          </div>
          <div className={`text-lg font-bold font-mono ${item.color}`}>
            {item.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
