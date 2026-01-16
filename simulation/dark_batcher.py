#!/usr/bin/env python3
"""
SwarmShield: Dark Batcher (Keeper) Service
============================================

The Dark Batcher is the "keeper" that:
1. Monitors pending shielded intents in the pool
2. Aggregates multiple intents into a single batch
3. Executes the batch via Jupiter aggregator
4. Distributes outputs back to shielded accounts

CRITICAL: The Batcher CANNOT see individual agent identities.
It only sees: aggregated buy volume, aggregated sell volume.

This is what makes SwarmShield MEV-resistant:
- MEV bots see ONE transaction from the batcher wallet
- The link between agents and trades is BROKEN
- No sandwich attacks possible on individual agents
"""

import asyncio
import hashlib
import json
import os
import time
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Tuple
from uuid import uuid4

# In production, these would be real Solana SDK imports
# from solana.rpc.async_api import AsyncClient
# from solders.keypair import Keypair
# from solders.pubkey import Pubkey

# =============================================================================
# CONFIGURATION
# =============================================================================

class BatcherConfig:
    """Batcher configuration"""
    # Execution parameters
    BATCH_INTERVAL_MS = 5000        # Check for batches every 5 seconds
    MIN_BATCH_SIZE = 2              # Minimum intents to form a batch
    MAX_BATCH_SIZE = 10             # Maximum intents per batch
    MAX_WAIT_TIME_SEC = 30          # Max time to wait before executing partial batch

    # Network
    RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
    HELIUS_API_KEY = os.getenv("HELIUS_API_KEY", "")  # For hackathon bounty

    # Jupiter Aggregator
    JUPITER_API_URL = "https://quote-api.jup.ag/v6"
    SLIPPAGE_BPS = 100  # 1% slippage

    # Program IDs
    SWARM_SHIELD_PROGRAM = "ShLd1111111111111111111111111111111111111111"
    LIGHT_SYSTEM_PROGRAM = "SySTEM1eSU2p4BGQfQpimFEWWSC1XDFeun3Nqzz3rT7"

    # Token Mints (Devnet)
    SOL_MINT = "So11111111111111111111111111111111111111112"
    USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"


# =============================================================================
# DATA STRUCTURES
# =============================================================================

class IntentType(Enum):
    BUY_SOL = 0
    SELL_SOL = 1


@dataclass
class PendingIntent:
    """Represents a pending shielded intent (batcher's view)"""
    intent_id: str
    intent_type: IntentType
    amount: float
    min_output: float
    expiry_slot: int
    submitted_at: float

    # NOTE: agent_hash is NOT stored here - batcher doesn't know agent identities


@dataclass
class AggregatedBatch:
    """Aggregated batch ready for execution"""
    batch_id: str
    buy_volume: float       # Total USDC wanting to buy SOL
    sell_volume: float      # Total SOL wanting to sell for USDC
    net_direction: str      # "BUY" or "SELL"
    net_amount: float       # Net amount to execute
    intent_count: int
    created_at: float


@dataclass
class ExecutionResult:
    """Result of batch execution"""
    batch_id: str
    success: bool
    tx_signature: Optional[str]
    input_amount: float
    output_amount: float
    execution_price: float
    gas_used: int
    error: Optional[str] = None


# =============================================================================
# JUPITER INTEGRATION (Simulated for Demo)
# =============================================================================

class JupiterAggregator:
    """
    Jupiter DEX Aggregator integration.

    In production, this would:
    1. Fetch real quotes from Jupiter API
    2. Execute swaps with optimal routing
    3. Handle transaction building and signing
    """

    def __init__(self):
        self.api_url = BatcherConfig.JUPITER_API_URL

    async def get_quote(
        self,
        input_mint: str,
        output_mint: str,
        amount: int,  # in smallest units
        slippage_bps: int = 100
    ) -> dict:
        """
        Get a swap quote from Jupiter.

        In production:
        ```python
        async with aiohttp.ClientSession() as session:
            params = {
                "inputMint": input_mint,
                "outputMint": output_mint,
                "amount": amount,
                "slippageBps": slippage_bps,
            }
            async with session.get(f"{self.api_url}/quote", params=params) as resp:
                return await resp.json()
        ```
        """
        # Simulated quote for demo
        simulated_price = 100  # SOL/USDC

        if input_mint == BatcherConfig.USDC_MINT:
            # Buying SOL with USDC
            output_amount = int(amount / simulated_price)
        else:
            # Selling SOL for USDC
            output_amount = int(amount * simulated_price)

        return {
            "inputMint": input_mint,
            "outputMint": output_mint,
            "inAmount": amount,
            "outAmount": output_amount,
            "priceImpactPct": 0.1,
            "routePlan": [
                {"swapInfo": {"ammKey": "RaydiumAMM", "percent": 100}}
            ]
        }

    async def execute_swap(self, quote: dict, payer_keypair: str) -> str:
        """
        Execute a swap on Jupiter.

        Returns transaction signature.
        """
        # Simulated execution for demo
        print(f"    [JUPITER] Executing swap:")
        print(f"      Input: {quote['inAmount']} ({quote['inputMint'][:8]}...)")
        print(f"      Output: {quote['outAmount']} ({quote['outputMint'][:8]}...)")

        # Simulate transaction signature
        tx_sig = hashlib.sha256(f"{quote}{time.time()}".encode()).hexdigest()
        return tx_sig


# =============================================================================
# LIGHT PROTOCOL INTEGRATION (Simulated for Demo)
# =============================================================================

class LightProtocolClient:
    """
    Light Protocol client for reading compressed account state.

    In production, this would:
    1. Use light-client Rust crate or stateless.js SDK
    2. Query compressed account states
    3. Generate validity proofs
    """

    def __init__(self, rpc_url: str):
        self.rpc_url = rpc_url

    async def fetch_pending_intents(self) -> List[PendingIntent]:
        """
        Fetch pending intents from the shielded pool.

        IMPORTANT: This returns ONLY aggregated data.
        The batcher cannot see individual agent identities.

        In production:
        ```typescript
        const rpc = createRpc(RPC_URL, COMPRESSION_URL);
        const accounts = await rpc.getCompressedAccountsByOwner(PROGRAM_ID);
        // Filter for intent accounts
        ```
        """
        # Simulated pending intents for demo
        # In reality, these would come from Light Protocol compressed accounts
        return []

    async def get_validity_proof(self, account_hashes: List[bytes]) -> bytes:
        """
        Get a validity proof for compressed accounts.

        This proves the accounts exist without revealing contents.
        """
        # Simulated proof
        return b"validity_proof_placeholder"


# =============================================================================
# DARK BATCHER SERVICE
# =============================================================================

class DarkBatcher:
    """
    The Dark Batcher (Keeper) Service.

    Responsibilities:
    1. Monitor the intent pool for pending trades
    2. Aggregate intents into MEV-resistant batches
    3. Execute batches via Jupiter
    4. Distribute outputs to shielded accounts

    KEY PRIVACY PROPERTY:
    The batcher only sees AGGREGATED volumes, never individual agents.
    """

    def __init__(self):
        self.jupiter = JupiterAggregator()
        self.light_client = LightProtocolClient(BatcherConfig.RPC_URL)
        self.pending_intents: List[PendingIntent] = []
        self.executed_batches: List[ExecutionResult] = []
        self.is_running = False
        self.oldest_intent_time: Optional[float] = None

        # Stats
        self.total_volume_executed = 0
        self.total_batches = 0
        self.mev_savings_estimated = 0

    def add_intent(self, intent: PendingIntent):
        """Add a pending intent to the pool"""
        self.pending_intents.append(intent)
        if self.oldest_intent_time is None:
            self.oldest_intent_time = intent.submitted_at

    def aggregate_intents(self) -> Optional[AggregatedBatch]:
        """
        Aggregate pending intents into a batch.

        This is where the magic happens:
        - Buy intents are summed
        - Sell intents are summed
        - Net position is calculated
        - Individual agent info is NEVER exposed
        """
        if len(self.pending_intents) < BatcherConfig.MIN_BATCH_SIZE:
            return None

        # Separate by direction
        buy_intents = [i for i in self.pending_intents if i.intent_type == IntentType.BUY_SOL]
        sell_intents = [i for i in self.pending_intents if i.intent_type == IntentType.SELL_SOL]

        # Aggregate volumes (this is all the batcher knows)
        buy_volume = sum(i.amount for i in buy_intents)
        sell_volume = sum(i.amount for i in sell_intents)

        # Calculate net position
        if buy_volume > sell_volume:
            net_direction = "BUY"
            net_amount = buy_volume - sell_volume
        else:
            net_direction = "SELL"
            net_amount = sell_volume - buy_volume

        # Internal matching: some buys and sells cancel out
        # This is ADDITIONAL MEV protection - matched orders never hit the DEX
        internal_match = min(buy_volume, sell_volume)

        batch = AggregatedBatch(
            batch_id=uuid4().hex,
            buy_volume=buy_volume,
            sell_volume=sell_volume,
            net_direction=net_direction,
            net_amount=net_amount,
            intent_count=len(self.pending_intents),
            created_at=time.time(),
        )

        print(f"\n  [AGGREGATION] Batch Created:")
        print(f"    Buy Volume: {buy_volume:.2f} USDC")
        print(f"    Sell Volume: {sell_volume:.2f} SOL")
        print(f"    Internal Match: {internal_match:.2f} (never hits DEX!)")
        print(f"    Net to Execute: {net_direction} {net_amount:.2f}")

        return batch

    async def execute_batch(self, batch: AggregatedBatch) -> ExecutionResult:
        """
        Execute an aggregated batch via Jupiter.

        THE MEV PROTECTION:
        - MEV bots see ONE transaction from batcher wallet
        - They don't know how many agents are involved
        - They don't know individual trade sizes
        - They cannot sandwich individual agents
        """
        print(f"\n  [EXECUTION] Starting batch {batch.batch_id[:16]}...")
        print(f"    Direction: {batch.net_direction}")
        print(f"    Net Amount: {batch.net_amount:.2f}")

        if batch.net_amount < 1:  # Minimum trade size
            print(f"    [SKIP] Net amount too small, internally matched")
            return ExecutionResult(
                batch_id=batch.batch_id,
                success=True,
                tx_signature=None,
                input_amount=0,
                output_amount=0,
                execution_price=100,  # Assumed price for internal match
                gas_used=0,
            )

        # Determine swap direction
        if batch.net_direction == "BUY":
            input_mint = BatcherConfig.USDC_MINT
            output_mint = BatcherConfig.SOL_MINT
            amount_in = int(batch.net_amount * 1e6)  # USDC decimals
        else:
            input_mint = BatcherConfig.SOL_MINT
            output_mint = BatcherConfig.USDC_MINT
            amount_in = int(batch.net_amount * 1e9)  # SOL decimals

        # Get Jupiter quote
        quote = await self.jupiter.get_quote(
            input_mint=input_mint,
            output_mint=output_mint,
            amount=amount_in,
            slippage_bps=BatcherConfig.SLIPPAGE_BPS,
        )

        # Execute swap
        tx_sig = await self.jupiter.execute_swap(quote, "batcher_keypair")

        # Calculate execution price
        if batch.net_direction == "BUY":
            execution_price = batch.net_amount / (quote["outAmount"] / 1e9)
        else:
            execution_price = (quote["outAmount"] / 1e6) / batch.net_amount

        result = ExecutionResult(
            batch_id=batch.batch_id,
            success=True,
            tx_signature=tx_sig,
            input_amount=batch.net_amount,
            output_amount=quote["outAmount"] / (1e9 if batch.net_direction == "BUY" else 1e6),
            execution_price=execution_price,
            gas_used=5000,  # Simulated
        )

        # Update stats
        self.total_volume_executed += batch.buy_volume + batch.sell_volume
        self.total_batches += 1

        # Estimate MEV savings (conservative: 0.5% per sandwiched trade)
        self.mev_savings_estimated += batch.intent_count * batch.net_amount * 0.005

        print(f"\n  [SUCCESS] Batch executed!")
        print(f"    TX: {tx_sig[:32]}...")
        print(f"    Price: {execution_price:.2f}")
        print(f"    Estimated MEV Saved: ${batch.intent_count * batch.net_amount * 0.005:.2f}")

        # Clear pending intents
        self.pending_intents.clear()
        self.oldest_intent_time = None

        self.executed_batches.append(result)
        return result

    def should_execute(self) -> bool:
        """
        Determine if we should execute a batch now.

        Triggers:
        1. Reached minimum batch size
        2. Waited too long (prevent stale intents)
        3. Pool value exceeds threshold
        """
        if len(self.pending_intents) >= BatcherConfig.MAX_BATCH_SIZE:
            return True

        if len(self.pending_intents) >= BatcherConfig.MIN_BATCH_SIZE:
            # Check if we've waited too long
            if self.oldest_intent_time:
                wait_time = time.time() - self.oldest_intent_time
                if wait_time >= BatcherConfig.MAX_WAIT_TIME_SEC:
                    return True
            return True

        return False

    async def run(self):
        """Main batcher loop"""
        self.is_running = True
        print("\n" + "=" * 60)
        print("   SWARMSHIELD DARK BATCHER - KEEPER SERVICE")
        print("=" * 60)
        print(f"\n  Config:")
        print(f"    Min Batch Size: {BatcherConfig.MIN_BATCH_SIZE}")
        print(f"    Max Batch Size: {BatcherConfig.MAX_BATCH_SIZE}")
        print(f"    Check Interval: {BatcherConfig.BATCH_INTERVAL_MS}ms")
        print(f"    Max Wait Time: {BatcherConfig.MAX_WAIT_TIME_SEC}s")
        print("\n  [READY] Waiting for intents...")

        while self.is_running:
            try:
                # In production: fetch intents from Light Protocol
                # new_intents = await self.light_client.fetch_pending_intents()
                # for intent in new_intents:
                #     self.add_intent(intent)

                if self.should_execute():
                    batch = self.aggregate_intents()
                    if batch:
                        await self.execute_batch(batch)

                await asyncio.sleep(BatcherConfig.BATCH_INTERVAL_MS / 1000)

            except Exception as e:
                print(f"  [ERROR] Batcher error: {e}")
                await asyncio.sleep(1)

    def print_stats(self):
        """Print batcher statistics"""
        print("\n" + "=" * 60)
        print("   DARK BATCHER STATISTICS")
        print("=" * 60)
        print(f"\n  Total Batches: {self.total_batches}")
        print(f"  Total Volume: ${self.total_volume_executed:,.2f}")
        print(f"  MEV Savings (Est.): ${self.mev_savings_estimated:,.2f}")
        print(f"  Pending Intents: {len(self.pending_intents)}")
        print("=" * 60 + "\n")


# =============================================================================
# DEMO MODE: Simulate with fake intents
# =============================================================================

async def demo_mode():
    """Run batcher in demo mode with simulated intents"""
    batcher = DarkBatcher()

    print("\n[DEMO MODE] Simulating Dark Batcher with fake intents\n")

    # Simulate some pending intents
    demo_intents = [
        PendingIntent(
            intent_id=uuid4().hex,
            intent_type=IntentType.BUY_SOL,
            amount=500,  # $500 USDC
            min_output=4.9,  # ~5 SOL at $100
            expiry_slot=int(time.time()) + 100,
            submitted_at=time.time(),
        ),
        PendingIntent(
            intent_id=uuid4().hex,
            intent_type=IntentType.BUY_SOL,
            amount=750,  # $750 USDC
            min_output=7.35,  # ~7.5 SOL
            expiry_slot=int(time.time()) + 100,
            submitted_at=time.time(),
        ),
        PendingIntent(
            intent_id=uuid4().hex,
            intent_type=IntentType.SELL_SOL,
            amount=3,  # 3 SOL
            min_output=294,  # ~$300 USDC
            expiry_slot=int(time.time()) + 100,
            submitted_at=time.time(),
        ),
    ]

    print("[DEMO] Adding simulated intents from AI agents...\n")

    for i, intent in enumerate(demo_intents):
        print(f"  Intent {i+1}: {intent.intent_type.name} | Amount: {intent.amount}")
        batcher.add_intent(intent)
        await asyncio.sleep(0.5)

    print(f"\n[DEMO] {len(demo_intents)} intents added to pool")

    # Execute batch
    if batcher.should_execute():
        batch = batcher.aggregate_intents()
        if batch:
            await batcher.execute_batch(batch)

    batcher.print_stats()

    print("\n[DEMO] Summary:")
    print("  - 3 individual agent trades were batched into 1 transaction")
    print("  - MEV bots could not see individual trade sizes or directions")
    print("  - Internal matching reduced DEX exposure")
    print("  - Estimated sandwich attacks prevented: 3")


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    print("\nStarting SwarmShield Dark Batcher...")
    asyncio.run(demo_mode())
