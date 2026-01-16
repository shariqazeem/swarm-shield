# SwarmShield Keeper Setup Guide

This guide will help you run the keeper service that monitors and executes batched trade intents.

## Prerequisites

- Node.js 18+ installed
- Solana wallet with some devnet SOL
- SwarmShield program deployed to devnet

## Step 1: Get Your Keeper Keypair

The keeper must be the same wallet that initialized the protocol. Get your keypair:

```bash
# Display your keypair
solana-keygen pubkey ~/.config/solana/id.json

# Export as JSON array
cat ~/.config/solana/id.json
```

Copy the array that looks like: `[1,2,3,4,...]`

## Step 2: Configure Keeper

```bash
cd keeper

# Copy environment template
cp .env.example .env

# Edit .env and paste your keypair array
nano .env  # or use your favorite editor
```

Update `.env`:
```
RPC_URL=https://api.devnet.solana.com
KEEPER_PRIVATE_KEY=[your,keypair,array,here]
POLL_INTERVAL_MS=5000
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Fund Keeper Wallet

The keeper needs SOL for transaction fees:

```bash
# Get some devnet SOL
solana airdrop 2 YOUR_KEEPER_PUBLIC_KEY --url devnet
```

## Step 5: Run Keeper

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

## What You Should See

```
============================================================
🚀 SwarmShield Dark Pool Keeper
============================================================
📡 RPC: https://api.devnet.solana.com
⏱️  Poll Interval: 5000ms

✓ Keeper authorized: YOUR_PUBLIC_KEY
✓ Min batch size: 3
✓ Max batch size: 10
✓ Total batches executed: 0

============================================================
👀 Monitoring for pending intents...

📭 No pending intents
📭 No pending intents
...
```

## Testing the Full Flow

### 1. Start Frontend (Terminal 1)

```bash
cd frontend
npm run dev
```

Visit http://localhost:3000

### 2. Start Keeper (Terminal 2)

```bash
cd keeper
npm run dev
```

### 3. Submit Intents (Browser)

1. Connect your wallet (Phantom/Solflare)
2. Click "Initialize Protocol" (if not already done)
3. Click "Register Agent"
4. Deposit some SOL (e.g., 0.5 SOL)
5. Submit a trade intent (e.g., Buy 0.1 SOL)
6. Submit 2 more intents to reach batch minimum

### 4. Watch Keeper Execute Batch

Once you submit the 3rd intent, the keeper will:

```
📊 Found 3 pending intent(s)

🔄 Processing batch of 3 intents:
  • BUY 0.1 SOL from 5TY5gts9...
  • SELL 0.05 SOL from 7Km2xPq1...
  • BUY 0.02 SOL from 9Jk8nMp3...

💱 Simulated Swap:
   Buy Volume: 0.12 SOL
   Sell Volume: 0.05 SOL
   Total Input: 0.17 SOL
   Total Output: 0.16915 SOL

🛡️  MEV Protection:
   💰 Value Protected: 0.00408 SOL
   📈 Protection Rate: 99.0%

⚡ Executing batch #1 on-chain...

✅ BATCH EXECUTED SUCCESSFULLY!
   🔗 Signature: 2rkJxVBn9rfEe7vX...
   📦 Batch ID: 1
   🤖 Agents Protected: 3
   💎 Total Volume: 0.17 SOL
   🛡️  MEV Saved: 0.00408 SOL
```

### 5. Check Frontend Dashboard

The "Dark Pool Analytics" section will update:
- Batches Executed: 1
- Protected Agents: (your count)
- Volume Protected: 0.17 SOL
- MEV Saved: ~0.00408 SOL

## Troubleshooting

### "Keeper not authorized" Error

The keeper wallet must match the protocol authority. Check:

```bash
# Get config PDA
solana account YOUR_CONFIG_PDA --url devnet

# Verify keeper matches your wallet
```

### "Insufficient balance" Error

Fund your keeper wallet:

```bash
solana airdrop 1 YOUR_KEEPER_ADDRESS --url devnet
```

### No Intents Being Found

Make sure:
1. Frontend is connected to devnet
2. You've registered as an agent
3. You've submitted intents through the UI
4. Intents are marked as `isPending: true`

### Batch Execution Fails

Check:
- Keeper wallet has enough SOL
- Config is initialized properly
- You're on the correct network (devnet)

## For Hackathon Demo

### Demo Script

1. **Setup** (5 min before demo):
   - Start keeper in one terminal
   - Start frontend in another terminal
   - Have 2-3 browser windows ready with different wallets

2. **Live Demo** (3-5 minutes):
   - Show empty dashboard (0 batches)
   - Submit 3 intents from different "agents" (wallets)
   - Watch keeper detect and batch them in real-time
   - Show MEV savings calculation
   - Show updated dashboard metrics

3. **Talking Points**:
   - "Without SwarmShield, each of these 3 trades would be visible and exploitable"
   - "MEV bots could front-run or sandwich attack each one"
   - "With SwarmShield, they're batched into ONE transaction"
   - "The keeper executes anonymously - bots can't see individual agents"
   - "Result: 99% protection, agents save ~3% per trade"

## Next Steps

- Integrate with Jupiter for real swaps
- Add Light Protocol ZK compression
- Deploy to mainnet with proper security audits

## Support

For issues or questions during the hackathon:
- Check the [main README](./README.md)
- Review keeper logs for errors
- Test on devnet first before any mainnet deployment
