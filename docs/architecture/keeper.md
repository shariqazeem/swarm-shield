# Keeper Service Architecture

The keeper is an off-chain service that monitors, decrypts, batches, and executes trade intents.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     KEEPER SERVICE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Monitor   │──│   Decrypt   │──│   Execute   │        │
│  │   Intents   │  │   & Batch   │  │   Swap      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    RPC      │  │   NaCl Box  │  │  Jupiter    │        │
│  │   Polling   │  │   Decrypt   │  │    API      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Responsibilities

| Function | Description |
|----------|-------------|
| **Monitor** | Poll for pending TradeIntent accounts |
| **Decrypt** | Decrypt encrypted intents using keeper private key |
| **Batch** | Group intents by direction (buy/sell) |
| **Execute** | Call Jupiter API for aggregated swap |
| **Settle** | Distribute results to agent accounts |

## Implementation

### Main Loop

```typescript
// keeper/index.ts
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import * as anchor from "@coral-xyz/anchor";

const MIN_BATCH_SIZE = 3;
const POLL_INTERVAL_MS = 5000;

async function runKeeper() {
  const connection = new Connection(RPC_URL, "confirmed");
  const keeperKeypair = loadKeeperKeypair();

  console.log("Keeper started:", keeperKeypair.publicKey.toBase58());

  while (true) {
    try {
      // 1. Fetch pending intents
      const pendingIntents = await fetchPendingIntents(connection);

      if (pendingIntents.length >= MIN_BATCH_SIZE) {
        // 2. Decrypt all intents
        const decrypted = pendingIntents.map(intent =>
          decryptIntent(intent.encryptedData, keeperKeypair.secretKey)
        );

        // 3. Group by direction
        const sellIntents = decrypted.filter(i => i.direction === 1);
        const buyIntents = decrypted.filter(i => i.direction === 0);

        // 4. Execute batches
        if (sellIntents.length >= MIN_BATCH_SIZE) {
          await executeBatch(sellIntents, "sell", connection, keeperKeypair);
        }

        if (buyIntents.length >= MIN_BATCH_SIZE) {
          await executeBatch(buyIntents, "buy", connection, keeperKeypair);
        }
      }

      await sleep(POLL_INTERVAL_MS);
    } catch (error) {
      console.error("Keeper error:", error);
      await sleep(POLL_INTERVAL_MS);
    }
  }
}
```

### Fetching Pending Intents

```typescript
async function fetchPendingIntents(
  connection: Connection
): Promise<IntentAccount[]> {
  const program = getProgram(connection);

  // Fetch all TradeIntent accounts
  const accounts = await program.account.tradeIntent.all([
    {
      memcmp: {
        offset: 8 + 32 + 96, // Skip discriminator, agent, encrypted_data
        bytes: bs58.encode(Buffer.from([1])), // is_pending = true
      },
    },
  ]);

  return accounts.map(acc => ({
    publicKey: acc.publicKey,
    agent: acc.account.agent,
    encryptedData: acc.account.encryptedData,
    nonce: acc.account.nonce,
  }));
}
```

### Decryption

```typescript
interface DecryptedIntent {
  agent: PublicKey;
  direction: number;  // 0 = buy, 1 = sell
  amount: bigint;
  minOutput: bigint;
}

function decryptIntent(
  encryptedData: Uint8Array,
  keeperSecretKey: Uint8Array
): DecryptedIntent {
  // Extract components from 96-byte payload
  const ephemeralPublicKey = encryptedData.slice(0, 32);
  const nonce = encryptedData.slice(32, 56);
  const ciphertext = encryptedData.slice(56, 96);

  // Decrypt using NaCl box
  const message = nacl.box.open(
    ciphertext,
    nonce,
    ephemeralPublicKey,
    keeperSecretKey
  );

  if (!message) {
    throw new Error("Decryption failed");
  }

  // Deserialize 17-byte message
  return {
    direction: message[0],
    amount: deserializeU64(message.slice(1, 9)),
    minOutput: deserializeU64(message.slice(9, 17)),
  };
}
```

### Batch Execution

```typescript
async function executeBatch(
  intents: DecryptedIntent[],
  direction: "buy" | "sell",
  connection: Connection,
  keeper: Keypair
) {
  // 1. Calculate total amount
  const totalAmount = intents.reduce((sum, i) => sum + i.amount, BigInt(0));

  console.log(`Executing ${direction} batch:`, {
    count: intents.length,
    totalAmount: totalAmount.toString(),
  });

  // 2. Get Jupiter quote
  const quote = await getJupiterQuote({
    inputMint: direction === "sell" ? SOL_MINT : USDC_MINT,
    outputMint: direction === "sell" ? USDC_MINT : SOL_MINT,
    amount: totalAmount.toString(),
    slippageBps: 100,
  });

  // 3. Execute swap
  const swapResult = await executeJupiterSwap(quote, keeper);

  // 4. Calculate distributions
  const outputAmount = BigInt(swapResult.outputAmount);
  const distributions = intents.map(intent => ({
    agent: intent.agent,
    share: (intent.amount * outputAmount) / totalAmount,
  }));

  // 5. Settle on-chain
  await settleToAgents(distributions, connection, keeper);

  console.log("Batch executed:", swapResult.signature);
}
```

### Jupiter Integration

```typescript
interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  slippageBps: number;
  route: any;
}

async function getJupiterQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
}): Promise<JupiterQuote> {
  const response = await fetch(
    `https://quote-api.jup.ag/v6/quote?` +
    `inputMint=${params.inputMint}&` +
    `outputMint=${params.outputMint}&` +
    `amount=${params.amount}&` +
    `slippageBps=${params.slippageBps}`
  );

  return await response.json();
}

async function executeJupiterSwap(
  quote: JupiterQuote,
  keeper: Keypair
): Promise<{ signature: string; outputAmount: string }> {
  // Get swap transaction
  const swapResponse = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: keeper.publicKey.toBase58(),
    }),
  });

  const { swapTransaction } = await swapResponse.json();

  // Sign and send
  const transaction = VersionedTransaction.deserialize(
    Buffer.from(swapTransaction, "base64")
  );
  transaction.sign([keeper]);

  const signature = await connection.sendTransaction(transaction);
  await connection.confirmTransaction(signature);

  return {
    signature,
    outputAmount: quote.outAmount,
  };
}
```

### Settlement

```typescript
async function settleToAgents(
  distributions: Array<{ agent: PublicKey; share: bigint }>,
  connection: Connection,
  keeper: Keypair
) {
  const program = getProgram(connection, keeper);

  // Build execute_batch instruction
  const tx = await program.methods
    .executeBatch(
      new anchor.BN(Date.now()),  // batch_id
      distributions.map(d => ({
        agent: d.agent,
        amount: new anchor.BN(d.share.toString()),
      }))
    )
    .accounts({
      keeper: keeper.publicKey,
      config: CONFIG_PDA,
      // ... other accounts
    })
    .rpc();

  console.log("Settlement tx:", tx);
}
```

## Security Model

### Trust Assumptions

| Property | Trust Level |
|----------|-------------|
| **Has decryption key** | Full trust required |
| **Can't steal funds** | Enforced by program |
| **Can delay execution** | Possible (DoS) |
| **Can see intent details** | Yes (after decryption) |

### What Keeper CAN Do:
- View decrypted intent details
- Choose when to batch
- Delay execution (DoS potential)

### What Keeper CANNOT Do:
- Steal user funds (program-enforced)
- Modify user balances arbitrarily
- Execute invalid distributions
- Front-run within a batch (same transaction)

## Monitoring & Alerts

```typescript
// Monitor keeper health
function setupMonitoring() {
  // Alert if no batches in 10 minutes
  setInterval(async () => {
    const lastBatch = await getLastBatchTime();
    const pending = await getPendingIntentCount();

    if (pending >= MIN_BATCH_SIZE && Date.now() - lastBatch > 600000) {
      alertOps("Keeper may be stalled");
    }
  }, 60000);
}
```

## Configuration

### Environment Variables

```bash
# Required
KEEPER_PRIVATE_KEY=[1,2,3,...,64]
RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Optional
MIN_BATCH_SIZE=3
POLL_INTERVAL_MS=5000
JUPITER_API_URL=https://quote-api.jup.ag/v6
```

### Keeper Keypair

```typescript
// Generate keeper keypair (do once, store securely)
const keeperKeypair = nacl.box.keyPair();

// Public key (share this)
const publicKeyBase64 = Buffer.from(keeperKeypair.publicKey).toString("base64");
// "HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE="

// Private key (keep secret!)
const privateKeyBase64 = Buffer.from(keeperKeypair.secretKey).toString("base64");
```

## Running the Keeper

```bash
# Install dependencies
cd keeper
npm install

# Set environment
export KEEPER_PRIVATE_KEY='[1,2,3,...]'
export RPC_URL='https://...'

# Run
npm start
# or
npx ts-node index.ts
```

## Next Steps

- [Smart Contract](/architecture/smart-contract) - On-chain program
- [Encryption](/architecture/encryption) - Cryptographic details
- [MEV Protection](/architecture/mev-protection) - Security analysis
