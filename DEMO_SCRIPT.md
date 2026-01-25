# SwarmShield Demo Script for Judges

## Quick Links

| Resource | Link |
|----------|------|
| Live Frontend | [swarmshield.vercel.app](https://swarmshield.vercel.app) |
| Program on Solscan | [5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew](https://solscan.io/account/5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew?cluster=devnet) |
| Example Encrypted TX | [View on Solscan](https://solscan.io/tx/bpL71PwcDk1DwkmssLxWCE3VDmswNRuPxoT8XuZoot6xeC2dvhCFdS6X6vEXwfmvnMR3EqJjuChLnTbPaZ8NXUw?cluster=devnet) |

---

## Part 1: Connect Wallet (30 seconds)

1. Go to [swarmshield.vercel.app](https://swarmshield.vercel.app)
2. Click **"Connect Wallet"** (Phantom recommended)
3. Approve the connection

**What to notice:**
- Range compliance check runs automatically on wallet connect
- Status shows "Verified" if wallet passes OFAC screening

---

## Part 2: Deposit to Dark Pool (1 minute)

1. Click the **"Deposit"** tab
2. Enter amount (e.g., 0.1 SOL or 5 USDC)
3. Click **"Deposit SOL"** or **"Deposit USDC"**
4. Approve transaction in wallet

**What to notice:**
- Your balance updates in the dark pool
- Funds are now in the shielded vault, ready for private trading

---

## Part 3: Submit Encrypted Intent (1 minute) - KEY DEMO

1. Click the **"Trade"** tab
2. Select trade direction: **BUY** (SOL -> USDC) or **SELL** (USDC -> SOL)
3. Enter amount (e.g., 1 USDC)
4. Set slippage tolerance (e.g., 1%)
5. Click **"Submit Encrypted Intent"**

**What to notice:**
- Button says "Encrypting..." during submission
- Success message shows: **"Encrypted & Submitted"**
- **Encrypted Data Preview**: You'll see something like `9bed43a48f60f39e...6500000000000000`
- This is the ACTUAL encrypted bytes stored on-chain

**Key talking point:**
> "This hex string is what MEV bots see. They cannot determine if this is a buy or sell, the amount, or the slippage. It's cryptographically encrypted using NaCl box (X25519 + XSalsa20-Poly1305)."

---

## Part 4: Verify Encryption On-Chain (1 minute)

1. Go to [Solscan Devnet](https://solscan.io/?cluster=devnet)
2. Search for the program: `5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew`
3. Click on a recent "submit_shielded_intent" transaction
4. Look at the transaction memo and account data

**What to notice:**
- Memo: `"SwarmShield: Encrypted Intent Submitted to Dark Pool"`
- Account data: 96 bytes of encrypted ciphertext (NOT plaintext trade data)
- NO readable trade direction, amount, or slippage anywhere

**Compare to plaintext:** Show a competitor's dark pool where trade data is visible on-chain.

---

## Part 5: Batch Execution (Automatic)

When 3+ intents of the same direction accumulate:
1. Keeper service automatically detects pending intents
2. Keeper decrypts intents using X25519 private key
3. Intents are batched into a single Jupiter swap
4. All users receive their tokens atomically

**Keeper logs show:**
```
🔐 Found 3 shielded intent(s), 3 active
   🔓 Decrypted: BUY 1.0000 USDC from 5tKREECD...
   🔓 Decrypted: BUY 1.0000 USDC from 5tKREECD...
   🔓 Decrypted: BUY 1.0000 USDC from 5tKREECD...
✅ SHIELDED BATCH EXECUTED!
```

---

## Bounty Integrations Checklist

### Anoncoin - Dark Liquidity ($10,000)
- [x] Encrypted intents (NaCl box)
- [x] Dark liquidity pools (shielded vaults)
- [x] Private swaps via batching
- [x] MEV protection

### Light Protocol - Open Track ($18,000)
- [x] Architecture designed for ZK Compression
- [x] Compressed account structure ready
- [x] Shielded state management

### Helius - RPC Infrastructure ($5,000)
- [x] Primary RPC provider
- [x] Photon indexer integration
- [x] Priority fee estimation

### QuickNode - Backup Infrastructure ($3,000)
- [x] Backup RPC provider
- [x] Browser CORS support
- [x] Automatic failover

### Range - Compliance ($1,500)
- [x] Wallet screening on connect
- [x] OFAC sanctions check
- [x] Risk assessment display

### PNP Exchange - AI Agents ($2,500)
- [x] Agent-first SDK design
- [x] Autonomous trading support
- [x] Anonymous agent registration

**Total Bounty Target: $40,000**

---

## Q&A Preparation

### "How is this different from other dark pools?"

> "Other dark pools batch trades but store **plaintext** on-chain. MEV bots can still see the trade data - they just can't front-run individual trades. SwarmShield uses **NaCl box encryption** (X25519 + XSalsa20-Poly1305) to ensure the trade data is NEVER visible on-chain. MEV bots see only random bytes."

### "How do you prevent the keeper from front-running?"

> "The keeper is a trusted party in the MVP. Post-hackathon, we plan to implement threshold decryption with multiple keepers, where no single party can decrypt without consensus. We can also use TEEs (Trusted Execution Environments) for additional security."

### "What's the encryption algorithm?"

> "NaCl box, which combines X25519 for key exchange and XSalsa20-Poly1305 for authenticated encryption. It's the same encryption used by Signal and other privacy-focused applications. The 96-byte payload contains the ephemeral public key (32 bytes), nonce (24 bytes), and ciphertext (40 bytes)."

### "How do you handle different trade sizes in a batch?"

> "We group intents by direction and execute a single Jupiter swap for the net amount. Individual users are settled proportionally based on their contribution to the batch. This provides privacy amplification - your specific trade is hidden among others."

### "Why Solana?"

> "Solana's high throughput and low fees make it ideal for MEV protection. AI agents need to trade frequently, and Solana can handle the volume. Plus, the Solana ecosystem (Jupiter, Helius, etc.) provides excellent infrastructure for building DeFi applications."

---

## Key Differentiators Table

| Feature | SwarmShield | Other Dark Pools |
|---------|-------------|------------------|
| On-chain data | **Encrypted bytes** | Plaintext |
| MEV visibility | **0%** | Partial |
| Privacy level | **Cryptographic** | Batching only |
| Encryption | NaCl Box (X25519) | None |
| Real swaps | Jupiter | Often mocked |
| Compliance | Range integrated | Usually none |

---

## Demo Tips

1. **Use Devnet SOL** - Make sure wallet has devnet SOL for gas
2. **Submit 3+ intents** - Batching requires minimum 3 intents of same direction
3. **Show Solscan** - Always verify encrypted data on-chain for judges
4. **Compare to plaintext** - Show how other protocols expose trade data
5. **Highlight encryption hex** - The random bytes are the key visual proof

---

## Emergency Fallback

If the frontend is down:
1. Run locally: `cd frontend && npm run dev`
2. Use test script: `npx tsx test-encryption.ts`
3. Show keeper logs from VM: `pm2 logs keeper`

---

*SwarmShield: Where Agents Trade in the Dark*
