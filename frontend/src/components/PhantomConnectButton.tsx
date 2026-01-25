"use client";

import { FC, useState, useRef, useEffect } from "react";
import { useWallet } from "@/contexts/PhantomWallet";

export const PhantomConnectButton: FC = () => {
  const { connected, publicKey, connecting, connect, disconnect } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!connected) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20
                   rounded-lg text-sm font-medium text-white transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {connecting ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  const addr = publicKey?.toBase58() || "";
  const shortAddr = `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20
                   rounded-lg text-sm font-medium text-white transition-all
                   flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-green-400" />
        {shortAddr}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-white/20
                        rounded-lg shadow-xl overflow-hidden z-50 min-w-[160px]">
          <button
            onClick={() => {
              navigator.clipboard.writeText(addr);
              setShowDropdown(false);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10
                       transition-colors"
          >
            Copy Address
          </button>
          <button
            onClick={() => {
              disconnect();
              setShowDropdown(false);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/10
                       transition-colors border-t border-white/10"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
