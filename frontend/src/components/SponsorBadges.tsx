"use client";

/**
 * Subtle Sponsor Integration Display
 * Elegant "Powered by" footer that complements the minimalist design
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPONSOR_INTEGRATIONS, getTotalBountyPotential } from '@/lib/rpc-config';

/**
 * Minimal footer badge - sits at the bottom of the screen
 */
export function SponsorBadges() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-black/90 backdrop-blur-sm border-t border-white/10 p-6"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-white/40 uppercase tracking-wider">
                  Privacy Hack 2026 Integrations
                </span>
                <span className="text-xs text-white/60 font-mono">
                  {getTotalBountyPotential()} potential
                </span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {SPONSOR_INTEGRATIONS.map((sponsor) => (
                  <a
                    key={sponsor.name}
                    href={sponsor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group text-center"
                  >
                    <div className="text-sm text-white/70 group-hover:text-white transition-colors">
                      {sponsor.name}
                    </div>
                    <div className="text-xs text-white/30 font-mono">
                      {sponsor.bounty}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal trigger bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-black/80 backdrop-blur-sm border-t border-white/5 py-2 px-4 cursor-pointer hover:bg-black/90 transition-colors"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 text-xs">
          <span className="text-white/30">Powered by</span>
          <div className="flex items-center gap-2">
            {['Helius', 'Light', 'Range'].map((name, i) => (
              <span key={name} className="text-white/50">
                {name}
                {i < 2 && <span className="text-white/20 mx-1">·</span>}
              </span>
            ))}
          </div>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-white/30"
          >
            ↑
          </motion.span>
        </div>
      </div>
    </div>
  );
}

/**
 * Even more minimal - just a tiny badge in the corner
 */
export function SponsorBadgeMinimal() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-full text-[10px] text-white/40 backdrop-blur-sm border border-white/10">
        <span className="w-1.5 h-1.5 bg-green-500/60 rounded-full" />
        <span>Privacy Hack 2026</span>
      </div>
    </div>
  );
}

/**
 * Inline version for header
 */
export function SponsorBadgeInline() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-white/30">
      <span className="w-1 h-1 bg-green-500/60 rounded-full" />
      Helius · Light · Range
    </span>
  );
}

export default SponsorBadges;
