import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";
import { SwarmShieldKeeperClient, findConfigPDA } from "./swarmshield-client";
import * as dotenv from "dotenv";

dotenv.config();

// Config
const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const KEEPER_PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "5000");

// MEV Simulation Constants
const MEV_ATTACK_RATE = 0.03; // 3% value extracted by MEV bots on individual trades
const BATCH_PROTECTION_RATE = 0.99; // 99% protection when batched

class DarkPoolKeeper {
  private client: SwarmShieldKeeperClient;
  private connection: Connection;
  private isRunning: boolean = false;

  constructor(connection: Connection, keeper: Keypair) {
    this.connection = connection;
    this.client = new SwarmShieldKeeperClient(connection, keeper);
  }

  // Calculate MEV savings from batching
  private calculateMEVSavings(totalVolume: BN): BN {
    // Without batching: MEV bots extract 3% per trade
    // With batching: Only 0.03% extraction (99% protection)
    const mevWithoutBatch = totalVolume.muln(MEV_ATTACK_RATE * 100).divn(10000);
    const mevWithBatch = totalVolume.muln((1 - BATCH_PROTECTION_RATE) * 10000).divn(10000);
    return mevWithoutBatch.sub(mevWithBatch);
  }

  // Simulate Jupiter swap execution
  private async simulateSwapExecution(
    buyVolume: BN,
    sellVolume: BN
  ): Promise<{ totalInput: BN; totalOutput: BN }> {
    // For hackathon demo: Simulate realistic slippage (0.5-1%)
    const slippageRate = 0.995; // 0.5% slippage

    // Total input is the sum of all amounts
    const totalInput = buyVolume.add(sellVolume);

    // Simulate output after slippage
    const totalOutput = totalInput.muln(slippageRate * 1000).divn(1000);

    console.log(`  💱 Simulated Swap:`);
    console.log(`     Buy Volume: ${buyVolume.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`     Sell Volume: ${sellVolume.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`     Total Input: ${totalInput.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`     Total Output: ${totalOutput.toNumber() / LAMPORTS_PER_SOL} SOL`);

    return { totalInput, totalOutput };
  }

  // Process pending intents and execute batch if criteria met
  private async processBatch(): Promise<void> {
    try {
      // Get config
      const config = await this.client.getConfig();
      if (!config) {
        console.log("⚠️  SwarmShield not initialized");
        return;
      }

      // Get all pending intents
      const pendingIntents = await this.client.getAllPendingIntents();

      if (pendingIntents.length === 0) {
        console.log("📭 No pending intents");
        return;
      }

      console.log(`\n📊 Found ${pendingIntents.length} pending intent(s)`);

      // Check if we have enough for a batch
      if (pendingIntents.length < config.minBatchSize) {
        console.log(
          `⏳ Waiting for more intents (need ${config.minBatchSize}, have ${pendingIntents.length})`
        );
        return;
      }

      // Take up to maxBatchSize intents
      const batchIntents = pendingIntents.slice(0, config.maxBatchSize);

      console.log(`\n🔄 Processing batch of ${batchIntents.length} intents:`);

      // Separate buy and sell intents
      let totalBuyVolume = new BN(0);
      let totalSellVolume = new BN(0);

      for (const { pubkey, intent } of batchIntents) {
        const type = intent.intentType === 0 ? "BUY" : "SELL";
        const amount = intent.amount.toNumber() / LAMPORTS_PER_SOL;

        console.log(`  • ${type} ${amount} SOL from ${intent.agent.toBase58().slice(0, 8)}...`);

        if (intent.intentType === 0) {
          totalBuyVolume = totalBuyVolume.add(intent.amount);
        } else {
          totalSellVolume = totalSellVolume.add(intent.amount);
        }
      }

      // Simulate swap execution
      const { totalInput, totalOutput } = await this.simulateSwapExecution(
        totalBuyVolume,
        totalSellVolume
      );

      // Calculate MEV savings
      const mevSaved = this.calculateMEVSavings(totalInput);

      console.log(`\n🛡️  MEV Protection:`);
      console.log(`   💰 Value Protected: ${mevSaved.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`   📈 Protection Rate: ${(BATCH_PROTECTION_RATE * 100).toFixed(1)}%`);

      // Execute batch on-chain
      const batchId = config.totalBatches;
      console.log(`\n⚡ Executing batch #${batchId.toString()} on-chain...`);

      const signature = await this.client.executeBatch(
        batchId,
        batchIntents.length,
        totalInput,
        totalOutput
      );

      console.log(`\n✅ BATCH EXECUTED SUCCESSFULLY!`);
      console.log(`   🔗 Signature: ${signature}`);
      console.log(`   📦 Batch ID: ${batchId.toString()}`);
      console.log(`   🤖 Agents Protected: ${batchIntents.length}`);
      console.log(`   💎 Total Volume: ${totalInput.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`   🛡️  MEV Saved: ${mevSaved.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`\n${"=".repeat(60)}\n`);

    } catch (error: any) {
      console.error("❌ Error processing batch:", error.message);
      if (error.logs) {
        console.error("Transaction logs:", error.logs);
      }
    }
  }

  // Main keeper loop
  async start(): Promise<void> {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 SwarmShield Dark Pool Keeper");
    console.log("=".repeat(60));
    console.log(`📡 RPC: ${RPC_URL}`);
    console.log(`⏱️  Poll Interval: ${POLL_INTERVAL_MS}ms`);

    // Verify keeper is authorized
    const config = await this.client.getConfig();
    if (!config) {
      console.error("❌ SwarmShield not initialized on-chain");
      process.exit(1);
    }

    console.log(`\n✓ Keeper authorized: ${config.keeper.toBase58()}`);
    console.log(`✓ Min batch size: ${config.minBatchSize}`);
    console.log(`✓ Max batch size: ${config.maxBatchSize}`);
    console.log(`✓ Total batches executed: ${config.totalBatches.toString()}`);
    console.log("\n" + "=".repeat(60));
    console.log("👀 Monitoring for pending intents...\n");

    this.isRunning = true;

    while (this.isRunning) {
      await this.processBatch();
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  stop(): void {
    console.log("\n⏹️  Stopping keeper...");
    this.isRunning = false;
  }
}

// Main entry point
async function main() {
  if (!KEEPER_PRIVATE_KEY) {
    console.error("❌ KEEPER_PRIVATE_KEY not found in environment");
    console.error("Please create a .env file with:");
    console.error("KEEPER_PRIVATE_KEY=[your keeper private key as base58 or array]");
    process.exit(1);
  }

  // Parse keeper keypair
  let keeper: Keypair;
  try {
    // Try parsing as JSON array first
    const keyArray = JSON.parse(KEEPER_PRIVATE_KEY);
    keeper = Keypair.fromSecretKey(Uint8Array.from(keyArray));
  } catch {
    // Try as base58
    try {
      const bs58 = require("bs58");
      keeper = Keypair.fromSecretKey(bs58.decode(KEEPER_PRIVATE_KEY));
    } catch (error) {
      console.error("❌ Invalid KEEPER_PRIVATE_KEY format");
      console.error("Must be either JSON array or base58 string");
      process.exit(1);
    }
  }

  console.log(`\n🔑 Keeper Public Key: ${keeper.publicKey.toBase58()}`);

  // Create connection
  const connection = new Connection(RPC_URL, "confirmed");

  // Check keeper balance
  const balance = await connection.getBalance(keeper.publicKey);
  console.log(`💰 Keeper Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance < 0.1 * LAMPORTS_PER_SOL) {
    console.warn("\n⚠️  WARNING: Keeper balance is low!");
    console.warn("Please fund the keeper wallet for transaction fees");
  }

  // Start keeper
  const darkPoolKeeper = new DarkPoolKeeper(connection, keeper);

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    darkPoolKeeper.stop();
    process.exit(0);
  });

  await darkPoolKeeper.start();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
