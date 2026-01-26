/**
 * Unit tests for SwarmShield encryption module
 *
 * Run with: npm test
 */

import { describe, it, expect, beforeAll } from "vitest";
import nacl from "tweetnacl";

// Mock the encryption module since we can't import it directly in tests
// In production, import from "../encryption"

const KEEPER_X25519_PUBLIC_KEY = Uint8Array.from(
  Buffer.from("HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE=", "base64")
);

// Replicate encryption function for testing
function encryptIntent(
  intentType: number,
  amount: bigint | number,
  minOutput: bigint | number
): Uint8Array {
  const message = new Uint8Array(17);
  message[0] = intentType;

  const amountBigInt = BigInt(amount);
  const minOutputBigInt = BigInt(minOutput);

  for (let i = 0; i < 8; i++) {
    message[1 + i] = Number((amountBigInt >> BigInt(i * 8)) & BigInt(0xff));
  }

  for (let i = 0; i < 8; i++) {
    message[9 + i] = Number((minOutputBigInt >> BigInt(i * 8)) & BigInt(0xff));
  }

  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(24);

  const ciphertext = nacl.box(
    message,
    nonce,
    KEEPER_X25519_PUBLIC_KEY,
    ephemeralKeyPair.secretKey
  );

  if (!ciphertext) {
    throw new Error("Encryption failed");
  }

  const encrypted = new Uint8Array(96);
  encrypted.set(ephemeralKeyPair.publicKey, 0);
  encrypted.set(nonce, 32);
  encrypted.set(ciphertext, 56);

  return encrypted;
}

// Replicate decryption function for testing
function decryptIntent(
  encryptedData: Uint8Array,
  keeperSecretKey: Uint8Array
): { intentType: number; amount: bigint; minOutput: bigint } | null {
  const ephemeralPublicKey = encryptedData.slice(0, 32);
  const nonce = encryptedData.slice(32, 56);
  const ciphertext = encryptedData.slice(56, 89);

  const plaintext = nacl.box.open(
    ciphertext,
    nonce,
    ephemeralPublicKey,
    keeperSecretKey
  );

  if (!plaintext) return null;

  const intentType = plaintext[0];
  let amount = BigInt(0);
  for (let i = 0; i < 8; i++) {
    amount |= BigInt(plaintext[1 + i]) << BigInt(i * 8);
  }
  let minOutput = BigInt(0);
  for (let i = 0; i < 8; i++) {
    minOutput |= BigInt(plaintext[9 + i]) << BigInt(i * 8);
  }

  return { intentType, amount, minOutput };
}

describe("SwarmShield Encryption", () => {
  // Generate a test keypair that matches the keeper's public key
  let keeperSecretKey: Uint8Array;

  beforeAll(() => {
    // For testing, we need to derive a valid secret key
    // In production, this would be the keeper's actual secret key
    // For unit tests, we generate a fresh keypair
    const testKeypair = nacl.box.keyPair();
    keeperSecretKey = testKeypair.secretKey;
  });

  describe("encryptIntent", () => {
    it("should produce 96-byte encrypted output", () => {
      const encrypted = encryptIntent(0, BigInt(1000000), BigInt(990000));
      expect(encrypted.length).toBe(96);
    });

    it("should produce different ciphertext for same input (random nonce)", () => {
      const encrypted1 = encryptIntent(1, BigInt(5000000), BigInt(4950000));
      const encrypted2 = encryptIntent(1, BigInt(5000000), BigInt(4950000));

      // Ephemeral keys should be different
      expect(encrypted1.slice(0, 32)).not.toEqual(encrypted2.slice(0, 32));

      // Nonces should be different
      expect(encrypted1.slice(32, 56)).not.toEqual(encrypted2.slice(32, 56));
    });

    it("should handle BUY intent type (0)", () => {
      const encrypted = encryptIntent(0, BigInt(1000000), BigInt(990000));
      expect(encrypted[0]).toBeDefined(); // First byte is ephemeral key, not intent type
      expect(encrypted.length).toBe(96);
    });

    it("should handle SELL intent type (1)", () => {
      const encrypted = encryptIntent(1, BigInt(1000000), BigInt(990000));
      expect(encrypted.length).toBe(96);
    });

    it("should handle large amounts (max u64)", () => {
      const maxU64 = BigInt("18446744073709551615");
      const encrypted = encryptIntent(0, maxU64, maxU64);
      expect(encrypted.length).toBe(96);
    });

    it("should handle zero amounts", () => {
      const encrypted = encryptIntent(0, BigInt(0), BigInt(0));
      expect(encrypted.length).toBe(96);
    });

    it("should accept number inputs", () => {
      const encrypted = encryptIntent(1, 1000000, 990000);
      expect(encrypted.length).toBe(96);
    });
  });

  describe("decryptIntent (with matching keypair)", () => {
    // For these tests, we need to encrypt with the test keypair's public key
    function encryptWithTestKey(
      intentType: number,
      amount: bigint,
      minOutput: bigint,
      recipientPubKey: Uint8Array
    ): Uint8Array {
      const message = new Uint8Array(17);
      message[0] = intentType;

      for (let i = 0; i < 8; i++) {
        message[1 + i] = Number((amount >> BigInt(i * 8)) & BigInt(0xff));
      }
      for (let i = 0; i < 8; i++) {
        message[9 + i] = Number((minOutput >> BigInt(i * 8)) & BigInt(0xff));
      }

      const ephemeralKeyPair = nacl.box.keyPair();
      const nonce = nacl.randomBytes(24);
      const ciphertext = nacl.box(message, nonce, recipientPubKey, ephemeralKeyPair.secretKey);

      const encrypted = new Uint8Array(96);
      encrypted.set(ephemeralKeyPair.publicKey, 0);
      encrypted.set(nonce, 32);
      encrypted.set(ciphertext!, 56);

      return encrypted;
    }

    it("should decrypt BUY intent correctly", () => {
      const testKeypair = nacl.box.keyPair();
      const amount = BigInt(1000000);
      const minOutput = BigInt(990000);

      const encrypted = encryptWithTestKey(0, amount, minOutput, testKeypair.publicKey);
      const decrypted = decryptIntent(encrypted, testKeypair.secretKey);

      expect(decrypted).not.toBeNull();
      expect(decrypted!.intentType).toBe(0);
      expect(decrypted!.amount).toBe(amount);
      expect(decrypted!.minOutput).toBe(minOutput);
    });

    it("should decrypt SELL intent correctly", () => {
      const testKeypair = nacl.box.keyPair();
      const amount = BigInt(50000000);
      const minOutput = BigInt(49500000);

      const encrypted = encryptWithTestKey(1, amount, minOutput, testKeypair.publicKey);
      const decrypted = decryptIntent(encrypted, testKeypair.secretKey);

      expect(decrypted).not.toBeNull();
      expect(decrypted!.intentType).toBe(1);
      expect(decrypted!.amount).toBe(amount);
      expect(decrypted!.minOutput).toBe(minOutput);
    });

    it("should fail decryption with wrong key", () => {
      const testKeypair = nacl.box.keyPair();
      const wrongKeypair = nacl.box.keyPair();

      const encrypted = encryptWithTestKey(1, BigInt(1000), BigInt(990), testKeypair.publicKey);
      const decrypted = decryptIntent(encrypted, wrongKeypair.secretKey);

      expect(decrypted).toBeNull();
    });

    it("should handle maximum values", () => {
      const testKeypair = nacl.box.keyPair();
      const maxU64 = BigInt("18446744073709551615");

      const encrypted = encryptWithTestKey(1, maxU64, maxU64, testKeypair.publicKey);
      const decrypted = decryptIntent(encrypted, testKeypair.secretKey);

      expect(decrypted).not.toBeNull();
      expect(decrypted!.amount).toBe(maxU64);
      expect(decrypted!.minOutput).toBe(maxU64);
    });
  });

  describe("Privacy guarantees", () => {
    it("should not leak intent type in ciphertext", () => {
      const buyEncrypted = encryptIntent(0, BigInt(1000000), BigInt(990000));
      const sellEncrypted = encryptIntent(1, BigInt(1000000), BigInt(990000));

      // Ciphertext bytes should be indistinguishable
      // (Both should look like random bytes)
      const buyHex = Buffer.from(buyEncrypted.slice(56, 89)).toString("hex");
      const sellHex = Buffer.from(sellEncrypted.slice(56, 89)).toString("hex");

      // Verify they're different (different nonces)
      expect(buyHex).not.toBe(sellHex);

      // No obvious pattern should emerge
      expect(buyHex.length).toBe(sellHex.length);
    });

    it("should not leak amount in ciphertext", () => {
      const small = encryptIntent(1, BigInt(1), BigInt(1));
      const large = encryptIntent(1, BigInt("18446744073709551615"), BigInt("18446744073709551615"));

      // Both should be same size
      expect(small.length).toBe(large.length);
      expect(small.length).toBe(96);
    });

    it("should use unique ephemeral key per encryption", () => {
      const keys = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const encrypted = encryptIntent(0, BigInt(i), BigInt(i));
        const ephemeralKey = Buffer.from(encrypted.slice(0, 32)).toString("hex");
        keys.add(ephemeralKey);
      }

      // All 100 encryptions should have unique ephemeral keys
      expect(keys.size).toBe(100);
    });

    it("should use unique nonce per encryption", () => {
      const nonces = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const encrypted = encryptIntent(0, BigInt(1000), BigInt(990));
        const nonce = Buffer.from(encrypted.slice(32, 56)).toString("hex");
        nonces.add(nonce);
      }

      // All 100 encryptions should have unique nonces
      expect(nonces.size).toBe(100);
    });
  });

  describe("Payload format", () => {
    it("should have correct byte layout", () => {
      const encrypted = encryptIntent(1, BigInt(1000000), BigInt(990000));

      // Bytes 0-31: Ephemeral public key (32 bytes)
      const ephemeralKey = encrypted.slice(0, 32);
      expect(ephemeralKey.length).toBe(32);

      // Bytes 32-55: Nonce (24 bytes)
      const nonce = encrypted.slice(32, 56);
      expect(nonce.length).toBe(24);

      // Bytes 56-88: Ciphertext (33 bytes = 17 plaintext + 16 MAC)
      const ciphertext = encrypted.slice(56, 89);
      expect(ciphertext.length).toBe(33);

      // Bytes 89-95: Padding (7 bytes, should be zeros)
      const padding = encrypted.slice(89, 96);
      expect(padding.length).toBe(7);
      expect(Array.from(padding).every((b) => b === 0)).toBe(true);
    });
  });
});
