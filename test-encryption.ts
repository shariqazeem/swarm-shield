/**
 * Test script to verify encryption is working
 * Run with: npx tsx test-encryption.ts
 */

import nacl from "tweetnacl";

// Keeper's X25519 public key (same as in frontend/src/lib/encryption.ts)
const KEEPER_X25519_PUBLIC_KEY = Uint8Array.from(
  Buffer.from("HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE=", "base64")
);

// Simulate what the frontend does
function encryptIntent(
  intentType: number,
  amount: bigint,
  minOutput: bigint
): Uint8Array {
  // Serialize: type(1) + amount(8) + min_output(8) = 17 bytes
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
  const ciphertext = nacl.box(
    message,
    nonce,
    KEEPER_X25519_PUBLIC_KEY,
    ephemeralKeyPair.secretKey
  );

  const encrypted = new Uint8Array(96);
  encrypted.set(ephemeralKeyPair.publicKey, 0);
  encrypted.set(nonce, 32);
  encrypted.set(ciphertext!, 56);

  return encrypted;
}

// Simulate what the keeper does (needs real secret key)
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

// Test
console.log("=".repeat(60));
console.log("SwarmShield Encryption Test");
console.log("=".repeat(60));

// Original intent data
const intentType = 1; // SELL
const amount = BigInt(50000000); // 0.05 SOL in lamports
const minOutput = BigInt(9900000); // ~9.9 USDC (6 decimals)

console.log("\n📤 ORIGINAL INTENT (what you submit):");
console.log(`   Type: ${intentType === 0 ? "BUY" : "SELL"}`);
console.log(`   Amount: ${Number(amount) / 1e9} SOL`);
console.log(`   Min Output: ${Number(minOutput) / 1e6} USDC`);

// Encrypt
const encrypted = encryptIntent(intentType, amount, minOutput);
const encryptedHex = Buffer.from(encrypted).toString("hex");

console.log("\n🔐 ENCRYPTED DATA (what goes on-chain):");
console.log(`   Length: ${encrypted.length} bytes`);
console.log(`   First 32 bytes (ephemeral key): ${encryptedHex.slice(0, 64)}`);
console.log(`   Nonce (24 bytes): ${encryptedHex.slice(64, 112)}`);
console.log(`   Ciphertext (33 bytes): ${encryptedHex.slice(112, 178)}`);

console.log("\n👀 WHAT MEV BOTS SEE:");
console.log(`   ${encryptedHex.slice(0, 32)}...${encryptedHex.slice(-32)}`);
console.log("   ⚠️  Cannot determine: BUY or SELL? How much? What slippage?");

// To verify decryption works, we need the keeper's secret key
// This uses the first 32 bytes of the keeper's Solana keypair
console.log("\n🔓 DECRYPTION (only keeper can do this):");
try {
  const fs = require("fs");
  const keypairPath = process.env.HOME + "/.config/solana/devnet.json";
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const keeperSecretKey = new Uint8Array(keypairData.slice(0, 32));

  const decrypted = decryptIntent(encrypted, keeperSecretKey);
  if (decrypted) {
    console.log(`   ✅ Decryption successful!`);
    console.log(`   Type: ${decrypted.intentType === 0 ? "BUY" : "SELL"}`);
    console.log(`   Amount: ${Number(decrypted.amount) / 1e9} SOL`);
    console.log(`   Min Output: ${Number(decrypted.minOutput) / 1e6} USDC`);
    console.log(`\n   ✓ Original matches decrypted: ${
      decrypted.intentType === intentType &&
      decrypted.amount === amount &&
      decrypted.minOutput === minOutput
    }`);
  } else {
    console.log("   ❌ Decryption failed (wrong key or corrupted data)");
  }
} catch (e: any) {
  console.log(`   ⚠️  Could not load keeper keypair: ${e.message}`);
  console.log("   (This is expected if you're not the keeper)");
}

console.log("\n" + "=".repeat(60));
console.log("PRIVACY PROOF:");
console.log("=".repeat(60));
console.log(`
1. On-chain observers see: ${encryptedHex.slice(0, 20)}...
2. They CANNOT determine:
   - Trade direction (buy or sell)
   - Trade amount
   - Slippage tolerance
3. Only the keeper with the secret key can decrypt
4. MEV bots are completely blind to your trade intent
`);
