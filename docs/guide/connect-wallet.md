# Connect Wallet

SwarmShield supports popular Solana wallets through the Solana Wallet Adapter.

## Supported Wallets

| Wallet | Status | Notes |
|--------|--------|-------|
| **Phantom** | ✅ Recommended | Most popular Solana wallet |
| **Solflare** | ✅ Supported | Great mobile experience |
| **Backpack** | ✅ Supported | Multi-chain support |
| **Other** | ⚠️ May work | Any Solana Wallet Adapter compatible |

## Connection Steps

### 1. Install a Wallet

If you don't have a wallet:

**Phantom (Recommended)**
1. Go to [phantom.app](https://phantom.app)
2. Download the browser extension
3. Create a new wallet or import existing
4. Save your seed phrase securely

**Solflare**
1. Go to [solflare.com](https://solflare.com)
2. Download extension or mobile app
3. Create or import wallet

### 2. Switch to Devnet

SwarmShield is currently on **Solana Devnet**.

**In Phantom:**
1. Click the gear icon (Settings)
2. Go to Developer Settings
3. Change Network to "Devnet"

**In Solflare:**
1. Click the network indicator
2. Select "Devnet"

### 3. Get Devnet SOL

You need devnet SOL for transaction fees:

1. Copy your wallet address
2. Go to [faucet.solana.com](https://faucet.solana.com)
3. Paste your address
4. Request airdrop (2 SOL)

### 4. Connect to SwarmShield

1. Visit [swarmshield.vercel.app](https://swarmshield.vercel.app)
2. Click **Connect Wallet** in the top right
3. Select your wallet from the modal
4. Approve the connection request

## Automatic Compliance Check

When you connect, SwarmShield automatically:

1. **Screens your wallet** via Range Protocol
2. **Checks for sanctions** or suspicious activity
3. **Verifies eligibility** for the dark pool

This happens instantly and transparently.

::: info Privacy Note
The compliance check only verifies your wallet address against public sanction lists. Your trading activity remains private.
:::

## Connection Status

After connecting, you'll see:

```
┌─────────────────────────────────────┐
│  Connected: 7xKp...3Rjf            │
│  Network: Devnet                    │
│  Balance: 2.0 SOL                   │
│  Status: ✅ Compliant               │
└─────────────────────────────────────┘
```

## Troubleshooting

### Wallet Not Detected

- Ensure the wallet extension is installed
- Refresh the page
- Check if extension is enabled for the site

### Wrong Network

- Verify you're on Solana Devnet
- Some wallets default to Mainnet

### Connection Rejected

- Make sure you approved the connection in your wallet
- Try disconnecting and reconnecting

### Transaction Approval Issues

- Ensure your wallet is unlocked
- Check for any pending approval popups
- Some wallets require explicit user action

## Security Best Practices

1. **Never share your seed phrase**
2. **Verify the URL** before connecting (swarmshield.vercel.app)
3. **Review transactions** before signing
4. **Use a dedicated wallet** for testing on devnet

## Next Steps

- [Deposit SOL](/guide/deposit) - Fund your shielded vault
- [Submit Intents](/guide/submit-intent) - Start trading privately
