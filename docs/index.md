---
layout: home

hero:
  name: SwarmShield
  text: Trade in the Dark
  tagline: Privacy-preserving dark pool for Solana. End-to-end encrypted intents. MEV bots see only random bytes.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Launch App
      link: https://swarmshield.vercel.app

features:
  - title: End-to-End Encryption
    details: NaCl Box encryption ensures your trade details are cryptographically hidden. Only the keeper can decrypt, and only at execution time.
  - title: Batch Execution
    details: Multiple intents combined into single transactions. Individual trades become invisible within the aggregate.
  - title: Real Token Transfers
    details: Not a simulation. Real SOL deposits, real SwarmUSDC tokens, verifiable on-chain. Production-ready architecture.
  - title: Agent Ready
    details: Built for autonomous AI agents. SDK integrations for Eliza, LangChain, and more. Trade programmatically without MEV.
---

<div class="custom-section">

## The Problem

Every trade you submit is visible in the mempool before execution. MEV bots exploit this transparency:

| Attack | How it works | Your loss |
|--------|-------------|-----------|
| Front-run | Bot buys before you, sells to you higher | 1-5% |
| Sandwich | Bot surrounds your trade | 2-10% |
| Back-run | Bot captures your price impact | 0.5-2% |

## The Solution

SwarmShield makes your trades invisible:

```
Your Intent    Encrypted     Batched        Executed
    ↓             ↓            ↓              ↓
 0.1 SOL  →  9bed43a8...  →  [████]  →  Fair Output
    ?             ?            ?              ✓
```

MEV bots see encrypted bytes. No direction. No amount. No opportunity.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   User  →  Encrypt Intent  →  On-Chain Pool            │
│                                      ↓                  │
│                              Keeper Batches             │
│                                      ↓                  │
│   User  ←  Fair Settlement  ←  DEX Execution           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Integrations

Built on production infrastructure:

- **Light Protocol** — ZK compression for 99% cost reduction
- **Helius** — Enterprise RPC with enhanced APIs
- **Range Protocol** — Wallet compliance screening
- **Jupiter** — Best-price DEX aggregation

</div>

<style>
.custom-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.custom-section h2 {
  margin-top: 3rem;
  font-weight: 200;
}

.custom-section table {
  width: 100%;
  margin: 1.5rem 0;
}

.custom-section pre {
  background: #0a0a0a;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
}
</style>
