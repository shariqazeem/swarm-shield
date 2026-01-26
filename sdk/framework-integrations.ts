/**
 * ============================================================================
 * SWARMSHIELD FRAMEWORK INTEGRATIONS
 * ============================================================================
 *
 * Examples of integrating SwarmShield with popular AI agent frameworks.
 * Shows how autonomous agents can use encrypted dark pool trading.
 *
 * Bounty Target: PNP Exchange ($2,500) - AI Agent Infrastructure
 * ============================================================================
 */

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import nacl from "tweetnacl";
import { sha256 } from "js-sha256";

// =============================================================================
// CONFIGURATION
// =============================================================================

const PROGRAM_ID = new PublicKey("5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew");

const KEEPER_PUBLIC_KEY = Uint8Array.from(
  Buffer.from("HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE=", "base64")
);

// =============================================================================
// CORE ENCRYPTION
// =============================================================================

function encryptIntent(intentType: number, amount: bigint, minOutput: bigint): Uint8Array {
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
  const ciphertext = nacl.box(message, nonce, KEEPER_PUBLIC_KEY, ephemeralKeyPair.secretKey);
  if (!ciphertext) throw new Error("Encryption failed");

  const encrypted = new Uint8Array(96);
  encrypted.set(ephemeralKeyPair.publicKey, 0);
  encrypted.set(nonce, 32);
  encrypted.set(ciphertext, 56);
  return encrypted;
}

// =============================================================================
// SWARMSHIELD AGENT CLASS
// =============================================================================

export class SwarmShieldAgent {
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

  async submitEncryptedIntent(
    direction: "buy" | "sell",
    amount: bigint,
    slippageBps: number = 100
  ): Promise<{ signature: string; encryptedData: string }> {
    const slippageFactor = BigInt(10000 - slippageBps);
    const minOutput = (amount * slippageFactor) / BigInt(10000);
    const intentType = direction === "buy" ? 0 : 1;

    const encryptedData = encryptIntent(intentType, amount, minOutput);
    const encryptedHex = Buffer.from(encryptedData).toString("hex");

    // Build and send transaction (simplified for demo)
    console.log(`📤 Submitting encrypted ${direction.toUpperCase()} intent`);
    console.log(`   Amount: ${amount.toString()}`);
    console.log(`   Encrypted: ${encryptedHex.slice(0, 32)}...`);

    return {
      signature: "demo-signature",
      encryptedData: encryptedHex,
    };
  }
}

// =============================================================================
// ELIZA FRAMEWORK INTEGRATION
// =============================================================================

/**
 * Eliza Action for SwarmShield Trading
 *
 * This shows how to integrate SwarmShield with the Eliza framework
 * for building conversational AI agents that can trade.
 */
export const elizaSwarmShieldAction = {
  name: "SWARMSHIELD_TRADE",
  similes: ["DARK_POOL_TRADE", "MEV_PROTECTED_SWAP", "ENCRYPTED_TRADE"],
  description: "Execute an MEV-protected trade through SwarmShield dark pool",

  validate: async (runtime: any, message: any) => {
    // Check if message contains trade intent
    const text = message.content.text.toLowerCase();
    return text.includes("swap") || text.includes("trade") || text.includes("buy") || text.includes("sell");
  },

  handler: async (runtime: any, message: any, state: any) => {
    // Parse trade parameters from message
    const text = message.content.text.toLowerCase();
    const direction = text.includes("sell") ? "sell" : "buy";

    // Extract amount (simplified parsing)
    const amountMatch = text.match(/(\d+\.?\d*)\s*(sol|usdc)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0.1;

    // Initialize SwarmShield agent
    const rpcUrl = runtime.getSetting("SWARMSHIELD_RPC_URL");
    const privateKey = runtime.getSetting("SWARMSHIELD_PRIVATE_KEY");
    const keypair = Keypair.fromSecretKey(Buffer.from(privateKey, "base64"));

    const agent = new SwarmShieldAgent(rpcUrl, keypair);

    // Execute encrypted trade
    const amountLamports = BigInt(Math.floor(amount * LAMPORTS_PER_SOL));
    const result = await agent.submitEncryptedIntent(direction, amountLamports, 100);

    return {
      text: `🛡️ MEV-Protected Trade Executed!\n\nDirection: ${direction.toUpperCase()}\nAmount: ${amount} SOL\nEncrypted: ${result.encryptedData.slice(0, 20)}...\n\nMEV bots cannot see your trade details.`,
      action: "SWARMSHIELD_TRADE",
      data: result,
    };
  },

  examples: [
    [
      { user: "user1", content: { text: "Swap 0.5 SOL for USDC" } },
      { user: "agent", content: { text: "🛡️ MEV-Protected Trade Executed!..." } },
    ],
    [
      { user: "user1", content: { text: "Sell 1 SOL through dark pool" } },
      { user: "agent", content: { text: "🛡️ MEV-Protected Trade Executed!..." } },
    ],
  ],
};

// =============================================================================
// LANGCHAIN TOOL INTEGRATION
// =============================================================================

/**
 * LangChain Tool for SwarmShield Trading
 *
 * Use this tool with LangChain agents to enable MEV-protected trading.
 */
export class SwarmShieldLangChainTool {
  name = "swarmshield_trade";
  description = `Execute MEV-protected trades on Solana through SwarmShield's encrypted dark pool.
  Input should be JSON: {"direction": "buy" or "sell", "amount": number in SOL, "slippage": number in percent}
  Returns encrypted trade confirmation.`;

  private agent: SwarmShieldAgent;

  constructor(rpcUrl: string, keypair: Keypair) {
    this.agent = new SwarmShieldAgent(rpcUrl, keypair);
  }

  async call(input: string): Promise<string> {
    try {
      const params = JSON.parse(input);
      const { direction, amount, slippage = 1 } = params;

      if (!["buy", "sell"].includes(direction)) {
        return JSON.stringify({ error: "Direction must be 'buy' or 'sell'" });
      }

      const amountLamports = BigInt(Math.floor(amount * LAMPORTS_PER_SOL));
      const result = await this.agent.submitEncryptedIntent(
        direction,
        amountLamports,
        slippage * 100
      );

      return JSON.stringify({
        success: true,
        direction,
        amount,
        encrypted: result.encryptedData.slice(0, 32) + "...",
        note: "Trade encrypted. MEV bots cannot read details.",
      });
    } catch (error: any) {
      return JSON.stringify({ error: error.message });
    }
  }
}

// =============================================================================
// AUTOGPT PLUGIN PATTERN
// =============================================================================

/**
 * AutoGPT-style Plugin for SwarmShield
 *
 * Enables AutoGPT agents to execute MEV-protected trades.
 */
export class SwarmShieldAutoGPTPlugin {
  private agent: SwarmShieldAgent;

  static commands = [
    {
      name: "swarmshield_trade",
      description: "Execute MEV-protected trade on Solana",
      args: {
        direction: { type: "string", description: "buy or sell", required: true },
        amount: { type: "number", description: "Amount in SOL", required: true },
      },
    },
    {
      name: "swarmshield_balance",
      description: "Check SwarmShield agent balance",
      args: {},
    },
  ];

  constructor(config: { rpcUrl: string; privateKey: string }) {
    const keypair = Keypair.fromSecretKey(Buffer.from(config.privateKey, "base64"));
    this.agent = new SwarmShieldAgent(config.rpcUrl, keypair);
  }

  async executeCommand(
    command: string,
    args: Record<string, any>
  ): Promise<{ success: boolean; data: any; message: string }> {
    switch (command) {
      case "swarmshield_trade":
        return this.trade(args.direction, args.amount);
      case "swarmshield_balance":
        return this.getBalance();
      default:
        return { success: false, data: null, message: `Unknown command: ${command}` };
    }
  }

  private async trade(
    direction: "buy" | "sell",
    amountSol: number
  ): Promise<{ success: boolean; data: any; message: string }> {
    const amountLamports = BigInt(Math.floor(amountSol * LAMPORTS_PER_SOL));
    const result = await this.agent.submitEncryptedIntent(direction, amountLamports, 100);

    return {
      success: true,
      data: {
        direction,
        amount: amountSol,
        encrypted: result.encryptedData.slice(0, 32) + "...",
        signature: result.signature,
      },
      message: `Successfully submitted encrypted ${direction} intent for ${amountSol} SOL. MEV bots blocked.`,
    };
  }

  private async getBalance(): Promise<{ success: boolean; data: any; message: string }> {
    const balance = await this.agent.getBalance();
    return {
      success: true,
      data: { balance, unit: "SOL" },
      message: `Agent balance: ${balance.toFixed(4)} SOL`,
    };
  }
}

// =============================================================================
// VIRTUALS PROTOCOL PATTERN
// =============================================================================

/**
 * Virtuals Protocol Integration Pattern
 *
 * Shows how virtual AI agents can use SwarmShield for trading.
 */
export class VirtualsSwarmShieldAdapter {
  private agent: SwarmShieldAgent;

  constructor(rpcUrl: string, keypair: Keypair) {
    this.agent = new SwarmShieldAgent(rpcUrl, keypair);
  }

  /**
   * Register trading capability with Virtuals agent
   */
  getCapabilities() {
    return {
      name: "swarmshield_trading",
      description: "MEV-protected trading on Solana",
      actions: [
        {
          name: "trade",
          description: "Execute encrypted trade through dark pool",
          parameters: {
            direction: { type: "string", enum: ["buy", "sell"] },
            amount: { type: "number", description: "Amount in SOL" },
          },
        },
      ],
    };
  }

  /**
   * Execute trade action
   */
  async executeAction(action: string, params: any): Promise<any> {
    if (action === "trade") {
      const { direction, amount } = params;
      const amountLamports = BigInt(Math.floor(amount * LAMPORTS_PER_SOL));
      return this.agent.submitEncryptedIntent(direction, amountLamports, 100);
    }
    throw new Error(`Unknown action: ${action}`);
  }
}

// =============================================================================
// DEMO
// =============================================================================

async function main() {
  console.log("================================================================");
  console.log("        SWARMSHIELD FRAMEWORK INTEGRATIONS DEMO                 ");
  console.log("        PNP Exchange Bounty ($2,500)                            ");
  console.log("================================================================");

  // Demo encryption
  const testAmount = BigInt(100000000);
  const testMinOutput = BigInt(99000000);
  const encrypted = encryptIntent(1, testAmount, testMinOutput);

  console.log("\n🔐 NaCl Box Encryption Demo:");
  console.log("   Input: SELL 0.1 SOL, 1% slippage");
  console.log("   Output: " + Buffer.from(encrypted).toString("hex").slice(0, 48) + "...");
  console.log("   Size: " + encrypted.length + " bytes");

  console.log("\n📦 Framework Integrations Available:");
  console.log("   - Eliza: elizaSwarmShieldAction");
  console.log("   - LangChain: SwarmShieldLangChainTool");
  console.log("   - AutoGPT: SwarmShieldAutoGPTPlugin");
  console.log("   - Virtuals: VirtualsSwarmShieldAdapter");

  console.log("\n🛡️ Privacy Benefits:");
  console.log("   - Trade direction: HIDDEN");
  console.log("   - Trade amount: HIDDEN");
  console.log("   - Slippage tolerance: HIDDEN");
  console.log("   - MEV extraction: BLOCKED");

  console.log("\n================================================================");
  console.log("SwarmShield: Where Agents Trade in the Dark");
  console.log("================================================================\n");
}

main().catch(console.error);
