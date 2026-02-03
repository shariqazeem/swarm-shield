# Encryption Architecture

SwarmShield uses **NaCl Box** encryption - the same cryptographic construction used by Signal messenger.

## The Algorithm

```
NaCl Box = X25519 + XSalsa20 + Poly1305
```

| Component | Purpose |
|-----------|---------|
| **X25519** | Elliptic curve Diffie-Hellman key exchange |
| **XSalsa20** | Stream cipher for encryption |
| **Poly1305** | Message authentication code |

## Why NaCl Box?

| Property | Benefit |
|----------|---------|
| **Battle-tested** | Used by Signal, WhatsApp, Keybase |
| **Fast** | Native speed on modern CPUs |
| **Simple API** | Hard to misuse |
| **Small output** | Only 16 bytes overhead |

## Payload Structure

Every encrypted intent is exactly **96 bytes**:

```
┌────────────────────────────────────────────────────────────┐
│                    96-BYTE PAYLOAD                         │
├────────────────────────────────────────────────────────────┤
│ Offset 0-31:   Ephemeral Public Key (32 bytes)            │
│ Offset 32-55:  Nonce (24 bytes)                           │
│ Offset 56-95:  Ciphertext + MAC (40 bytes)                │
└────────────────────────────────────────────────────────────┘
```

### Breakdown

| Field | Size | Purpose |
|-------|------|---------|
| Ephemeral Public Key | 32 bytes | One-time key for this intent |
| Nonce | 24 bytes | Random, prevents replay attacks |
| Ciphertext | 24 bytes | Encrypted intent data |
| MAC | 16 bytes | Poly1305 authentication tag |

## Plaintext Structure

Before encryption, the intent is 17 bytes:

```typescript
// 17 bytes of plaintext
struct Intent {
  direction: u8,     // 1 byte: 0 = BUY, 1 = SELL
  amount: u64,       // 8 bytes: Amount in lamports (LE)
  minOutput: u64,    // 8 bytes: Minimum output (LE)
}
```

### Byte Layout

```
┌────┬────────────────────────┬────────────────────────┐
│ 0  │  1-8                   │  9-16                  │
├────┼────────────────────────┼────────────────────────┤
│ Dir│  Amount (u64 LE)       │  MinOutput (u64 LE)    │
└────┴────────────────────────┴────────────────────────┘
```

## Encryption Flow

```typescript
import nacl from 'tweetnacl';

function encryptIntent(
  direction: number,
  amount: bigint,
  minOutput: bigint,
  keeperPublicKey: Uint8Array
): Uint8Array {
  // 1. Serialize the intent (17 bytes)
  const message = new Uint8Array(17);
  message[0] = direction;

  // Little-endian u64 serialization
  for (let i = 0; i < 8; i++) {
    message[1 + i] = Number((amount >> BigInt(i * 8)) & BigInt(0xff));
    message[9 + i] = Number((minOutput >> BigInt(i * 8)) & BigInt(0xff));
  }

  // 2. Generate ephemeral keypair (new for each intent!)
  const ephemeral = nacl.box.keyPair();

  // 3. Generate random nonce (24 bytes)
  const nonce = nacl.randomBytes(24);

  // 4. Encrypt using NaCl box
  const ciphertext = nacl.box(
    message,
    nonce,
    keeperPublicKey,
    ephemeral.secretKey
  );

  // 5. Combine into 96-byte payload
  const payload = new Uint8Array(96);
  payload.set(ephemeral.publicKey, 0);  // 32 bytes
  payload.set(nonce, 32);               // 24 bytes
  payload.set(ciphertext, 56);          // 40 bytes

  return payload;
}
```

## Decryption (Keeper Only)

Only the keeper can decrypt, using its private key:

```typescript
function decryptIntent(
  payload: Uint8Array,
  keeperSecretKey: Uint8Array
): Intent {
  // Extract components
  const ephemeralPublicKey = payload.slice(0, 32);
  const nonce = payload.slice(32, 56);
  const ciphertext = payload.slice(56, 96);

  // Decrypt
  const message = nacl.box.open(
    ciphertext,
    nonce,
    ephemeralPublicKey,
    keeperSecretKey
  );

  if (!message) {
    throw new Error("Decryption failed");
  }

  // Deserialize
  return {
    direction: message[0],
    amount: deserializeU64(message.slice(1, 9)),
    minOutput: deserializeU64(message.slice(9, 17)),
  };
}

function deserializeU64(bytes: Uint8Array): bigint {
  let value = BigInt(0);
  for (let i = 0; i < 8; i++) {
    value |= BigInt(bytes[i]) << BigInt(i * 8);
  }
  return value;
}
```

## Security Properties

### What's Protected

| Property | Protected? | Why |
|----------|------------|-----|
| Direction (buy/sell) | ✅ Yes | Encrypted in ciphertext |
| Amount | ✅ Yes | Encrypted in ciphertext |
| Slippage/minOutput | ✅ Yes | Encrypted in ciphertext |
| Sender identity | ❌ No | Wallet address visible on-chain |
| Timing | ❌ No | Block timestamp is public |

### Attack Resistance

| Attack | Mitigated? | How |
|--------|------------|-----|
| Passive eavesdropping | ✅ | X25519 encryption |
| Message tampering | ✅ | Poly1305 MAC verification |
| Replay attacks | ✅ | Unique nonce per intent |
| Key extraction | ✅ | Ephemeral keys per intent |
| Brute force | ✅ | 2^128 security level |

## Key Management

### Keeper Keys

```typescript
// Keeper's keypair (generated once, stored securely)
const keeperKeyPair = nacl.box.keyPair();

// Public key is shared (encoded in base64)
const keeperPublicKey = Buffer.from(keeperKeyPair.publicKey).toString("base64");
// "HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE="

// Private key is kept secret by keeper
const keeperSecretKey = keeperKeyPair.secretKey;
```

### Ephemeral Keys

Each intent uses a **fresh ephemeral keypair**:

```typescript
// Generated fresh for EACH intent
const ephemeral = nacl.box.keyPair();

// Used once, then discarded
// Forward secrecy: compromising one doesn't reveal others
```

## Why Ephemeral Keys?

| Property | Benefit |
|----------|---------|
| **Forward secrecy** | Past intents safe if key leaks |
| **Unlinkability** | Can't link intents to same user |
| **No key management** | User doesn't manage encryption keys |

## Visual: Encryption Process

```
User Intent                     Keeper
────────────                    ──────

SELL 0.1 SOL                   (has secret key)
1% slippage
     │
     ▼
┌──────────────┐
│ Serialize    │
│ 17 bytes     │
└──────┬───────┘
       │
       ▼
┌──────────────┐    ┌─────────────┐
│ Generate     │    │   Keeper    │
│ Ephemeral    │───▶│ Public Key  │
│ Keypair      │    └─────────────┘
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ NaCl Box     │
│ Encrypt      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 96 bytes     │────────────────────▶ On-Chain
│ Ciphertext   │                     (visible to all)
└──────────────┘
```

## What MEV Bots See

```
On-Chain Data:
9bed43a48f60f39e2a857226c8f2a78d5e1f3b4a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b

Analysis:
├── Bytes 0-31:   Unknown public key (could be anyone)
├── Bytes 32-55:  Random nonce (no pattern)
└── Bytes 56-95:  Encrypted noise (indistinguishable from random)

Can determine:
✅ An intent was submitted
✅ Sender's wallet address
✅ Submission time

Cannot determine:
❌ Buy or sell
❌ Amount
❌ Slippage tolerance
❌ Expected price
```

## Why Not ZK Proofs?

| Approach | Pros | Cons |
|----------|------|------|
| **NaCl Box** | Fast, simple, proven | Requires trusted keeper |
| **ZK Proofs** | Fully trustless | Complex, slower, expensive |

For a production-ready MVP, NaCl Box provides **real privacy** with **simple implementation**. ZK proofs are on the roadmap for full trustlessness.

## Code References

- Encryption: `frontend/src/lib/encryption.ts`
- Tests: `frontend/src/lib/__tests__/encryption.test.ts`
- Keeper decryption: `keeper/decrypt.ts`

## Next Steps

- [Smart Contract](/architecture/smart-contract) - On-chain program
- [Keeper Service](/architecture/keeper) - Decryption and execution
- [MEV Protection](/architecture/mev-protection) - How it defeats MEV
