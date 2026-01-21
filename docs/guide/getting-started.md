# Getting Started

SwarmShield is a privacy-preserving dark pool for Solana that protects your trades from MEV extraction.

## What is MEV?

**Maximal Extractable Value (MEV)** is profit that can be extracted by reordering, inserting, or censoring transactions. On public blockchains, every trade you submit is visible before execution, allowing sophisticated bots to:

- **Front-run** your buys (buying before you, selling to you higher)
- **Sandwich** your trades (surrounding your trade to extract value)
- **Back-run** for arbitrage opportunities your trade creates

## How SwarmShield Protects You

Instead of submitting trades directly to a DEX, SwarmShield:

1. **Collects trade intents** from multiple users into a shielded pool
2. **Batches them together** into a single unified transaction
3. **Executes as one trade** - MEV bots see one large trade, not individuals
4. **Distributes outputs fairly** based on each user's contribution

## Prerequisites

- A Solana wallet (Phantom, Solflare, etc.)
- Some SOL for transaction fees (devnet SOL for testing)
- Browser with wallet extension installed

## Quick Start

1. Visit [SwarmShield Demo](https://swarmshield.vercel.app)
2. Connect your wallet
3. Initialize the protocol (first-time only)
4. Register as a shielded agent
5. Deposit SOL to your shielded vault
6. Submit trade intents

## Network

SwarmShield is currently deployed on **Solana Devnet** for testing.

| Component | Address |
|-----------|---------|
| Program ID | `5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew` |
| SwarmUSDC Mint | `8ypRqPnaiegfw9if3R2JZpqLsfr4YHjfPtxUz8YgdkuJ` |

## Next Steps

- [Why SwarmShield?](/guide/why-swarmshield) - Deep dive into MEV protection
- [Quick Start Guide](/guide/quick-start) - Step-by-step tutorial
- [Architecture Overview](/architecture/overview) - Technical details
