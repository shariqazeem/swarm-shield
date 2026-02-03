# Encryption

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

### Plaintext Structure (Before Encryption)

```typescript
// 17 bytes of plaintext
const intent = {
  direction: u8,     // 1 byte: 0 = BUY, 1 = SELL
  amount: u64,       // 8 bytes: Amount in lamports
  minOutput: u64,    // 8 bytes: Minimum output (slippage)
};
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
  // ... serialize amount and minOutput as little-endian u64

  // 2. Generate ephemeral keypair
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

  // Deserialize
  return {
    direction: message[0],
    amount: deserializeU64(message.slice(1, 9)),
    minOutput: deserializeU64(message.slice(9, 17)),
  };
}
```

## Security Properties

### What's Protected

| Property | Protected? | Why |
|----------|------------|-----|
| Direction (buy/sell) | ✅ Yes | Encrypted in ciphertext |
| Amount | ✅ Yes | Encrypted in ciphertext |
| Slippage/minOutput | ✅ Yes | Encrypted in ciphertext |
| Sender identity | ❌ No | Visible on-chain (wallet address) |
| Timing | ❌ No | Block timestamp is public |

### Attack Resistance

| Attack | Mitigated? | How |
|--------|------------|-----|
| Passive eavesdropping | ✅ | X25519 encryption |
| Message tampering | ✅ | Poly1305 MAC |
| Replay attacks | ✅ | Unique nonce per intent |
| Key extraction | ✅ | Ephemeral keys per intent |

## Why Not ZK Proofs?

You might ask: "Why encryption instead of zero-knowledge proofs?"

| Approach | Pros | Cons |
|----------|------|------|
| **NaCl Box** | Fast, simple, proven | Requires trusted keeper |
| **ZK Proofs** | Trustless | Complex, slower, expensive |

For a hackathon MVP, NaCl Box provides **real privacy** with **simple implementation**. ZK is the future roadmap.

## Code References

- Encryption: `frontend/src/lib/encryption.ts`
- Tests: `frontend/src/lib/__tests__/encryption.test.ts`
- Keeper decryption: `keeper/decrypt.ts`
