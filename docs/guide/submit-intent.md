# Submit Intents

Submit encrypted trade intents to SwarmShield for MEV-protected execution.

## What is an Intent?

An **intent** is your trading instruction:
- **Direction**: Buy or Sell
- **Amount**: How much to trade
- **Slippage**: Maximum acceptable slippage (auto-calculated)

```typescript
// Your intent (before encryption)
{
  direction: "SELL",
  amount: 0.1,        // SOL
  minOutput: 19.0     // Minimum USDC expected
}
```

## The Encryption Process

When you submit, your intent is encrypted **before** hitting the blockchain:

```
Your Intent                    On-Chain Data
┌──────────────────┐          ┌──────────────────────────────────┐
│ SELL 0.1 SOL     │  ──▶     │ 9bed43a48f60f39e2a857226c8f2... │
│ Min: 19 USDC     │ encrypt  │ (96 bytes of cryptographic noise)│
└──────────────────┘          └──────────────────────────────────┘
```

**MEV bots cannot determine:**
- ❌ Buy or sell direction
- ❌ Trade amount
- ❌ Slippage tolerance
- ❌ Expected output

## How to Submit

### Step 1: Select Direction

Choose your trade direction:
- **SELL**: Convert SOL → USDC
- **BUY**: Convert USDC → SOL

### Step 2: Enter Amount

Enter the amount you want to trade:
- For SELL: Amount in SOL
- For BUY: Amount in USDC

### Step 3: Review Slippage

Default slippage is **1%** (100 basis points):
- Protects against price movement
- Automatically calculates minimum output

### Step 4: Submit

Click **Submit Shielded Intent** and confirm in your wallet.

## What Happens Next

```
1. Intent Submitted
   └─▶ Encrypted and stored on-chain

2. Batch Formation (3+ intents)
   └─▶ Keeper monitors for matching intents

3. Execution
   └─▶ Single Jupiter swap for entire batch

4. Distribution
   └─▶ Results distributed proportionally
```

## Understanding the Output

After submission, you'll see:

```
┌────────────────────────────────────────────────┐
│  ✅ Intent Submitted                           │
│                                                │
│  Encrypted Data:                               │
│  9bed43a48f60f39e2a857226c8f2a78d5e1f3b4a...  │
│                                                │
│  Status: Pending (waiting for batch)           │
│  Direction: SELL                               │
│  Amount: 0.1 SOL                               │
└────────────────────────────────────────────────┘
```

## Batch Execution

SwarmShield batches multiple intents together:

| Your Intent | Combined Batch | Your Share |
|-------------|----------------|------------|
| SELL 0.05 SOL | Total: 0.20 SOL | 25% |
| (with 3 others) | One Jupiter swap | of output |

**Benefits:**
- Hidden in larger transaction
- Shared gas costs
- Better liquidity execution

## Viewing Intent Status

Track your intent status:

| Status | Meaning |
|--------|---------|
| **Pending** | Waiting for batch (3+ intents) |
| **Batched** | Included in a batch, executing |
| **Executed** | Trade complete, check balances |
| **Failed** | Execution failed (rare) |

## Encryption Details

SwarmShield uses **NaCl Box** encryption:

```
┌─────────────────────────────────────────────────┐
│           96-BYTE ENCRYPTED PAYLOAD             │
├─────────────────────────────────────────────────┤
│ Bytes 0-31:  Ephemeral Public Key (X25519)     │
│ Bytes 32-55: Nonce (24 bytes)                  │
│ Bytes 56-95: Ciphertext + Poly1305 MAC         │
└─────────────────────────────────────────────────┘
```

Only the keeper (with the private key) can decrypt.

## Best Practices

### Do:
- ✅ Set reasonable slippage (1-2%)
- ✅ Verify your balance before submitting
- ✅ Check transaction confirmation

### Don't:
- ❌ Set slippage too low (may fail execution)
- ❌ Submit more than your shielded balance
- ❌ Spam intents (rate limited)

## Troubleshooting

### "Insufficient Shielded Balance"
Deposit more SOL to your vault first.

### Intent Stuck in Pending
Batches need 3+ matching intents. Either:
- Wait for other users
- Submit more intents (different wallets in devnet)

### Transaction Failed
- Check wallet has SOL for gas
- Retry after a few seconds
- Network congestion may cause timeouts

## Next Steps

- [Withdraw Tokens](/guide/withdraw) - Get your USDC out
- [Architecture: Encryption](/architecture/encryption) - Deep dive into the crypto
- [Agent SDK](/sdk/quickstart) - Automate intent submission
