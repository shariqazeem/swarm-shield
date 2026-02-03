# Withdraw Tokens

Withdraw your tokens from SwarmShield back to your personal wallet.

## Understanding Withdrawals

After batch execution, your vault holds tokens:
- **SOL**: From buy orders
- **USDC**: From sell orders

Withdrawing ("unshielding") moves these to your wallet.

```
SwarmShield Vault              Your Wallet
┌──────────────────┐          ┌──────────────────┐
│  USDC: 50.0      │ ──▶      │  USDC: 50.0      │
│  SOL:  0.1       │ unshield │  SOL:  2.1       │
└──────────────────┘          └──────────────────┘
```

## How to Withdraw

### Step 1: Check Your Balance

View your shielded balances:
```
┌─────────────────────────────────────┐
│  Shielded Balances                 │
│  ─────────────────                 │
│  SOL:   0.05                       │
│  USDC:  25.50                      │
└─────────────────────────────────────┘
```

### Step 2: Select Token

Choose which token to withdraw:
- **SOL**: Native Solana
- **USDC**: SwarmUSDC (devnet test token)

### Step 3: Enter Amount

Enter the amount to withdraw:
- Can withdraw partial amounts
- Cannot exceed shielded balance

### Step 4: Click Unshield

Click **Unshield** and confirm in your wallet.

### Step 5: Receive Tokens

After confirmation:
- Tokens appear in your wallet
- Shielded balance decreases
- Transaction viewable on Solscan

## Withdrawal Fees

| Fee Type | Amount |
|----------|--------|
| Transaction fee | ~0.00001 SOL |
| Protocol fee | 0% (devnet) |

::: tip No Lock Period
Unlike some protocols, SwarmShield has no lock period. Withdraw anytime.
:::

## Token Addresses (Devnet)

| Token | Address |
|-------|---------|
| SOL | Native |
| SwarmUSDC | `8ypRqPnaiegfw9if3R2JZpqLsfr4YHjfPtxUz8YgdkuJ` |

## Viewing in Wallet

After withdrawal, add the SwarmUSDC token to your wallet:

**Phantom:**
1. Click "Manage Token List"
2. Enter the USDC mint address
3. Token will appear in your list

**Solflare:**
1. Go to Portfolio
2. Click "Add Token"
3. Paste the mint address

## Partial Withdrawals

You can withdraw any amount up to your balance:

```typescript
// Example: Withdraw half your USDC
shieldedBalance: 50.0 USDC
withdrawAmount:  25.0 USDC
remaining:       25.0 USDC
```

## Withdrawal Flow

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  Your Request  │ ──▶ │  Smart Contract│ ──▶ │  Your Wallet   │
│  Withdraw 25   │     │  Verifies &    │     │  Receives 25   │
│  USDC          │     │  Transfers     │     │  USDC          │
└────────────────┘     └────────────────┘     └────────────────┘
```

## Security Considerations

### What's Verified:
- Your signature (wallet ownership)
- Sufficient balance
- Valid token account

### What's Protected:
- Funds only go to your wallet
- No third-party access
- Atomic transaction (all or nothing)

## Troubleshooting

### "Insufficient Balance"
- Verify your shielded balance
- May have pending intents reducing available balance

### "Token Account Not Found"
- First withdrawal creates the token account
- Small rent (~0.002 SOL) required

### Transaction Pending
- Solana confirmation typically ~400ms
- Check Solscan for status

### Wrong Token Amount
- Verify you're looking at the correct token
- SOL and USDC are separate balances

## Best Practices

1. **Withdraw after batch execution** - Ensure your intents are processed
2. **Keep some SOL for fees** - Always maintain gas funds
3. **Verify on Solscan** - Confirm successful transfer
4. **Add token to wallet** - So balances display correctly

## Next Steps

- [Architecture Overview](/architecture/overview) - Understand the full system
- [Agent SDK](/sdk/quickstart) - Automate withdrawals programmatically
- [Why SwarmShield?](/guide/why-swarmshield) - Review the benefits
