# Framework Integrations

Integrate SwarmShield with popular AI agent frameworks.

## Eliza (ai16z)

Eliza is a popular framework for building AI agents. Here's how to add SwarmShield as a plugin.

### Installation

```bash
npm install @ai16z/eliza @solana/web3.js tweetnacl
```

### Plugin Implementation

```typescript
// swarmshield-plugin.ts
import { Plugin, Action, IAgentRuntime } from "@ai16z/eliza";
import { Keypair, Connection } from "@solana/web3.js";
import nacl from "tweetnacl";

const KEEPER_PUBLIC_KEY = Uint8Array.from(
  Buffer.from("HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE=", "base64")
);

function encryptIntent(direction: number, amount: bigint, minOutput: bigint): Uint8Array {
  const message = new Uint8Array(17);
  message[0] = direction;
  for (let i = 0; i < 8; i++) {
    message[1 + i] = Number((amount >> BigInt(i * 8)) & BigInt(0xff));
    message[9 + i] = Number((minOutput >> BigInt(i * 8)) & BigInt(0xff));
  }

  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(24);
  const ciphertext = nacl.box(message, nonce, KEEPER_PUBLIC_KEY, ephemeralKeyPair.secretKey);

  const encrypted = new Uint8Array(96);
  encrypted.set(ephemeralKeyPair.publicKey, 0);
  encrypted.set(nonce, 32);
  encrypted.set(ciphertext, 56);

  return encrypted;
}

const shieldedTradeAction: Action = {
  name: "SHIELDED_TRADE",
  description: "Execute MEV-protected trade via SwarmShield",

  validate: async (runtime: IAgentRuntime, message: any) => {
    return message.content.includes("trade") ||
           message.content.includes("swap") ||
           message.content.includes("sell");
  },

  handler: async (runtime: IAgentRuntime, message: any) => {
    // Parse intent from message
    const direction = message.content.includes("sell") ? 1 : 0;
    const amount = BigInt(50000000); // 0.05 SOL
    const minOutput = BigInt(9500000); // ~9.5 USDC

    // Encrypt
    const encrypted = encryptIntent(direction, amount, minOutput);

    return {
      success: true,
      encrypted: Buffer.from(encrypted).toString("hex"),
      message: `Shielded ${direction === 1 ? "sell" : "buy"} intent created`
    };
  }
};

export const swarmShieldPlugin: Plugin = {
  name: "swarmshield",
  description: "MEV-protected trading via SwarmShield dark pool",
  actions: [shieldedTradeAction],
};
```

### Usage with Eliza

```typescript
import { AgentRuntime } from "@ai16z/eliza";
import { swarmShieldPlugin } from "./swarmshield-plugin";

const runtime = new AgentRuntime({
  plugins: [swarmShieldPlugin],
  // ... other config
});

// Agent can now respond to trading requests with MEV protection
```

---

## LangChain

Integrate SwarmShield as a LangChain tool for autonomous trading.

### Installation

```bash
npm install langchain @langchain/openai @solana/web3.js tweetnacl
```

### Tool Implementation

```typescript
// swarmshield-tool.ts
import { Tool } from "langchain/tools";
import nacl from "tweetnacl";

const KEEPER_PUBLIC_KEY = Uint8Array.from(
  Buffer.from("HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE=", "base64")
);

function encryptIntent(direction: number, amount: bigint, minOutput: bigint): Uint8Array {
  const message = new Uint8Array(17);
  message[0] = direction;
  for (let i = 0; i < 8; i++) {
    message[1 + i] = Number((amount >> BigInt(i * 8)) & BigInt(0xff));
    message[9 + i] = Number((minOutput >> BigInt(i * 8)) & BigInt(0xff));
  }

  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(24);
  const ciphertext = nacl.box(message, nonce, KEEPER_PUBLIC_KEY, ephemeralKeyPair.secretKey);

  const encrypted = new Uint8Array(96);
  encrypted.set(ephemeralKeyPair.publicKey, 0);
  encrypted.set(nonce, 32);
  encrypted.set(ciphertext, 56);

  return encrypted;
}

export class SwarmShieldTool extends Tool {
  name = "swarmshield_trade";
  description = `Execute MEV-protected trades on Solana.
    Input: JSON with direction (buy/sell), amount (in SOL).
    Output: Encrypted intent ready for submission.`;

  async _call(input: string): Promise<string> {
    const { direction, amount } = JSON.parse(input);

    const intentDirection = direction === "sell" ? 1 : 0;
    const amountLamports = BigInt(Math.floor(amount * 1e9));
    const minOutput = (amountLamports * BigInt(99)) / BigInt(100); // 1% slippage

    const encrypted = encryptIntent(intentDirection, amountLamports, minOutput);

    return JSON.stringify({
      success: true,
      encrypted: Buffer.from(encrypted).toString("hex"),
      direction,
      amount,
      protection: "MEV-shielded via SwarmShield"
    });
  }
}
```

### Usage with LangChain Agent

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { SwarmShieldTool } from "./swarmshield-tool";

const model = new ChatOpenAI({ modelName: "gpt-4" });
const tools = [new SwarmShieldTool()];

const executor = await initializeAgentExecutorWithOptions(tools, model, {
  agentType: "openai-functions",
});

// Agent can now execute MEV-protected trades
const result = await executor.invoke({
  input: "Sell 0.1 SOL with MEV protection"
});
```

---

## AutoGPT

Add SwarmShield as an AutoGPT command.

### Command Implementation

```python
# swarmshield_command.py
import json
import base64
from nacl.public import PrivateKey, PublicKey, Box
from nacl.utils import random

KEEPER_PUBLIC_KEY = base64.b64decode("HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE=")

def encrypt_intent(direction: int, amount: int, min_output: int) -> bytes:
    """Encrypt a trade intent using NaCl box."""
    # Serialize intent (17 bytes)
    message = bytearray(17)
    message[0] = direction

    for i in range(8):
        message[1 + i] = (amount >> (i * 8)) & 0xff
        message[9 + i] = (min_output >> (i * 8)) & 0xff

    # Generate ephemeral keypair
    ephemeral_private = PrivateKey.generate()
    ephemeral_public = ephemeral_private.public_key

    # Create box and encrypt
    box = Box(ephemeral_private, PublicKey(KEEPER_PUBLIC_KEY))
    nonce = random(24)
    ciphertext = box.encrypt(bytes(message), nonce).ciphertext

    # Combine into 96-byte payload
    payload = bytes(ephemeral_public) + nonce + ciphertext
    return payload

class SwarmShieldCommand:
    """AutoGPT command for MEV-protected trading."""

    def __init__(self):
        self.name = "swarmshield_trade"
        self.description = "Execute MEV-protected trade on Solana"
        self.signature = "(direction: str, amount: float) -> str"

    def __call__(self, direction: str, amount: float) -> str:
        intent_direction = 1 if direction.lower() == "sell" else 0
        amount_lamports = int(amount * 1e9)
        min_output = int(amount_lamports * 0.99)  # 1% slippage

        encrypted = encrypt_intent(intent_direction, amount_lamports, min_output)

        return json.dumps({
            "success": True,
            "encrypted": encrypted.hex(),
            "direction": direction,
            "amount": amount,
            "note": "Submit this encrypted payload to SwarmShield program"
        })
```

---

## Virtuals Protocol

Integration for Virtuals Protocol AI agents.

```typescript
// virtuals-swarmshield.ts
import nacl from "tweetnacl";

const KEEPER_PUBLIC_KEY = Uint8Array.from(
  Buffer.from("HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE=", "base64")
);

export const swarmShieldCapability = {
  name: "mev_protected_trade",

  execute: async (params: { direction: "buy" | "sell"; amount: number }) => {
    const direction = params.direction === "sell" ? 1 : 0;
    const amountLamports = BigInt(Math.floor(params.amount * 1e9));
    const minOutput = (amountLamports * BigInt(99)) / BigInt(100);

    // Encrypt intent
    const message = new Uint8Array(17);
    message[0] = direction;
    for (let i = 0; i < 8; i++) {
      message[1 + i] = Number((amountLamports >> BigInt(i * 8)) & BigInt(0xff));
      message[9 + i] = Number((minOutput >> BigInt(i * 8)) & BigInt(0xff));
    }

    const ephemeralKeyPair = nacl.box.keyPair();
    const nonce = nacl.randomBytes(24);
    const ciphertext = nacl.box(message, nonce, KEEPER_PUBLIC_KEY, ephemeralKeyPair.secretKey);

    const encrypted = new Uint8Array(96);
    encrypted.set(ephemeralKeyPair.publicKey, 0);
    encrypted.set(nonce, 32);
    encrypted.set(ciphertext, 56);

    return {
      encrypted: Buffer.from(encrypted).toString("hex"),
      direction: params.direction,
      amount: params.amount,
      status: "ready_for_submission"
    };
  }
};
```

---

## Generic Integration Pattern

For any framework, follow this pattern:

```typescript
// 1. Import encryption library
import nacl from "tweetnacl";

// 2. Configure keeper key
const KEEPER_PUBLIC_KEY = Uint8Array.from(
  Buffer.from("HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE=", "base64")
);

// 3. Implement encryption function
function encryptIntent(direction: number, amount: bigint, minOutput: bigint): Uint8Array {
  // ... (see examples above)
}

// 4. Create framework-specific wrapper
class YourFrameworkSwarmShield {
  async trade(direction: "buy" | "sell", amountSol: number) {
    const encrypted = encryptIntent(
      direction === "sell" ? 1 : 0,
      BigInt(Math.floor(amountSol * 1e9)),
      BigInt(Math.floor(amountSol * 0.99 * 1e9))
    );

    return {
      encrypted: Buffer.from(encrypted).toString("hex"),
      // ... framework-specific response
    };
  }
}
```

## Next Steps

- [API Reference](/sdk/api-reference) - Full API documentation
- [Quick Start](/sdk/quickstart) - Basic examples
- [Architecture](/architecture/overview) - How SwarmShield works
