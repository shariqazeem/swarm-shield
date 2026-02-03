# Quick Start

Get started with SwarmShield in under 5 minutes.

## Prerequisites

- A Solana wallet (Phantom or Solflare recommended)
- Some Devnet SOL ([Get from faucet](https://faucet.solana.com/))

## Step 1: Connect Your Wallet

1. Go to [swarmshield.vercel.app](https://swarmshield.vercel.app)
2. Click **Connect Wallet**
3. Select your wallet provider
4. Approve the connection

::: tip Automatic Compliance
SwarmShield automatically screens your wallet using Range Protocol. This happens instantly on connect.
:::

## Step 2: Register as an Agent

Click **Register Agent** to create your on-chain account.

This creates:
- Your personal **Shielded Vault** (PDA)
- Your **Agent ID** on the protocol

## Step 3: Deposit Funds

1. Enter an amount (e.g., `0.05` SOL)
2. Click **Deposit to Shield**
3. Confirm the transaction in your wallet

Your SOL is now in the dark pool, ready for private trading.

## Step 4: Submit an Encrypted Intent

1. Select **SELL** or **BUY** direction
2. Enter the amount
3. Click **Submit Shielded Intent**
4. Confirm the transaction

::: warning What You'll See
After submission, you'll see a hex string like `9bed43a48f60...`. This is your encrypted intent stored on-chain. MEV bots cannot decode it.
:::

## Step 5: Wait for Batch Execution

The keeper automatically:
1. Monitors for 3+ intents of the same direction
2. Decrypts the intents (only keeper has the private key)
3. Batches them into a single Jupiter swap
4. Distributes results proportionally

Once executed, your USDC balance updates automatically.

## Step 6: Withdraw (Unshield)

When ready to withdraw:
1. Click **Unshield**
2. Enter amount
3. Confirm transaction

Funds return to your wallet.

## Verify the Encryption

Want proof that your intent is encrypted?

1. After submitting, click **View on Solscan**
2. Find the transaction data
3. You'll see 96 bytes of hex - completely random-looking

```
9bed43a48f60f39e2a857226c8f2a78d5e1f3b4a...
```

No direction. No amount. No slippage. Just cryptographic noise.

## Video Walkthrough

<div style="text-align: center; padding: 2rem; background: var(--vp-c-bg-soft); border-radius: 8px;">
  <p>Watch the demo video for a complete walkthrough:</p>
  <a href="https://swarmshield.vercel.app" target="_blank" style="font-size: 1.2em;">
    Launch SwarmShield →
  </a>
</div>

## Troubleshooting

### "Insufficient SOL"
Get devnet SOL from [faucet.solana.com](https://faucet.solana.com/)

### "Transaction failed"
- Wait a few seconds and retry
- Check you have enough SOL for gas (~0.01 SOL)

### Intent not executing?
The keeper needs 3+ matching intents to batch. Submit more or wait for other users.

### Wallet not connecting?
- Ensure you're on Solana Devnet
- Try refreshing the page
- Check wallet extension is unlocked

## Next Steps

- [Connect Wallet](/guide/connect-wallet) - Detailed wallet setup
- [Architecture Overview](/architecture/overview) - How it works technically
- [Agent SDK](/sdk/quickstart) - Integrate into your trading bot
