"use client";

import { motion } from "framer-motion";
import { Shield, Terminal, Github, ExternalLink, Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";

// Dynamic import to prevent hydration mismatch
const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

interface HeaderProps {
  walletBalance?: number;
}

export default function Header({ walletBalance }: HeaderProps) {
  const { connected, publicKey } = useWallet();

  return (
    <header className="border-b border-matrix/20 bg-void/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div
              className="relative"
              animate={{
                boxShadow: [
                  "0 0 10px rgba(0, 255, 0, 0.3)",
                  "0 0 20px rgba(0, 255, 0, 0.5)",
                  "0 0 10px rgba(0, 255, 0, 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-10 h-10 rounded-lg bg-matrix/10 border border-matrix/50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-matrix" />
              </div>
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-matrix tracking-wider">
                SWARMSHIELD
              </h1>
              <p className="text-xs text-matrix/40 font-mono">
                Dark Pool for AI Agents
              </p>
            </div>
          </div>

          {/* Center - Status */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-matrix/10 rounded-full border border-matrix/30">
              <motion.div
                className="w-2 h-2 rounded-full bg-matrix"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs text-matrix font-mono">DEVNET</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-matrix/60">
              <Terminal className="w-4 h-4" />
              <span className="font-mono">v0.1.0-alpha</span>
            </div>
            {connected && walletBalance !== undefined && (
              <div className="flex items-center gap-2 px-3 py-1 bg-cyber/10 rounded-full border border-cyber/30">
                <Wallet className="w-3 h-3 text-cyber" />
                <span className="text-xs text-cyber font-mono">
                  {walletBalance.toFixed(4)} SOL
                </span>
              </div>
            )}
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-3">
            {/* GitHub Link */}
            <motion.a
              href="https://github.com/swarmshield"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-matrix/60 hover:text-matrix transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github className="w-5 h-5" />
            </motion.a>

            {/* Wallet Connect Button */}
            <div className="wallet-adapter-button-wrapper">
              <WalletMultiButtonDynamic />
            </div>
          </div>
        </div>
      </div>

      {/* Hackathon Banner */}
      <div className="bg-shield/10 border-t border-b border-shield/30 py-1">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 text-xs">
          <span className="text-shield/60">Built for</span>
          <span className="text-shield font-bold">Solana Privacy Hackathon 2026</span>
          <ExternalLink className="w-3 h-3 text-shield/60" />
          <span className="text-shield/40 mx-2">|</span>
          <a
            href={`https://solscan.io/account/5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-matrix/60 hover:text-matrix transition-colors flex items-center gap-1"
          >
            <span>Program</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </header>
  );
}
