# Helius RPC Integration

SwarmShield uses Helius for enhanced RPC services and Photon indexer access.

## Why Helius?

Helius provides critical infrastructure for SwarmShield:

| Feature | Benefit |
|---------|---------|
| **Photon Indexer** | Required for Light Protocol queries |
| **Priority Fees** | Faster transaction inclusion |
| **Reliability** | 99.9% uptime SLA |
| **DAS API** | Digital Asset Standard support |

## Getting Started

### 1. Get API Key

1. Go to [helius.dev](https://helius.dev)
2. Create an account
3. Generate an API key
4. Select Devnet or Mainnet

### 2. Configure Environment

```bash
# .env
VITE_HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

### 3. Use in Code

```typescript
import { Connection } from "@solana/web3.js";

const connection = new Connection(
  import.meta.env.VITE_HELIUS_RPC_URL,
  "confirmed"
);
```

## Features Used

### Standard RPC

```typescript
// Basic Solana RPC operations
const balance = await connection.getBalance(publicKey);
const slot = await connection.getSlot();
const blockTime = await connection.getBlockTime(slot);
```

### Enhanced Transaction Sending

```typescript
// Send with priority fee
const signature = await connection.sendTransaction(transaction, [signer], {
  skipPreflight: false,
  preflightCommitment: "confirmed",
  maxRetries: 3,
});
```

### Priority Fee Estimation

```typescript
// Get optimal priority fee
const recentFees = await connection.getRecentPrioritizationFees();
const avgFee = recentFees.reduce((a, b) => a + b.prioritizationFee, 0) / recentFees.length;

// Add to transaction
const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: avgFee,
});
```

### Photon Indexer (Light Protocol)

```typescript
import { createRpc } from "@lightprotocol/stateless.js";

// Helius RPC includes Photon indexer
const rpc = createRpc(HELIUS_RPC_URL);

// Query compressed accounts
const accounts = await rpc.getCompressedAccountsByOwner(owner);
```

## SwarmShield Integration

### Connection Management

```typescript
// frontend/src/lib/helius.ts
import { Connection } from "@solana/web3.js";

const HELIUS_RPC = import.meta.env.VITE_HELIUS_RPC_URL;

let connectionInstance: Connection | null = null;

export function getConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(HELIUS_RPC, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60000,
    });
  }
  return connectionInstance;
}
```

### Health Check

```typescript
export async function checkHeliusHealth(): Promise<boolean> {
  try {
    const connection = getConnection();
    const version = await connection.getVersion();
    return !!version["solana-core"];
  } catch {
    return false;
  }
}
```

### Transaction Confirmation

```typescript
export async function confirmTransaction(
  signature: string
): Promise<boolean> {
  const connection = getConnection();

  const confirmation = await connection.confirmTransaction(
    signature,
    "confirmed"
  );

  return !confirmation.value.err;
}
```

## Configuration Options

### Connection Options

```typescript
const connection = new Connection(HELIUS_RPC_URL, {
  commitment: "confirmed",           // Confirmation level
  confirmTransactionInitialTimeout: 60000,  // 60s timeout
  wsEndpoint: HELIUS_WS_URL,        // WebSocket for subscriptions
});
```

### Retry Configuration

```typescript
const sendOptions = {
  skipPreflight: false,
  preflightCommitment: "confirmed",
  maxRetries: 5,
};
```

## Rate Limits

| Plan | Requests/sec | Burst |
|------|-------------|-------|
| Free | 10 | 50 |
| Dev | 50 | 200 |
| Business | 500 | 2000 |

SwarmShield works within free tier limits for development.

## Error Handling

```typescript
try {
  const balance = await connection.getBalance(publicKey);
} catch (error) {
  if (error.message.includes("429")) {
    // Rate limited - implement backoff
    await sleep(1000);
    return retry();
  }
  if (error.message.includes("503")) {
    // Service unavailable - try fallback
    return useFallbackRpc();
  }
  throw error;
}
```

## Monitoring

### Check Connection Status

```typescript
const statusCheck = async () => {
  const start = Date.now();
  await connection.getSlot();
  const latency = Date.now() - start;

  return {
    connected: true,
    latency: `${latency}ms`,
    endpoint: "helius-devnet",
  };
};
```

### UI Status Indicator

SwarmShield displays Helius status:

```
┌─────────────────────────────────┐
│  Helius RPC                     │
│  Status: ✅ Connected           │
│  Latency: 45ms                  │
│  Network: Devnet                │
└─────────────────────────────────┘
```

## Best Practices

### Do:
- ✅ Cache connection instance
- ✅ Use appropriate commitment levels
- ✅ Implement retry logic
- ✅ Handle rate limits gracefully

### Don't:
- ❌ Create new connections per request
- ❌ Ignore rate limit errors
- ❌ Use finalized when confirmed suffices
- ❌ Expose API keys in client code

## Fallback Strategy

```typescript
const RPC_ENDPOINTS = [
  import.meta.env.VITE_HELIUS_RPC_URL,
  "https://api.devnet.solana.com",
];

async function getWorkingConnection(): Promise<Connection> {
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const conn = new Connection(endpoint);
      await conn.getSlot(); // Test connection
      return conn;
    } catch {
      continue;
    }
  }
  throw new Error("All RPC endpoints unavailable");
}
```

## Next Steps

- [Light Protocol](/integrations/light-protocol) - Uses Helius Photon
- [Range Protocol](/integrations/range) - Compliance integration
- [Architecture](/architecture/overview) - Full system overview
