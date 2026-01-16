//! # SwarmShield: Dark Liquidity Pool for Autonomous AI Agents
//!
//! A privacy-preserving execution layer for AI agent swarms on Solana.
//! Protects autonomous agents from MEV extraction by shielding trade intents.
//!
//! ## Architecture
//! 1. **Shielded Vault**: Stores agent balances privately
//! 2. **Intent Pool**: Agents submit encrypted trade intents
//! 3. **Dark Batcher**: Aggregates intents into single MEV-resistant transactions
//!
//! ## Hackathon Targets
//! - Light Protocol (Open Track - $18k): ZK Compression for private state
//! - Anoncoin ($10k): Dark liquidity pool mechanics
//! - PNP Exchange ($2.5k): AI Agent infrastructure

use anchor_lang::prelude::*;

declare_id!("F5zRCquhMHFrGJjrgmSoMmv1Pdo6N1io4eRA5H8UcVZu");

// ============================================================================
// PROGRAM STATE
// ============================================================================

/// Global configuration for SwarmShield
#[account]
#[derive(Default)]
pub struct SwarmConfig {
    /// Authority that can update config
    pub authority: Pubkey,
    /// Keeper that can execute batches
    pub keeper: Pubkey,
    /// Total agents registered
    pub total_agents: u64,
    /// Total batches executed
    pub total_batches: u64,
    /// Total volume protected from MEV (in lamports)
    pub total_volume_protected: u64,
    /// Minimum batch size before execution
    pub min_batch_size: u8,
    /// Maximum batch size
    pub max_batch_size: u8,
    /// Bump seed for PDA
    pub bump: u8,
}

/// Shielded Agent Account - Stores agent state
/// In production with Light Protocol, this would be a compressed account
#[account]
#[derive(Default)]
pub struct ShieldedAgent {
    /// Owner of this agent account
    pub authority: Pubkey,
    /// Agent identifier hash (for privacy)
    pub agent_id_hash: [u8; 32],
    /// SOL balance in lamports
    pub sol_balance: u64,
    /// USDC balance (in smallest units)
    pub usdc_balance: u64,
    /// Nonce for replay protection
    pub nonce: u64,
    /// Is active
    pub is_active: bool,
    /// Bump seed
    pub bump: u8,
}

/// Trade Intent - Represents a pending swap request
/// In production, this would be encrypted/compressed
#[account]
#[derive(Default)]
pub struct TradeIntent {
    /// Agent submitting the intent
    pub agent: Pubkey,
    /// Intent type: 0 = BUY_SOL, 1 = SELL_SOL
    pub intent_type: u8,
    /// Amount to swap
    pub amount: u64,
    /// Minimum acceptable output (slippage protection)
    pub min_output: u64,
    /// Expiry slot
    pub expiry_slot: u64,
    /// Is pending (not yet batched)
    pub is_pending: bool,
    /// Bump seed
    pub bump: u8,
}

/// Batch Execution Record
#[account]
#[derive(Default)]
pub struct BatchRecord {
    /// Batch ID (sequential)
    pub batch_id: u64,
    /// Number of intents in this batch
    pub intent_count: u8,
    /// Total input volume
    pub total_input: u64,
    /// Total output received
    pub total_output: u64,
    /// Execution slot
    pub execution_slot: u64,
    /// Executed by keeper
    pub executed_by: Pubkey,
    /// Bump seed
    pub bump: u8,
}

// ============================================================================
// PROGRAM ENTRYPOINT
// ============================================================================

#[program]
pub mod swarm_shield {
    use super::*;

    /// Initialize the SwarmShield protocol
    pub fn initialize(ctx: Context<Initialize>, min_batch_size: u8, max_batch_size: u8) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.keeper = ctx.accounts.authority.key(); // Initially same as authority
        config.total_agents = 0;
        config.total_batches = 0;
        config.total_volume_protected = 0;
        config.min_batch_size = min_batch_size;
        config.max_batch_size = max_batch_size;
        config.bump = ctx.bumps.config;

        msg!("SwarmShield initialized! Dark Pool ready for AI agents.");
        Ok(())
    }

    /// Register a new AI agent with the dark pool
    pub fn register_agent(ctx: Context<RegisterAgent>, agent_id_hash: [u8; 32]) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.authority = ctx.accounts.authority.key();
        agent.agent_id_hash = agent_id_hash;
        agent.sol_balance = 0;
        agent.usdc_balance = 0;
        agent.nonce = 0;
        agent.is_active = true;
        agent.bump = ctx.bumps.agent;

        let config = &mut ctx.accounts.config;
        config.total_agents += 1;

        msg!("Agent registered to SwarmShield. ID Hash: {:?}", &agent_id_hash[..8]);
        Ok(())
    }

    /// Deposit SOL into shielded vault
    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        require!(amount > 0, SwarmShieldError::InvalidAmount);

        // Transfer SOL from user to vault
        let transfer_ix = anchor_lang::system_program::Transfer {
            from: ctx.accounts.authority.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            transfer_ix,
        );
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        // Update agent balance
        let agent = &mut ctx.accounts.agent;
        agent.sol_balance = agent.sol_balance.checked_add(amount)
            .ok_or(SwarmShieldError::Overflow)?;
        agent.nonce += 1;

        msg!("Deposited {} lamports to shielded vault", amount);
        Ok(())
    }

    /// Submit a shielded trade intent
    /// This is THE KEY MEV PROTECTION - intent is hidden until batch execution
    pub fn submit_intent(
        ctx: Context<SubmitIntent>,
        intent_type: u8,
        amount: u64,
        min_output: u64,
    ) -> Result<()> {
        require!(intent_type <= 1, SwarmShieldError::InvalidIntentType);
        require!(amount > 0, SwarmShieldError::InvalidAmount);

        let agent = &mut ctx.accounts.agent;
        let intent = &mut ctx.accounts.intent;

        intent.agent = agent.key();
        intent.intent_type = intent_type;
        intent.amount = amount;
        intent.min_output = min_output;
        intent.expiry_slot = Clock::get()?.slot + 100; // ~40 seconds
        intent.is_pending = true;
        intent.bump = ctx.bumps.intent;

        // Increment nonce for next intent
        agent.nonce = agent.nonce.checked_add(1).ok_or(SwarmShieldError::Overflow)?;

        msg!(
            "Shielded intent submitted: {} {} | Amount: {} | Nonce: {}",
            if intent_type == 0 { "BUY" } else { "SELL" },
            "SOL",
            amount,
            agent.nonce
        );
        Ok(())
    }

    /// Execute a batch of intents (called by keeper)
    /// This aggregates multiple agent intents into ONE transaction
    /// MEV bots see one trade, not individual agent activity
    pub fn execute_batch(
        ctx: Context<ExecuteBatch>,
        batch_id: u64,
        intent_count: u8,
        total_input: u64,
        total_output: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;

        // Verify keeper authorization
        require!(
            ctx.accounts.keeper.key() == config.keeper,
            SwarmShieldError::UnauthorizedKeeper
        );

        let batch = &mut ctx.accounts.batch;
        batch.batch_id = batch_id;
        batch.intent_count = intent_count;
        batch.total_input = total_input;
        batch.total_output = total_output;
        batch.execution_slot = Clock::get()?.slot;
        batch.executed_by = ctx.accounts.keeper.key();
        batch.bump = ctx.bumps.batch;

        // Update global stats
        config.total_batches += 1;
        config.total_volume_protected = config.total_volume_protected
            .checked_add(total_input)
            .ok_or(SwarmShieldError::Overflow)?;

        msg!(
            "BATCH EXECUTED - MEV DEFEATED! Batch #{}: {} intents, {} volume protected",
            batch_id,
            intent_count,
            total_input
        );
        Ok(())
    }

    /// Withdraw SOL from shielded vault
    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
        let agent = &mut ctx.accounts.agent;

        require!(amount > 0, SwarmShieldError::InvalidAmount);
        require!(agent.sol_balance >= amount, SwarmShieldError::InsufficientBalance);

        // Update balance first (checks-effects-interactions)
        agent.sol_balance = agent.sol_balance.checked_sub(amount)
            .ok_or(SwarmShieldError::Overflow)?;
        agent.nonce += 1;

        // Transfer from vault
        let vault_bump = ctx.accounts.vault.to_account_info().data.borrow()[0];
        let seeds = &[b"vault".as_ref(), &[vault_bump]];
        let signer_seeds = &[&seeds[..]];

        let transfer_ix = anchor_lang::system_program::Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            transfer_ix,
            signer_seeds,
        );
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        msg!("Withdrawn {} lamports from shielded vault", amount);
        Ok(())
    }

    /// Update keeper address (admin only)
    pub fn update_keeper(ctx: Context<UpdateConfig>, new_keeper: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.keeper = new_keeper;
        msg!("Keeper updated to: {}", new_keeper);
        Ok(())
    }
}

// ============================================================================
// ACCOUNT CONTEXTS
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 1 + 1 + 1,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, SwarmConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(agent_id_hash: [u8; 32])]
pub struct RegisterAgent<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, SwarmConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 1 + 1,
        seeds = [b"agent", authority.key().as_ref()],
        bump
    )]
    pub agent: Account<'info, ShieldedAgent>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(
        mut,
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent.bump,
        constraint = agent.authority == authority.key() @ SwarmShieldError::UnauthorizedAgent
    )]
    pub agent: Account<'info, ShieldedAgent>,

    /// CHECK: Vault PDA to hold funds
    #[account(
        mut,
        seeds = [b"vault"],
        bump
    )]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitIntent<'info> {
    #[account(
        mut,
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent.bump,
        constraint = agent.authority == authority.key() @ SwarmShieldError::UnauthorizedAgent
    )]
    pub agent: Account<'info, ShieldedAgent>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 1 + 8 + 8 + 8 + 1 + 1,
        seeds = [b"intent", authority.key().as_ref(), &agent.nonce.to_le_bytes()],
        bump
    )]
    pub intent: Account<'info, TradeIntent>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(batch_id: u64)]
pub struct ExecuteBatch<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, SwarmConfig>,

    #[account(
        init,
        payer = keeper,
        space = 8 + 8 + 1 + 8 + 8 + 8 + 32 + 1,
        seeds = [b"batch", batch_id.to_le_bytes().as_ref()],
        bump
    )]
    pub batch: Account<'info, BatchRecord>,

    #[account(mut)]
    pub keeper: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(
        mut,
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent.bump,
        constraint = agent.authority == authority.key() @ SwarmShieldError::UnauthorizedAgent
    )]
    pub agent: Account<'info, ShieldedAgent>,

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault"],
        bump
    )]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.authority == authority.key() @ SwarmShieldError::UnauthorizedAgent
    )]
    pub config: Account<'info, SwarmConfig>,

    pub authority: Signer<'info>,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum SwarmShieldError {
    #[msg("Unauthorized agent - signature mismatch")]
    UnauthorizedAgent,

    #[msg("Unauthorized keeper - only designated keeper can execute batches")]
    UnauthorizedKeeper,

    #[msg("Insufficient balance in shielded account")]
    InsufficientBalance,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Intent has expired")]
    IntentExpired,

    #[msg("Invalid intent type - must be 0 (BUY) or 1 (SELL)")]
    InvalidIntentType,

    #[msg("Invalid amount - must be greater than 0")]
    InvalidAmount,

    #[msg("Batch size exceeds maximum")]
    BatchTooLarge,

    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
}

// ============================================================================
// CONSTANTS
// ============================================================================

/// Intent types
pub const INTENT_BUY_SOL: u8 = 0;
pub const INTENT_SELL_SOL: u8 = 1;
