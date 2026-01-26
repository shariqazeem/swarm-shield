# SwarmShield Agent SDK

**MEV-Protected Trading for AI Agents on Solana**

This SDK enables AI agents to trade through SwarmShield's encrypted dark pool, protecting them from sandwich attacks and other MEV extraction.

## Installation

```bash
npm install @swarmshield/agent-sdk
# or
yarn add @swarmshield/agent-sdk
```

## Quick Start

```typescript
import { SwarmShieldAgent } from "@swarmshield/agent-sdk";
import { Keypair } from "@solana/web3.js";

// Initialize agent
const agent = new SwarmShieldAgent(
  "https://devnet.helius-rpc.com/?api-key=YOUR_KEY",
  keypair
);

// Submit encrypted trade intent
const result = await agent.submitEncryptedIntent("sell", BigInt(100000000), 50);
console.log("Encrypted payload:", result.encryptedData);
// MEV bots see: 9bed43a48f60f39e2a857226...
// Cannot determine: direction, amount, or slippage
```

## Framework Integrations

### Eliza Framework Pattern

```typescript
import { SwarmShieldAgent } from "@swarmshield/agent-sdk";

// Define SwarmShield action for Eliza
const swarmShieldAction = {
  name: "SWARMSHIELD_TRADE",
  description: "Execute MEV-protected trade through SwarmShield dark pool",

  async execute(params: { direction: "buy" | "sell"; amount: number; slippage: number }) {
    const agent = new SwarmShieldAgent(RPC_URL, agentKeypair);

    const amountLamports = BigInt(Math.floor(params.amount * 1e9));
    const result = await agent.submitEncryptedIntent(
      params.direction,
      amountLamports,
      params.slippage * 100
    );

    return {
      success: true,
      signature: result.signature,
      message: `Trade encrypted and submitted. MEV bots blocked.`
    };
  }
};
```

### LangChain Tool Pattern

```typescript
import { Tool } from "langchain/tools";
import { SwarmShieldAgent } from "@swarmshield/agent-sdk";

class SwarmShieldTool extends Tool {
  name = "swarmshield_trade";
  description = "Execute MEV-protected trades on Solana via encrypted dark pool";

  private agent: SwarmShieldAgent;

  constructor(rpcUrl: string, keypair: Keypair) {
    super();
    this.agent = new SwarmShieldAgent(rpcUrl, keypair);
  }

  async _call(input: string): Promise<string> {
    const { direction, amount, slippage } = JSON.parse(input);
    const result = await this.agent.submitEncryptedIntent(
      direction,
      BigInt(amount),
      slippage
    );
    return JSON.stringify(result);
  }
}
```

### AutoGPT Plugin Pattern

```typescript
// swarmshield_plugin.py equivalent in TypeScript
export class SwarmShieldPlugin {
  private agent: SwarmShieldAgent;

  constructor(config: { rpcUrl: string; privateKey: string }) {
    const keypair = Keypair.fromSecretKey(Buffer.from(config.privateKey, 'base64'));
    this.agent = new SwarmShieldAgent(config.rpcUrl, keypair);
  }

  // Command: swarmshield_trade
  async trade(direction: "buy" | "sell", amountSol: number): Promise<{
    success: boolean;
    encrypted: string;
    signature: string;
  }> {
    const result = await this.agent.submitEncryptedIntent(
      direction,
      BigInt(Math.floor(amountSol * 1e9)),
      100 // 1% slippage
    );

    return {
      success: true,
      encrypted: result.encryptedData.slice(0, 32) + "...",
      signature: result.signature
    };
  }
}
```

## Why AI Agents Need SwarmShield

### The Problem
AI agents are predictable. MEV bots watch for their patterns:
- **Algorithmic trading patterns** are easy to detect
- **Large, frequent trades** are prime targets
- **Public mempool** exposes all intentions

### The Solution
SwarmShield encrypts trade intents before submission:

```
Without SwarmShield:
┌─────────────────────────────────┐
│ Mempool: SELL 1.5 SOL @ 0.5%   │  ← MEV bot reads this
│ 🥪 Sandwich attack: -3%        │
└─────────────────────────────────┘

With SwarmShield:
┌─────────────────────────────────┐
│ On-chain: 9bed43a48f60f39e...  │  ← MEV bot sees random bytes
│ 🛡️ Attack blocked: 0% loss    │
└─────────────────────────────────┘
```

## API Reference

### `SwarmShieldAgent`

```typescript
class SwarmShieldAgent {
  constructor(rpcUrl: string, keypair: Keypair);

  // Get SOL balance
  getBalance(): Promise<number>;

  // Submit encrypted trade intent
  submitEncryptedIntent(
    direction: "buy" | "sell",
    amount: bigint,           // In lamports for SOL, smallest units for tokens
    slippageBps?: number      // Default: 100 (1%)
  ): Promise<{
    signature: string;
    encryptedData: string;
  }>;

  // Execute trading strategy
  executeTradingStrategy(
    trades: Array<{
      direction: "buy" | "sell";
      amountSol?: number;
      amountUsdc?: number;
    }>
  ): Promise<Array<{ signature: string; encryptedData: string }>>;
}
```

### Encryption Details

- **Algorithm**: NaCl Box (X25519 + XSalsa20-Poly1305)
- **Payload**: 96 bytes (32 ephemeral key + 24 nonce + 40 ciphertext)
- **Key Exchange**: X25519 ECDH
- **Cipher**: XSalsa20 stream cipher
- **MAC**: Poly1305 authentication

## Running the Demo

```bash
cd sdk
npm install
npx tsx agent-example.ts
```

## Environment Variables

```bash
HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
KEEPER_PUBLIC_KEY=HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE=
```

## Links

- **Program**: [5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew](https://solscan.io/account/5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew?cluster=devnet)
- **Frontend**: [swarmshield.vercel.app](https://swarmshield.vercel.app)
- **GitHub**: [github.com/shariqazeem/swarm-shield](https://github.com/shariqazeem/swarm-shield)

---

**SwarmShield: Where Agents Trade in the Dark**

*PNP Exchange Bounty ($2,500) - Privacy Infrastructure for Autonomous Agents*
