import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// SPL Memo Program for transaction descriptions
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import BN from "bn.js";
import { sha256 } from "js-sha256";

// Type alias for BN
type BNType = InstanceType<typeof BN>;

// Program ID
export const PROGRAM_ID = "5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew";
export const SWARM_SHIELD_PROGRAM_ID = new PublicKey(PROGRAM_ID);

// SwarmUSDC token mint (devnet) - REAL SPL token for actual transfers
export const SWARM_USDC_MINT = new PublicKey("8ypRqPnaiegfw9if3R2JZpqLsfr4YHjfPtxUz8YgdkuJ");

// Vault's token account for SwarmUSDC
export const VAULT_USDC_ACCOUNT = new PublicKey("91SVXnhuqdE56AdSZ9wRW9vfzS2TGrVuKACLBEPtWVqS");

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
  totalAgents: BNType;
  totalBatches: BNType;
  totalVolumeProtected: BNType;
  minBatchSize: number;
  maxBatchSize: number;
  bump: number;
}

export interface ShieldedAgent {
  authority: PublicKey;
  agentIdHash: number[];
  solBalance: BNType;
  usdcBalance: BNType;
  nonce: BNType;
  isActive: boolean;
  bump: number;
}

export interface TradeIntent {
  agent: PublicKey;
  intentType: number;
  amount: BNType;
  minOutput: BNType;
  expirySlot: BNType;
  isPending: boolean;
  bump: number;
}

// Instruction discriminators (first 8 bytes of sha256 hash of instruction name)
function getDiscriminator(name: string): Buffer {
  const hash = sha256.array(`global:${name}`);
  return Buffer.from(hash.slice(0, 8));
}

// Create memo instruction for transaction descriptions
// Note: SPL Memo v2 doesn't require signers, the message is just logged
function createMemoInstruction(message: string): TransactionInstruction {
  return new TransactionInstruction({
    keys: [], // No keys required for memo
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(message, "utf-8"),
  });
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

export function findShieldedIntentPDA(
  authority: PublicKey,
  nonce: BN
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("shielded_intent"),
      authority.toBuffer(),
      nonce.toArrayLike(Buffer, "le", 8),
    ],
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

    // Add memo for wallet display
    const memo = createMemoInstruction(
      `SwarmShield: Deposit ${amountSol} SOL to shielded vault`
    );

    const tx = new Transaction().add(memo).add(instruction);
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

    // Add memo for wallet display
    const amountDisplay = intentType === "sell"
      ? `${(amountLamports.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`
      : `${(amountLamports.toNumber() / 1e6).toFixed(2)} USDC`;
    const outputType = intentType === "sell" ? "USDC" : "SOL";
    const memo = createMemoInstruction(
      `SwarmShield: ${intentType === "sell" ? "Sell" : "Buy"} Intent - ${amountDisplay} → ${outputType}`
    );

    const tx = new Transaction().add(memo).add(instruction);
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

  // Submit ENCRYPTED trade intent - TRUE PRIVACY
  // Intent data is encrypted with keeper's X25519 public key
  // On-chain, only encrypted bytes are visible to observers
  async submitShieldedIntent(
    authority: PublicKey,
    intentType: "buy" | "sell",
    amountLamports: BN,
    minOutputLamports: BN
  ): Promise<{ signature: string; encryptedData: Uint8Array }> {
    if (!this.wallet) throw new Error("Wallet not connected");

    // Import encryption utility
    const { encryptIntent } = await import("./encryption");

    // Encrypt the intent data
    const typeNum = intentType === "buy" ? 0 : 1;
    const encryptedData = encryptIntent(
      typeNum,
      BigInt(amountLamports.toString()),
      BigInt(minOutputLamports.toString())
    );

    console.log("Intent encrypted! On-chain data will be unreadable to MEV bots.");
    console.log("Encrypted payload (first 32 bytes = ephemeral key):", Buffer.from(encryptedData.slice(0, 32)).toString("hex"));

    // Get current agent nonce
    let agent = await this.getAgent(authority);
    if (!agent) throw new Error("Agent not registered");

    // Check if shielded intent PDA already exists at this nonce
    let [shieldedIntentPDA] = findShieldedIntentPDA(authority, agent.nonce);
    let intentExists = await this.connection.getAccountInfo(shieldedIntentPDA);

    if (intentExists) {
      console.log("Shielded intent PDA exists, refetching agent...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      agent = await this.getAgent(authority);
      if (!agent) throw new Error("Agent not registered");
      [shieldedIntentPDA] = findShieldedIntentPDA(authority, agent.nonce);
    }

    const [agentPDA] = findAgentPDA(authority);

    // Build instruction: discriminator + encrypted_data([u8; 96])
    const discriminator = getDiscriminator("submit_shielded_intent");
    const data = Buffer.concat([
      discriminator,
      Buffer.from(encryptedData), // 96 bytes
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: agentPDA, isSigner: false, isWritable: true },
        { pubkey: shieldedIntentPDA, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: SWARM_SHIELD_PROGRAM_ID,
      data,
    });

    // Add privacy-preserving memo (doesn't reveal intent details)
    const memo = createMemoInstruction(
      "SwarmShield: Encrypted Intent Submitted to Dark Pool"
    );

    const tx = new Transaction().add(memo).add(instruction);
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

    console.log("Encrypted intent confirmed on-chain! Signature:", signature);
    return { signature, encryptedData };
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

    // Add memo for wallet display
    const memo = createMemoInstruction(
      `SwarmShield: Withdraw ${amountSol.toFixed(4)} SOL from vault`
    );

    const tx = new Transaction().add(memo).add(instruction);
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

  // Withdraw USDC (SwarmUSDC) - REAL SPL TOKEN TRANSFER!
  async withdrawUsdc(authority: PublicKey, amount: number): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected");

    const [agentPDA] = findAgentPDA(authority);
    const [vaultPDA] = findVaultPDA();

    // Get user's ATA for SwarmUSDC (create if needed)
    const userUsdcAccount = await getAssociatedTokenAddress(
      SWARM_USDC_MINT,
      authority
    );

    // Amount in token units (6 decimals)
    const amountUnits = new BN(amount * 1e6);

    // Build instruction data: discriminator + amount (u64 le)
    const discriminator = getDiscriminator("withdraw_usdc");
    const data = Buffer.concat([
      discriminator,
      amountUnits.toArrayLike(Buffer, "le", 8),
    ]);

    const tx = new Transaction();

    // Add memo first for wallet display
    const memo = createMemoInstruction(
      `SwarmShield: Withdraw ${amount.toFixed(2)} USDC to wallet`
    );
    tx.add(memo);

    // Check if user has ATA, if not create it
    const userAtaInfo = await this.connection.getAccountInfo(userUsdcAccount);
    if (!userAtaInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          authority, // payer
          userUsdcAccount, // ata
          authority, // owner
          SWARM_USDC_MINT // mint
        )
      );
    }

    // Add withdraw instruction
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: agentPDA, isSigner: false, isWritable: true },
        { pubkey: userUsdcAccount, isSigner: false, isWritable: true },
        { pubkey: VAULT_USDC_ACCOUNT, isSigner: false, isWritable: true },
        { pubkey: vaultPDA, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: SWARM_SHIELD_PROGRAM_ID,
      data,
    });

    tx.add(instruction);
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

  // Get user's SwarmUSDC balance (real tokens)
  async getSwarmUsdcBalance(owner: PublicKey): Promise<number> {
    try {
      const ata = await getAssociatedTokenAddress(SWARM_USDC_MINT, owner);
      const balance = await this.connection.getTokenAccountBalance(ata);
      return parseFloat(balance.value.uiAmountString || "0");
    } catch {
      return 0;
    }
  }

  // Deposit USDC (SwarmUSDC) from wallet to shielded vault
  async depositUsdc(authority: PublicKey, amount: number): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected");

    const [agentPDA] = findAgentPDA(authority);

    // Get user's ATA for SwarmUSDC
    const userUsdcAccount = await getAssociatedTokenAddress(
      SWARM_USDC_MINT,
      authority
    );

    // Amount in token units (6 decimals)
    const amountUnits = new BN(amount * 1e6);

    // Build instruction data: discriminator + amount (u64 le)
    const discriminator = getDiscriminator("deposit_usdc");
    const data = Buffer.concat([
      discriminator,
      amountUnits.toArrayLike(Buffer, "le", 8),
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: agentPDA, isSigner: false, isWritable: true },
        { pubkey: userUsdcAccount, isSigner: false, isWritable: true },
        { pubkey: VAULT_USDC_ACCOUNT, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: SWARM_SHIELD_PROGRAM_ID,
      data,
    });

    // Add memo for wallet display
    const memo = createMemoInstruction(
      `SwarmShield: Deposit ${amount.toFixed(2)} USDC to shielded vault`
    );

    const tx = new Transaction().add(memo).add(instruction);
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
}

// Create client instance
export function createSwarmShieldClient(rpcUrl: string): SwarmShieldClient {
  const connection = new Connection(rpcUrl, "confirmed");
  return new SwarmShieldClient(connection);
}
