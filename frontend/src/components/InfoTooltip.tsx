"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InfoTooltipProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function InfoTooltip({ title, description, children }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-4
                       bg-white/10 backdrop-blur-xl rounded-xl border border-white/10
                       shadow-2xl"
          >
            <h4 className="text-sm font-medium text-white mb-1">{title}</h4>
            <p className="text-xs text-white/60 leading-relaxed">{description}</p>
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2
                           bg-white/10 rotate-45 -mt-1 border-r border-b border-white/10" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Question mark icon for info buttons
export function InfoButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-5 h-5 rounded-full border border-white/20 text-white/40 text-xs
                 hover:border-white/40 hover:text-white/60 transition-colors
                 flex items-center justify-center"
    >
      ?
    </button>
  );
}
