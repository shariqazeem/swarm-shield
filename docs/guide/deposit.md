# Deposit SOL

Before trading on SwarmShield, you need to deposit SOL into your Shielded Vault.

## What is a Shielded Vault?

Your Shielded Vault is a **Program Derived Address (PDA)** controlled by the SwarmShield smart contract. When you deposit:

```
Your Wallet                    SwarmShield Program
┌──────────────┐              ┌──────────────────────────────┐
│  2.0 SOL     │ ──deposit──▶ │  Your Shielded Vault (PDA)   │
│              │              │  ┌────────────────────────┐  │
│              │              │  │  0.5 SOL available     │  │
│              │              │  │  for private trading   │  │
│              │              │  └────────────────────────┘  │
└──────────────┘              └──────────────────────────────┘
```

## Prerequisites

Before depositing:
1. ✅ Wallet connected
2. ✅ Registered as an agent
3. ✅ Have SOL in your wallet

## How to Deposit

### Step 1: Enter Amount

In the SwarmShield interface:
1. Find the **Deposit** section
2. Enter the amount of SOL (e.g., `0.1`)
3. Minimum: 0.01 SOL recommended

### Step 2: Click Deposit

Click **Deposit to Shield** button.

### Step 3: Confirm Transaction

Your wallet will prompt you to approve:
- **Amount**: The SOL you're depositing
- **Fee**: ~0.00001 SOL (rent + gas)

### Step 4: Wait for Confirmation

After ~400ms (Solana block time), you'll see:
- Updated vault balance
- Transaction confirmation
- Link to view on Solscan

## Understanding Balances

After depositing, you'll see two balances:

| Balance | Description |
|---------|-------------|
| **Wallet SOL** | SOL in your personal wallet |
| **Shielded SOL** | SOL in your vault, ready for trading |

```
┌─────────────────────────────────────┐
│  Wallet Balance:    1.5 SOL        │
│  Shielded Balance:  0.5 SOL ← Your vault
│  ─────────────────────────────────  │
│  USDC Balance:      0.0 USDC       │
└─────────────────────────────────────┘
```

## Gas Considerations

Each deposit costs approximately:
- **Transaction fee**: ~0.00001 SOL
- **Account rent**: One-time ~0.002 SOL (if vault not created)

::: tip Batch Your Deposits
Rather than many small deposits, make fewer larger ones to save on transaction fees.
:::

## On-Chain Verification

Every deposit is verifiable on Solscan:

1. Click the transaction link after depositing
2. View the "SOL Transfer" instruction
3. Verify your vault PDA received the funds

## Security

Your deposited SOL is secured by:
- **Program ownership**: Only SwarmShield program can move funds
- **Signer requirement**: Only you can authorize trades
- **Audit trail**: All movements recorded on-chain

::: warning Devnet Notice
Currently on Devnet - funds have no real value. For Mainnet, additional security audits will be completed.
:::

## Troubleshooting

### "Insufficient Balance"
- Ensure you have enough SOL (amount + fees)
- Get more from [faucet.solana.com](https://faucet.solana.com)

### "Transaction Failed"
- Wait a few seconds and retry
- Network may be congested

### Balance Not Updating
- Refresh the page
- Check transaction on Solscan
- Balance updates may take a few seconds

## Next Steps

- [Submit Intents](/guide/submit-intent) - Start trading privately
- [Withdraw Tokens](/guide/withdraw) - How to unshield funds
