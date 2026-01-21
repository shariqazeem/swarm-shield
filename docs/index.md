---
layout: home

hero:
  name: SwarmShield
  text: Trade Together. Defeat MEV.
  tagline: Privacy-preserving dark pool for Solana. Batch your trades with others to become invisible to MEV bots.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View Demo
      link: https://swarmshield.vercel.app

features:
  - icon: 🛡️
    title: MEV Protection
    details: Your trades are batched with others into a single transaction. MEV bots can't identify or front-run individual trades.
  - icon: ⚡
    title: Real Token Transfers
    details: Not a simulation. Real SOL deposits and real SwarmUSDC token withdrawals directly to your wallet.
  - icon: 🔒
    title: Privacy by Design
    details: Intent-based architecture hides your trading activity. Only the batched aggregate is visible on-chain.
  - icon: 🐝
    title: Swarm Intelligence
    details: The more traders in the swarm, the stronger the protection. Collective anonymity through batching.
---

## How It Works

```
You (Intent) → SwarmShield → Batch with Others → Single DEX Trade → Fair Settlement
     🔒            🛡️              🐝                  ⚡                ✅
```

### The Problem: MEV Extraction

Every trade you make on-chain is visible before it executes. MEV bots exploit this by:
- **Front-running**: Buying before your buy, selling to you at a higher price
- **Sandwich attacks**: Surrounding your trade to extract value
- **Back-running**: Capturing arbitrage from your trade's price impact

### The Solution: Swarm Protection

SwarmShield batches multiple trade intents into a single transaction:

1. **Submit Intent** - Your trade intent is encrypted and pooled
2. **Batch Formation** - 3+ intents trigger automatic batching
3. **Unified Execution** - One transaction, multiple traders hidden inside
4. **Fair Distribution** - Outputs distributed proportionally to all participants

## Real, Not Simulated

- **Real SOL deposits** to on-chain vault PDA
- **Real SwarmUSDC tokens** - actual SPL token transfers
- **Verifiable on Solscan** - every transaction has proof
- **Production-ready architecture** - built for mainnet

## Built For

- **AI Agents** - Autonomous trading without MEV extraction
- **Whale Traders** - Large orders without signaling to bots
- **DeFi Users** - Fair execution on every swap
- **Privacy Seekers** - Trade without revealing your strategy

---

<div style="text-align: center; margin-top: 2rem; opacity: 0.6;">
  Built with ❤️ for Solana Privacy Hackathon 2026
</div>
