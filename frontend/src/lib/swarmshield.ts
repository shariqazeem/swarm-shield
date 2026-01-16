import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { BN } from "bn.js";
import { sha256 } from "js-sha256";

// Program ID
export const PROGRAM_ID = "F5zRCquhMHFrGJjrgmSoMmv1Pdo6N1io4eRA5H8UcVZu";
export const SWARM_SHIELD_PROGRAM_ID = new PublicKey(PROGRAM_ID);

// PDA Seeds
const CONFIG_SEED = "config";
const AGENT_SEED = "agent";
const VAULT_SEED = "vault";
const INTENT_SEED = "intent";
const BATCH_SEED = "batch";

// Types
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

export interface ShieldedAgent {
  authority: PublicKey;
  agentIdHash: number[];
  solBalance: BN;
  usdcBalance: BN;
  nonce: BN;
  isActive: boolean;
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

// Instruction discriminators (first 8 bytes of sha256 hash of instruction name)
function getDiscriminator(name: string): Buffer {
  const hash = sha256.array(`global:${name}`);
  return Buffer.from(hash.slice(0, 8));
}

// Helper to find PDAs
export function findConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED)],
    SWARM_SHIELD_PROGRAM_ID
  );
}

export function findAgentPDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(AGENT_SEED), authority.toBuffer()],
    SWARM_SHIELD_PROGRAM_ID
  );
}

export function findVaultPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_SEED)],
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

// Generate agent ID hash from wallet
export function generateAgentIdHash(wallet: PublicKey): number[] {
  const hash = sha256.array(wallet.toBuffer());
  return hash.slice(0, 32);
}

// Wallet interface for signing
interface WalletAdapter {
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
}

// SwarmShield Client Class - using raw web3.js
export class SwarmShieldClient {
  private connection: Connection;
  private wallet: WalletAdapter | null = null;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  // Set wallet for signing
  setWallet(wallet: WalletAdapter) {
    this.wallet = wallet;
  }

  // Check if config exists (protocol initialized)
  async isInitialized(): Promise<boolean> {
    try {
      const [configPDA] = findConfigPDA();
      const account = await this.connection.getAccountInfo(configPDA);
      return account !== null;
    } catch {
      return false;
    }
  }

  // Get config data (manual deserialization)
  async getConfig(): Promise<SwarmConfig | null> {
    try {
      const [configPDA] = findConfigPDA();
      const account = await this.connection.getAccountInfo(configPDA);
      if (!account) return null;

      // Skip 8-byte discriminator, then parse struct
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

  // Get agent data (manual deserialization)
  async getAgent(authority: PublicKey): Promise<ShieldedAgent | null> {
    try {
      const [agentPDA] = findAgentPDA(authority);
      const account = await this.connection.getAccountInfo(agentPDA);
      if (!account) return null;

      // Skip 8-byte discriminator, then parse struct
      const data = account.data.slice(8);
      return {
        authority: new PublicKey(data.slice(0, 32)),
        agentIdHash: Array.from(data.slice(32, 64)),
        solBalance: new BN(data.slice(64, 72), "le"),
        usdcBalance: new BN(data.slice(72, 80), "le"),
        nonce: new BN(data.slice(80, 88), "le"),
        isActive: data[88] === 1,
        bump: data[89],
      };
    } catch (e) {
      console.error("Error getting agent:", e);
      return null;
    }
  }

  // Check if agent is registered
  async isAgentRegistered(authority: PublicKey): Promise<boolean> {
    try {
      const [agentPDA] = findAgentPDA(authority);
      const account = await this.connection.getAccountInfo(agentPDA);
      return account !== null;
    } catch {
      return false;
    }
  }

  // Initialize protocol
  async initialize(
    authority: PublicKey,
    minBatchSize: number = 3,
    maxBatchSize: number = 10
  ): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected");

    const [configPDA] = findConfigPDA();
    console.log("Initializing protocol:");
    console.log("  Config PDA:", configPDA.toBase58());
    console.log("  Authority:", authority.toBase58());
    console.log("  Min batch size:", minBatchSize);
    console.log("  Max batch size:", maxBatchSize);

    // Build instruction data: discriminator + args
    const discriminator = getDiscriminator("initialize");
    console.log("  Discriminator:", Array.from(discriminator));

    const data = Buffer.concat([
      discriminator,
      Buffer.from([minBatchSize, maxBatchSize]),
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: configPDA, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: SWARM_SHIELD_PROGRAM_ID,
      data,
    });

    const tx = new Transaction().add(instruction);
    tx.feePayer = authority;
    const { blockhash } = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    console.log("  Signing transaction...");
    const signedTx = await this.wallet.signTransaction(tx);

    console.log("  Sending transaction...");
    const signature = await this.connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    console.log("  Transaction signature:", signature);
    console.log("  Waiting for confirmation...");

    const confirmation = await this.connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight: (await this.connection.getLatestBlockhash()).lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    console.log("  Transaction confirmed!");
    return signature;
  }

  // Register as an agent
  async registerAgent(authority: PublicKey): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected");

    const [configPDA] = findConfigPDA();
    const [agentPDA] = findAgentPDA(authority);
    const agentIdHash = generateAgentIdHash(authority);

    // Build instruction data: discriminator + agent_id_hash (32 bytes)
    const discriminator = getDiscriminator("register_agent");
    const data = Buffer.concat([
      discriminator,
      Buffer.from(agentIdHash),
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: configPDA, isSigner: false, isWritable: true },
        { pubkey: agentPDA, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: SWARM_SHIELD_PROGRAM_ID,
      data,
    });

    const tx = new Transaction().add(instruction);
    tx.feePayer = authority;
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const signedTx = await this.wallet.signTransaction(tx);
    const signature = await this.connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    const confirmation = await this.connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    return signature;
  }

  // Deposit SOL to shielded vault
  async depositSol(authority: PublicKey, amountSol: number): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected");

    const [agentPDA] = findAgentPDA(authority);
    const [vaultPDA] = findVaultPDA();
    const amountLamports = new BN(amountSol * LAMPORTS_PER_SOL);

    // Build instruction data: discriminator + amount (u64 le)
    const discriminator = getDiscriminator("deposit_sol");
    const data = Buffer.concat([
      discriminator,
      amountLamports.toArrayLike(Buffer, "le", 8),
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: agentPDA, isSigner: false, isWritable: true },
        { pubkey: vaultPDA, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: SWARM_SHIELD_PROGRAM_ID,
      data,
    });

    const tx = new Transaction().add(instruction);
    tx.feePayer = authority;
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const signedTx = await this.wallet.signTransaction(tx);
    const signature = await this.connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    const confirmation = await this.connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    return signature;
  }

  // Submit shielded intent
  async submitIntent(
    authority: PublicKey,
    intentType: "buy" | "sell",
    amountLamports: BN,
    minOutputLamports: BN
  ): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected");

    // Get current agent to read nonce
    let agent = await this.getAgent(authority);
    if (!agent) throw new Error("Agent not registered");

    console.log("Current agent nonce:", agent.nonce.toNumber());

    // Check if intent PDA with this nonce already exists
    let [intentPDA] = findIntentPDA(authority, agent.nonce);
    let intentExists = await this.connection.getAccountInfo(intentPDA);

    // If intent already exists, nonce was already incremented - refetch agent
    if (intentExists) {
      console.log("Intent PDA already exists, refetching agent state...");
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for state to settle
      agent = await this.getAgent(authority);
      if (!agent) throw new Error("Agent not registered");
      console.log("Refreshed agent nonce:", agent.nonce.toNumber());
      [intentPDA] = findIntentPDA(authority, agent.nonce);
    }

    const [agentPDA] = findAgentPDA(authority);
    console.log("Using intent PDA:", intentPDA.toBase58());

    // Build instruction data: discriminator + intent_type (u8) + amount (u64) + min_output (u64)
    const discriminator = getDiscriminator("submit_intent");
    const data = Buffer.concat([
      discriminator,
      Buffer.from([intentType === "buy" ? 0 : 1]),
      amountLamports.toArrayLike(Buffer, "le", 8),
      minOutputLamports.toArrayLike(Buffer, "le", 8),
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: agentPDA, isSigner: false, isWritable: true }, // Must be writable to increment nonce
        { pubkey: intentPDA, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: SWARM_SHIELD_PROGRAM_ID,
      data,
    });

    const tx = new Transaction().add(instruction);
    tx.feePayer = authority;
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    console.log("Signing transaction...");
    const signedTx = await this.wallet.signTransaction(tx);

    console.log("Sending transaction...");
    try {
      const signature = await this.connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      console.log("Transaction signature:", signature);
      console.log("Waiting for confirmation...");

      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log("Transaction confirmed!");
      return signature;
    } catch (err: any) {
      // If transaction already processed, check if intent PDA exists
      if (err.message?.includes("already been processed") ||
          err.message?.includes("AlreadyProcessed")) {
        console.log("Transaction already processed, checking if intent was created...");

        // Wait a bit for state to settle
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check if intent exists at this nonce
        const intentCheck = await this.connection.getAccountInfo(intentPDA);
        if (intentCheck) {
          console.log("Intent PDA exists - transaction succeeded previously");
          return "already_processed_success";
        }

        // Intent doesn't exist, maybe nonce changed - refetch and retry once
        console.log("Intent PDA doesn't exist, fetching latest agent state for retry...");
        const freshAgent = await this.getAgent(authority);
        if (!freshAgent) throw new Error("Agent not registered");

        console.log("Fresh agent nonce:", freshAgent.nonce.toNumber());
        const [freshIntentPDA] = findIntentPDA(authority, freshAgent.nonce);

        // Check if this intent exists
        const freshIntentCheck = await this.connection.getAccountInfo(freshIntentPDA);
        if (freshIntentCheck) {
          console.log("Intent already exists at fresh nonce - considering success");
          return "already_processed_success";
        }

        // If we still have issues after refetching, throw error with helpful message
        throw new Error(
          `Transaction failed with stale nonce. Current nonce: ${freshAgent.nonce.toNumber()}. ` +
          `Please try again.`
        );
      }

      // Re-throw other errors
      throw err;
    }
  }

  // Withdraw SOL from vault
  async withdrawSol(authority: PublicKey, amountSol: number): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected");

    const [agentPDA] = findAgentPDA(authority);
    const [vaultPDA] = findVaultPDA();
    const amountLamports = new BN(amountSol * LAMPORTS_PER_SOL);

    // Build instruction data: discriminator + amount (u64 le)
    const discriminator = getDiscriminator("withdraw_sol");
    const data = Buffer.concat([
      discriminator,
      amountLamports.toArrayLike(Buffer, "le", 8),
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: agentPDA, isSigner: false, isWritable: true },
        { pubkey: vaultPDA, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: SWARM_SHIELD_PROGRAM_ID,
      data,
    });

    const tx = new Transaction().add(instruction);
    tx.feePayer = authority;
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const signedTx = await this.wallet.signTransaction(tx);
    const signature = await this.connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    const confirmation = await this.connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    return signature;
  }

  // Get current slot
  async getCurrentSlot(): Promise<number> {
    return await this.connection.getSlot();
  }

  // Get SOL balance
  async getSolBalance(pubkey: PublicKey): Promise<number> {
    const balance = await this.connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  }
}

// Create client instance
export function createSwarmShieldClient(rpcUrl: string): SwarmShieldClient {
  const connection = new Connection(rpcUrl, "confirmed");
  return new SwarmShieldClient(connection);
}
