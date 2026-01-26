/**
 * SwarmShield Agent SDK Example
 *
 * This example shows how AI agents can programmatically interact with
 * the SwarmShield dark pool for MEV-protected trading.
 *
 * Run with: npx tsx sdk/agent-example.ts
 */

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import nacl from "tweetnacl";
import { sha256 } from "js-sha256";
import fs from "fs";

// =============================================================================
// CONFIGURATION
// =============================================================================

const RPC_URL = process.env.HELIUS_RPC_URL || "https://devnet.helius-rpc.com/?api-key=YOUR_KEY";
const PROGRAM_ID = new PublicKey("5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew");

// Keeper's X25519 public key for encrypting intents
const KEEPER_PUBLIC_KEY = Uint8Array.from(
  Buffer.from("HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE=", "base64")
);

// =============================================================================
// ENCRYPTION MODULE
// =============================================================================

/**
 * Encrypt trade intent using NaCl box encryption
 * Only the keeper can decrypt this data
 */
function encryptIntent(
  intentType: number, // 0 = BUY, 1 = SELL
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

  // Generate ephemeral keypair
  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(24);

  // Encrypt with NaCl box
  const ciphertext = nacl.box(
    message,
    nonce,
    KEEPER_PUBLIC_KEY,
    ephemeralKeyPair.secretKey
  );

  if (!ciphertext) throw new Error("Encryption failed");

  // Pack into 96-byte payload
  const encrypted = new Uint8Array(96);
  encrypted.set(ephemeralKeyPair.publicKey, 0);  // 32 bytes
  encrypted.set(nonce, 32);                       // 24 bytes
  encrypted.set(ciphertext, 56);                  // 33 bytes

  return encrypted;
}

// =============================================================================
// PDA HELPERS
// =============================================================================

function getDiscriminator(name: string): Buffer {
  const hash = sha256.array("global:" + name);
  return Buffer.from(hash.slice(0, 8));
}

function findAgentPDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), authority.toBuffer()],
    PROGRAM_ID
  );
}

function findShieldedIntentPDA(authority: PublicKey, nonce: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("shielded_intent"), authority.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
}

// =============================================================================
// SWARMSHIELD AGENT CLASS
// =============================================================================

class SwarmShieldAgent {
  private connection: Connection;
  private keypair: Keypair;

  constructor(rpcUrl: string, keypair: Keypair) {
    this.connection = new Connection(rpcUrl, "confirmed");
    this.keypair = keypair;
  }

  get publicKey() {
    return this.keypair.publicKey;
  }

  async getBalance(): Promise<number> {
    const balance = await this.connection.getBalance(this.keypair.publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  async getAgentNonce(): Promise<BN> {
    try {
      const [agentPDA] = findAgentPDA(this.keypair.publicKey);
      const account = await this.connection.getAccountInfo(agentPDA);
      if (!account) return new BN(0);
      // Nonce is at offset 80 (after discriminator + authority + id_hash + balances)
      const data = account.data.slice(8);
      return new BN(data.slice(80, 88), "le");
    } catch {
      return new BN(0);
    }
  }

  /**
   * Submit an encrypted trade intent to the dark pool
   */
  async submitEncryptedIntent(
    direction: "buy" | "sell",
    amount: bigint,
    slippageBps: number = 100
  ): Promise<{ signature: string; encryptedData: string }> {
    console.log("\n" + "=".repeat(60));
    console.log("SWARMSHIELD ENCRYPTED INTENT SUBMISSION");
    console.log("=".repeat(60));

    const slippageFactor = BigInt(10000 - slippageBps);
    const minOutput = (amount * slippageFactor) / BigInt(10000);

    const directionStr = direction.toUpperCase();
    console.log("\nIntent Details:");
    console.log("   Direction: " + directionStr);
    console.log("   Amount: " + amount.toString());
    console.log("   Min Output: " + minOutput.toString());
    console.log("   Slippage: " + (slippageBps / 100) + "%");

    // Encrypt the intent
    const intentType = direction === "buy" ? 0 : 1;
    const encryptedData = encryptIntent(intentType, amount, minOutput);
    const encryptedHex = Buffer.from(encryptedData).toString("hex");

    console.log("\nEncryption Complete:");
    console.log("   Encrypted payload: " + encryptedHex.slice(0, 32) + "...");
    console.log("   Payload size: " + encryptedData.length + " bytes");

    console.log("\nWhat MEV Bots See:");
    console.log("   Random bytes: " + encryptedHex.slice(0, 32) + "...");
    console.log("   Cannot determine: direction, amount, or slippage");

    // Get nonce and build transaction
    const nonce = await this.getAgentNonce();
    const [agentPDA] = findAgentPDA(this.keypair.publicKey);
    const [shieldedIntentPDA] = findShieldedIntentPDA(this.keypair.publicKey, nonce);

    const discriminator = getDiscriminator("submit_shielded_intent");
    const data = Buffer.concat([discriminator, Buffer.from(encryptedData)]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: agentPDA, isSigner: false, isWritable: true },
        { pubkey: shieldedIntentPDA, isSigner: false, isWritable: true },
        { pubkey: this.keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data,
    });

    const tx = new Transaction().add(instruction);
    tx.feePayer = this.keypair.publicKey;
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.sign(this.keypair);

    const signature = await this.connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    await this.connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

    console.log("\nIntent submitted to dark pool!");
    console.log("   Signature: " + signature);
    console.log("   View on Solscan: https://solscan.io/tx/" + signature + "?cluster=devnet");

    return { signature, encryptedData: encryptedHex };
  }

  /**
   * Execute a trading strategy with multiple encrypted intents
   */
  async executeTradingStrategy(trades: Array<{
    direction: "buy" | "sell";
    amountSol?: number;
    amountUsdc?: number;
  }>) {
    console.log("\n" + "=".repeat(60));
    console.log("AI AGENT TRADING STRATEGY EXECUTION");
    console.log("=".repeat(60));

    const results: Array<{ signature: string; encryptedData: string }> = [];

    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      console.log("\n--- Trade " + (i + 1) + " of " + trades.length + " ---");

      let amount: bigint;
      if (trade.direction === "sell" && trade.amountSol) {
        amount = BigInt(Math.floor(trade.amountSol * LAMPORTS_PER_SOL));
      } else if (trade.direction === "buy" && trade.amountUsdc) {
        amount = BigInt(Math.floor(trade.amountUsdc * 1e6));
      } else {
        console.log("Invalid trade configuration");
        continue;
      }

      try {
        const result = await this.submitEncryptedIntent(trade.direction, amount);
        results.push(result);
      } catch (e: any) {
        console.log("Trade failed: " + e.message);
      }

      if (i < trades.length - 1) {
        console.log("\nWaiting before next trade...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("STRATEGY EXECUTION COMPLETE");
    console.log("Submitted " + results.length + " encrypted intents to dark pool.");
    console.log("Keeper will batch and execute when threshold reached.");
    console.log("=".repeat(60));

    return results;
  }
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function main() {
  console.log("================================================================");
  console.log("           SWARMSHIELD AGENT SDK DEMO                          ");
  console.log("           MEV-Protected Trading for AI Agents                 ");
  console.log("================================================================");

  // Load keypair
  let keypair: Keypair;
  const keypairPath = process.env.HOME + "/.config/solana/id.json";

  try {
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
    console.log("\nLoaded keypair from " + keypairPath);
  } catch {
    keypair = Keypair.generate();
    console.log("\nGenerated new keypair (not saved)");
  }

  console.log("   Agent Address: " + keypair.publicKey.toBase58());

  const agent = new SwarmShieldAgent(RPC_URL, keypair);

  try {
    const balance = await agent.getBalance();
    console.log("   SOL Balance: " + balance.toFixed(4) + " SOL");
  } catch {
    console.log("   Could not fetch balance (check RPC URL)");
  }

  // Demo: Show encryption without submitting
  console.log("\n" + "-".repeat(60));
  console.log("DEMO: Encryption Preview (no transaction)");
  console.log("-".repeat(60));

  const testAmount = BigInt(100000000); // 0.1 SOL
  const testMinOutput = BigInt(99000000);
  const encrypted = encryptIntent(1, testAmount, testMinOutput);

  console.log("\nOriginal Intent:");
  console.log("   Type: SELL");
  console.log("   Amount: 0.1 SOL");
  console.log("   Min Output: 0.099 SOL equivalent");

  console.log("\nEncrypted (96 bytes):");
  console.log("   " + Buffer.from(encrypted).toString("hex").slice(0, 64) + "...");

  console.log("\nMEV Bot View: BLOCKED");
  console.log("   Cannot see direction, amount, or slippage");

  console.log("\n" + "=".repeat(60));
  console.log("PRIVACY BENEFITS FOR AI AGENTS:");
  console.log("=".repeat(60));
  console.log("\n1. ALGORITHMIC PATTERN HIDING");
  console.log("   - Your trading patterns are invisible");
  console.log("   - MEV bots cannot predict your strategy");
  console.log("\n2. INTENT ENCRYPTION");
  console.log("   - Trade direction hidden (buy/sell)");
  console.log("   - Trade size hidden");
  console.log("   - Slippage tolerance hidden");
  console.log("\n3. BATCH EXECUTION");
  console.log("   - Multiple agents batched together");
  console.log("   - Individual trades indistinguishable");
  console.log("\n4. MEV PROTECTION");
  console.log("   - No front-running possible");
  console.log("   - No sandwich attacks");
  console.log("   - 0% MEV extraction");

  console.log("\n================================================================");
  console.log("To submit real intents, ensure you have:");
  console.log("  1. Devnet SOL in your wallet");
  console.log("  2. Registered as an agent (via frontend or SDK)");
  console.log("  3. Deposited funds to the dark pool");
  console.log("================================================================\n");
}

main().catch(console.error);
