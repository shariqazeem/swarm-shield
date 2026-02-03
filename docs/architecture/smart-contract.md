# Smart Contract Architecture

SwarmShield's on-chain program is built with Anchor framework on Solana.

## Program Overview

| Property | Value |
|----------|-------|
| **Program ID** | `5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew` |
| **Framework** | Anchor (Rust) |
| **Network** | Devnet (Mainnet ready) |

## Account Structure

### SwarmConfig (Global)

Stores protocol-wide configuration:

```rust
#[account]
pub struct SwarmConfig {
    /// Protocol admin
    pub authority: Pubkey,

    /// Authorized keeper address
    pub keeper: Pubkey,

    /// Statistics
    pub total_batches: u64,
    pub total_volume_protected: u64,

    /// Batch settings
    pub min_batch_size: u8,  // Default: 3

    /// Bump for PDA derivation
    pub bump: u8,
}
```

**PDA Seeds:** `["swarm_config"]`

### ShieldedAgent (Per-User)

Each user has a shielded agent account:

```rust
#[account]
pub struct ShieldedAgent {
    /// User's wallet
    pub authority: Pubkey,

    /// Shielded balances
    pub sol_balance: u64,
    pub usdc_balance: u64,

    /// Intent counter (prevents replay)
    pub nonce: u64,

    /// Registration time
    pub registered_at: i64,

    /// Bump for PDA
    pub bump: u8,
}
```

**PDA Seeds:** `["shielded_agent", authority.key()]`

### TradeIntent (Per-Intent)

Stores encrypted trade intents:

```rust
#[account]
pub struct TradeIntent {
    /// Owning agent
    pub agent: Pubkey,

    /// Encrypted payload (96 bytes)
    pub encrypted_data: [u8; 96],

    /// Status
    pub is_pending: bool,
    pub submitted_at: i64,

    /// Bump
    pub bump: u8,
}
```

**PDA Seeds:** `["trade_intent", agent.key(), nonce.to_le_bytes()]`

### BatchRecord (Per-Batch)

Records executed batches:

```rust
#[account]
pub struct BatchRecord {
    /// Batch identifier
    pub batch_id: u64,

    /// Participants
    pub agents: Vec<Pubkey>,

    /// Execution details
    pub total_input: u64,
    pub total_output: u64,
    pub executed_at: i64,

    /// Bump
    pub bump: u8,
}
```

## Instructions

### `initialize`

Creates the SwarmConfig account.

```rust
pub fn initialize(ctx: Context<Initialize>) -> Result<()>
```

**Accounts:**
- `authority`: Signer, payer
- `config`: SwarmConfig PDA (init)
- `system_program`: System Program

### `register_agent`

Registers a new shielded agent.

```rust
pub fn register_agent(ctx: Context<RegisterAgent>) -> Result<()>
```

**Accounts:**
- `authority`: Signer, payer
- `agent`: ShieldedAgent PDA (init)
- `config`: SwarmConfig (verified)
- `system_program`: System Program

### `deposit_sol`

Deposits SOL into shielded vault.

```rust
pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()>
```

**Flow:**
1. Transfer SOL from user to vault PDA
2. Increment `agent.sol_balance`

### `submit_shielded_intent`

Submits an encrypted trade intent.

```rust
pub fn submit_shielded_intent(
    ctx: Context<SubmitIntent>,
    encrypted_data: [u8; 96]
) -> Result<()>
```

**Flow:**
1. Verify agent has sufficient balance
2. Create TradeIntent account with encrypted data
3. Increment `agent.nonce`
4. Emit `IntentSubmitted` event

### `execute_batch`

Keeper-only instruction to execute batched intents.

```rust
pub fn execute_batch(
    ctx: Context<ExecuteBatch>,
    batch_id: u64,
    output_amount: u64,
    distributions: Vec<Distribution>
) -> Result<()>
```

**Flow:**
1. Verify caller is authorized keeper
2. Verify all intents are pending
3. Update agent balances per distribution
4. Mark intents as executed
5. Create BatchRecord
6. Emit `BatchExecuted` event

### `withdraw_usdc`

Withdraws USDC from shielded vault.

```rust
pub fn withdraw_usdc(ctx: Context<WithdrawUsdc>, amount: u64) -> Result<()>
```

**Flow:**
1. Verify sufficient USDC balance
2. Transfer USDC from vault to user ATA
3. Decrement `agent.usdc_balance`

## Events

### IntentSubmitted

```rust
#[event]
pub struct IntentSubmitted {
    pub agent: Pubkey,
    pub nonce: u64,
    pub encrypted_data: [u8; 96],
    pub timestamp: i64,
}
```

### BatchExecuted

```rust
#[event]
pub struct BatchExecuted {
    pub batch_id: u64,
    pub num_intents: u8,
    pub total_input: u64,
    pub total_output: u64,
    pub timestamp: i64,
}
```

## Error Codes

```rust
#[error_code]
pub enum SwarmShieldError {
    #[msg("Insufficient balance for this operation")]
    InsufficientBalance,

    #[msg("Unauthorized: not the keeper")]
    UnauthorizedKeeper,

    #[msg("Intent already executed")]
    IntentAlreadyExecuted,

    #[msg("Invalid batch size")]
    InvalidBatchSize,

    #[msg("Invalid distribution")]
    InvalidDistribution,
}
```

## Security Features

### Access Control

```rust
// Keeper-only check
require!(
    ctx.accounts.keeper.key() == ctx.accounts.config.keeper,
    SwarmShieldError::UnauthorizedKeeper
);

// Owner-only check
require!(
    ctx.accounts.authority.key() == ctx.accounts.agent.authority,
    SwarmShieldError::Unauthorized
);
```

### Balance Checks

```rust
// Ensure sufficient balance
require!(
    agent.sol_balance >= amount,
    SwarmShieldError::InsufficientBalance
);

// Update balance atomically
agent.sol_balance = agent.sol_balance
    .checked_sub(amount)
    .ok_or(SwarmShieldError::InsufficientBalance)?;
```

### PDA Security

All accounts use deterministic PDAs:

```rust
// Agent PDA
let (agent_pda, bump) = Pubkey::find_program_address(
    &[b"shielded_agent", authority.key().as_ref()],
    program_id
);

// Only program can sign for PDA operations
```

## Account Sizes

| Account | Size | Rent |
|---------|------|------|
| SwarmConfig | 200 bytes | ~0.002 SOL |
| ShieldedAgent | 150 bytes | ~0.001 SOL |
| TradeIntent | 200 bytes | ~0.002 SOL |
| BatchRecord | Variable | ~0.003 SOL |

## Building & Deploying

### Build

```bash
cd programs/swarm-shield
anchor build
```

### Deploy

```bash
anchor deploy --provider.cluster devnet
```

### Upgrade

```bash
anchor upgrade target/deploy/swarm_shield.so \
  --program-id 5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew \
  --provider.cluster devnet
```

## IDL

The program IDL is available at:
- `target/idl/swarm_shield.json`
- Deployed to: [Anchor Explorer](https://anchor.so)

## Next Steps

- [Keeper Service](/architecture/keeper) - Off-chain execution
- [Encryption](/architecture/encryption) - Cryptographic details
- [MEV Protection](/architecture/mev-protection) - Security analysis
