"use client";

/**
 * ============================================================================
 * COMPLIANCE CHECK - Elegant Inline Animation
 * ============================================================================
 *
 * Minimalist compliance verification that integrates with the Steve Jobs
 * aesthetic. No modal - just beautiful inline animations.
 *
 * Privacy Hack 2026 - Range Protocol ($1,500)
 * ============================================================================
 */

import { motion } from 'framer-motion';
import { RiskLevel } from '@/lib/compliance';

interface ComplianceCheckProps {
  isChecking: boolean;
  isComplete: boolean;
  allowed: boolean;
  riskLevel?: RiskLevel;
  walletAddress?: string;
  onComplete?: () => void;
}

export function ComplianceCheck({
  isChecking,
  isComplete,
  allowed,
  riskLevel,
  walletAddress,
  onComplete,
}: ComplianceCheckProps) {

  // Auto-advance after showing result
  if (isComplete && allowed && onComplete) {
    setTimeout(onComplete, 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center max-w-2xl"
    >
      {/* Checking State */}
      {isChecking && !isComplete && (
        <>
          <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-6">
            Verifying
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-white/40"
            >
              ...
            </motion.span>
          </h1>

          {/* Wallet address */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-white/20 font-mono tracking-wider mb-10"
          >
            {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}` : ''}
          </motion.p>

          {/* Granular Compliance Checks - Animated Sequence */}
          <div className="space-y-3 max-w-xs mx-auto">
            {[
              { label: 'OFAC Sanctions', delay: 0.2 },
              { label: 'Risk Assessment', delay: 0.6 },
              { label: 'Wallet History', delay: 1.0 },
              { label: 'Entity Screening', delay: 1.4 },
            ].map((check, index) => (
              <motion.div
                key={check.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: check.delay }}
                className="flex items-center justify-between py-2 border-b border-white/5"
              >
                <span className="text-xs text-white/40">{check.label}</span>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: check.delay + 0.3 }}
                  className="flex items-center gap-2"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: check.delay + 0.4, type: "spring" }}
                    className="w-1.5 h-1.5 bg-green-400 rounded-full"
                  />
                  <span className="text-[10px] text-green-400/80 uppercase tracking-wider">
                    Pass
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Range Protocol branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex items-center justify-center gap-2"
          >
            <span className="w-1.5 h-1.5 bg-purple-500/60 rounded-full animate-pulse" />
            <span className="text-[10px] text-white/20 uppercase tracking-widest">
              Secured by Range Protocol
            </span>
          </motion.div>
        </>
      )}

      {/* Complete State - Allowed */}
      {isComplete && allowed && (
        <>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mb-8"
          >
            {/* Animated checkmark circle */}
            <div className="relative w-24 h-24 mx-auto">
              {/* Outer ring */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="absolute inset-0 rounded-full border border-white/20"
              />

              {/* Inner glow */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="absolute inset-2 rounded-full bg-gradient-to-b from-white/10 to-transparent"
              />

              {/* Checkmark */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
              >
                <motion.path
                  d="M 30 50 L 45 65 L 70 35"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                />
              </svg>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-7xl font-extralight tracking-tight mb-6"
          >
            Verified
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg text-white/40 font-light mb-8"
          >
            Your wallet is compliant
          </motion.p>

          {/* Risk level - subtle */}
          {riskLevel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-2"
            >
              <span className={`w-2 h-2 rounded-full ${
                riskLevel === RiskLevel.LOW ? 'bg-green-400/60' :
                riskLevel === RiskLevel.MEDIUM ? 'bg-yellow-400/60' : 'bg-orange-400/60'
              }`} />
              <span className="text-xs text-white/30 uppercase tracking-wider">
                {riskLevel} risk
              </span>
            </motion.div>
          )}

          {/* Progress indicator to next screen */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12"
          >
            <div className="h-[2px] w-32 mx-auto bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white/40"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: "linear" }}
              />
            </div>
          </motion.div>
        </>
      )}

      {/* Complete State - Blocked */}
      {isComplete && !allowed && (
        <>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mb-8"
          >
            <div className="relative w-24 h-24 mx-auto">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 rounded-full border border-red-500/30"
              />

              {/* X mark */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
              >
                <motion.path
                  d="M 35 35 L 65 65"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                />
                <motion.path
                  d="M 65 35 L 35 65"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                />
              </svg>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-5xl md:text-7xl font-extralight tracking-tight mb-6 text-red-400/80"
          >
            Blocked
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-lg text-white/40 font-light"
          >
            This wallet cannot access the protocol
          </motion.p>
        </>
      )}
    </motion.div>
  );
}

export default ComplianceCheck;
