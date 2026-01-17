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
  "F5zRCquhMHFrGJjrgmSoMmv1Pdo6N1io4eRA5H8UcVZu"
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

  // Execute batch
  async executeBatch(
    batchId: BN,
    intentCount: number,
    totalInput: BN,
    totalOutput: BN
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

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: configPDA, isSigner: false, isWritable: true },
        { pubkey: batchPDA, isSigner: false, isWritable: true },
        { pubkey: this.keeper.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: SWARM_SHIELD_PROGRAM_ID,
      data,
    });

    const tx = new Transaction().add(instruction);
    tx.feePayer = this.keeper.publicKey;
    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    tx.sign(this.keeper);

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
