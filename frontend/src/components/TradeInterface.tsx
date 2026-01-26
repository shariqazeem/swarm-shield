"use client";

/**
 * ============================================================================
 * TRADE INTERFACE - Steve Jobs Minimalist Design
 * ============================================================================
 *
 * A beautiful, focused trading experience with elegant animations.
 * One action at a time. No clutter. Pure functionality.
 *
 * Privacy Hack 2026 - SwarmShield
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseError, getErrorAction } from '@/lib/errors';

// Token pairs configuration
const TOKEN_PAIRS = [
  { id: 'sol-usdc', base: 'SOL', quote: 'USDC', active: true, icon: '◎' },
  { id: 'bonk-sol', base: 'BONK', quote: 'SOL', active: false, icon: '🐕' },
  { id: 'wbtc-usdc', base: 'wBTC', quote: 'USDC', active: false, icon: '₿' },
  { id: 'weth-usdc', base: 'wETH', quote: 'USDC', active: false, icon: 'Ξ' },
];

interface TradeInterfaceProps {
  // Balances
  shieldedSol: number;
  shieldedUsdc: number;
  walletSol: number;
  walletUsdc: number;
  // State
  isSubmitting: boolean;
  showSuccess: boolean;
  showError: string | null;
  lastTxSignature?: string | null;
  lastEncryptedPreview?: string | null;
  // Actions
  onSubmitIntent: (direction: 'sell' | 'buy', amount: number) => void;
  onDeposit: (type: 'sol' | 'usdc') => void;
  onWithdraw: (type: 'sol' | 'usdc') => void;
}

type ViewState = 'trade' | 'submitting' | 'success' | 'vault';

export function TradeInterface({
  shieldedSol,
  shieldedUsdc,
  walletSol,
  walletUsdc,
  isSubmitting,
  showSuccess,
  showError,
  lastTxSignature,
  lastEncryptedPreview,
  onSubmitIntent,
  onDeposit,
  onWithdraw,
}: TradeInterfaceProps) {
  const [direction, setDirection] = useState<'sell' | 'buy'>('sell');
  const [amount, setAmount] = useState('');
  const [viewState, setViewState] = useState<ViewState>('trade');
  const [showVault, setShowVault] = useState(false);
  const [selectedPair, setSelectedPair] = useState('sol-usdc');
  const [showTokenSelector, setShowTokenSelector] = useState(false);

  // Derived values
  const maxAmount = direction === 'sell' ? shieldedSol : shieldedUsdc;
  const currency = direction === 'sell' ? 'SOL' : 'USDC';
  const outputCurrency = direction === 'sell' ? 'USDC' : 'SOL';
  const parsedAmount = parseFloat(amount) || 0;
  const isValidAmount = parsedAmount > 0 && parsedAmount <= maxAmount;

  // Handle view state changes
  useEffect(() => {
    if (isSubmitting) {
      setViewState('submitting');
    } else if (showSuccess) {
      setViewState('success');
      // Reset after showing success
      const timer = setTimeout(() => {
        setViewState('trade');
        setAmount('');
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setViewState('trade');
    }
  }, [isSubmitting, showSuccess]);

  const handleSubmit = () => {
    if (isValidAmount) {
      onSubmitIntent(direction, parsedAmount);
    }
  };

  const handleMax = () => {
    setAmount(direction === 'sell' ? maxAmount.toFixed(4) : maxAmount.toFixed(2));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center max-w-lg w-full mx-auto"
    >
      <AnimatePresence mode="wait">
        {/* ============ TRADE VIEW ============ */}
        {viewState === 'trade' && (
          <motion.div
            key="trade"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-extralight tracking-tight mb-3">
              {direction === 'sell' ? 'Sell SOL' : 'Buy SOL'}
            </h1>
            <p className="text-white/30 font-light mb-12">
              Dark Pool • MEV Protected
            </p>

            {/* Dark Pool Balances - Always Visible */}
            <div className="mb-10 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-white/30 uppercase tracking-widest">Dark Pool Balance</span>
                <button
                  onClick={() => setShowVault(!showVault)}
                  className="text-[10px] text-white/40 hover:text-white/60 transition-colors"
                >
                  {showVault ? 'Hide' : 'Manage'}
                </button>
              </div>

              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-xl font-light">{shieldedSol.toFixed(4)}</p>
                  <p className="text-[10px] text-white/30 mt-1">SOL</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-xl font-light">{shieldedUsdc.toFixed(2)}</p>
                  <p className="text-[10px] text-white/30 mt-1">USDC</p>
                </div>
              </div>

              {/* Quick Actions - Expandable */}
              <AnimatePresence>
                {showVault && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-white/20">Wallet</span>
                        <span className="text-[10px] text-white/30">
                          {walletSol.toFixed(2)} SOL · {walletUsdc.toFixed(2)} USDC
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          onClick={() => onDeposit('sol')}
                          className="px-3 py-1.5 text-[10px] text-white/50 border border-white/10 rounded-lg
                                   hover:border-white/30 hover:text-white/70 transition-all"
                        >
                          Shield SOL
                        </button>
                        <button
                          onClick={() => onDeposit('usdc')}
                          disabled={walletUsdc === 0}
                          className="px-3 py-1.5 text-[10px] text-white/50 border border-white/10 rounded-lg
                                   hover:border-white/30 hover:text-white/70 transition-all disabled:opacity-30"
                        >
                          Shield USDC
                        </button>
                        <button
                          onClick={() => onWithdraw('sol')}
                          disabled={shieldedSol === 0}
                          className="px-3 py-1.5 text-[10px] text-white/50 border border-white/10 rounded-lg
                                   hover:border-white/30 hover:text-white/70 transition-all disabled:opacity-30"
                        >
                          Unshield SOL
                        </button>
                        <button
                          onClick={() => onWithdraw('usdc')}
                          disabled={shieldedUsdc === 0}
                          className="px-3 py-1.5 text-[10px] text-white/50 border border-white/10 rounded-lg
                                   hover:border-white/30 hover:text-white/70 transition-all disabled:opacity-30"
                        >
                          Unshield USDC
                        </button>
                      </div>
                      {lastTxSignature && (
                        <a
                          href={`https://solscan.io/tx/${lastTxSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-3 text-[10px] text-white/20 hover:text-white/40 transition-colors text-center"
                        >
                          View last tx ↗
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Token Pair Selector */}
            <div className="mb-6">
              <button
                onClick={() => setShowTokenSelector(!showTokenSelector)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10
                         hover:border-white/20 transition-all text-sm"
              >
                <span className="text-lg">{TOKEN_PAIRS.find(p => p.id === selectedPair)?.icon}</span>
                <span className="text-white/70">
                  {TOKEN_PAIRS.find(p => p.id === selectedPair)?.base} / {TOKEN_PAIRS.find(p => p.id === selectedPair)?.quote}
                </span>
                <svg className={`w-4 h-4 text-white/40 transition-transform ${showTokenSelector ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {showTokenSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Select Trading Pair</p>
                      <div className="grid grid-cols-2 gap-2">
                        {TOKEN_PAIRS.map((pair) => (
                          <button
                            key={pair.id}
                            onClick={() => {
                              if (pair.active) {
                                setSelectedPair(pair.id);
                                setShowTokenSelector(false);
                              }
                            }}
                            disabled={!pair.active}
                            className={`relative flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all ${
                              pair.active
                                ? selectedPair === pair.id
                                  ? 'bg-white/10 border border-white/20'
                                  : 'bg-white/[0.02] border border-white/5 hover:border-white/15'
                                : 'bg-white/[0.01] border border-white/5 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <span className="text-lg">{pair.icon}</span>
                            <div className="flex-1">
                              <p className="text-xs text-white/80">{pair.base}/{pair.quote}</p>
                              {!pair.active && (
                                <p className="text-[9px] text-yellow-400/70">Coming Soon</p>
                              )}
                            </div>
                            {pair.active && selectedPair === pair.id && (
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                            )}
                            {!pair.active && (
                              <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[8px] bg-yellow-400/20 text-yellow-400/80 rounded-full">
                                SOON
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-white/20 mt-3 text-center">
                        More pairs coming with Light Protocol ZK Compression
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direction Toggle - Minimal */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/5">
                <button
                  onClick={() => { setDirection('sell'); setAmount(''); }}
                  className={`px-5 py-2 rounded-full text-sm transition-all ${
                    direction === 'sell'
                      ? 'bg-white text-black'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  SOL → USDC
                </button>
                <button
                  onClick={() => { setDirection('buy'); setAmount(''); }}
                  className={`px-5 py-2 rounded-full text-sm transition-all ${
                    direction === 'buy'
                      ? 'bg-white text-black'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  USDC → SOL
                </button>
              </div>
            </div>

            {/* Amount Input - Hero Element */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-5xl md:text-6xl font-extralight text-center
                           outline-none placeholder:text-white/10"
                  style={{ caretColor: 'white' }}
                />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-lg text-white/20"
                >
                  {currency}
                </motion.span>
              </div>

              {/* Balance & Max */}
              <div className="flex items-center justify-center gap-4 mt-3">
                <span className="text-xs text-white/30">
                  Available: {direction === 'sell' ? shieldedSol.toFixed(4) : shieldedUsdc.toFixed(2)} {currency}
                </span>
                <button
                  onClick={handleMax}
                  className="text-xs text-white/50 hover:text-white transition-colors
                           px-2 py-0.5 rounded border border-white/10 hover:border-white/30"
                >
                  MAX
                </button>
              </div>

              {/* Validation */}
              {parsedAmount > maxAmount && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400/80 mt-3"
                >
                  Exceeds available balance
                </motion.p>
              )}
            </div>

            {/* Output Preview */}
            {parsedAmount > 0 && parsedAmount <= maxAmount && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <p className="text-white/30 text-sm mb-1">You'll receive approximately</p>
                <p className="text-2xl font-light">
                  ~{(parsedAmount * (direction === 'sell' ? 200 : 0.005)).toFixed(direction === 'sell' ? 2 : 4)} {outputCurrency}
                </p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmit}
              disabled={!isValidAmount || isSubmitting}
              className="w-full max-w-sm mx-auto py-4 px-8 bg-white text-black font-medium
                       rounded-full text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              whileHover={isValidAmount ? { scale: 1.02 } : {}}
              whileTap={isValidAmount ? { scale: 0.98 } : {}}
            >
              Submit Encrypted Intent
            </motion.button>

            {/* Error Display - Enhanced */}
            {showError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 max-w-sm mx-auto"
              >
                {(() => {
                  const parsed = parseError(showError);
                  const action = getErrorAction(showError);
                  return (
                    <>
                      <p className="text-red-400 font-medium text-sm">{parsed.title}</p>
                      <p className="text-red-400/70 text-xs mt-1">{parsed.message}</p>
                      {action && (
                        <a
                          href={action.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-xs text-red-300 underline hover:text-red-200"
                        >
                          {action.text} ↗
                        </a>
                      )}
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* How it works - Ultra minimal */}
            <div className="mt-12 pt-8 border-t border-white/5">
              <div className="flex items-center justify-center gap-4 text-[10px] text-white/20 uppercase tracking-widest">
                <span>Encrypt</span>
                <span className="text-white/10">→</span>
                <span>Submit</span>
                <span className="text-white/10">→</span>
                <span>Batch</span>
                <span className="text-white/10">→</span>
                <span>Execute</span>
                <span className="text-white/10">→</span>
                <span className="text-white/40">Receive</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============ SUBMITTING VIEW ============ */}
        {viewState === 'submitting' && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-20"
          >
            <h1 className="text-5xl md:text-6xl font-extralight tracking-tight mb-6">
              Encrypting
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-white/40"
              >
                ...
              </motion.span>
            </h1>

            {/* Animated circles */}
            <div className="relative h-32 flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 bg-white rounded-full"
                  animate={{
                    x: [0, 30, 0, -30, 0],
                    opacity: [0.3, 1, 0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                  style={{ left: `calc(50% - 6px + ${(i - 1) * 40}px)` }}
                />
              ))}
            </div>

            <p className="text-white/30 text-sm">
              Encrypting intent & submitting to dark pool
            </p>
          </motion.div>
        )}

        {/* ============ SUCCESS VIEW ============ */}
        {viewState === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12"
          >
            {/* Animated checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mb-8"
            >
              <div className="relative w-28 h-28 mx-auto">
                {/* Expanding ring */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border border-white/30"
                />

                {/* Main circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="absolute inset-0 rounded-full border border-white/20"
                />

                {/* Checkmark SVG */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <motion.path
                    d="M 28 50 L 42 64 L 72 34"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                  />
                </svg>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-5xl md:text-6xl font-extralight tracking-tight mb-4"
            >
              Encrypted & Submitted
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/40 font-light mb-6"
            >
              Shielded intent added to Dark Pool
            </motion.p>

            {/* Encrypted data preview */}
            {lastEncryptedPreview && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mb-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 max-w-sm mx-auto"
              >
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">On-chain Data (Encrypted)</p>
                <p className="text-[11px] text-white/50 font-mono break-all">
                  {lastEncryptedPreview}
                </p>
                <p className="text-[9px] text-green-400/60 mt-1.5">MEV bots see only random bytes</p>
              </motion.div>
            )}

            {/* Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5"
            >
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-white/50">
                Intent encrypted on-chain • Only keeper can decrypt
              </span>
            </motion.div>

            {/* Progress bar back to trade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-10"
            >
              <div className="h-[2px] w-24 mx-auto bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white/30"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: "linear" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default TradeInterface;
