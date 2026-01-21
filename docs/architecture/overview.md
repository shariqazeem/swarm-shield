# Architecture Overview

SwarmShield consists of three main components working together to provide MEV-resistant trade execution.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         SwarmShield                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │  User 1  │────│              │    │                    │    │
│  └──────────┘    │   Shielded   │    │   Keeper Service   │    │
│  ┌──────────┐    │    Vault     │────│                    │    │
│  │  User 2  │────│   (On-Chain) │    │  • Monitors pool   │    │
│  └──────────┘    │              │    │  • Batches intents │    │
│  ┌──────────┐    │  • Intents   │    │  • Executes swaps  │    │
│  │  User 3  │────│  • Balances  │    │  • Settles outputs │    │
│  └──────────┘    └──────────────┘    └────────────────────┘    │
│                         │                      │                 │
│                         └──────────┬───────────┘                 │
│                                    │                             │
│                         ┌──────────▼──────────┐                 │
│                         │    DEX (Jupiter)    │                 │
│                         │   Single Batched    │                 │
│                         │     Transaction     │                 │
│                         └─────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Smart Contract (Anchor/Rust)

The on-chain program manages:

- **SwarmConfig**: Global protocol settings, keeper address, stats
- **ShieldedAgent**: Per-user account storing balances and nonce
- **TradeIntent**: Pending swap requests with amount and direction
- **Vault PDA**: Holds deposited SOL and SwarmUSDC tokens

```rust
// Key Program Accounts
pub struct SwarmConfig {
    pub authority: Pubkey,
    pub keeper: Pubkey,
    pub total_batches: u64,
    pub total_volume_protected: u64,
    pub min_batch_size: u8,  // Default: 3
}

pub struct ShieldedAgent {
    pub authority: Pubkey,
    pub sol_balance: u64,
    pub usdc_balance: u64,
    pub nonce: u64,
}

pub struct TradeIntent {
    pub agent: Pubkey,
    pub intent_type: u8,  // 0=BUY, 1=SELL
    pub amount: u64,
    pub is_pending: bool,
}
```

### 2. Keeper Service (TypeScript)

Off-chain service that:

- Monitors pending intents via RPC polling
- Triggers batch execution when threshold met
- Calculates fair output distribution
- Handles settlement to agent accounts

```typescript
// Keeper Flow
while (true) {
  const pendingIntents = await getPendingIntents();

  if (pendingIntents.length >= MIN_BATCH_SIZE) {
    const batch = aggregateIntents(pendingIntents);
    const output = await executeSwap(batch);
    await settleToAgents(pendingIntents, output);
  }

  await sleep(5000);
}
```

### 3. Frontend (Next.js/React)

User interface providing:

- Wallet connection (Phantom, Solflare, etc.)
- Real-time balance display
- Intent submission
- Transaction verification via Solscan links

## Data Flow

### Deposit Flow
```
User Wallet → deposit_sol() → Vault PDA (SOL)
                            → Agent.sol_balance ↑
```

### Intent Submission
```
User → submit_intent() → TradeIntent account created
                       → Agent.nonce ↑
```

### Batch Execution
```
Keeper → execute_batch() → Batch account created
                        → Intents marked executed
                        → Agent balances updated
                        → Config.total_batches ↑
```

### Withdrawal Flow
```
User → withdraw_usdc() → Vault Token Account → User ATA
                       → Agent.usdc_balance ↓
                       → REAL tokens in wallet!
```

## Security Model

### Trust Assumptions

| Component | Trust Level |
|-----------|-------------|
| Smart Contract | Trustless (on-chain, verifiable) |
| Keeper | Semi-trusted (can delay, can't steal) |
| User Balances | Trustless (PDA-controlled) |
| Settlement | Trustless (on-chain verification) |

### What Keeper CAN Do
- Delay batch execution
- Choose batch timing

### What Keeper CANNOT Do
- Steal user funds
- Modify user balances
- Execute invalid settlements
- Front-run within batches

## Token Addresses (Devnet)

| Token | Mint Address |
|-------|--------------|
| SOL | Native |
| SwarmUSDC | `8ypRqPnaiegfw9if3R2JZpqLsfr4YHjfPtxUz8YgdkuJ` |

## Future: ZK Compression

The architecture is designed for Light Protocol integration:

- Intents can be compressed into merkle trees
- Only merkle roots stored on-chain (99% rent savings)
- Full privacy until batch execution
- See [MEV Protection](/architecture/mev-protection) for details
