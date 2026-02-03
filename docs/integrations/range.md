# Range Protocol Integration

SwarmShield integrates Range Protocol for automated wallet compliance screening.

## What is Range Protocol?

Range Protocol provides **wallet risk assessment** for DeFi applications:

- OFAC sanctions list checking
- Known bad actor detection
- Mixer association analysis
- Real-time risk scoring

## Why Compliance Matters

Even decentralized protocols benefit from basic compliance:

| Benefit | Description |
|---------|-------------|
| **Legal Protection** | Avoid sanctions violations |
| **User Safety** | Block known scammers |
| **Ecosystem Health** | Reduce illicit activity |
| **Institutional Access** | Enable regulated users |

## SwarmShield Integration

### Automatic Screening

When a user connects their wallet, SwarmShield automatically screens:

```typescript
// On wallet connect
const handleWalletConnect = async (publicKey: PublicKey) => {
  // 1. Screen wallet
  const compliance = await checkWalletCompliance(publicKey.toBase58());

  if (compliance.status === "blocked") {
    // Reject sanctioned wallets
    throw new Error("Wallet not eligible");
  }

  // 2. Allow trading
  setWalletConnected(true);
};
```

### Compliance Check Function

```typescript
// frontend/src/lib/range.ts
interface ComplianceResult {
  status: "approved" | "blocked" | "review";
  riskScore: number;
  flags: string[];
}

export async function checkWalletCompliance(
  walletAddress: string
): Promise<ComplianceResult> {
  try {
    // Range API call (or local screening)
    const response = await fetch(
      `https://api.range.org/v1/screen/${walletAddress}`
    );

    if (!response.ok) {
      // Default to approved if API unavailable
      return { status: "approved", riskScore: 0, flags: [] };
    }

    return await response.json();
  } catch {
    // Fail open for availability
    return { status: "approved", riskScore: 0, flags: [] };
  }
}
```

## What Gets Checked

### Sanctions Lists

| List | Source |
|------|--------|
| OFAC SDN | US Treasury |
| UN Sanctions | United Nations |
| EU Sanctions | European Union |

### Risk Indicators

| Indicator | Description |
|-----------|-------------|
| Mixer usage | Tornado Cash, etc. |
| Bridge abuse | Cross-chain laundering |
| Known exploits | Hacker addresses |
| Fraud history | Rug pulls, scams |

## Privacy Considerations

Range screening preserves privacy:

| What's Checked | What's NOT Checked |
|----------------|-------------------|
| Wallet address | Trading history |
| Sanctions lists | Transaction amounts |
| Public records | Personal identity |

**Your trading activity within SwarmShield remains private.**

## UI Integration

### Connection Flow

```
User Clicks "Connect Wallet"
           │
           ▼
    ┌──────────────┐
    │ Range Screen │
    │ (instant)    │
    └──────┬───────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
✅ Approved    ❌ Blocked
    │             │
    ▼             ▼
 Continue      Show Error
```

### Status Display

```
┌─────────────────────────────────┐
│  Compliance Status              │
│  ─────────────────              │
│  Wallet: 7xKp...3Rjf           │
│  Status: ✅ Approved            │
│  Risk Score: 0                  │
│  Screened: Just now             │
└─────────────────────────────────┘
```

## Implementation

### React Hook

```typescript
// useCompliance.ts
import { useState, useEffect } from "react";
import { checkWalletCompliance } from "../lib/range";

export function useCompliance(walletAddress: string | null) {
  const [status, setStatus] = useState<"pending" | "approved" | "blocked">("pending");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setStatus("pending");
      return;
    }

    setLoading(true);
    checkWalletCompliance(walletAddress)
      .then((result) => {
        setStatus(result.status === "blocked" ? "blocked" : "approved");
      })
      .finally(() => setLoading(false));
  }, [walletAddress]);

  return { status, loading };
}
```

### Component Usage

```tsx
function WalletStatus() {
  const { publicKey } = useWallet();
  const { status, loading } = useCompliance(publicKey?.toBase58() ?? null);

  if (loading) return <Spinner />;

  return (
    <div className={status === "approved" ? "text-green-500" : "text-red-500"}>
      {status === "approved" ? "✅ Compliant" : "❌ Not Eligible"}
    </div>
  );
}
```

## Configuration

### Environment Variables

```bash
# Optional: Custom Range endpoint
VITE_RANGE_API_URL=https://api.range.org/v1

# Optional: API key for higher limits
VITE_RANGE_API_KEY=your_api_key
```

### Fail-Open vs Fail-Closed

SwarmShield uses **fail-open** by default:

```typescript
// If Range API is unavailable, allow users
// This prioritizes availability over strict compliance
const FAIL_OPEN = true;

async function checkCompliance(wallet: string) {
  try {
    return await rangeApi.screen(wallet);
  } catch {
    return FAIL_OPEN
      ? { status: "approved" }
      : { status: "blocked" };
  }
}
```

For production, consider **fail-closed** for stricter compliance.

## Testing

### Test Addresses

| Address | Expected Result |
|---------|-----------------|
| `7xKp...normal` | Approved |
| `OFAC...test` | Blocked |
| Random devnet | Approved |

### Verification

```typescript
async function testRangeIntegration() {
  console.log("Testing Range Protocol...");

  // 1. Test normal address
  const normal = await checkWalletCompliance("7xKpR3...");
  console.log("Normal wallet:", normal.status); // approved

  // 2. Test screening
  console.log("✅ Range integration working");
}
```

## Best Practices

### Do:
- ✅ Screen on wallet connect
- ✅ Cache results (5 min TTL)
- ✅ Show clear status to users
- ✅ Handle API errors gracefully

### Don't:
- ❌ Screen on every transaction
- ❌ Store compliance data long-term
- ❌ Block without explanation
- ❌ Ignore API rate limits

## Error Handling

```typescript
try {
  const result = await checkWalletCompliance(wallet);

  switch (result.status) {
    case "approved":
      return { canTrade: true };
    case "blocked":
      return {
        canTrade: false,
        reason: "Wallet flagged for compliance review",
      };
    case "review":
      return {
        canTrade: true,
        warning: "Enhanced monitoring active",
      };
  }
} catch (error) {
  // Log for monitoring but don't block user
  console.error("Compliance check failed:", error);
  return { canTrade: true, warning: "Compliance check unavailable" };
}
```

## Next Steps

- [Light Protocol](/integrations/light-protocol) - ZK compression
- [Helius RPC](/integrations/helius) - RPC infrastructure
- [Architecture](/architecture/overview) - System design
