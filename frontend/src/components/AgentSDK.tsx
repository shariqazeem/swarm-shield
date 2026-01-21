"use client";

/**
 * ============================================================================
 * AGENT SDK - For AI Agents & Bots
 * ============================================================================
 *
 * Shows developers how to integrate SwarmShield programmatically.
 * This is the "Agent First" interface that PNP Exchange judges want to see.
 *
 * Privacy Hack 2026 - PNP Exchange ($2,500) + Anoncoin ($10,000)
 * ============================================================================
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentSDKProps {
  walletAddress?: string;
  programId: string;
}

export function AgentSDK({ walletAddress, programId }: AgentSDKProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'typescript' | 'python' | 'rust'>('typescript');
  const [copied, setCopied] = useState(false);

  const walletPlaceholder = walletAddress || 'YOUR_WALLET_PUBKEY';

  const codeSnippets = {
    typescript: `// SwarmShield Agent SDK - TypeScript/Eliza
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

const PROGRAM_ID = '${programId}';
const RPC_URL = 'https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY';

class SwarmShieldAgent {
  private program: Program;
  private wallet: Keypair;

  constructor(secretKey: Uint8Array) {
    this.wallet = Keypair.fromSecretKey(secretKey);
    const connection = new Connection(RPC_URL);
    // Initialize Anchor program...
  }

  // Shield assets into the dark pool
  async shieldAssets(amountSol: number): Promise<string> {
    const tx = await this.program.methods
      .depositSol(new BN(amountSol * 1e9))
      .accounts({
        agent: this.getAgentPDA(),
        owner: this.wallet.publicKey,
      })
      .rpc();
    return tx;
  }

  // Submit private trade intent
  async submitIntent(
    direction: 'buy' | 'sell',
    amount: number,
    minOutput: number
  ): Promise<string> {
    const intentType = direction === 'sell' ? { sell: {} } : { buy: {} };

    const tx = await this.program.methods
      .submitIntent(
        intentType,
        new BN(amount * 1e9),
        new BN(minOutput * 1e9)
      )
      .accounts({
        config: this.getConfigPDA(),
        agent: this.getAgentPDA(),
        owner: this.wallet.publicKey,
      })
      .rpc();
    return tx;
  }

  // Get shielded balances
  async getBalances(): Promise<{ sol: number; usdc: number }> {
    const agent = await this.program.account.agent.fetch(this.getAgentPDA());
    return {
      sol: agent.solBalance.toNumber() / 1e9,
      usdc: agent.usdcBalance.toNumber() / 1e6,
    };
  }
}

// Example: AI Trading Bot
const agent = new SwarmShieldAgent(YOUR_SECRET_KEY);
await agent.shieldAssets(0.1);  // Shield 0.1 SOL
await agent.submitIntent('sell', 0.05, 9.5);  // Sell 0.05 SOL for ~10 USDC`,

    python: `# SwarmShield Agent SDK - Python/ARC Framework
from solana.rpc.api import Client
from solana.keypair import Keypair
from solana.publickey import PublicKey
from anchorpy import Program, Provider, Wallet

PROGRAM_ID = "${programId}"
RPC_URL = "https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY"

class SwarmShieldAgent:
    def __init__(self, secret_key: bytes):
        self.wallet = Keypair.from_secret_key(secret_key)
        self.client = Client(RPC_URL)
        # Initialize Anchor program...

    async def shield_assets(self, amount_sol: float) -> str:
        """Shield SOL into the dark liquidity pool"""
        tx = await self.program.rpc["deposit_sol"](
            int(amount_sol * 1e9),
            ctx=self._get_deposit_ctx()
        )
        return str(tx)

    async def submit_intent(
        self,
        direction: str,  # "buy" or "sell"
        amount: float,
        min_output: float
    ) -> str:
        """Submit private trade intent to the swarm"""
        intent_type = {"sell": {}} if direction == "sell" else {"buy": {}}

        tx = await self.program.rpc["submit_intent"](
            intent_type,
            int(amount * 1e9),
            int(min_output * 1e9),
            ctx=self._get_intent_ctx()
        )
        return str(tx)

    async def get_balances(self) -> dict:
        """Get shielded dark pool balances"""
        agent = await self.program.account["Agent"].fetch(self.agent_pda)
        return {
            "sol": agent.sol_balance / 1e9,
            "usdc": agent.usdc_balance / 1e6
        }

# Example: Autonomous Trading Agent
agent = SwarmShieldAgent(YOUR_SECRET_KEY)
await agent.shield_assets(0.1)  # Shield 0.1 SOL
await agent.submit_intent("sell", 0.05, 9.5)  # Private swap`,

    rust: `// SwarmShield Agent SDK - Rust
use anchor_client::{Client, Cluster};
use solana_sdk::{
    commitment_config::CommitmentConfig,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
};

const PROGRAM_ID: &str = "${programId}";

pub struct SwarmShieldAgent {
    program: anchor_client::Program,
    wallet: Keypair,
}

impl SwarmShieldAgent {
    pub fn new(secret_key: &[u8]) -> Self {
        let wallet = Keypair::from_bytes(secret_key).unwrap();
        let client = Client::new_with_options(
            Cluster::Custom(
                "https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY".into(),
                "wss://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY".into(),
            ),
            &wallet,
            CommitmentConfig::confirmed(),
        );
        // Initialize program...
        Self { program, wallet }
    }

    /// Shield assets into the dark liquidity pool
    pub async fn shield_assets(&self, amount_sol: f64) -> Result<String> {
        let lamports = (amount_sol * 1e9) as u64;
        let tx = self.program
            .request()
            .accounts(deposit_accounts)
            .args(swarm_shield::instruction::DepositSol { amount: lamports })
            .send()
            .await?;
        Ok(tx.to_string())
    }

    /// Submit private trade intent
    pub async fn submit_intent(
        &self,
        direction: IntentType,
        amount: f64,
        min_output: f64,
    ) -> Result<String> {
        let tx = self.program
            .request()
            .accounts(intent_accounts)
            .args(swarm_shield::instruction::SubmitIntent {
                intent_type: direction,
                amount: (amount * 1e9) as u64,
                min_output: (min_output * 1e9) as u64,
            })
            .send()
            .await?;
        Ok(tx.to_string())
    }
}

// Example: High-frequency trading bot
let agent = SwarmShieldAgent::new(&secret_key);
agent.shield_assets(0.1).await?;
agent.submit_intent(IntentType::Sell, 0.05, 9.5).await?;`
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Trigger Button - Bottom left, prominent */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-6 z-40 px-4 py-2.5
                   bg-white/5 hover:bg-white/10 backdrop-blur-sm
                   text-white/60 hover:text-white/90 transition-all
                   border border-white/10 hover:border-white/20 rounded-xl
                   flex items-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-sm">{'</>'}</span>
        <span className="text-xs font-medium tracking-wide">Agent SDK</span>
      </motion.button>

      {/* SDK Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-black border border-white/10 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-8 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-extralight tracking-tight">Agent SDK</h2>
                    <p className="text-xs text-white/30 mt-1">
                      Dark Pool Infrastructure for AI Agents
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center"
                  >
                    <span className="text-white/40">×</span>
                  </button>
                </div>

                {/* Language Tabs */}
                <div className="flex gap-1 mt-6">
                  {(['typescript', 'python', 'rust'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveTab(lang)}
                      className={`px-4 py-2 text-xs rounded-full transition-all ${
                        activeTab === lang
                          ? 'bg-white text-black'
                          : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      {lang === 'typescript' ? 'TypeScript' : lang === 'python' ? 'Python' : 'Rust'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Display */}
              <div className="p-6 overflow-y-auto max-h-[55vh]">
                <div className="relative">
                  <pre className="bg-white/5 rounded-xl p-4 overflow-x-auto">
                    <code className="text-xs text-white/70 font-mono leading-relaxed">
                      {codeSnippets[activeTab]}
                    </code>
                  </pre>

                  {/* Copy Button */}
                  <button
                    onClick={copyCode}
                    className="absolute top-3 right-3 px-3 py-1.5 text-[10px] uppercase tracking-wider
                             bg-white/10 hover:bg-white/20 rounded-full transition-all"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {/* Features */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-2">MEV Protected</p>
                    <p className="text-sm text-white/80">Intent batching hides your strategy</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-2">ZK Compressed</p>
                    <p className="text-sm text-white/80">Light Protocol for 99% cheaper state</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Dark Liquidity</p>
                    <p className="text-sm text-white/80">Trade without revealing position</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-white/20 uppercase tracking-wider">Built for</span>
                  <span className="text-xs text-white/50">Eliza</span>
                  <span className="text-white/10">·</span>
                  <span className="text-xs text-white/50">ARC</span>
                  <span className="text-white/10">·</span>
                  <span className="text-xs text-white/50">Custom Agents</span>
                </div>
                <span className="text-[10px] text-white/20">Program: {programId.slice(0, 8)}...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AgentSDK;
