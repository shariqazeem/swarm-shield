# How It Works

SwarmShield uses a three-layer architecture to protect your trades from MEV extraction.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SWARMSHIELD PROTOCOL                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  USER LAYER                                                         │
│  ┌─────────────┐                                                    │
│  │   Wallet    │ ──▶ Encrypt Intent ──▶ Submit to Chain            │
│  └─────────────┘                                                    │
│         │                                                           │
│         ▼                                                           │
│  PROTOCOL LAYER (On-Chain)                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SwarmShield Program (Solana)                               │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │   │
│  │  │ Agent Vaults  │  │ Intent Queue  │  │ Batch Records │   │   │
│  │  │ (SOL + USDC)  │  │ (Encrypted)   │  │ (Executed)    │   │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         │                                                           │
│         ▼                                                           │
│  KEEPER LAYER (Off-Chain)                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Keeper Service                                              │   │
│  │  1. Monitor for 3+ matching intents                         │   │
│  │  2. Decrypt intents (holds private key)                     │   │
│  │  3. Batch into single Jupiter swap                          │   │
│  │  4. Execute and distribute results                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Flow

### Step 1: Deposit

User deposits SOL into their Shielded Vault:

```typescript
// Deposit 0.1 SOL into shield
await swarmShield.deposit(0.1);
```

The funds are now held by the SwarmShield program, ready for private trading.

### Step 2: Encrypt Intent

When the user wants to trade, the intent is encrypted client-side:

```typescript
// User wants to SELL 0.05 SOL for USDC with 1% slippage
const intent = {
  direction: 1,        // 0 = BUY, 1 = SELL
  amount: 50000000n,   // 0.05 SOL in lamports
  minOutput: 9500000n  // Minimum USDC (with slippage)
};

// Encrypt using keeper's public key
const encrypted = nacl.box(
  serialize(intent),
  nonce,
  keeperPublicKey,
  ephemeralSecretKey
);
// Result: 96 bytes of random-looking data
```

**What MEV bots see on-chain:**
```
9bed43a48f60f39e2a857226c8f2a78d5e1f3b4a...
```

**What they can determine:** Nothing. Not direction, not amount, not slippage.

### Step 3: Submit to Chain

The encrypted intent is submitted to the Solana program:

```rust
// On-chain: Store encrypted intent
pub fn submit_shielded_intent(
    ctx: Context<SubmitIntent>,
    encrypted_data: [u8; 96],  // Just random bytes to everyone
) -> Result<()> {
    // Store encrypted intent
    // Emit event for keeper to monitor
}
```

### Step 4: Keeper Batches & Executes

The keeper service monitors for matching intents:

```python
# Keeper logic (simplified)
while True:
    intents = get_pending_intents()
    
    # Need 3+ intents of same direction for a batch
    sell_intents = [i for i in intents if decrypt(i).direction == SELL]
    
    if len(sell_intents) >= 3:
        # Decrypt all intents
        decrypted = [decrypt(i) for i in sell_intents]
        
        # Calculate total amount
        total_sol = sum(i.amount for i in decrypted)
        
        # Execute ONE Jupiter swap for entire batch
        jupiter_swap(total_sol, "SOL", "USDC")
        
        # Distribute USDC proportionally
        distribute_results(decrypted)
```

### Step 5: Receive Results

Users receive USDC proportional to their contribution:

```
Alice sold 0.05 SOL → Receives 9.5 USDC
Bob sold 0.10 SOL   → Receives 19.0 USDC
Carol sold 0.05 SOL → Receives 9.5 USDC
─────────────────────────────────────────
Total: 0.20 SOL     → 38.0 USDC (one swap)
```

## Why MEV Bots Can't Attack

| Attack Vector | Why It Fails |
|---------------|--------------|
| **Read intent from mempool** | Intent is encrypted - just 96 random bytes |
| **Analyze transaction patterns** | All intents look identical |
| **Front-run large trades** | Batch execution hides individual sizes |
| **Detect trade direction** | Encrypted - could be buy or sell |
| **Calculate slippage tolerance** | Encrypted - no way to know |

## The Encryption in Detail

SwarmShield uses **NaCl Box** (Networking and Cryptography library):

```
┌─────────────────────────────────────────────────────────────┐
│                    96-BYTE PAYLOAD                          │
├─────────────────────────────────────────────────────────────┤
│ Bytes 0-31:  Ephemeral Public Key (X25519)                 │
│ Bytes 32-55: Nonce (24 bytes)                              │
│ Bytes 56-95: Ciphertext (encrypted intent + Poly1305 MAC)  │
└─────────────────────────────────────────────────────────────┘
```

- **X25519**: Elliptic curve Diffie-Hellman for key exchange
- **XSalsa20**: Stream cipher for encryption
- **Poly1305**: Message authentication code

This is the same encryption used by:
- Signal messenger
- WhatsApp (via Signal protocol)
- Many secure communication apps

## Next Steps

- [Quick Start](/guide/quickstart) - Try it yourself
- [Encryption Deep Dive](/guide/encryption) - Technical details
- [Agent SDK](/sdk/quickstart) - Integrate into your bot
