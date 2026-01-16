#!/usr/bin/env python3
"""
SwarmShield: AI Agent Swarm Simulation
=======================================

Simulates autonomous AI agents (whales) generating trade signals.
These signals are submitted as shielded intents to the Dark Pool,
protecting them from MEV extraction.

Hackathon Targets:
- PNP Exchange ($2.5k): AI Agent infrastructure
- Light Protocol ($18k): ZK Compression privacy
- Anoncoin ($10k): Dark liquidity mechanics
"""

import asyncio
import hashlib
import json
import os
import random
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import uuid4

# =============================================================================
# CONFIGURATION
# =============================================================================

class Config:
    """Simulation configuration"""
    NUM_AGENTS = 3                    # Number of whale agents
    SIGNAL_INTERVAL_MS = 2000         # Time between signals (2 seconds)
    BATCH_THRESHOLD = 3               # Intents needed to trigger batch
    MAX_POSITION_SOL = 1000           # Max position size in SOL
    MIN_TRADE_SIZE = 10               # Minimum trade in SOL/USDC
    MAX_TRADE_SIZE = 500              # Maximum trade in SOL/USDC
    SLIPPAGE_TOLERANCE = 0.02         # 2% slippage tolerance

    # Solana RPC (would be real in production)
    RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")

    # SwarmShield Program ID
    PROGRAM_ID = "ShLd1111111111111111111111111111111111111111"


# =============================================================================
# DATA STRUCTURES
# =============================================================================

class IntentType(Enum):
    """Trade intent types"""
    BUY_SOL = 0   # Buy SOL with USDC
    SELL_SOL = 1  # Sell SOL for USDC


@dataclass
class AgentWallet:
    """Simulated agent wallet with shielded balances"""
    agent_id: str
    sol_balance: float = 100.0
    usdc_balance: float = 10000.0
    public_key: str = field(default_factory=lambda: f"Agent{uuid4().hex[:8]}")

    @property
    def agent_id_hash(self) -> bytes:
        """Generate anonymous hash of agent ID"""
        return hashlib.sha256(self.agent_id.encode()).digest()


@dataclass
class TradeIntent:
    """
    Shielded trade intent - this is what gets submitted to the Dark Pool.
    MEV bots CANNOT see: agent identity, trade direction, or size.
    """
    intent_id: str
    agent_hash: bytes         # Anonymous - no link to agent
    intent_type: IntentType
    amount: float
    min_output: float
    timestamp: float
    expiry_slot: int

    def to_dict(self) -> dict:
        return {
            "intent_id": self.intent_id,
            "agent_hash": self.agent_hash.hex()[:16] + "...",  # Truncated for display
            "type": self.intent_type.name,
            "amount": self.amount,
            "min_output": self.min_output,
            "expiry_slot": self.expiry_slot,
        }


@dataclass
class BatchExecution:
    """Record of a batch execution"""
    batch_id: str
    intents: List[TradeIntent]
    total_input: float
    total_output: float
    execution_time: float

    @property
    def intent_count(self) -> int:
        return len(self.intents)


# =============================================================================
# AI AGENT SIMULATION
# =============================================================================

class WhaleAgent:
    """
    Simulates an autonomous AI trading agent (whale).

    In production, this would be:
    - An AI16z agent running trading strategies
    - A DeFAI bot managing liquidity
    - An autonomous portfolio manager

    The key insight: These agents have PREDICTABLE patterns that MEV bots exploit.
    SwarmShield breaks this by hiding their intents.
    """

    def __init__(self, name: str, strategy: str = "momentum"):
        self.name = name
        self.strategy = strategy
        self.wallet = AgentWallet(agent_id=f"whale_{name}_{uuid4().hex[:8]}")
        self.pending_intents: List[TradeIntent] = []
        self.executed_trades: List[dict] = []
        self.is_active = True

        # Strategy parameters (simulated)
        self.momentum_threshold = random.uniform(0.01, 0.05)
        self.rebalance_target = random.uniform(0.3, 0.7)  # Target SOL allocation

    def generate_signal(self) -> Optional[TradeIntent]:
        """
        Generate a trade signal based on agent's strategy.

        This simulates various AI agent strategies:
        - Momentum: Follow price trends
        - Mean Reversion: Trade against extremes
        - Portfolio Rebalancing: Maintain target allocation
        """

        # Simulate market data (in production, would fetch real prices)
        simulated_sol_price = 100 + random.uniform(-10, 10)
        price_change = random.uniform(-0.1, 0.1)  # 10% price movement range

        intent_type = None
        amount = 0

        if self.strategy == "momentum":
            # Buy on positive momentum, sell on negative
            if price_change > self.momentum_threshold:
                intent_type = IntentType.BUY_SOL
                # Use USDC to buy SOL
                max_buy = min(self.wallet.usdc_balance * 0.3, Config.MAX_TRADE_SIZE * simulated_sol_price)
                amount = random.uniform(Config.MIN_TRADE_SIZE * simulated_sol_price, max_buy)
            elif price_change < -self.momentum_threshold:
                intent_type = IntentType.SELL_SOL
                # Sell SOL for USDC
                max_sell = min(self.wallet.sol_balance * 0.3, Config.MAX_TRADE_SIZE)
                amount = random.uniform(Config.MIN_TRADE_SIZE, max_sell)

        elif self.strategy == "rebalance":
            # Calculate current allocation
            total_value = self.wallet.sol_balance * simulated_sol_price + self.wallet.usdc_balance
            sol_allocation = (self.wallet.sol_balance * simulated_sol_price) / total_value if total_value > 0 else 0

            # Rebalance if off target
            if sol_allocation < self.rebalance_target - 0.1:
                intent_type = IntentType.BUY_SOL
                target_sol_value = total_value * self.rebalance_target
                current_sol_value = self.wallet.sol_balance * simulated_sol_price
                amount = min(target_sol_value - current_sol_value, self.wallet.usdc_balance * 0.5)
            elif sol_allocation > self.rebalance_target + 0.1:
                intent_type = IntentType.SELL_SOL
                target_sol_value = total_value * self.rebalance_target
                current_sol_value = self.wallet.sol_balance * simulated_sol_price
                amount = min((current_sol_value - target_sol_value) / simulated_sol_price, self.wallet.sol_balance * 0.5)

        else:  # random strategy
            # Random trading (for demo purposes)
            if random.random() > 0.6:  # 40% chance of signal
                intent_type = random.choice([IntentType.BUY_SOL, IntentType.SELL_SOL])
                if intent_type == IntentType.BUY_SOL:
                    amount = random.uniform(Config.MIN_TRADE_SIZE, min(Config.MAX_TRADE_SIZE, self.wallet.usdc_balance * 0.2)) * simulated_sol_price
                else:
                    amount = random.uniform(Config.MIN_TRADE_SIZE, min(Config.MAX_TRADE_SIZE, self.wallet.sol_balance * 0.2))

        if intent_type is None or amount < Config.MIN_TRADE_SIZE:
            return None

        # Calculate minimum output with slippage tolerance
        if intent_type == IntentType.BUY_SOL:
            expected_output = amount / simulated_sol_price
        else:
            expected_output = amount * simulated_sol_price
        min_output = expected_output * (1 - Config.SLIPPAGE_TOLERANCE)

        # Create the shielded intent
        intent = TradeIntent(
            intent_id=uuid4().hex,
            agent_hash=self.wallet.agent_id_hash,
            intent_type=intent_type,
            amount=amount,
            min_output=min_output,
            timestamp=time.time(),
            expiry_slot=int(time.time()) + 100,  # ~40 seconds
        )

        return intent

    def __repr__(self):
        return f"WhaleAgent({self.name}, strategy={self.strategy}, SOL={self.wallet.sol_balance:.2f}, USDC={self.wallet.usdc_balance:.2f})"


# =============================================================================
# DARK POOL SIMULATION
# =============================================================================

class DarkPool:
    """
    Simulates the SwarmShield Dark Pool.

    This is where the MEV protection happens:
    1. Agents submit SHIELDED intents (encrypted)
    2. Pool accumulates intents without knowing identities
    3. Batcher aggregates into single transaction
    4. MEV bots see ONE trade, not individual agent activity
    """

    def __init__(self):
        self.pending_intents: List[TradeIntent] = []
        self.executed_batches: List[BatchExecution] = []
        self.total_volume_protected: float = 0
        self.mev_attacks_prevented: int = 0

    def submit_intent(self, intent: TradeIntent) -> bool:
        """
        Submit a shielded intent to the dark pool.

        In production, this would:
        1. Create a Light Protocol compressed account
        2. Store the intent in encrypted form
        3. Only the batch executor can read aggregated data
        """
        self.pending_intents.append(intent)
        print(f"    [DARK POOL] Intent submitted: {intent.intent_type.name} | "
              f"Amount: {intent.amount:.2f} | Agent: {intent.agent_hash.hex()[:8]}...")
        return True

    def get_pending_count(self) -> int:
        return len(self.pending_intents)

    def should_execute_batch(self) -> bool:
        """Check if we have enough intents to batch"""
        return len(self.pending_intents) >= Config.BATCH_THRESHOLD

    def execute_batch(self) -> Optional[BatchExecution]:
        """
        Execute a batch of intents as a single transaction.

        THE KEY MEV PROTECTION:
        - Individual agent intents are hidden
        - Only aggregated volume is visible on-chain
        - MEV bots cannot sandwich individual trades
        """
        if not self.pending_intents:
            return None

        batch_id = uuid4().hex
        intents = self.pending_intents.copy()

        # Aggregate intents by type
        buy_intents = [i for i in intents if i.intent_type == IntentType.BUY_SOL]
        sell_intents = [i for i in intents if i.intent_type == IntentType.SELL_SOL]

        total_buy = sum(i.amount for i in buy_intents)
        total_sell = sum(i.amount for i in sell_intents)

        # Net the orders (internal matching)
        net_direction = "BUY" if total_buy > total_sell else "SELL"
        net_amount = abs(total_buy - total_sell)

        # Simulate execution (in production, would call Jupiter)
        simulated_price = 100  # SOL/USDC
        if net_direction == "BUY":
            total_output = net_amount / simulated_price
        else:
            total_output = net_amount * simulated_price

        execution = BatchExecution(
            batch_id=batch_id,
            intents=intents,
            total_input=net_amount,
            total_output=total_output,
            execution_time=time.time(),
        )

        # Update stats
        self.executed_batches.append(execution)
        self.total_volume_protected += total_buy + total_sell
        self.mev_attacks_prevented += len(intents)  # Each intent would have been sandwiched

        # Clear pending
        self.pending_intents.clear()

        return execution


# =============================================================================
# MAIN SIMULATION
# =============================================================================

class SwarmShieldSimulation:
    """
    Main simulation orchestrator.

    Demonstrates:
    1. Multiple AI agents generating trade signals
    2. Shielded intent submission to dark pool
    3. Batch execution for MEV protection
    4. Statistics on protection provided
    """

    def __init__(self):
        self.agents: List[WhaleAgent] = []
        self.dark_pool = DarkPool()
        self.is_running = False

    def setup_agents(self):
        """Initialize the whale agent swarm"""
        strategies = ["momentum", "rebalance", "random"]

        for i in range(Config.NUM_AGENTS):
            agent = WhaleAgent(
                name=f"Whale_{i+1}",
                strategy=strategies[i % len(strategies)]
            )
            self.agents.append(agent)
            print(f"[SWARM] Initialized {agent}")

    def print_header(self):
        """Print simulation header"""
        print("\n" + "=" * 70)
        print("   SWARMSHIELD: Dark Liquidity Pool for Autonomous AI Agents")
        print("   MEV Protection via ZK Compression on Solana")
        print("=" * 70)
        print(f"\n[CONFIG] Agents: {Config.NUM_AGENTS} | "
              f"Batch Threshold: {Config.BATCH_THRESHOLD} | "
              f"Signal Interval: {Config.SIGNAL_INTERVAL_MS}ms")
        print("-" * 70 + "\n")

    async def run_simulation(self, num_rounds: int = 10):
        """Run the simulation for N rounds"""
        self.is_running = True
        self.setup_agents()
        self.print_header()

        for round_num in range(1, num_rounds + 1):
            print(f"\n[ROUND {round_num}] " + "-" * 50)

            # Each agent generates a signal
            for agent in self.agents:
                intent = agent.generate_signal()

                if intent:
                    print(f"\n  [{agent.name}] Signal Generated:")
                    print(f"    Strategy: {agent.strategy}")
                    print(f"    Type: {intent.intent_type.name}")
                    print(f"    Amount: {intent.amount:.2f}")

                    # Submit to dark pool (shielded)
                    self.dark_pool.submit_intent(intent)
                else:
                    print(f"\n  [{agent.name}] No signal (holding)")

            # Check if batch should execute
            if self.dark_pool.should_execute_batch():
                print(f"\n  [BATCHER] Threshold reached! Executing batch...")
                execution = self.dark_pool.execute_batch()

                if execution:
                    print(f"\n  {'='*50}")
                    print(f"  BATCH EXECUTED - MEV DEFEATED!")
                    print(f"  {'='*50}")
                    print(f"  Batch ID: {execution.batch_id[:16]}...")
                    print(f"  Intents Batched: {execution.intent_count}")
                    print(f"  Net Volume: {execution.total_input:.2f}")
                    print(f"  Output: {execution.total_output:.2f}")
                    print(f"  {'='*50}")
                    print(f"\n  [MEV PROTECTION] Without SwarmShield, {execution.intent_count} ")
                    print(f"  individual trades would have been visible to MEV bots.")
                    print(f"  Estimated sandwich attacks prevented: {execution.intent_count}")

            # Wait before next round
            await asyncio.sleep(Config.SIGNAL_INTERVAL_MS / 1000)

        # Final stats
        self.print_summary()
        self.is_running = False

    def print_summary(self):
        """Print simulation summary"""
        print("\n" + "=" * 70)
        print("   SIMULATION COMPLETE - SWARMSHIELD STATS")
        print("=" * 70)
        print(f"\n  Total Batches Executed: {len(self.dark_pool.executed_batches)}")
        print(f"  Total Volume Protected: ${self.dark_pool.total_volume_protected:,.2f}")
        print(f"  MEV Attacks Prevented: {self.dark_pool.mev_attacks_prevented}")
        print(f"  Pending Intents: {self.dark_pool.get_pending_count()}")

        print("\n  AGENT FINAL STATES:")
        for agent in self.agents:
            print(f"    {agent.name}: SOL={agent.wallet.sol_balance:.2f}, "
                  f"USDC={agent.wallet.usdc_balance:.2f}")

        print("\n  [IMPACT] In a real scenario with $500M+ MEV extraction on Solana,")
        print("  SwarmShield would have protected these agents from sandwich attacks.")
        print("=" * 70 + "\n")


# =============================================================================
# ENTRY POINT
# =============================================================================

async def main():
    """Run the SwarmShield simulation"""
    simulation = SwarmShieldSimulation()
    await simulation.run_simulation(num_rounds=10)


if __name__ == "__main__":
    print("\nStarting SwarmShield Agent Simulation...")
    asyncio.run(main())
