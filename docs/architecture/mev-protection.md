# MEV Protection Analysis

How SwarmShield defeats common MEV attacks.

## Attack Vectors & Mitigations

### 1. Front-Running

**Traditional Attack:**
```
MEV Bot sees: "User wants to BUY 10 SOL"
Bot action:   Buy 10 SOL first (price increases)
User action:  Buys at higher price
Bot action:   Sell 10 SOL (profit)
User loss:    Paid more than fair price
```

**SwarmShield Mitigation:**
```
MEV Bot sees: "9bed43a48f60f39e2a857226..."
Bot action:   ??? (Can't determine direction)
User action:  Intent batched and executed
User loss:    None
```

### 2. Sandwich Attacks

**Traditional Attack:**
```
         Front-run    User Trade    Back-run
            ↓             ↓            ↓
Price: $10 → $10.50 → $10.75 → $10.25
            ↑                        ↑
         Bot buys                 Bot sells
```

**SwarmShield Mitigation:**
- Bot can't see trade direction
- Bot can't see trade size
- Bot can't calculate optimal sandwich

### 3. Statistical Analysis

**Can MEV bots analyze patterns?**

| Signal | Visible? | Exploitable? |
|--------|----------|--------------|
| Transaction timing | ✅ Yes | ❌ No (random) |
| Payload size | ✅ Yes (always 96 bytes) | ❌ No (fixed) |
| Sender address | ✅ Yes | ⚠️ Partial |
| Trade direction | ❌ No | ❌ No |
| Trade amount | ❌ No | ❌ No |
| Slippage | ❌ No | ❌ No |

**Address-based profiling:**

Even if a bot profiles a wallet's historical behavior:
- Past trades don't reveal current encrypted intent
- Direction is still hidden
- Amount is still hidden

### 4. Timing Attacks

**Attack Vector:**
Try to correlate intent submission times with market movements.

**Mitigation:**
- Batch execution aggregates multiple users
- Individual timing signal diluted
- Batch timing determined by keeper (not predictable)

## Protection Layers

### Layer 1: Encryption

```
┌─────────────────────────────────────────────┐
│  96-byte encrypted payload                  │
│  ─────────────────────────────              │
│  • NaCl Box (X25519 + XSalsa20 + Poly1305) │
│  • Ephemeral keys per intent                │
│  • Only keeper can decrypt                  │
└─────────────────────────────────────────────┘
```

**What's hidden:**
- Direction (buy/sell)
- Amount
- Slippage tolerance

### Layer 2: Batching

```
Alice: SELL 0.05 SOL ─┐
Bob:   SELL 0.10 SOL ─┼─→ Single 0.20 SOL swap
Carol: SELL 0.05 SOL ─┘
```

**Benefits:**
- Individual trades invisible
- Size obscured in aggregate
- Timing decorrelated

### Layer 3: Atomic Execution

```
One Transaction:
├── Aggregate swap on Jupiter
├── Update Alice's balance
├── Update Bob's balance
└── Update Carol's balance
```

**Why it matters:**
- No intermediate state to exploit
- All-or-nothing execution
- No front-run opportunity between steps

## Comparison: SwarmShield vs Others

| Solution | Encrypted? | Batched? | Atomic? | Trustless? |
|----------|------------|----------|---------|------------|
| Public DEX | ❌ | ❌ | ❌ | ✅ |
| Private mempool | ⚠️ | ❌ | ❌ | ❌ |
| Simple batching | ❌ | ✅ | ⚠️ | ✅ |
| **SwarmShield** | ✅ | ✅ | ✅ | ⚠️* |

*Semi-trustless: Keeper can't steal, but can delay

## Attack Scenarios

### Scenario 1: Sophisticated MEV Bot

**Bot capabilities:**
- Monitor all transactions
- Access to historical data
- ML-based pattern recognition

**Attack attempt:**
1. See SwarmShield transaction
2. Extract 96-byte payload
3. Analyze payload... **BLOCKED**

**Why it fails:**
- Payload is cryptographically random
- No patterns to learn
- No side-channel information

### Scenario 2: Compromised Keeper

**Attack vector:**
Keeper operator tries to front-run users.

**What keeper knows:**
- Decrypted intent details
- Direction, amount, slippage

**Why attack still fails:**
1. Keeper executes as single batch transaction
2. No opportunity to insert front-run
3. All users in batch executed atomically
4. Keeper profit = 0 (can't extract MEV from own batch)

### Scenario 3: Network Observer

**Attack vector:**
Monitor network traffic to correlate intents.

**Mitigations:**
- HTTPS encryption in transit
- No correlation between network packet and on-chain intent
- Ephemeral keys prevent linking

## Quantifying Protection

### MEV Savings

| Trade Size | Without Protection | With SwarmShield | Savings |
|------------|-------------------|------------------|---------|
| 0.1 SOL | -0.5% | 0% | 0.5% |
| 1 SOL | -1.2% | 0% | 1.2% |
| 10 SOL | -2.5% | 0% | 2.5% |
| 100 SOL | -5%+ | 0% | 5%+ |

*Estimates based on typical DEX slippage + MEV extraction*

### Gas Efficiency

| Scenario | Transactions | Gas Cost |
|----------|--------------|----------|
| Individual trades | 3 | 0.003 SOL |
| SwarmShield batch | 1 | 0.001 SOL |
| **Savings** | -2 | **66%** |

## Limitations

### What SwarmShield Doesn't Protect

| Exposure | Visible? | Mitigation |
|----------|----------|------------|
| Sender wallet | Yes | Use fresh wallets |
| Timing of submission | Yes | Random delay (future) |
| Total batch size | Yes | Minimum batch size |
| Batch direction | After execution | N/A (already executed) |

### Trust Assumptions

| Trust | Level | Future Improvement |
|-------|-------|-------------------|
| Keeper honesty | Required | MPC keepers |
| Keeper availability | Required | Decentralized keepers |
| RPC privacy | Assumed | Private RPCs |

## Future Enhancements

### 1. ZK Proofs (Roadmap)

Replace trusted keeper with zero-knowledge proofs:
- Prove correct execution without revealing details
- Fully trustless operation
- No keeper key required

### 2. Threshold Decryption

Distribute keeper key across multiple parties:
- No single point of trust
- Byzantine fault tolerant
- Requires M-of-N to decrypt

### 3. TEE Execution

Run keeper in Trusted Execution Environment:
- Hardware-enforced privacy
- Attestation of correct execution
- Reduced trust requirements

## Security Checklist

When using SwarmShield, verify:

- [ ] Connected to official SwarmShield frontend
- [ ] Correct program ID: `5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew`
- [ ] Using verified keeper public key
- [ ] Intent shows as 96-byte encrypted data on-chain
- [ ] Batch execution confirmed on Solscan

## Next Steps

- [Encryption Details](/architecture/encryption) - Cryptographic deep dive
- [Keeper Architecture](/architecture/keeper) - How batching works
- [Smart Contract](/architecture/smart-contract) - On-chain guarantees
