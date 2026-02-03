# Why SwarmShield?

SwarmShield addresses the critical problem of MEV (Maximal Extractable Value) extraction on Solana, which costs traders millions daily.

## The MEV Problem

### What is MEV?

MEV refers to the profit that can be extracted by manipulating the order of transactions in a block. On Solana, sophisticated bots monitor the mempool and exploit visible trade information.

```
Traditional Trade Flow:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  You submit  │ →  │  Mempool     │ →  │  MEV Bot     │
│  BUY 10 SOL  │    │  (visible)   │    │  sees trade  │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │  Sandwich!   │
                                        │  You lose 3% │
                                        └──────────────┘
```

### Common MEV Attacks

| Attack Type | Description | Your Loss |
|-------------|-------------|-----------|
| **Sandwich** | Bot buys before you, sells after | 1-5% |
| **Front-run** | Bot copies your trade, executes first | Variable |
| **Back-run** | Bot captures arbitrage you created | Opportunity cost |

### Real-World Impact

- **$1.4B+** extracted from Ethereum users (2020-2023)
- **$100M+** estimated Solana MEV extraction annually
- **AI Agents** are particularly vulnerable due to predictable patterns

## The SwarmShield Solution

### Encryption First

Unlike other "dark pools" that simply delay transactions, SwarmShield **encrypts** your trade intent before it touches the chain.

```
SwarmShield Flow:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  You submit  │ →  │  On-chain    │ →  │  MEV Bot     │
│  BUY 10 SOL  │    │  9bed43a4... │    │  sees noise  │
└──────────────┘    └──────────────┘    └──────────────┘
       │                                        │
       │            ✅ NaCl Box Encryption      │
       │                                        │
       ▼                                        ▼
┌──────────────┐                        ┌──────────────┐
│  Full trade  │                        │  Cannot      │
│  executed    │                        │  attack!     │
└──────────────┘                        └──────────────┘
```

### Batch Execution

Multiple encrypted intents are batched into a single Jupiter swap:

```
Alice: SELL 0.05 SOL ─┐
Bob:   SELL 0.10 SOL ─┼─→ ONE Jupiter Swap (0.20 SOL) → Distributed
Carol: SELL 0.05 SOL ─┘
```

**Benefits:**
- Individual trades invisible
- Lower gas costs (shared)
- Better execution (larger liquidity)

### Zero Knowledge of Direction

MEV bots cannot determine:
- ❌ Buy or sell
- ❌ Trade amount
- ❌ Slippage tolerance
- ❌ Target price

## Comparison

| Feature | Traditional DEX | Other Dark Pools | SwarmShield |
|---------|-----------------|------------------|-------------|
| Trade visible | ✅ Yes | ⚠️ Delayed | ❌ Never |
| Intent encrypted | ❌ No | ❌ No | ✅ Yes |
| Batch execution | ❌ No | ⚠️ Some | ✅ Yes |
| MEV protection | ❌ None | ⚠️ Partial | ✅ Full |

## Who Benefits?

### AI Trading Agents
Autonomous agents with predictable patterns are prime MEV targets. SwarmShield lets them trade privately.

### Whale Traders
Large orders move markets. Hide your size in the swarm.

### Retail Users
Small traders lose disproportionately to MEV. Level the playing field.

### DeFi Protocols
Integrate SwarmShield for MEV-protected swaps in your protocol.

## Next Steps

- [Quick Start](/guide/quick-start) - Try SwarmShield in 5 minutes
- [Architecture Overview](/architecture/overview) - Technical deep dive
- [Agent SDK](/sdk/quickstart) - Integrate into your bot
