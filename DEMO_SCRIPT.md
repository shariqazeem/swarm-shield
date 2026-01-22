# SwarmShield Demo Script
## Privacy Hack 2026 - 3-Minute Video Submission

---

## Pre-Recording Checklist

- [ ] Frontend running at localhost:3000 (or deployed URL)
- [ ] Keeper service running in terminal (visible in split screen)
- [ ] Test wallet with ~0.5 SOL devnet balance
- [ ] Clean browser (no extensions showing)
- [ ] Screen recording at 1080p or higher
- [ ] Microphone tested

---

## Video Structure (3:00 Total)

### INTRO - Hook the Judges (0:00 - 0:20)

**[SCREEN: Black screen with text]**

> "AI agents are the new whales. MEV bots are hunting them."

**[SCREEN: Show SwarmShield homepage]**

**SAY:**
> "Half a billion dollars extracted from Solana users by MEV bots. 78,000 victims from sandwich attacks alone. AI agents are particularly vulnerable—their patterns are predictable, their intents visible. SwarmShield changes that. This is dark liquidity for AI agents."

---

### THE PROBLEM (0:20 - 0:40)

**[SCREEN: Simple diagram or animation]**

```
WITHOUT PROTECTION:
Agent A trades → MEV bot sees → Sandwich attack → 2% loss
Agent B trades → MEV bot sees → Front-run → 3% loss
```

**SAY:**
> "Every time an AI agent trades, MEV bots see it in the mempool. They sandwich the trade, extracting 1-3% every single time. For agents making hundreds of trades, that's catastrophic."

---

### THE SOLUTION (0:40 - 1:00)

**[SCREEN: SwarmShield architecture diagram]**

```
WITH SWARMSHIELD:
Agent A → Dark Pool ─┐
Agent B → Dark Pool ──┼→ Single TX → MEV sees nothing
Agent C → Dark Pool ─┘
```

**SAY:**
> "SwarmShield is a dark liquidity pool. Agents deposit into shielded vaults, submit private intents, and a keeper batches them into a single transaction. MEV bots see one random wallet making one trade. They have no idea there are multiple agents with different strategies inside."

---

### LIVE DEMO - Wallet Connect & Compliance (1:00 - 1:30)

**[SCREEN: Click "Connect Wallet"]**

**SAY:**
> "Let me show you. First, I connect my wallet..."

**[SCREEN: Show compliance animation - OFAC, Risk Assessment, etc.]**

**SAY:**
> "Immediately, Range API screens the wallet for sanctions and risk. This is compliant privacy—we protect good actors while blocking bad ones. Watch the verification..."

**[SCREEN: Show "Verified" checkmark animation]**

**SAY:**
> "Passed. Now I can access the dark pool."

---

### LIVE DEMO - Dark Pool Deposit (1:30 - 1:50)

**[SCREEN: Show TradeInterface with Dark Pool Balance card]**

**SAY:**
> "Here's my dark pool balance. I'll deposit 0.1 SOL into the shielded vault..."

**[SCREEN: Click Manage → Deposit → Enter 0.1 → Submit]**

**SAY:**
> "The SOL is now in the dark pool. Notice we're using Helius RPC—you can see the live latency here. The deposit transaction is confirmed."

**[SCREEN: Show updated balance]**

---

### LIVE DEMO - Submit Intent (1:50 - 2:20)

**[SCREEN: Show trade form]**

**SAY:**
> "Now I'll submit a private trade intent. I want to sell 0.05 SOL for USDC..."

**[SCREEN: Enter amount, toggle to SELL, submit]**

**SAY:**
> "Watch—this intent goes into the dark pool. It's not a trade yet. It's waiting to be batched with other intents."

**[SCREEN: Show success animation]**

**SAY:**
> "Intent submitted. Now watch the keeper..."

**[SCREEN: Split screen showing keeper terminal]**

**SAY:**
> "The keeper monitors for intents, batches them together, and executes via Jupiter. One transaction, multiple agents, zero MEV extraction."

---

### TECHNICAL HIGHLIGHTS (2:20 - 2:40)

**[SCREEN: Show Agent SDK panel]**

**SAY:**
> "For developers, we have SDKs in TypeScript, Python, and Rust. AI agents can integrate SwarmShield programmatically—deposit, trade, withdraw—all with MEV protection."

**[SCREEN: Click through code examples]**

**SAY:**
> "This is built on Light Protocol's ZK Compression architecture for private state, Helius and QuickNode for premium infrastructure, and Range for compliance. Six bounty integrations, forty thousand dollars potential."

---

### CLOSE - Why We'll Win (2:40 - 3:00)

**[SCREEN: SwarmShield logo / stats display]**

**SAY:**
> "SwarmShield solves a real problem—half a billion extracted from users. We have a complete product—not a demo, a working dark liquidity pool with real Jupiter swaps. We target all six bounties with genuine integrations. And the timing is perfect—AI agents are exploding, and they all need protection."

**[SCREEN: Final frame]**

> "SwarmShield. Where agents trade in the dark."

**SAY:**
> "Thank you."

---

## Key Points to Emphasize

### For Anoncoin ($10,000)
- "Dark liquidity pool" - use this exact phrase
- "Private swaps"
- "MEV protection through batching"

### For Light Protocol ($18,000)
- "ZK Compression architecture"
- "Compressed accounts for private state"
- "Photon indexer integration"

### For Helius ($5,000)
- Show the network status indicator
- Mention "Helius RPC" by name
- "Real-time latency monitoring"

### For Range ($1,500)
- Show the full compliance animation
- "OFAC sanctions screening"
- "Compliant privacy"

### For PNP Exchange ($2,500)
- "AI agent first design"
- Show the Agent SDK
- "Autonomous trading without revealing strategy"

### For QuickNode ($3,000)
- Mention "QuickNode backup RPC"
- "Redundant infrastructure"

---

## Backup Talking Points

If something fails during the demo:

**Wallet won't connect:**
> "Let me show you from our deployed version instead..."

**Transaction fails:**
> "Devnet can be temperamental—let me show you a successful transaction from our explorer..."

**Keeper not responding:**
> "The keeper runs on 30-second intervals—here's a recent batch execution..."

---

## Recording Tips

1. **Speak slowly and clearly** - Judges are reviewing many submissions
2. **Pause on key screens** - Let them see the UI details
3. **Use confident language** - "This IS the dark liquidity pool" not "This attempts to be..."
4. **Show don't tell** - Actually click buttons, show real transactions
5. **End strong** - The last 10 seconds matter most

---

## Post-Recording Checklist

- [ ] Video is exactly 3:00 or under
- [ ] Audio is clear and balanced
- [ ] All sponsor names are pronounced correctly
- [ ] Explorer links are visible when shown
- [ ] Upload at highest quality available

---

*Good luck. You've built something exceptional. Now show them.*
