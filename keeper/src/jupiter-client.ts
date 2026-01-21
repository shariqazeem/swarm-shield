import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import BN from "bn.js";

// Jupiter API endpoints (using mainnet API for quotes, works for price discovery)
const JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6/quote";
const JUPITER_SWAP_API = "https://quote-api.jup.ag/v6/swap";
const JUPITER_PRICE_API = "https://api.jup.ag/price/v2";

// Token mints
export const SOL_MINT = "So11111111111111111111111111111111111111112";
// Circle USDC Devnet (can request from faucet: https://faucet.circle.com)
export const USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
// Mainnet USDC for price reference
const MAINNET_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Cache for SOL price
let cachedSolPrice: number | null = null;
let lastPriceFetch: number = 0;
const PRICE_CACHE_MS = 30000; // Cache price for 30 seconds

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
   * Fetch live SOL price from CoinGecko API (free, no auth needed)
   * Returns price in USD
   */
  async getLiveSolPrice(): Promise<number> {
    const now = Date.now();

    // Return cached price if still valid
    if (cachedSolPrice && (now - lastPriceFetch) < PRICE_CACHE_MS) {
      return cachedSolPrice;
    }

    // Try CoinGecko first (free, reliable)
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
        { headers: { accept: "application/json" } }
      );

      if (response.ok) {
        const data = await response.json() as { solana?: { usd?: number } };
        if (data.solana?.usd) {
          cachedSolPrice = data.solana.usd;
          lastPriceFetch = now;
          console.log(`📊 Live SOL price (CoinGecko): $${cachedSolPrice.toFixed(2)}`);
          return cachedSolPrice;
        }
      }
    } catch (error) {
      console.log("CoinGecko API failed, trying Jupiter...");
    }

    // Fallback to Jupiter
    try {
      const response = await fetch(`${JUPITER_PRICE_API}?ids=${SOL_MINT}`);

      if (response.ok) {
        const data = await response.json() as { data?: { [key: string]: { price?: string } } };
        const solData = data.data?.[SOL_MINT];

        if (solData?.price) {
          cachedSolPrice = parseFloat(solData.price);
          lastPriceFetch = now;
          console.log(`📊 Live SOL price (Jupiter): $${cachedSolPrice.toFixed(2)}`);
          return cachedSolPrice;
        }
      }
    } catch (error) {
      console.log("Jupiter API also failed");
    }

    console.log(`⚠️ Using cached/fallback price: $${cachedSolPrice || 180}`);
    return cachedSolPrice || 180;
  }

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

      const quote = await response.json() as JupiterQuote;
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

      const { swapTransaction } = await swapResponse.json() as { swapTransaction: string };

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

  /**
   * Estimate output with realistic SOL/USDC rate for devnet simulation
   * @param inputAmount - Input amount in smallest units (lamports for SOL, 6 decimals for USDC)
   * @param direction - "sell" means selling SOL for USDC, "buy" means buying SOL with USDC
   * @param slippageBps - Slippage in basis points (default 50 = 0.5%)
   * @param solPrice - Live SOL price in USDC (optional, will use cached if not provided)
   */
  estimateOutputWithRate(
    inputAmount: BN,
    direction: "buy" | "sell",
    slippageBps: number = 50,
    solPrice: number = cachedSolPrice || 180
  ): BN {
    // Use live SOL/USDC rate
    // SOL has 9 decimals (lamports), USDC has 6 decimals
    const SOL_PRICE_USDC = Math.floor(solPrice);

    const slippageFactor = 10000 - slippageBps; // 9950 for 0.5% slippage

    if (direction === "sell") {
      // SELL SOL → GET USDC
      // Convert lamports to USDC: (lamports / 1e9) * price * 1e6 = lamports * price / 1e3
      const usdcAmount = inputAmount.muln(SOL_PRICE_USDC).divn(1000);
      return usdcAmount.muln(slippageFactor).divn(10000);
    } else {
      // BUY SOL → SPEND USDC
      // Convert USDC to lamports: (usdc / 1e6) / price * 1e9 = usdc * 1e3 / price
      const solAmount = inputAmount.muln(1000).divn(SOL_PRICE_USDC);
      return solAmount.muln(slippageFactor).divn(10000);
    }
  }

  /**
   * Estimate output with LIVE price fetching (async version)
   */
  async estimateOutputWithLiveRate(
    inputAmount: BN,
    direction: "buy" | "sell",
    slippageBps: number = 50
  ): Promise<BN> {
    const solPrice = await this.getLiveSolPrice();
    return this.estimateOutputWithRate(inputAmount, direction, slippageBps, solPrice);
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
