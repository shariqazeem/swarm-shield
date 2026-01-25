/**
 * SwarmShield Keeper Decryption
 *
 * Decrypts shielded intent data using the keeper's X25519 secret key.
 * Only the keeper can decrypt intents submitted by agents.
 *
 * Encrypted payload format (96 bytes):
 * - bytes 0-31:  Ephemeral X25519 public key (sender)
 * - bytes 32-55: Nonce (24 bytes)
 * - bytes 56-88: Ciphertext (17 bytes plaintext + 16 bytes MAC = 33 bytes)
 * - bytes 89-95: Zero padding
 *
 * Decrypted plaintext (17 bytes):
 * - byte 0:    intent_type (0 = BUY_SOL, 1 = SELL_SOL)
 * - bytes 1-8: amount (u64 little-endian, lamports or USDC units)
 * - bytes 9-16: min_output (u64 little-endian)
 */

import nacl from "tweetnacl";

export interface DecryptedIntent {
  intentType: number; // 0 = BUY, 1 = SELL
  amount: bigint;
  minOutput: bigint;
}

/**
 * Derive the keeper's X25519 secret key from the Solana keypair.
 * The first 32 bytes of a Solana keypair are used as the X25519 scalar.
 */
export function getKeeperX25519SecretKey(solanaKeypairBytes: Uint8Array): Uint8Array {
  return solanaKeypairBytes.slice(0, 32);
}

/**
 * Decrypt a shielded intent payload.
 *
 * @param encryptedData - 96-byte encrypted payload from on-chain ShieldedIntent account
 * @param keeperSecretKey - 32-byte X25519 secret key (first 32 bytes of Solana keypair)
 * @returns Decrypted intent data or null if decryption fails
 */
export function decryptIntent(
  encryptedData: Uint8Array,
  keeperSecretKey: Uint8Array
): DecryptedIntent | null {
  if (encryptedData.length !== 96) {
    console.error(`Invalid encrypted data length: ${encryptedData.length}, expected 96`);
    return null;
  }

  // Extract components from the 96-byte payload
  const ephemeralPublicKey = encryptedData.slice(0, 32);
  const nonce = encryptedData.slice(32, 56);
  const ciphertext = encryptedData.slice(56, 89); // 33 bytes (17 + 16 MAC)

  // Decrypt using NaCl box.open
  const plaintext = nacl.box.open(
    ciphertext,
    nonce,
    ephemeralPublicKey,
    keeperSecretKey
  );

  if (!plaintext) {
    console.error("Decryption failed - invalid ciphertext or wrong key");
    return null;
  }

  if (plaintext.length < 17) {
    console.error(`Decrypted plaintext too short: ${plaintext.length}, expected 17`);
    return null;
  }

  // Parse the 17-byte plaintext
  const intentType = plaintext[0];

  // Read amount as little-endian u64
  let amount = BigInt(0);
  for (let i = 0; i < 8; i++) {
    amount |= BigInt(plaintext[1 + i]) << BigInt(i * 8);
  }

  // Read min_output as little-endian u64
  let minOutput = BigInt(0);
  for (let i = 0; i < 8; i++) {
    minOutput |= BigInt(plaintext[9 + i]) << BigInt(i * 8);
  }

  return { intentType, amount, minOutput };
}
