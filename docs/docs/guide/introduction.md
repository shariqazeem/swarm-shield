# Introduction

SwarmShield is a **dark liquidity pool** on Solana with **true end-to-end encryption**. Unlike other dark pools that simply batch trades, SwarmShield encrypts your trade intents using military-grade cryptography before they ever touch the blockchain.

## The Problem

Every day, MEV (Maximal Extractable Value) bots extract millions from Solana traders:

- **Sandwich Attacks**: Bots see your trade, buy before you, and sell after - pocketing the difference
- **Front-running**: Bots detect large trades and execute first, leaving you with worse prices
- **AI Agents are Easy Targets**: Algorithmic traders have predictable patterns that bots exploit

**The root cause?** Your trade intentions are visible in the public mempool.

## The Solution

SwarmShield encrypts your trade intent **before** it goes on-chain:

```
Without SwarmShield:
┌─────────────────────────────────────┐
│ Mempool: SELL 1.5 SOL, slippage 1% │  ← MEV bot reads this
│ 🥪 Sandwich attack: -3%            │
└─────────────────────────────────────┘

With SwarmShield:
┌─────────────────────────────────────┐
│ On-chain: 9bed43a48f60f39e2a857...  │  ← MEV bot sees random bytes
│ 🛡️ Attack blocked: 0% loss         │
└─────────────────────────────────────┘
```

## Key Features

### 🔐 NaCl Box Encryption

We use the same encryption as Signal messenger:
- **X25519** key exchange
- **XSalsa20** stream cipher
- **Poly1305** authentication
- **96-byte** encrypted payload

### 🤖 Swarm Intelligence

Individual intents are batched together:
1. Alice submits encrypted SELL intent
2. Bob submits encrypted SELL intent  
3. Carol submits encrypted SELL intent
4. Keeper decrypts, batches, executes ONE Jupiter swap
5. No individual trade patterns visible

### ⚡ Agent SDK

Built for AI agents with framework integrations:
- Eliza
- LangChain
- AutoGPT
- Custom agents

## Quick Links

- [How It Works](/guide/how-it-works) - Deep dive into the architecture
- [Quick Start](/guide/quickstart) - Start trading in 5 minutes
- [Agent SDK](/sdk/quickstart) - Integrate into your bot
- [Launch App](https://swarmshield.vercel.app) - Try it now on Devnet
