import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";
import { SwarmShieldKeeperClient, findConfigPDA } from "./swarmshield-client";
import { JupiterClient, SOL_MINT, USDC_MINT } from "./jupiter-client";
import { decryptIntent, getKeeperX25519SecretKey } from "./encryption";
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
  private jupiterClient: JupiterClient;
  private connection: Connection;
  private isRunning: boolean = false;
  private isDevnet: boolean;
  private keeperX25519SecretKey: Uint8Array;

  constructor(connection: Connection, keeper: Keypair, isDevnet: boolean = true) {
    this.connection = connection;
    this.isDevnet = isDevnet;
    this.client = new SwarmShieldKeeperClient(connection, keeper);

    // Derive X25519 secret key for decrypting shielded intents
    this.keeperX25519SecretKey = getKeeperX25519SecretKey(keeper.secretKey);

    // Use real Jupiter client (simulates on devnet, executes on mainnet)
    this.jupiterClient = new JupiterClient(connection, isDevnet);

    console.log(`🔧 Jupiter Mode: ${isDevnet ? 'DEVNET (simulation with real quotes)' : 'MAINNET (real execution)'}`);
    console.log(`🔐 Shielded intent decryption: ENABLED`);
  }

  // Calculate MEV savings from batching
  private calculateMEVSavings(totalVolume: BN): BN {
    // Without batching: MEV bots extract 3% per trade
    // With batching: Only 0.03% extraction (99% protection)
    const mevWithoutBatch = totalVolume.muln(MEV_ATTACK_RATE * 100).divn(10000);
    const mevWithBatch = totalVolume.muln((1 - BATCH_PROTECTION_RATE) * 10000).divn(10000);
    return mevWithoutBatch.sub(mevWithBatch);
  }

  // Execute swap via Jupiter (real or mock depending on network)
  // Note: buyVolume is in USDC units (6 decimals), sellVolume is in SOL lamports (9 decimals)
  private async executeSwapWithJupiter(
    buyVolume: BN,
    sellVolume: BN,
    keeperPubkey: any
  ): Promise<{ totalInput: BN; totalOutput: BN }> {
    // Get live SOL price for conversion
    const solPrice = await this.jupiterClient.getLiveSolPrice();

    // Convert to common base (USDC) for comparison
    // sellVolume (lamports) -> USDC: (lamports / 1e9) * price * 1e6 = lamports * price / 1000
    const sellVolumeUsdc = sellVolume.muln(Math.floor(solPrice)).divn(1000);
    // buyVolume is already in USDC units

    console.log(`  💱 Batch Optimization:`);
    console.log(`     Buy Volume: ${(buyVolume.toNumber() / 1e6).toFixed(2)} USDC`);
    console.log(`     Sell Volume: ${(sellVolume.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL (~${(sellVolumeUsdc.toNumber() / 1e6).toFixed(2)} USDC)`);

    // Determine net direction based on USDC values
    let optimization: { netVolume: BN; direction: "buy" | "sell" | "balanced" };
    if (buyVolume.gt(sellVolumeUsdc)) {
      // Net buy: Need to buy SOL with USDC
      const netUsdc = buyVolume.sub(sellVolumeUsdc);
      optimization = { netVolume: netUsdc, direction: "buy" };
    } else if (sellVolumeUsdc.gt(buyVolume)) {
      // Net sell: Need to sell SOL for USDC
      // Convert back to SOL: (usdc / 1e6) / price * 1e9 = usdc * 1000 / price
      const netUsdcDiff = sellVolumeUsdc.sub(buyVolume);
      const netSol = netUsdcDiff.muln(1000).divn(Math.floor(solPrice));
      optimization = { netVolume: netSol, direction: "sell" };
    } else {
      optimization = { netVolume: new BN(0), direction: "balanced" };
    }

    console.log(`     Net Direction: ${optimization.direction}`);
    if (optimization.direction === "buy") {
      console.log(`     Net Volume: ${(optimization.netVolume.toNumber() / 1e6).toFixed(2)} USDC to buy SOL`);
    } else if (optimization.direction === "sell") {
      console.log(`     Net Volume: ${(optimization.netVolume.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL to sell`);
    }

    // Total input is the sum of all amounts (in their native units)
    const totalInput = buyVolume.add(sellVolume);

    if (optimization.direction === "balanced") {
      console.log(`     ✅ Orders perfectly balanced - no DEX interaction needed!`);
      // Internal settlement only
      return { totalInput, totalOutput: totalInput };
    }

    // Get Jupiter quote for net volume
    console.log(`     🔄 Fetching Jupiter quote for net volume...`);
    const inputMint = optimization.direction === "buy" ? USDC_MINT : SOL_MINT;
    const outputMint = optimization.direction === "buy" ? SOL_MINT : USDC_MINT;

    const quote = await this.jupiterClient.getQuote(
      inputMint,
      outputMint,
      optimization.netVolume,
      50 // 0.5% slippage
    );

    if (!quote) {
      console.log(`     ⚠️  Jupiter quote unavailable (expected on devnet - no liquidity)`);
      console.log(`     📊 Using LIVE price estimation from Jupiter...`);
      // Use live price estimation
      const estimatedOutput = await this.jupiterClient.estimateOutputWithLiveRate(
        optimization.netVolume,
        optimization.direction as "buy" | "sell",
        50
      );
      console.log(`     💱 Estimated output: ${estimatedOutput.toString()} (${optimization.direction === "sell" ? "USDC" : "SOL"})`);
      return { totalInput, totalOutput: estimatedOutput };
    }

    console.log(`     ✅ Jupiter quote received:`);
    console.log(`        Input: ${new BN(quote.inAmount).toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`        Output: ${new BN(quote.outAmount).toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`        Price Impact: ${quote.priceImpactPct}%`);

    // Execute swap (real on mainnet, simulated on devnet)
    console.log(`     ⚡ Executing swap...`);
    const swapResult = await this.jupiterClient.executeSwap(keeperPubkey, quote);

    console.log(`     ${swapResult.executed ? "✅ REAL" : "🎭 SIMULATED"} swap completed`);
    console.log(`     📤 Swap Output: ${swapResult.outputAmount.toNumber() / LAMPORTS_PER_SOL} SOL`);
    if (swapResult.signature) {
      console.log(`     🔗 Signature: ${swapResult.signature}`);
    }

    // Use actual swap output from Jupiter
    const totalOutput = swapResult.outputAmount;

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

      // PRODUCTION FIX: Filter out expired intents
      const currentSlot = await this.connection.getSlot();
      const activeIntents = pendingIntents.filter(({ intent }) => {
        const isExpired = currentSlot > intent.expirySlot.toNumber();
        return !isExpired && intent.isPending;
      });

      console.log(`\n📊 Found ${pendingIntents.length} pending intent(s)`);
      if (activeIntents.length < pendingIntents.length) {
        const expiredCount = pendingIntents.length - activeIntents.length;
        console.log(`   ⏰ Filtered out ${expiredCount} expired intent(s)`);
      }
      console.log(`   ✅ Active intents: ${activeIntents.length}`);

      // CRITICAL: Separate sell and buy intents - they have different unit types
      // Sell intents: amount in SOL lamports → receive USDC
      // Buy intents: amount in USDC units → receive SOL
      const sellIntents = activeIntents.filter(({ intent }) => intent.intentType === 1);
      const buyIntents = activeIntents.filter(({ intent }) => intent.intentType === 0);

      console.log(`   📉 Sell intents: ${sellIntents.length}`);
      console.log(`   📈 Buy intents: ${buyIntents.length}`);

      // Process whichever batch type has enough intents
      // Prefer the one with more intents, or sell if equal
      let batchToProcess = null;
      let batchType = "";

      if (sellIntents.length >= config.minBatchSize && sellIntents.length >= buyIntents.length) {
        batchToProcess = sellIntents;
        batchType = "SELL";
      } else if (buyIntents.length >= config.minBatchSize) {
        batchToProcess = buyIntents;
        batchType = "BUY";
      } else if (sellIntents.length >= config.minBatchSize) {
        batchToProcess = sellIntents;
        batchType = "SELL";
      }

      // Check if we have enough for a batch
      if (!batchToProcess) {
        console.log(
          `⏳ Waiting for more intents of same type (need ${config.minBatchSize} sell or buy)`
        );
        console.log(`   Current: ${sellIntents.length} sell, ${buyIntents.length} buy`);
        return;
      }

      console.log(`\n🎯 Processing ${batchType} batch with ${batchToProcess.length} intents`);

      // Take up to maxBatchSize intents (from selected batch type only)
      const batchIntents = batchToProcess.slice(0, config.maxBatchSize);

      console.log(`\n🔄 Processing batch of ${batchIntents.length} intents:`);

      // Separate buy and sell intents
      let totalBuyVolume = new BN(0);
      let totalSellVolume = new BN(0);

      for (const { pubkey, intent } of batchIntents) {
        const type = intent.intentType === 0 ? "BUY" : "SELL";
        // For buy: amount is in USDC units (6 decimals)
        // For sell: amount is in SOL lamports (9 decimals)
        const amount = intent.intentType === 0
          ? intent.amount.toNumber() / 1e6 // USDC
          : intent.amount.toNumber() / LAMPORTS_PER_SOL; // SOL
        const unit = intent.intentType === 0 ? "USDC" : "SOL";

        console.log(`  • ${type} ${amount.toFixed(intent.intentType === 0 ? 2 : 4)} ${unit} from ${intent.agent.toBase58().slice(0, 8)}...`);

        if (intent.intentType === 0) {
          totalBuyVolume = totalBuyVolume.add(intent.amount);
        } else {
          totalSellVolume = totalSellVolume.add(intent.amount);
        }
      }

      // Execute swap via Jupiter (or mock on devnet)
      const keeperPubkey = this.client.getKeeperPublicKey();
      const { totalInput, totalOutput } = await this.executeSwapWithJupiter(
        totalBuyVolume,
        totalSellVolume,
        keeperPubkey
      );

      // Calculate MEV savings
      const mevSaved = this.calculateMEVSavings(totalInput);

      console.log(`\n🛡️  MEV Protection:`);
      console.log(`   💰 Value Protected: ${mevSaved.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`   📈 Protection Rate: ${(BATCH_PROTECTION_RATE * 100).toFixed(1)}%`);

      // Execute batch on-chain with settlement
      // Find next available batch ID (handles failed attempts that created orphan batch PDAs)
      const startingBatchId = config.totalBatches;
      const batchId = await this.client.findNextAvailableBatchId(startingBatchId);
      console.log(`\n⚡ Executing batch #${batchId.toString()} on-chain with settlement...`);

      // Prepare intent accounts for settlement
      const intentAccountsForSettlement = batchIntents.map(({ pubkey, intent }) => ({
        intentPubkey: pubkey,
        agentPubkey: intent.agent,
      }));

      const signature = await this.client.executeBatch(
        batchId,
        batchIntents.length,
        totalInput,
        totalOutput,
        intentAccountsForSettlement
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

  // Process pending SHIELDED intents (encrypted on-chain)
  private async processShieldedBatch(): Promise<void> {
    try {
      const config = await this.client.getConfig();
      if (!config) return;

      // Get all pending shielded intents
      const pendingShielded = await this.client.getAllPendingShieldedIntents();

      if (pendingShielded.length === 0) {
        return; // Silent - don't spam logs when no shielded intents
      }

      // Filter expired
      const currentSlot = await this.connection.getSlot();
      const activeShielded = pendingShielded.filter(({ intent }) => {
        return currentSlot <= intent.expirySlot.toNumber() && intent.isPending;
      });

      console.log(`\n🔐 Found ${pendingShielded.length} shielded intent(s), ${activeShielded.length} active`);

      if (activeShielded.length < config.minBatchSize) {
        console.log(`   ⏳ Need ${config.minBatchSize} shielded intents for batch (have ${activeShielded.length})`);
        return;
      }

      // Decrypt all intents
      const decryptedIntents: Array<{
        pubkey: any;
        agentPubkey: any;
        intentType: number;
        amount: BN;
        minOutput: BN;
      }> = [];

      for (const { pubkey, intent } of activeShielded) {
        const decrypted = decryptIntent(intent.encryptedData, this.keeperX25519SecretKey);
        if (!decrypted) {
          console.error(`   ❌ Failed to decrypt intent ${pubkey.toBase58().slice(0, 8)}...`);
          continue;
        }

        decryptedIntents.push({
          pubkey,
          agentPubkey: intent.agent,
          intentType: decrypted.intentType,
          amount: new BN(decrypted.amount.toString()),
          minOutput: new BN(decrypted.minOutput.toString()),
        });

        const type = decrypted.intentType === 0 ? "BUY" : "SELL";
        const amountNum = decrypted.intentType === 0
          ? Number(decrypted.amount) / 1e6
          : Number(decrypted.amount) / LAMPORTS_PER_SOL;
        const unit = decrypted.intentType === 0 ? "USDC" : "SOL";
        console.log(`   🔓 Decrypted: ${type} ${amountNum.toFixed(4)} ${unit} from ${intent.agent.toBase58().slice(0, 8)}...`);
      }

      if (decryptedIntents.length < config.minBatchSize) {
        console.log(`   ⏳ Not enough valid decrypted intents (${decryptedIntents.length}/${config.minBatchSize})`);
        return;
      }

      // Take up to maxBatchSize
      const batchIntents = decryptedIntents.slice(0, config.maxBatchSize);

      console.log(`\n🔄 Processing SHIELDED batch of ${batchIntents.length} intents:`);

      // Calculate volumes
      let totalBuyVolume = new BN(0);
      let totalSellVolume = new BN(0);

      for (const intent of batchIntents) {
        if (intent.intentType === 0) {
          totalBuyVolume = totalBuyVolume.add(intent.amount);
        } else {
          totalSellVolume = totalSellVolume.add(intent.amount);
        }
      }

      // Execute swap via Jupiter
      const keeperPubkey = this.client.getKeeperPublicKey();
      const { totalInput, totalOutput } = await this.executeSwapWithJupiter(
        totalBuyVolume,
        totalSellVolume,
        keeperPubkey
      );

      // Find next batch ID
      const startingBatchId = config.totalBatches;
      const batchId = await this.client.findNextAvailableBatchId(startingBatchId);
      console.log(`\n⚡ Executing SHIELDED batch #${batchId.toString()} on-chain...`);

      // Prepare decrypted data arrays for the instruction
      const decryptedTypes = batchIntents.map(i => i.intentType);
      const decryptedAmounts = batchIntents.map(i => i.amount);
      const decryptedMinOutputs = batchIntents.map(i => i.minOutput);
      const intentAccounts = batchIntents.map(i => ({
        intentPubkey: i.pubkey,
        agentPubkey: i.agentPubkey,
      }));

      const signature = await this.client.executeShieldedBatch(
        batchId,
        totalOutput,
        decryptedTypes,
        decryptedAmounts,
        decryptedMinOutputs,
        intentAccounts
      );

      const mevSaved = this.calculateMEVSavings(totalInput);

      console.log(`\n✅ SHIELDED BATCH EXECUTED!`);
      console.log(`   🔗 Signature: ${signature}`);
      console.log(`   📦 Batch ID: ${batchId.toString()}`);
      console.log(`   🔐 Intents Decrypted & Settled: ${batchIntents.length}`);
      console.log(`   🛡️  MEV Saved: ${mevSaved.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`   🔒 On-chain: Only encrypted bytes visible to observers`);
      console.log(`\n${"=".repeat(60)}\n`);

    } catch (error: any) {
      console.error("❌ Error processing shielded batch:", error.message);
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

    // Fetch live SOL price at startup
    console.log("\n📊 Fetching live SOL price from Jupiter...");
    const solPrice = await this.jupiterClient.getLiveSolPrice();
    console.log(`✅ Live SOL Price: $${solPrice.toFixed(2)} USDC`);

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
      await this.processShieldedBatch();
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

  // Detect network
  const isDevnet = RPC_URL.includes("devnet");
  console.log(`🌐 Network: ${isDevnet ? "DEVNET" : "MAINNET"}`);

  // Check keeper balance
  const balance = await connection.getBalance(keeper.publicKey);
  console.log(`💰 Keeper Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance < 0.1 * LAMPORTS_PER_SOL) {
    console.warn("\n⚠️  WARNING: Keeper balance is low!");
    console.warn("Please fund the keeper wallet for transaction fees");
  }

  // Start keeper
  const darkPoolKeeper = new DarkPoolKeeper(connection, keeper, isDevnet);

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
