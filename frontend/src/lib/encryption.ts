/**
 * SwarmShield Intent Encryption
 *
 * Encrypts trade intent data (type, amount, min_output) using NaCl box
 * with the keeper's X25519 public key. Only the keeper can decrypt.
 *
 * On-chain, observers see only random-looking encrypted bytes.
 * MEV bots cannot determine trade direction, size, or slippage.
 *
 * Format of encrypted_data (96 bytes):
 * - bytes 0-31:  Ephemeral X25519 public key
 * - bytes 32-55: Nonce (24 bytes)
 * - bytes 56-95: Ciphertext (intent_type:1 + amount:8 + min_output:8 = 17 bytes + 16 MAC = 33 bytes, padded)
 */

import nacl from "tweetnacl";

// Keeper's X25519 public key (derived from keeper's Solana keypair)
// This is a PUBLIC key - safe to embed in frontend code
const KEEPER_X25519_PUBLIC_KEY = Uint8Array.from(
  Buffer.from("HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE=", "base64")
);

/**
 * Encrypt trade intent data for the dark pool
 *
 * @param intentType - 0 = BUY_SOL, 1 = SELL_SOL
 * @param amount - Amount in lamports or smallest token unit
 * @param minOutput - Minimum acceptable output (slippage protection)
 * @returns 96-byte encrypted payload for on-chain storage
 */
export function encryptIntent(
  intentType: number,
  amount: bigint | number,
  minOutput: bigint | number
): Uint8Array {
  // Serialize intent data: type(1) + amount(8) + min_output(8) = 17 bytes
  const message = new Uint8Array(17);
  message[0] = intentType;

  const amountBigInt = BigInt(amount);
  const minOutputBigInt = BigInt(minOutput);

  // Write amount as little-endian u64
  for (let i = 0; i < 8; i++) {
    message[1 + i] = Number((amountBigInt >> BigInt(i * 8)) & BigInt(0xff));
  }

  // Write min_output as little-endian u64
  for (let i = 0; i < 8; i++) {
    message[9 + i] = Number((minOutputBigInt >> BigInt(i * 8)) & BigInt(0xff));
  }

  // Generate ephemeral keypair for this encryption
  const ephemeralKeyPair = nacl.box.keyPair();

  // Generate random nonce
  const nonce = nacl.randomBytes(24);

  // Encrypt with NaCl box: message + nonce + recipient's public key + sender's secret key
  const ciphertext = nacl.box(
    message,
    nonce,
    KEEPER_X25519_PUBLIC_KEY,
    ephemeralKeyPair.secretKey
  );

  if (!ciphertext) {
    throw new Error("Encryption failed");
  }

  // Pack into 96-byte array:
  // ephemeral_pk(32) + nonce(24) + ciphertext(33) + padding(7)
  const encrypted = new Uint8Array(96);
  encrypted.set(ephemeralKeyPair.publicKey, 0); // bytes 0-31
  encrypted.set(nonce, 32); // bytes 32-55
  encrypted.set(ciphertext, 56); // bytes 56-88 (33 bytes)
  // bytes 89-95 remain zero (padding)

  return encrypted;
}

/**
 * Get a display-safe representation of encrypted data
 * Shows first/last bytes to prove it's encrypted without revealing content
 */
export function getEncryptedPreview(data: Uint8Array): string {
  const hex = Buffer.from(data).toString("hex");
  return `${hex.slice(0, 16)}...${hex.slice(-16)}`;
}
