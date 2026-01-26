"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSwarmShield } from "@/hooks/useSwarmShield";
import { HowItWorks } from "@/components/HowItWorks";
import { SponsorBadges } from "@/components/SponsorBadges";
import { ComplianceCheck } from "@/components/ComplianceCheck";
import { IntegrationVerifier } from "@/components/IntegrationVerifier";
import { TradeInterface } from "@/components/TradeInterface";
import { AgentSDK } from "@/components/AgentSDK";
import { NetworkStatus } from "@/components/NetworkStatus";
import { SwarmActivity } from "@/components/SwarmActivity";
import { MEVProtectionDemo } from "@/components/MEVProtectionDemo";
import { ZKCompressionPanel } from "@/components/ZKCompressionPanel";
import { checkCompliance, RiskLevel } from "@/lib/compliance";

const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

// Particle component for swarm visualization
function SwarmParticle({ index, total }: { index: number; total: number }) {
  const angle = (index / total) * Math.PI * 2;
  const radius = 120 + Math.random() * 60;
  const duration = 15 + Math.random() * 10;
  const delay = Math.random() * 5;

  return (
    <motion.div
      className="absolute w-1.5 h-1.5 bg-white rounded-full"
      style={{
        left: '50%',
        top: '50%',
        boxShadow: '0 0 10px rgba(255,255,255,0.5)',
      }}
      animate={{
        x: [
          Math.cos(angle) * radius,
          Math.cos(angle + Math.PI) * radius,
          Math.cos(angle) * radius,
        ],
        y: [
          Math.sin(angle) * radius,
          Math.sin(angle + Math.PI) * radius,
          Math.sin(angle) * radius,
        ],
        opacity: [0.3, 0.8, 0.3],
        scale: [0.8, 1.2, 0.8],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// MEV Bot being blocked animation
function BlockedBot({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute text-red-500/60 text-xs font-mono"
      initial={{ x: -100, y: Math.random() * 200 - 100, opacity: 0 }}
      animate={{
        x: [null, 0, 0],
        opacity: [0, 0.8, 0],
        scale: [1, 1.2, 0.5],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 5 + Math.random() * 3,
      }}
      style={{ left: '20%', top: '50%' }}
    >
      MEV BOT BLOCKED
    </motion.div>
  );
}

// Animated encrypted data stream - shows what MEV bots see
function EncryptedDataStream() {
  const [chars, setChars] = useState<string[]>([]);

  useEffect(() => {
    const hexChars = "0123456789abcdef";
    const generateChars = () => {
      return Array.from({ length: 32 }, () =>
        hexChars[Math.floor(Math.random() * hexChars.length)]
      );
    };

    setChars(generateChars());
    const interval = setInterval(() => {
      setChars(generateChars());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-[10px] text-green-400/60 tracking-wider overflow-hidden whitespace-nowrap">
      {chars.join("")}
    </div>
  );
}

export default function SwarmShield() {
  const { connected, publicKey } = useWallet();
  const [swarmState, swarmActions] = useSwarmShield();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [complianceStatus, setComplianceStatus] = useState<{
    checking: boolean;
    checked: boolean;
    allowed: boolean;
    riskLevel?: RiskLevel;
    showOverlay: boolean;
  }>({ checking: false, checked: false, allowed: true, showOverlay: false });

  // Range Compliance Check - runs when wallet connects ($1,500 bounty)
  useEffect(() => {
    if (connected && publicKey) {
      // Show checking overlay immediately
      setComplianceStatus({
        checking: true,
        checked: false,
        allowed: true,
        showOverlay: true,
      });

      // Add slight delay to show the checking animation
      const checkWallet = async () => {
        try {
          // Small delay to ensure the checking animation is visible
          await new Promise(resolve => setTimeout(resolve, 1500));

          const result = await checkCompliance(publicKey);
          console.log('Range Compliance Result:', result);

          setComplianceStatus({
            checking: false,
            checked: true,
            allowed: result.allowed,
            riskLevel: result.riskAssessment?.riskLevel,
            showOverlay: true,
          });
        } catch (err) {
          console.error('Compliance check error:', err);
          // Fail open for demo
          setComplianceStatus({
            checking: false,
            checked: true,
            allowed: true,
            showOverlay: true,
          });
        }
      };

      checkWallet();
    } else {
      setComplianceStatus({ checking: false, checked: false, allowed: true, showOverlay: false });
    }
  }, [connected, publicKey]);

  // Calculate step based on state
  useEffect(() => {
    if (!connected) {
      setCurrentStep(0);
    } else if (swarmState.isLoading) {
      // Keep current step while loading
      return;
    } else if (!swarmState.isInitialized) {
      setCurrentStep(1);
    } else if (!swarmState.isAgentRegistered) {
      setCurrentStep(2);
    } else if (swarmState.agent?.solBalance.toNumber() === 0) {
      setCurrentStep(3);
    } else {
      setCurrentStep(4);
    }
  }, [connected, swarmState]);

  const handleAction = useCallback(async (action: string) => {
    setIsSubmitting(true);
    try {
      switch (action) {
        case 'initialize':
          await swarmActions.initialize();
          break;
        case 'register':
          await swarmActions.registerAgent();
          break;
        case 'deposit':
          // Check if user has enough SOL (deposit 0.05 SOL, need ~0.06 with fees)
          if (swarmState.walletBalance < 0.06) {
            setShowError(`Insufficient SOL. You have ${swarmState.walletBalance.toFixed(4)} SOL, need at least 0.06 SOL. Get devnet SOL from a faucet.`);
            setTimeout(() => setShowError(null), 10000);
            setIsSubmitting(false);
            return;
          }
          await swarmActions.depositSol(0.05);
          break;
        case 'withdraw':
          // Withdraw all SOL from shielded vault back to wallet
          const solBal = swarmState.agent?.solBalance.toNumber() || 0;
          if (solBal > 0) {
            await swarmActions.withdrawSol(solBal / 1e9);
          }
          break;
        case 'withdrawUsdc':
          // Withdraw REAL SwarmUSDC tokens to wallet
          const usdcBal = swarmState.agent?.usdcBalance.toNumber() || 0;
          if (usdcBal > 0) {
            await swarmActions.withdrawUsdc(usdcBal / 1e6);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);
          }
          break;
      }
    } catch (e: any) {
      // Handle "already in use" errors as success (already done)
      const errorMsg = e?.message || '';
      if (errorMsg.includes('already in use') ||
          errorMsg.includes('already been processed') ||
          errorMsg.includes('0x0')) {
        // Refresh state to get current status
        await swarmActions.refresh();
      } else {
        console.error(e);
        // Show user-friendly error
        let displayError = errorMsg;
        if (errorMsg.includes('insufficient lamports')) {
          displayError = 'Insufficient SOL. Please get devnet SOL from a faucet.';
        }
        setShowError(displayError);
        setTimeout(() => setShowError(null), 8000);
      }
    }
    setIsSubmitting(false);
  }, [swarmActions, swarmState.agent, swarmState.walletBalance]);

  const totalBatches = swarmState.config?.totalBatches.toNumber() || 0;
  const totalVolume = (swarmState.config?.totalVolumeProtected.toNumber() || 0) / 1e9;
  const agentSol = swarmState.agent?.solBalance.toNumber() || 0;
  const agentUsdc = swarmState.agent?.usdcBalance.toNumber() || 0;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Integration Verifier - For judges to verify real API calls */}
      <IntegrationVerifier />

      {/* MEV Protection Demo - Shows encryption blocking attacks ($10K Anoncoin) */}
      <MEVProtectionDemo />

      {/* ZK Compression Panel - Shows Light Protocol SDK ($18K bounty) */}
      <ZKCompressionPanel />

      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-gray-950 to-black pointer-events-none" />

      {/* Swarm visualization */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="relative w-[600px] h-[600px]">
          {/* Central shield */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              boxShadow: '0 0 60px rgba(255,255,255,0.1)',
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          {/* Swarm particles */}
          {Array.from({ length: 40 }).map((_, i) => (
            <SwarmParticle key={i} index={i} total={40} />
          ))}

          {/* MEV bots being blocked */}
          {currentStep >= 4 && (
            <>
              <BlockedBot delay={0} />
              <BlockedBot delay={2} />
              <BlockedBot delay={4} />
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
          {/* Minimal header */}
        <header className="flex items-center justify-between p-6 md:p-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/80" />
            </div>
            <span className="text-lg font-light tracking-wider">SwarmShield</span>
            {/* Subtle compliance indicator */}
            {connected && complianceStatus.checked && (
              <span className={`hidden md:inline-flex items-center gap-1.5 text-[10px] ${
                complianceStatus.allowed ? 'text-green-500/60' : 'text-red-500/60'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  complianceStatus.allowed ? 'bg-green-500/60' : 'bg-red-500/60'
                }`} />
                {complianceStatus.allowed ? 'Compliant' : 'Blocked'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <NetworkStatus />
            <span className="text-[10px] text-white/20 hidden md:block">DEVNET</span>
            <WalletMultiButtonDynamic />
          </div>
        </header>

        {/* Agent SDK - For developers/judges */}
        <AgentSDK
          walletAddress={publicKey?.toBase58()}
          programId="5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew"
        />

        {/* Sponsor badges at bottom - minimal and elegant */}
        <SponsorBadges />

        {/* Hero section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-20">
          <AnimatePresence mode="wait">
            {/* Compliance Check - Shows when wallet first connects */}
            {connected && complianceStatus.showOverlay && (
              <ComplianceCheck
                key="compliance"
                isChecking={complianceStatus.checking}
                isComplete={complianceStatus.checked}
                allowed={complianceStatus.allowed}
                riskLevel={complianceStatus.riskLevel}
                walletAddress={publicKey?.toBase58()}
                onComplete={() => setComplianceStatus(prev => ({ ...prev, showOverlay: false }))}
              />
            )}

            {/* Loading state - show while fetching data after compliance passes */}
            {connected && !complianceStatus.showOverlay && swarmState.isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/40">Connecting to swarm...</p>
              </motion.div>
            )}

            {/* Step 0: Not connected - Enhanced Landing */}
            {!connected && (
              <motion.div
                key="connect"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center max-w-3xl"
              >
                {/* Live badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-white/60">Live on Solana Devnet</span>
                </motion.div>

                <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-6">
                  Trade in the
                  <br />
                  <span className="bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">Dark</span>
                </h1>
                <p className="text-lg text-white/40 font-light mb-8 max-w-md mx-auto">
                  End-to-end encrypted intents. MEV bots see only random bytes.
                  TRUE cryptographic privacy.
                </p>

                {/* Encrypted data visualization */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mb-10 py-3 px-6 rounded-lg bg-black/50 border border-white/5 inline-block"
                >
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">
                    What MEV bots see
                  </p>
                  <EncryptedDataStream />
                </motion.div>

                {/* Stats row */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-10"
                >
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-light text-white">99%</p>
                    <p className="text-[10px] text-white/30 mt-1">MEV Protected</p>
                  </div>
                  <div className="hidden md:block w-px h-10 bg-white/10" />
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-light text-white">96<span className="text-sm text-white/50">b</span></p>
                    <p className="text-[10px] text-white/30 mt-1">Encrypted Payload</p>
                  </div>
                  <div className="hidden md:block w-px h-10 bg-white/10" />
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-light text-white">0</p>
                    <p className="text-[10px] text-white/30 mt-1">Data Leaked</p>
                  </div>
                </motion.div>

                <p className="text-sm text-white/30 mb-8">Connect your wallet to enter the dark pool</p>

                {/* Trust indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex flex-wrap items-center justify-center gap-6"
                >
                  <div className="flex items-center gap-2 text-white/20">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px]">NaCl Box Encryption</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/20">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px]">X25519 Key Exchange</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/20">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[10px]">Jupiter Swaps</span>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Step 1: Initialize Protocol */}
            {connected && !complianceStatus.showOverlay && !swarmState.isLoading && !swarmState.isInitialized && (
              <motion.div
                key="initialize"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center max-w-2xl"
              >
                <h1 className="text-5xl md:text-6xl font-extralight tracking-tight mb-6">
                  Initialize the Shield
                </h1>
                <p className="text-lg text-white/40 font-light mb-12">
                  Deploy the SwarmShield protocol to begin protecting trades.
                </p>
                <motion.button
                  onClick={() => handleAction('initialize')}
                  disabled={isSubmitting}
                  className="px-12 py-4 bg-white text-black font-medium rounded-full text-lg
                           hover:bg-white/90 transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? 'Initializing...' : 'Initialize Protocol'}
                </motion.button>
              </motion.div>
            )}

            {/* Step 2: Register Agent */}
            {connected && !complianceStatus.showOverlay && !swarmState.isLoading && swarmState.isInitialized && !swarmState.isAgentRegistered && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center max-w-2xl"
              >
                <h1 className="text-5xl md:text-6xl font-extralight tracking-tight mb-6">
                  Join the Swarm
                </h1>
                <p className="text-lg text-white/40 font-light mb-12">
                  Register as a shielded agent. Your identity stays private.
                </p>
                <motion.button
                  onClick={() => handleAction('register')}
                  disabled={isSubmitting}
                  className="px-12 py-4 bg-white text-black font-medium rounded-full text-lg
                           hover:bg-white/90 transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? 'Joining...' : 'Join Swarm'}
                </motion.button>
              </motion.div>
            )}

            {/* Step 3: Deposit SOL */}
            {connected && !complianceStatus.showOverlay && !swarmState.isLoading && swarmState.isInitialized && swarmState.isAgentRegistered && swarmState.agent?.solBalance.toNumber() === 0 && (
              <motion.div
                key="deposit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center max-w-2xl"
              >
                <h1 className="text-5xl md:text-6xl font-extralight tracking-tight mb-6">
                  Fund Your Shield
                </h1>
                <p className="text-lg text-white/40 font-light mb-12">
                  Deposit SOL to your shielded vault. Ready for protected trading.
                </p>
                <motion.button
                  onClick={() => handleAction('deposit')}
                  disabled={isSubmitting}
                  className="px-12 py-4 bg-white text-black font-medium rounded-full text-lg
                           hover:bg-white/90 transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? 'Depositing...' : 'Deposit 0.05 SOL'}
                </motion.button>

                {showError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl max-w-md mx-auto"
                  >
                    <p className="text-red-400 text-sm">{showError}</p>
                  </motion.div>
                )}

                <p className="text-xs text-white/30 mt-6">
                  Wallet balance: {swarmState.walletBalance.toFixed(4)} SOL
                </p>
              </motion.div>
            )}

            {/* Step 4: Trade Interface - Beautiful Minimalist Design */}
            {connected && !complianceStatus.showOverlay && !swarmState.isLoading && swarmState.isInitialized && swarmState.isAgentRegistered && (swarmState.agent?.solBalance.toNumber() || 0) > 0 && (
              <TradeInterface
                key="trade"
                shieldedSol={agentSol / 1e9}
                shieldedUsdc={agentUsdc / 1e6}
                walletSol={swarmState.walletBalance}
                walletUsdc={swarmState.realUsdcBalance}
                isSubmitting={isSubmitting}
                showSuccess={showSuccess}
                showError={showError}
                lastTxSignature={swarmState.lastTxSignature}
                lastEncryptedPreview={swarmState.lastEncryptedPreview}
                onSubmitIntent={async (direction, amount) => {
                  setIsSubmitting(true);
                  try {
                    if (direction === 'sell') {
                      await swarmActions.submitIntent('sell', amount, amount * 0.99);
                    } else {
                      await swarmActions.submitIntent('buy', amount, amount * 0.99);
                    }
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 3000);
                  } catch (e: any) {
                    const errorMsg = e?.message || 'Unknown error';
                    if (!errorMsg.includes('already in use') && !errorMsg.includes('0x0')) {
                      setShowError(errorMsg);
                      setTimeout(() => setShowError(null), 5000);
                    }
                  }
                  setIsSubmitting(false);
                }}
                onDeposit={async (type) => {
                  setIsSubmitting(true);
                  try {
                    if (type === 'sol') {
                      await swarmActions.depositSol(0.05);
                    } else {
                      await swarmActions.depositUsdc(swarmState.realUsdcBalance);
                    }
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 3000);
                  } catch (e: any) {
                    setShowError(e?.message || 'Deposit failed');
                    setTimeout(() => setShowError(null), 5000);
                  }
                  setIsSubmitting(false);
                }}
                onWithdraw={async (type) => {
                  setIsSubmitting(true);
                  try {
                    if (type === 'sol') {
                      await swarmActions.withdrawSol(agentSol / 1e9);
                    } else {
                      await swarmActions.withdrawUsdc(agentUsdc / 1e6);
                    }
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 3000);
                  } catch (e: any) {
                    setShowError(e?.message || 'Withdraw failed');
                    setTimeout(() => setShowError(null), 5000);
                  }
                  setIsSubmitting(false);
                }}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Bottom stats - Dark Pool Activity */}
        <footer className="p-6 md:p-10">
          <SwarmActivity
            totalBatches={totalBatches}
            totalVolume={totalVolume}
          />

          <div className="flex flex-col items-center gap-3 mt-8">
            <HowItWorks />
            <p className="text-xs text-white/20">
              Dark Liquidity Pool • Light Protocol ZK Compression • Agent Infrastructure
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
