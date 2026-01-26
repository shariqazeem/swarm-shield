"use client";

/**
 * HeroSection - Impressive landing section for SwarmShield
 *
 * Features:
 * - Animated encryption visualization
 * - Live stats display
 * - Gradient text effects
 * - Responsive design
 */

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface HeroSectionProps {
  onConnect?: () => void;
  isConnected?: boolean;
}

// Animated encrypted data display
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

// Animated stats counter
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

export function HeroSection({ onConnect, isConnected }: HeroSectionProps) {
  return (
    <div className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 py-20">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 4 }}
        />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center max-w-4xl"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
        >
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-white/60">Live on Solana Devnet</span>
        </motion.div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extralight tracking-tight mb-6">
          <span className="block">Trade in the</span>
          <span className="block bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
            Dark
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-white/40 font-light mb-4 max-w-2xl mx-auto">
          End-to-end encrypted intents. MEV bots see only random bytes.
        </p>

        {/* Encrypted data visualization */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-12 py-3 px-6 rounded-lg bg-black/50 border border-white/5 inline-block"
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
          className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-12"
        >
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-light text-white">
              <AnimatedCounter value={99} suffix="%" />
            </p>
            <p className="text-xs text-white/30 mt-1">MEV Protected</p>
          </div>
          <div className="hidden md:block w-px h-12 bg-white/10" />
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-light text-white">
              <AnimatedCounter value={96} />
              <span className="text-lg text-white/50">b</span>
            </p>
            <p className="text-xs text-white/30 mt-1">Encrypted Payload</p>
          </div>
          <div className="hidden md:block w-px h-12 bg-white/10" />
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-light text-white">
              <AnimatedCounter value={0} />
            </p>
            <p className="text-xs text-white/30 mt-1">Data Leaked</p>
          </div>
        </motion.div>

        {/* CTA Button */}
        {!isConnected && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            onClick={onConnect}
            className="px-12 py-4 bg-white text-black font-medium rounded-full text-lg
                     hover:bg-white/90 transition-all hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Enter the Dark Pool
          </motion.button>
        )}

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-6"
        >
          <div className="flex items-center gap-2 text-white/20">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">NaCl Box Encryption</span>
          </div>
          <div className="flex items-center gap-2 text-white/20">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">X25519 Key Exchange</span>
          </div>
          <div className="flex items-center gap-2 text-white/20">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs">Jupiter Swaps</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-white/40 rounded-full" />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default HeroSection;
