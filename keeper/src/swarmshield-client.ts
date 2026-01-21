import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  Keypair,
} from "@solana/web3.js";
import BN from "bn.js";
import { createHash } from "crypto";

// Program ID
export const SWARM_SHIELD_PROGRAM_ID = new PublicKey(
  "5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew"
);

// PDA Seeds
const CONFIG_SEED = "config";
const INTENT_SEED = "intent";
const BATCH_SEED = "batch";

// Helper to find PDAs
export function findConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED)],
    SWARM_SHIELD_PROGRAM_ID
  );
}

export function findIntentPDA(
  authority: PublicKey,
  nonce: BN
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(INTENT_SEED),
      authority.toBuffer(),
      nonce.toArrayLike(Buffer, "le", 8),
    ],
    SWARM_SHIELD_PROGRAM_ID
  );
}

export function findBatchPDA(batchId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(BATCH_SEED), batchId.toArrayLike(Buffer, "le", 8)],
    SWARM_SHIELD_PROGRAM_ID
  );
}

// Instruction discriminators
function getDiscriminator(name: string): Buffer {
  const hash = createHash("sha256")
    .update(`global:${name}`)
    .digest();
  return hash.slice(0, 8);
}

export interface SwarmConfig {
  authority: PublicKey;
  keeper: PublicKey;
  totalAgents: BN;
  totalBatches: BN;
  totalVolumeProtected: BN;
  minBatchSize: number;
  maxBatchSize: number;
  bump: number;
}

export interface TradeIntent {
  agent: PublicKey;
  intentType: number;
  amount: BN;
  minOutput: BN;
  expirySlot: BN;
  isPending: boolean;
  bump: number;
}

export class SwarmShieldKeeperClient {
  constructor(
    private connection: Connection,
    private keeper: Keypair
  ) {}

  // Get keeper public key
  getKeeperPublicKey(): PublicKey {
    return this.keeper.publicKey;
  }

  // Check if a batch PDA already exists
  async batchExists(batchId: BN): Promise<boolean> {
    try {
      const [batchPDA] = findBatchPDA(batchId);
      const account = await this.connection.getAccountInfo(batchPDA);
      return account !== null;
    } catch {
      return false;
    }
  }

  // Find the next available batch ID (skips existing ones from failed attempts)
  async findNextAvailableBatchId(startingId: BN): Promise<BN> {
    let batchId = startingId;
    let attempts = 0;
    const maxAttempts = 10; // Don't search forever

    while (attempts < maxAttempts) {
      const exists = await this.batchExists(batchId);
      if (!exists) {
        return batchId;
      }
      console.log(`  ⚠️  Batch #${batchId.toString()} already exists, trying next...`);
      batchId = batchId.addn(1);
      attempts++;
    }

    throw new Error(`Could not find available batch ID after ${maxAttempts} attempts`);
  }

  // Get config
  async getConfig(): Promise<SwarmConfig | null> {
    try {
      const [configPDA] = findConfigPDA();
      const account = await this.connection.getAccountInfo(configPDA);
      if (!account) return null;

      const data = account.data.slice(8);
      return {
        authority: new PublicKey(data.slice(0, 32)),
        keeper: new PublicKey(data.slice(32, 64)),
        totalAgents: new BN(data.slice(64, 72), "le"),
        totalBatches: new BN(data.slice(72, 80), "le"),
        totalVolumeProtected: new BN(data.slice(80, 88), "le"),
        minBatchSize: data[88],
        maxBatchSize: data[89],
        bump: data[90],
      };
    } catch (e) {
      console.error("Error getting config:", e);
      return null;
    }
  }

  // Get intent data
  async getIntent(intentPDA: PublicKey): Promise<TradeIntent | null> {
    try {
      const account = await this.connection.getAccountInfo(intentPDA);
      if (!account) return null;

      const data = account.data.slice(8);
      return {
        agent: new PublicKey(data.slice(0, 32)),
        intentType: data[32],
        amount: new BN(data.slice(33, 41), "le"),
        minOutput: new BN(data.slice(41, 49), "le"),
        expirySlot: new BN(data.slice(49, 57), "le"),
        isPending: data[57] === 1,
        bump: data[58],
      };
    } catch (e) {
      console.error("Error getting intent:", e);
      return null;
    }
  }

  // Execute batch with settlement
  async executeBatch(
    batchId: BN,
    intentCount: number,
    totalInput: BN,
    totalOutput: BN,
    intentAccounts: Array<{ intentPubkey: PublicKey; agentPubkey: PublicKey }>
  ): Promise<string> {
    const [configPDA] = findConfigPDA();
    const [batchPDA] = findBatchPDA(batchId);

    const discriminator = getDiscriminator("execute_batch");
    const data = Buffer.concat([
      discriminator,
      batchId.toArrayLike(Buffer, "le", 8),
      Buffer.from([intentCount]),
      totalInput.toArrayLike(Buffer, "le", 8),
      totalOutput.toArrayLike(Buffer, "le", 8),
    ]);

    // Build account metas with settlement accounts
    const accountMetas = [
      { pubkey: configPDA, isSigner: false, isWritable: true },
      { pubkey: batchPDA, isSigner: false, isWritable: true },
      { pubkey: this.keeper.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    // Add intent and agent accounts for settlement (pairs: intent, agent)
    for (const { intentPubkey, agentPubkey } of intentAccounts) {
      accountMetas.push({ pubkey: intentPubkey, isSigner: false, isWritable: true });
      accountMetas.push({ pubkey: agentPubkey, isSigner: false, isWritable: true });
    }

    const instruction = new TransactionInstruction({
      keys: accountMetas,
      programId: SWARM_SHIELD_PROGRAM_ID,
      data,
    });

    const tx = new Transaction().add(instruction);
    tx.feePayer = this.keeper.publicKey;
    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    tx.sign(this.keeper);

    try {
      const signature = await this.connection.sendRawTransaction(
        tx.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        }
      );

      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(
          `Batch execution failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      return signature;
    } catch (error: any) {
      // Extract and log simulation error details
      if (error.logs) {
        console.error("\n📋 Transaction Logs:");
        error.logs.forEach((log: string) => console.error(`   ${log}`));
      }

      // Parse common error codes for better error messages
      const errStr = error.message || "";
      if (errStr.includes("Custom:0")) {
        console.error("\n❓ Error: Custom:0 = AccountAlreadyInUse (batch PDA already exists)");
        console.error("   Try incrementing batch ID or check for orphan batch accounts");
      } else if (errStr.includes("Custom:1")) {
        console.error("\n❓ Error: Custom:1 = InsufficientFunds (not enough SOL for fees)");
      }

      throw error;
    }
  }

  // Get all program accounts (intents)
  async getAllPendingIntents(): Promise<
    Array<{ pubkey: PublicKey; intent: TradeIntent }>
  > {
    try {
      const accounts = await this.connection.getProgramAccounts(
        SWARM_SHIELD_PROGRAM_ID,
        {
          filters: [
            {
              dataSize: 67, // TradeIntent account size: 8 discriminator + 59 data
            },
          ],
        }
      );

      const intents: Array<{ pubkey: PublicKey; intent: TradeIntent }> = [];

      for (const { pubkey, account } of accounts) {
        try {
          const data = account.data.slice(8);
          const intent: TradeIntent = {
            agent: new PublicKey(data.slice(0, 32)),
            intentType: data[32],
            amount: new BN(data.slice(33, 41), "le"),
            minOutput: new BN(data.slice(41, 49), "le"),
            expirySlot: new BN(data.slice(49, 57), "le"),
            isPending: data[57] === 1,
            bump: data[58],
          };

          // Only include pending intents
          if (intent.isPending) {
            intents.push({ pubkey, intent });
          }
        } catch (e) {
          // Skip invalid accounts
          continue;
        }
      }

      return intents;
    } catch (e) {
      console.error("Error getting pending intents:", e);
      return [];
    }
  }
}
