"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { Terminal } from "lucide-react";

interface LogEntry {
  id: number;
  timestamp: string;
  type: "info" | "success" | "warning" | "error" | "batch";
  message: string;
}

interface ActivityTerminalProps {
  logs: LogEntry[];
}

export default function ActivityTerminal({ logs }: ActivityTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getTypeColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-matrix";
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-mev-red";
      case "batch":
        return "text-cyber";
      default:
        return "text-matrix/60";
    }
  };

  const getTypePrefix = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "[SUCCESS]";
      case "warning":
        return "[WARN]";
      case "error":
        return "[ERROR]";
      case "batch":
        return "[BATCH]";
      default:
        return "[INFO]";
    }
  };

  return (
    <div className="bg-void border border-matrix/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-matrix/20 bg-matrix/5">
        <Terminal className="w-4 h-4 text-matrix" />
        <span className="text-sm text-matrix font-mono">Activity Log</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-mev-red/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-matrix/50" />
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={terminalRef}
        className="h-[200px] overflow-y-auto p-4 font-mono text-xs space-y-1 scanline"
      >
        <AnimatePresence mode="popLayout">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2"
            >
              <span className="text-matrix/40 shrink-0">{log.timestamp}</span>
              <span className={`shrink-0 ${getTypeColor(log.type)}`}>
                {getTypePrefix(log.type)}
              </span>
              <span className="text-matrix/80">{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Cursor */}
        <div className="flex items-center gap-2">
          <span className="text-matrix/40">{">"}</span>
          <motion.span
            className="w-2 h-4 bg-matrix"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
}
