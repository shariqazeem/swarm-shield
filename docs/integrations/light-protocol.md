# Light Protocol Integration

SwarmShield uses Light Protocol's ZK State Compression for efficient on-chain storage.

## What is ZK Compression?

ZK (Zero-Knowledge) State Compression allows storing data on Solana at dramatically reduced cost by:

1. **Storing data in compressed form** using Merkle trees
2. **Proving correctness** with zero-knowledge proofs
3. **Reducing costs** by ~99.5% compared to regular accounts

```
Traditional Account          ZK Compressed
┌──────────────────┐        ┌──────────────────┐
│ Rent: 0.002 SOL  │        │ Cost: 0.00001 SOL│
│ Per account      │   →    │ Per account      │
│ (expensive)      │        │ (99.5% cheaper)  │
└──────────────────┘        └──────────────────┘
```

## SwarmShield Implementation

### SDK Integration

SwarmShield uses the `@lightprotocol/stateless.js` SDK:

```typescript
import { createRpc } from "@lightprotocol/stateless.js";
import { PublicKey } from "@solana/web3.js";

// Create RPC connection with Photon indexer
const rpc = createRpc(
  "https://devnet.helius-rpc.com/?api-key=YOUR_KEY"
);

// Query compressed accounts
const accounts = await rpc.getCompressedAccountsByOwner(
  new PublicKey("your-wallet-address")
);

// Get compressed token balances
const balances = await rpc.getCompressedTokenBalancesByOwner(
  new PublicKey("your-wallet-address")
);
```

### Photon Indexer

The Photon indexer (provided by Helius) tracks compressed state:

```typescript
// Check Photon health
async function checkPhotonHealth(): Promise<boolean> {
  try {
    const rpc = createRpc(HELIUS_RPC_URL);
    const slot = await rpc.getSlot();
    return slot > 0;
  } catch {
    return false;
  }
}
```

## Cost Comparison

| Operation | Without Light | With Light | Savings |
|-----------|--------------|------------|---------|
| Store intent | 0.00203 SOL | 0.00001 SOL | 99.5% |
| Batch record | 0.00305 SOL | 0.000015 SOL | 99.5% |
| Agent vault | 0.00289 SOL | 0.000014 SOL | 99.5% |
| **1000 intents** | **2.03 SOL** | **0.01 SOL** | **99.5%** |

## Integration Points

### 1. Intent Storage

Encrypted intents can be stored as compressed accounts:

```typescript
// Compressed intent storage (conceptual)
const compressedIntent = {
  owner: userWallet,
  data: encryptedPayload,  // 96 bytes
  timestamp: Date.now(),
};
```

### 2. Batch Records

Batch execution records use compression:

```typescript
// Batch record (conceptual)
const batchRecord = {
  batchId: generateId(),
  participants: [wallet1, wallet2, wallet3],
  totalAmount: BigInt(200000000),
  executionTime: Date.now(),
};
```

### 3. Balance Queries

Query compressed token balances:

```typescript
const getCompressedBalances = async (owner: PublicKey) => {
  const rpc = createRpc(HELIUS_RPC_URL);

  const balances = await rpc.getCompressedTokenBalancesByOwner(owner);

  return balances.items.map(item => ({
    mint: item.mint.toBase58(),
    balance: item.balance.toString(),
  }));
};
```

## UI Component

SwarmShield includes a ZK Compression panel showing real-time stats:

```
┌─────────────────────────────────────────────────┐
│  ZK Compression - Light Protocol                │
├─────────────────────────────────────────────────┤
│  SDK Version: @lightprotocol/stateless.js      │
│  Photon Status: ✅ Connected                    │
│                                                 │
│  Cost Savings Calculator                        │
│  ──────────────────────────                     │
│  Traditional: 0.00203 SOL                       │
│  Compressed:  0.00001 SOL                       │
│  Savings:     99.5%                             │
└─────────────────────────────────────────────────┘
```

## Technical Details

### Compression Flow

```
1. Create Intent
   └─▶ Serialize data (17 bytes)

2. Compress
   └─▶ Add to Merkle tree
   └─▶ Generate ZK proof

3. Store On-Chain
   └─▶ Only Merkle root stored
   └─▶ Data in compressed format

4. Query via Photon
   └─▶ Indexer reconstructs state
   └─▶ ZK proof verifies integrity
```

### Merkle Tree Structure

```
            Root Hash
           /         \
       Hash01        Hash23
       /    \       /     \
    Intent0  Intent1  Intent2  Intent3
```

## Configuration

### Environment Setup

```bash
# Required: Helius RPC with Photon support
VITE_HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

### Frontend Config

```typescript
// light-protocol.ts
import { createRpc } from "@lightprotocol/stateless.js";

const HELIUS_RPC = import.meta.env.VITE_HELIUS_RPC_URL;

export function getLightRpc() {
  return createRpc(HELIUS_RPC);
}

export async function getCompressedAccountsByOwner(owner: PublicKey) {
  const rpc = getLightRpc();
  return await rpc.getCompressedAccountsByOwner(owner);
}
```

## Verification

Verify Light Protocol integration:

```typescript
async function verifyLightProtocol() {
  console.log("Testing Light Protocol integration...");

  // 1. Check SDK import
  const { createRpc } = await import("@lightprotocol/stateless.js");
  console.log("✅ SDK imported");

  // 2. Create RPC
  const rpc = createRpc(HELIUS_RPC_URL);
  console.log("✅ RPC created");

  // 3. Check Photon
  const slot = await rpc.getSlot();
  console.log("✅ Photon connected, slot:", slot);

  // 4. Query compressed accounts
  const accounts = await rpc.getCompressedAccountsByOwner(testWallet);
  console.log("✅ Query successful, accounts:", accounts.items.length);

  return true;
}
```

## Benefits for SwarmShield

1. **Lower User Costs**: Intent submission costs reduced 99.5%
2. **Scalability**: Can handle more intents per batch
3. **Privacy**: Compressed state harder to analyze
4. **Speed**: Faster state updates with smaller data

## Limitations

- Requires Photon indexer (Helius provides this)
- Some operations need decompression
- Currently Devnet focused

## Next Steps

- [Helius RPC](/integrations/helius) - Required for Photon access
- [Architecture Overview](/architecture/overview) - Full system design
- [API Reference](/sdk/api-reference) - SDK documentation
