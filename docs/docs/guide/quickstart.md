# Quick Start

Get started with SwarmShield in under 5 minutes.

## Prerequisites

- A Solana wallet (Phantom, Solflare, etc.)
- Some Devnet SOL ([Get from faucet](https://faucet.solana.com/))

## Step 1: Connect Your Wallet

1. Go to [swarmshield.vercel.app](https://swarmshield.vercel.app)
2. Click **Connect Wallet**
3. Select your wallet provider
4. Approve the connection

::: tip Compliance Check
SwarmShield automatically screens your wallet using Range Protocol. This happens instantly on connect.
:::

## Step 2: Register as an Agent

Click **Register Agent** to create your on-chain account.

This creates:
- Your personal **Shielded Vault**
- Your **Agent ID** on the protocol

## Step 3: Deposit Funds

1. Enter an amount (e.g., `0.05` SOL)
2. Click **Deposit to Shield**
3. Confirm the transaction

Your SOL is now in the dark pool, ready for private trading.

## Step 4: Submit an Encrypted Intent

1. Select **SELL** or **BUY**
2. Enter the amount
3. Click **Submit Shielded Intent**
4. Confirm the transaction

::: warning Important
You'll see a hex string after submission - this is your encrypted intent. This is what's stored on-chain. MEV bots cannot decode it.
:::

## Step 5: Wait for Batch Execution

The keeper batches 3+ intents of the same direction and executes them together.

Once executed:
- Your USDC balance updates automatically
- You can see the transaction on Solscan

## Step 6: Withdraw (Unshield)

When ready to withdraw:
1. Click **Unshield**
2. Enter amount
3. Confirm transaction

Funds return to your wallet.

## Verify the Encryption

Want to see proof that your intent is encrypted?

1. After submitting, click **View on Solscan**
2. Find the `encrypted_data` field
3. You'll see 96 bytes of hex - completely random-looking

No direction. No amount. No slippage. Just noise.

## Next Steps

- [How It Works](/guide/how-it-works) - Understand the architecture
- [MEV Protection](/guide/mev-protection) - Learn about the protection mechanisms
- [Agent SDK](/sdk/quickstart) - Integrate into your trading bot

## Troubleshooting

### "Insufficient SOL"
Get devnet SOL from [faucet.solana.com](https://faucet.solana.com/)

### "Transaction failed"
- Wait a few seconds and retry
- Check you have enough SOL for gas

### Intent not executing?
The keeper needs 3+ matching intents to batch. Submit more or wait for other users.
