/**
 * SwarmShield Multi-Token Configuration
 *
 * Supports multiple tokens on Solana devnet for dark pool trading.
 * Each token has verified mint addresses and proper decimal handling.
 */

import { PublicKey } from "@solana/web3.js";

export interface TokenConfig {
  symbol: string;
  name: string;
  mint: PublicKey;
  decimals: number;
  logoUrl: string;
  coingeckoId?: string;
  faucetUrl?: string;
  isNative?: boolean;
}

/**
 * Supported tokens on Solana Devnet
 *
 * Note: Jupiter has limited liquidity on devnet.
 * For hackathon demo, we focus on SOL/USDC pair which works reliably.
 */
export const DEVNET_TOKENS: Record<string, TokenConfig> = {
  SOL: {
    symbol: "SOL",
    name: "Solana",
    mint: new PublicKey("So11111111111111111111111111111111111111112"),
    decimals: 9,
    logoUrl: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    coingeckoId: "solana",
    isNative: true,
  },

  // Circle USDC Devnet - Get from https://faucet.circle.com
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    mint: new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
    decimals: 6,
    logoUrl: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    coingeckoId: "usd-coin",
    faucetUrl: "https://faucet.circle.com",
  },

  // SwarmUSDC - Our custom token for the dark pool
  SWARM_USDC: {
    symbol: "sUSDC",
    name: "SwarmShield USDC",
    mint: new PublicKey("8ypRqPnaiegfw9if3R2JZpqLsfr4YHjfPtxUz8YgdkuJ"),
    decimals: 6,
    logoUrl: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },

  // Bonk - Popular memecoin (devnet version may have limited liquidity)
  BONK: {
    symbol: "BONK",
    name: "Bonk",
    mint: new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
    decimals: 5,
    logoUrl: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
    coingeckoId: "bonk",
  },

  // Wrapped Bitcoin (devnet)
  WBTC: {
    symbol: "wBTC",
    name: "Wrapped Bitcoin",
    mint: new PublicKey("3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh"),
    decimals: 8,
    logoUrl: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh/logo.png",
    coingeckoId: "wrapped-bitcoin",
  },

  // Wrapped Ethereum (devnet)
  WETH: {
    symbol: "wETH",
    name: "Wrapped Ethereum",
    mint: new PublicKey("7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"),
    decimals: 8,
    logoUrl: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/logo.png",
    coingeckoId: "ethereum",
  },
};

/**
 * Primary trading pairs for the dark pool
 * These are the main pairs with best liquidity
 */
export const TRADING_PAIRS = [
  { base: "SOL", quote: "USDC", active: true },
  { base: "SOL", quote: "SWARM_USDC", active: true },
  { base: "BONK", quote: "SOL", active: false }, // Limited liquidity on devnet
  { base: "WBTC", quote: "USDC", active: false },
  { base: "WETH", quote: "USDC", active: false },
];

/**
 * Get token by symbol
 */
export function getToken(symbol: string): TokenConfig | undefined {
  return DEVNET_TOKENS[symbol];
}

/**
 * Get token by mint address
 */
export function getTokenByMint(mint: PublicKey | string): TokenConfig | undefined {
  const mintStr = typeof mint === "string" ? mint : mint.toBase58();
  return Object.values(DEVNET_TOKENS).find(
    (token) => token.mint.toBase58() === mintStr
  );
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(
  amount: number | bigint,
  token: TokenConfig,
  maxDecimals?: number
): string {
  const value = typeof amount === "bigint"
    ? Number(amount) / Math.pow(10, token.decimals)
    : amount / Math.pow(10, token.decimals);

  const decimals = maxDecimals ?? (token.decimals > 4 ? 4 : token.decimals);
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Parse token amount from display to smallest unit
 */
export function parseTokenAmount(
  displayAmount: string | number,
  token: TokenConfig
): bigint {
  const value = typeof displayAmount === "string"
    ? parseFloat(displayAmount)
    : displayAmount;
  return BigInt(Math.floor(value * Math.pow(10, token.decimals)));
}

/**
 * Get all active trading pairs
 */
export function getActiveTradingPairs() {
  return TRADING_PAIRS.filter((pair) => pair.active);
}

/**
 * Token icons as data URIs for offline support
 */
export const TOKEN_ICONS = {
  SOL: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="a" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#00FFA3"/><stop offset="100%" style="stop-color:#DC1FFF"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#a)"/><path d="M28 62l10-10h34l-10 10H28zm0-14l10-10h34l-10 10H28zm44-14l-10 10H28l10-10h34z" fill="white"/></svg>`)}`,
  USDC: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#2775CA"/><path d="M50 20c-16.5 0-30 13.5-30 30s13.5 30 30 30 30-13.5 30-30-13.5-30-30-30zm0 55c-13.8 0-25-11.2-25-25s11.2-25 25-25 25 11.2 25 25-11.2 25-25 25z" fill="white"/><text x="50" y="58" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">$</text></svg>`)}`,
};

export default DEVNET_TOKENS;
