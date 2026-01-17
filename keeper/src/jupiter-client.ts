import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import BN from "bn.js";

// Jupiter API endpoints
const JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6/quote";
const JUPITER_SWAP_API = "https://quote-api.jup.ag/v6/swap";

// Token mints
export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
}

export interface SwapResult {
  inputAmount: BN;
  outputAmount: BN;
  signature?: string;
  executed: boolean;
}

export class JupiterClient {
  constructor(
    private connection: Connection,
    private isDevnet: boolean = true
  ) {}

  /**
   * Get a quote from Jupiter for a swap
   */
  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: BN,
    slippageBps: number = 50 // 0.5% slippage
  ): Promise<JupiterQuote | null> {
    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amount.toString(),
        slippageBps: slippageBps.toString(),
      });

      const response = await fetch(`${JUPITER_QUOTE_API}?${params}`);

      if (!response.ok) {
        console.log(`Jupiter quote failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const quote = await response.json();
      return quote;
    } catch (error) {
      console.error("Error fetching Jupiter quote:", error);
      return null;
    }
  }

  /**
   * Execute a swap using Jupiter
   * For mainnet: Real swap with transaction execution
   * For devnet: Realistic simulation (Jupiter API works but lacks liquidity)
   */
  async executeSwap(
    userPublicKey: PublicKey,
    quote: JupiterQuote,
    signerKeypair?: any
  ): Promise<SwapResult> {
    const inputAmount = new BN(quote.inAmount);
    const outputAmount = new BN(quote.outAmount);

    if (this.isDevnet) {
      // DEVNET MODE: Realistic simulation using quote data
      console.log("🔶 DEVNET SWAP SIMULATION (using real quote data)");
      console.log(`   Input: ${inputAmount.toString()} lamports`);
      console.log(`   Expected Output: ${outputAmount.toString()} lamports`);
      console.log(`   Price Impact: ${quote.priceImpactPct}%`);
      console.log(`   Route: ${quote.routePlan.length} hop(s)`);

      // Use quote's actual output amount (already includes slippage)
      // This is realistic because it's based on real Jupiter routing
      return {
        inputAmount,
        outputAmount, // Use Jupiter's calculated output
        executed: false, // Simulated execution
      };
    }

    // MAINNET MODE: Real Jupiter swap with transaction execution
    try {
      console.log("💰 EXECUTING REAL JUPITER SWAP ON MAINNET");

      const swapResponse = await fetch(JUPITER_SWAP_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: userPublicKey.toString(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto",
        }),
      });

      if (!swapResponse.ok) {
        throw new Error(`Jupiter swap API failed: ${swapResponse.statusText}`);
      }

      const { swapTransaction } = await swapResponse.json();

      // Deserialize transaction
      const transactionBuf = Buffer.from(swapTransaction, 'base64');
      let transaction: VersionedTransaction | Transaction;

      try {
        transaction = VersionedTransaction.deserialize(transactionBuf);
      } catch {
        transaction = Transaction.from(transactionBuf);
      }

      // Sign and send transaction if signer provided
      if (signerKeypair) {
        console.log("📝 Signing and sending transaction...");

        // Sign transaction
        if (transaction instanceof VersionedTransaction) {
          transaction.sign([signerKeypair]);
        } else {
          transaction.sign(signerKeypair);
        }

        // Send transaction
        const signature = await this.connection.sendRawTransaction(
          transaction.serialize(),
          {
            skipPreflight: false,
            maxRetries: 3,
          }
        );

        // Wait for confirmation
        await this.connection.confirmTransaction(signature, 'confirmed');

        console.log(`✅ Swap executed! Signature: ${signature}`);

        return {
          inputAmount,
          outputAmount,
          signature,
          executed: true,
        };
      }

      console.log("✅ Jupiter swap transaction prepared (not signed)");
      return {
        inputAmount,
        outputAmount,
        executed: false,
      };
    } catch (error) {
      console.error("❌ Error executing Jupiter swap:", error);
      throw error;
    }
  }

  /**
   * Batch multiple intents into optimal routes
   * Nets buy/sell orders to minimize DEX exposure
   */
  async optimizeBatchRouting(
    buyVolume: BN,
    sellVolume: BN
  ): Promise<{ netVolume: BN; direction: "buy" | "sell" | "balanced" }> {
    // Net internal orders
    if (buyVolume.gt(sellVolume)) {
      return {
        netVolume: buyVolume.sub(sellVolume),
        direction: "buy",
      };
    } else if (sellVolume.gt(buyVolume)) {
      return {
        netVolume: sellVolume.sub(buyVolume),
        direction: "sell",
      };
    } else {
      return {
        netVolume: new BN(0),
        direction: "balanced",
      };
    }
  }

  /**
   * Calculate estimated output with realistic slippage
   */
  estimateOutputWithSlippage(
    inputAmount: BN,
    slippageBps: number = 50
  ): BN {
    // Apply slippage: output = input * (1 - slippage)
    const slippageFactor = 10000 - slippageBps; // 9950 for 0.5% slippage
    return inputAmount.muln(slippageFactor).divn(10000);
  }
}

/**
 * Mock Jupiter client for testing/demo
 */
export class MockJupiterClient extends JupiterClient {
  constructor(connection: Connection) {
    super(connection, true);
  }

  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: BN,
    slippageBps: number = 50
  ): Promise<JupiterQuote> {
    // Return mock quote with realistic values
    const outputAmount = this.estimateOutputWithSlippage(amount, slippageBps);

    return {
      inputMint,
      inAmount: amount.toString(),
      outputMint,
      outAmount: outputAmount.toString(),
      otherAmountThreshold: outputAmount.muln(99).divn(100).toString(), // 1% threshold
      swapMode: "ExactIn",
      slippageBps,
      priceImpactPct: "0.01",
      routePlan: [
        {
          swapInfo: {
            ammKey: "mock-amm",
            label: "Mock Swap",
            inputMint,
            outputMint,
            inAmount: amount.toString(),
            outAmount: outputAmount.toString(),
            feeAmount: amount.muln(25).divn(10000).toString(), // 0.25% fee
            feeMint: inputMint,
          },
          percent: 100,
        },
      ],
    };
  }

  async executeSwap(
    userPublicKey: PublicKey,
    quote: JupiterQuote
  ): Promise<SwapResult> {
    const inputAmount = new BN(quote.inAmount);
    const outputAmount = new BN(quote.outAmount);

    console.log("🎭 MOCK SWAP EXECUTED");
    console.log(`   From: ${quote.inputMint.slice(0, 8)}...`);
    console.log(`   To: ${quote.outputMint.slice(0, 8)}...`);
    console.log(`   In: ${inputAmount.toString()}`);
    console.log(`   Out: ${outputAmount.toString()}`);

    // Simulate 1 second execution time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      inputAmount,
      outputAmount,
      executed: false, // Mock execution
    };
  }
}
