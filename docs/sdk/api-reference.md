# API Reference

Complete API documentation for the SwarmShield Agent SDK.

## Core Functions

### `encryptIntent`

Encrypts a trade intent using NaCl Box encryption.

```typescript
function encryptIntent(
  direction: number,
  amount: bigint,
  minOutput: bigint,
  keeperPublicKey?: Uint8Array
): Uint8Array
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `direction` | `number` | 0 = BUY, 1 = SELL |
| `amount` | `bigint` | Amount in lamports (1 SOL = 1e9 lamports) |
| `minOutput` | `bigint` | Minimum output amount (slippage protection) |
| `keeperPublicKey` | `Uint8Array?` | Optional custom keeper key |

**Returns:** `Uint8Array` - 96-byte encrypted payload

**Example:**

```typescript
const encrypted = encryptIntent(
  1,                    // SELL
  BigInt(100000000),    // 0.1 SOL
  BigInt(19000000)      // Min 19 USDC
);
```

### `serializeIntent`

Serializes intent to 17-byte message format.

```typescript
function serializeIntent(
  direction: number,
  amount: bigint,
  minOutput: bigint
): Uint8Array
```

**Returns:** `Uint8Array` - 17-byte serialized intent

**Byte Layout:**

| Offset | Size | Field |
|--------|------|-------|
| 0 | 1 | direction (u8) |
| 1-8 | 8 | amount (u64 LE) |
| 9-16 | 8 | minOutput (u64 LE) |

---

## SwarmShieldAgent Class

### Constructor

```typescript
class SwarmShieldAgent {
  constructor(
    rpcUrl: string,
    keypair: Keypair,
    options?: SwarmShieldOptions
  )
}
```

**Options:**

```typescript
interface SwarmShieldOptions {
  programId?: string;
  keeperPublicKey?: string;
  defaultSlippageBps?: number;
  commitment?: Commitment;
}
```

### Methods

#### `register`

Registers the agent with the SwarmShield protocol.

```typescript
async register(): Promise<TransactionSignature>
```

**Example:**

```typescript
const agent = new SwarmShieldAgent(RPC_URL, keypair);
const sig = await agent.register();
console.log("Registered:", sig);
```

#### `deposit`

Deposits SOL into the shielded vault.

```typescript
async deposit(amountSol: number): Promise<TransactionSignature>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `amountSol` | `number` | Amount of SOL to deposit |

**Example:**

```typescript
const sig = await agent.deposit(0.1); // Deposit 0.1 SOL
```

#### `submitIntent`

Submits an encrypted trade intent.

```typescript
async submitIntent(
  direction: "buy" | "sell",
  amount: bigint,
  slippageBps?: number
): Promise<IntentResult>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `direction` | `"buy" \| "sell"` | Trade direction |
| `amount` | `bigint` | Amount in lamports |
| `slippageBps` | `number?` | Slippage in basis points (default: 100) |

**Returns:**

```typescript
interface IntentResult {
  signature: TransactionSignature;
  encrypted: string;        // Hex-encoded encrypted data
  intentId: string;         // Intent identifier
}
```

**Example:**

```typescript
const result = await agent.submitIntent(
  "sell",
  BigInt(50000000),  // 0.05 SOL
  100                 // 1% slippage
);
console.log("Intent:", result.intentId);
```

#### `withdraw`

Withdraws tokens from the shielded vault.

```typescript
async withdraw(
  token: "sol" | "usdc",
  amount: bigint
): Promise<TransactionSignature>
```

**Example:**

```typescript
const sig = await agent.withdraw("usdc", BigInt(10000000)); // 10 USDC
```

#### `getBalances`

Gets current shielded balances.

```typescript
async getBalances(): Promise<Balances>
```

**Returns:**

```typescript
interface Balances {
  sol: bigint;    // SOL in lamports
  usdc: bigint;   // USDC in base units
}
```

---

## Constants

### Program Addresses

```typescript
const PROGRAM_ID = "5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew";
const USDC_MINT = "8ypRqPnaiegfw9if3R2JZpqLsfr4YHjfPtxUz8YgdkuJ";
```

### Keeper Public Key

```typescript
const KEEPER_PUBLIC_KEY = Uint8Array.from(
  Buffer.from("HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE=", "base64")
);
```

---

## Utility Functions

### `calculateMinOutput`

Calculates minimum output with slippage.

```typescript
function calculateMinOutput(
  amount: bigint,
  slippageBps: number
): bigint
```

**Example:**

```typescript
const minOutput = calculateMinOutput(
  BigInt(100000000),  // 0.1 SOL
  100                  // 1% slippage
);
// Returns: 99000000n (0.099 SOL equivalent)
```

### `lamportsToSol`

Converts lamports to SOL.

```typescript
function lamportsToSol(lamports: bigint): number
```

### `solToLamports`

Converts SOL to lamports.

```typescript
function solToLamports(sol: number): bigint
```

---

## Error Handling

### Error Types

```typescript
enum SwarmShieldError {
  INSUFFICIENT_BALANCE = "InsufficientBalance",
  NOT_REGISTERED = "NotRegistered",
  ENCRYPTION_FAILED = "EncryptionFailed",
  TRANSACTION_FAILED = "TransactionFailed",
}
```

### Example Error Handling

```typescript
try {
  await agent.submitIntent("sell", BigInt(1000000000));
} catch (error) {
  if (error.message.includes("InsufficientBalance")) {
    console.error("Not enough funds in vault");
  } else if (error.message.includes("NotRegistered")) {
    console.error("Agent not registered");
  } else {
    throw error;
  }
}
```

---

## TypeScript Types

### Full Type Definitions

```typescript
// Intent direction
type IntentDirection = 0 | 1; // 0 = BUY, 1 = SELL

// Encrypted payload structure
interface EncryptedPayload {
  ephemeralPublicKey: Uint8Array; // 32 bytes
  nonce: Uint8Array;              // 24 bytes
  ciphertext: Uint8Array;         // 40 bytes
}

// Agent configuration
interface AgentConfig {
  rpcUrl: string;
  keypair: Keypair;
  programId: PublicKey;
  keeperPublicKey: Uint8Array;
}

// Transaction result
interface TransactionResult {
  signature: string;
  slot: number;
  confirmationStatus: string;
}
```

---

## Complete Example

```typescript
import { Keypair, Connection } from "@solana/web3.js";

// Initialize
const connection = new Connection("https://api.devnet.solana.com");
const keypair = Keypair.generate();

const agent = new SwarmShieldAgent(
  "https://api.devnet.solana.com",
  keypair,
  { defaultSlippageBps: 100 }
);

// Full workflow
async function tradingWorkflow() {
  // 1. Register
  await agent.register();
  console.log("✅ Registered");

  // 2. Deposit
  await agent.deposit(0.1);
  console.log("✅ Deposited 0.1 SOL");

  // 3. Check balance
  const balances = await agent.getBalances();
  console.log("Balances:", balances);

  // 4. Submit intent
  const result = await agent.submitIntent("sell", BigInt(50000000));
  console.log("✅ Intent submitted:", result.intentId);

  // 5. Wait for execution (batching)
  // ... keeper batches and executes

  // 6. Withdraw
  const newBalances = await agent.getBalances();
  if (newBalances.usdc > 0n) {
    await agent.withdraw("usdc", newBalances.usdc);
    console.log("✅ Withdrawn USDC");
  }
}

tradingWorkflow().catch(console.error);
```

## Next Steps

- [Frameworks](/sdk/frameworks) - Integrate with AI frameworks
- [Quick Start](/sdk/quickstart) - Simple examples
- [Architecture](/architecture/overview) - How it works
