# Agent SDK Quick Start

Integrate SwarmShield into your AI trading agent in minutes.

## Installation

```bash
cd your-agent-project
npm install @solana/web3.js tweetnacl bn.js
```

## Basic Usage

```typescript
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";

// Configuration
const PROGRAM_ID = new PublicKey("5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew");
const KEEPER_PUBLIC_KEY = Uint8Array.from(
  Buffer.from("HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE=", "base64")
);

// Encrypt a trade intent
function encryptIntent(
  direction: number,  // 0 = BUY, 1 = SELL
  amount: bigint,     // Amount in lamports
  minOutput: bigint   // Minimum output (slippage protection)
): Uint8Array {
  // Serialize intent
  const message = new Uint8Array(17);
  message[0] = direction;
  for (let i = 0; i < 8; i++) {
    message[1 + i] = Number((amount >> BigInt(i * 8)) & BigInt(0xff));
    message[9 + i] = Number((minOutput >> BigInt(i * 8)) & BigInt(0xff));
  }

  // Encrypt
  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(24);
  const ciphertext = nacl.box(message, nonce, KEEPER_PUBLIC_KEY, ephemeralKeyPair.secretKey);

  // Combine into 96-byte payload
  const encrypted = new Uint8Array(96);
  encrypted.set(ephemeralKeyPair.publicKey, 0);
  encrypted.set(nonce, 32);
  encrypted.set(ciphertext, 56);

  return encrypted;
}

// Example: Sell 0.1 SOL with 1% slippage
const encrypted = encryptIntent(
  1,                    // SELL
  BigInt(100000000),    // 0.1 SOL
  BigInt(19000000)      // Min ~19 USDC
);

console.log("Encrypted payload:", Buffer.from(encrypted).toString("hex"));
// Output: 9bed43a48f60f39e2a857226... (96 bytes of random-looking data)
```

## SwarmShieldAgent Class

For convenience, use the `SwarmShieldAgent` wrapper:

```typescript
class SwarmShieldAgent {
  private connection: Connection;
  private keypair: Keypair;

  constructor(rpcUrl: string, keypair: Keypair) {
    this.connection = new Connection(rpcUrl, "confirmed");
    this.keypair = keypair;
  }

  async submitEncryptedIntent(
    direction: "buy" | "sell",
    amount: bigint,
    slippageBps: number = 100  // 1% default
  ) {
    const intentType = direction === "buy" ? 0 : 1;
    const minOutput = (amount * BigInt(10000 - slippageBps)) / BigInt(10000);
    
    const encryptedData = encryptIntent(intentType, amount, minOutput);
    
    // Submit to SwarmShield program...
    // (Full implementation in sdk/agent-example.ts)
    
    return {
      encrypted: Buffer.from(encryptedData).toString("hex"),
      direction,
      amount: amount.toString(),
    };
  }
}

// Usage
const agent = new SwarmShieldAgent(
  "https://devnet.helius-rpc.com/?api-key=YOUR_KEY",
  Keypair.generate()
);

await agent.submitEncryptedIntent("sell", BigInt(100000000), 100);
```

## What MEV Bots See

```
Your Intent:          What's On-Chain:
─────────────────     ──────────────────────────────────────────
SELL 0.1 SOL    →     9bed43a48f60f39e2a857226c8f2a78d5e1f...
1% slippage           (96 bytes of cryptographic noise)
```

**They cannot determine:**
- ❌ Buy or sell
- ❌ Amount
- ❌ Slippage tolerance
- ❌ Target token

## Next Steps

- [Installation](/sdk/installation) - Detailed setup
- [API Reference](/sdk/api-reference) - Full API docs
- [Framework Integration](/sdk/frameworks) - Eliza, LangChain, AutoGPT
