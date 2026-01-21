"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useSwarmShield } from "@/hooks/useSwarmShield";
import { HowItWorks } from "@/components/HowItWorks";
import { SponsorBadges } from "@/components/SponsorBadges";
import { ComplianceCheck } from "@/components/ComplianceCheck";
import { IntegrationVerifier } from "@/components/IntegrationVerifier";
import { TradeInterface } from "@/components/TradeInterface";
import { AgentSDK } from "@/components/AgentSDK";
import { NetworkStatus } from "@/components/NetworkStatus";
import { SwarmActivity } from "@/components/SwarmActivity";
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

      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />

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

            {/* Step 0: Not connected */}
            {!connected && (
              <motion.div
                key="connect"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center max-w-2xl"
              >
                <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-6">
                  Trade Together.
                  <br />
                  <span className="text-white/60">Defeat MEV.</span>
                </h1>
                <p className="text-lg text-white/40 font-light mb-12 max-w-md mx-auto">
                  Join the swarm. Your trades are batched with others,
                  making you invisible to MEV bots.
                </p>
                <p className="text-sm text-white/30">Connect your wallet to join the swarm</p>
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
