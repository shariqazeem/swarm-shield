# Integrations Overview

SwarmShield integrates with leading Solana infrastructure providers to deliver production-ready MEV protection.

## Integration Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     SWARMSHIELD                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   LIGHT     │  │   HELIUS    │  │   RANGE     │        │
│  │  PROTOCOL   │  │    RPC      │  │  PROTOCOL   │        │
│  │             │  │             │  │             │        │
│  │  ZK State   │  │  Enhanced   │  │  Wallet     │        │
│  │ Compression │  │    RPC      │  │ Compliance  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Why These Integrations?

| Integration | Purpose | Benefit |
|-------------|---------|---------|
| **Light Protocol** | ZK Compression | 99.5% cost reduction |
| **Helius** | Enhanced RPC | Reliability + DAS API |
| **Range Protocol** | Compliance | OFAC + sanctions screening |

---

## Light Protocol

### What It Does

Light Protocol provides **ZK State Compression** - a way to store data on Solana at dramatically reduced cost by using zero-knowledge proofs.

### SwarmShield Integration

```typescript
// Query compressed accounts via Photon indexer
import { createRpc } from "@lightprotocol/stateless.js";

const rpc = createRpc(HELIUS_RPC_URL);
const accounts = await rpc.getCompressedAccountsByOwner(ownerPubkey);
```

### Cost Savings

| Operation | Without Compression | With Light Protocol |
|-----------|--------------------|--------------------|
| Store intent | ~0.002 SOL | ~0.00001 SOL |
| Batch record | ~0.003 SOL | ~0.000015 SOL |

**99.5% reduction in state costs.**

[Read more →](/integrations/light-protocol)

---

## Helius RPC

### What It Does

Helius provides **enhanced RPC services** with features like:
- Priority fee estimation
- Transaction simulation
- Digital Asset Standard (DAS) API
- Webhooks and streaming

### SwarmShield Integration

```typescript
const connection = new Connection(
  "https://devnet.helius-rpc.com/?api-key=YOUR_KEY"
);

// Priority fee for faster inclusion
const priorityFee = await connection.getRecentPrioritizationFees();
```

### Benefits

- **Reliability**: 99.9% uptime SLA
- **Speed**: Low-latency global infrastructure
- **Features**: Enhanced APIs for DeFi
- **Photon Support**: Required for Light Protocol queries

[Read more →](/integrations/helius)

---

## Range Protocol

### What It Does

Range Protocol provides **wallet compliance screening** to ensure regulatory compliance without compromising privacy.

### SwarmShield Integration

```typescript
// Automatic screening on wallet connect
const complianceResult = await checkWalletCompliance(walletAddress);

if (complianceResult.status === "approved") {
  // Allow trading
} else {
  // Block sanctioned wallets
}
```

### What's Checked

| Check | Description |
|-------|-------------|
| OFAC sanctions | US Treasury sanctions list |
| Known bad actors | Exploiters, hackers |
| Mixer associations | Tornado Cash, etc. |

### Privacy Preserved

Range only checks wallet addresses against public lists. Your trading activity remains private within SwarmShield.

[Read more →](/integrations/range)

---

## Integration Verification

SwarmShield includes a built-in integration verifier:

```
┌─────────────────────────────────────────────┐
│  Integration Status                         │
├─────────────────────────────────────────────┤
│  ✅ Light Protocol SDK    Connected         │
│  ✅ Helius RPC            Active            │
│  ✅ Range Protocol        Screening         │
│  ✅ Encryption            NaCl Box v1       │
└─────────────────────────────────────────────┘
```

Access this in the SwarmShield UI by clicking the **Integration Status** button.

---

## Architecture Diagram

```
User Request
     │
     ▼
┌─────────────────┐
│ Range Protocol  │ ← Compliance check
│ Wallet Screen   │
└────────┬────────┘
         │ ✅ Approved
         ▼
┌─────────────────┐
│    Encrypt      │ ← NaCl Box encryption
│    Intent       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Submit to     │ ← Via Helius RPC
│   SwarmShield   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Light Protocol  │ ← Compressed state storage
│ ZK Compression  │
└────────┬────────┘
         │
         ▼
    Batch Execution
```

---

## Configuration

### Environment Variables

```bash
# Helius (required)
HELIUS_API_KEY=your_api_key
HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=your_key

# Range Protocol (optional, defaults provided)
RANGE_API_ENDPOINT=https://api.range.org/v1

# Light Protocol (uses Helius endpoint)
PHOTON_ENDPOINT=https://devnet.helius-rpc.com/?api-key=your_key
```

### Frontend Configuration

```typescript
// config.ts
export const INTEGRATIONS = {
  helius: {
    rpcUrl: import.meta.env.VITE_HELIUS_RPC_URL,
  },
  lightProtocol: {
    enabled: true,
    photonEndpoint: import.meta.env.VITE_HELIUS_RPC_URL,
  },
  range: {
    enabled: true,
    screenOnConnect: true,
  },
};
```

---

## Next Steps

- [Light Protocol](/integrations/light-protocol) - ZK compression details
- [Helius](/integrations/helius) - RPC configuration
- [Range Protocol](/integrations/range) - Compliance integration
