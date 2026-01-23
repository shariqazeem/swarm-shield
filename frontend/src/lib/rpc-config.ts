/**
 * ============================================================================
 * RPC CONFIGURATION - PRIVACY HACK 2026 SPONSOR INTEGRATIONS
 * ============================================================================
 *
 * This module integrates multiple RPC providers for the hackathon:
 *
 * [x] HELIUS ($5,000 Bounty) - High-performance RPC + Photon indexer
 * [x] QUICKNODE ($3,000 Bounty) - Reliable infrastructure
 *
 * @see https://www.helius.dev/docs
 * @see https://www.quicknode.com/docs
 * ============================================================================
 */

import { Connection } from '@solana/web3.js';

// =============================================================================
// HELIUS INTEGRATION ($5,000 BOUNTY)
// Using Helius for:
// - High-performance RPC endpoint
// - Photon indexer for ZK Compression (Light Protocol)
// - Priority fee estimation for MEV protection
// - Enhanced transaction parsing
// =============================================================================

export const HELIUS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_HELIUS_API_KEY || '873c5824-7255-40c9-9a39-4d3d04efe717',
  rpcUrl: `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY || '873c5824-7255-40c9-9a39-4d3d04efe717'}`,
  wsUrl: `wss://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY || '873c5824-7255-40c9-9a39-4d3d04efe717'}`,
  apiUrl: 'https://api.helius.xyz/v0',
  features: {
    photonIndexer: true,      // ZK Compression indexing
    priorityFees: true,       // Dynamic fee estimation
    enhancedApis: true,       // DAS, webhooks, etc.
    compression: true,        // Compressed account support
  },
};

// =============================================================================
// QUICKNODE INTEGRATION ($3,000 BOUNTY)
// Using QuickNode for:
// - Reliable backup RPC
// - High availability
// - Fast response times
// =============================================================================

export const QUICKNODE_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_QUICKNODE_ENDPOINT || 'https://summer-maximum-frost.solana-devnet.quiknode.pro/e554493359261712cfdbfb439ee262f26dafc4ec/',
  token: process.env.NEXT_PUBLIC_QUICKNODE_TOKEN || 'e554493359261712cfdbfb439ee262f26dafc4ec',
  features: {
    highAvailability: true,
    fastResponses: true,
    reliableInfra: true,
  },
};

// =============================================================================
// ACTIVE RPC SELECTION
// Primary: Helius (for Photon indexer + $5k bounty)
// Fallback: QuickNode (for reliability + $3k bounty)
// =============================================================================

export type RpcProvider = 'helius' | 'quicknode' | 'default';

export function getActiveRpcUrl(): string {
  // Primary: QuickNode RPC (Privacy Hack $3k bounty - best browser CORS support)
  // Helius used for enhanced APIs (Photon indexer, priority fees)
  return QUICKNODE_CONFIG.endpoint;
}

export function getBackupRpcUrl(): string {
  // Backup: QuickNode (Privacy Hack $3k bounty)
  return QUICKNODE_CONFIG.endpoint;
}

/**
 * Create a Solana connection with sponsor RPC
 * Uses QuickNode as primary for reliability, Helius for enhanced APIs
 */
export function createConnection(): Connection {
  const rpcUrl = getActiveRpcUrl();
  console.log('Connected to QuickNode RPC (Privacy Hack $3k bounty)');
  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Create a backup connection with QuickNode
 */
export function createBackupConnection(): Connection {
  const rpcUrl = getBackupRpcUrl();
  console.log('⚡ Connected to QuickNode RPC (Privacy Hack $3k bounty)');
  return new Connection(rpcUrl, 'confirmed');
}

// =============================================================================
// HELIUS ENHANCED APIs
// These provide additional functionality for the hackathon demo
// =============================================================================

export class HeliusApi {
  private apiKey: string;
  private baseUrl: string;
  private rpcUrl: string;

  constructor() {
    this.apiKey = HELIUS_CONFIG.apiKey;
    this.baseUrl = HELIUS_CONFIG.apiUrl;
    this.rpcUrl = HELIUS_CONFIG.rpcUrl;
  }

  /**
   * Get priority fee estimate for MEV protection
   * SwarmShield uses this to ensure fast batch execution
   */
  async getPriorityFeeEstimate(accountKeys: string[]): Promise<{
    priorityFeeEstimate: number;
    priorityFeeLevels: {
      min: number;
      low: number;
      medium: number;
      high: number;
      veryHigh: number;
      unsafeMax: number;
    };
  }> {
    const response = await fetch(`${this.baseUrl}/priority-fee?api-key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountKeys,
        options: { includeAllPriorityFeeLevels: true },
      }),
    });

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Parse transaction with enhanced metadata
   * Used for displaying transaction details in UI
   */
  async parseTransaction(signature: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/transactions?api-key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: [signature] }),
    });

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get compressed account info via Photon indexer
   * CRITICAL for Light Protocol ZK Compression ($18k Open Track)
   */
  async getCompressedAccount(address: string): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'swarmshield-compression',
        method: 'getCompressedAccount',
        params: { address },
      }),
    });

    return response.json();
  }

  /**
   * Get multiple compressed accounts
   */
  async getCompressedAccountsByOwner(owner: string): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'swarmshield-compression',
        method: 'getCompressedAccountsByOwner',
        params: { owner },
      }),
    });

    return response.json();
  }

  /**
   * Get compressed token balances
   */
  async getCompressedTokenBalances(owner: string): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'swarmshield-compression',
        method: 'getCompressedTokenBalancesByOwner',
        params: { owner },
      }),
    });

    return response.json();
  }
}

// Singleton instance
let heliusApiInstance: HeliusApi | null = null;

export function getHeliusApi(): HeliusApi {
  if (!heliusApiInstance) {
    heliusApiInstance = new HeliusApi();
  }
  return heliusApiInstance;
}

// =============================================================================
// SPONSOR INTEGRATION STATUS
// For hackathon submission display
// =============================================================================

export interface SponsorIntegration {
  name: string;
  bounty: string;
  status: 'active' | 'configured' | 'pending';
  features: string[];
  url: string;
}

export const SPONSOR_INTEGRATIONS: SponsorIntegration[] = [
  {
    name: 'Helius',
    bounty: '$5,000',
    status: 'active',
    features: ['High-Performance RPC', 'Photon Indexer', 'Priority Fees', 'ZK Compression Support'],
    url: 'https://www.helius.dev',
  },
  {
    name: 'QuickNode',
    bounty: '$3,000',
    status: 'active',
    features: ['Reliable Infrastructure', 'Fast Response Times', 'High Availability'],
    url: 'https://www.quicknode.com',
  },
  {
    name: 'Light Protocol',
    bounty: '$18,000',
    status: 'active',
    features: ['ZK Compression', 'Compressed Accounts', 'Private State', '99% Cost Reduction'],
    url: 'https://www.zkcompression.com',
  },
  {
    name: 'Range',
    bounty: '$1,500',
    status: 'active',
    features: ['Compliance Screening', 'Sanctions Checking', 'Risk Assessment'],
    url: 'https://www.range.org',
  },
  {
    name: 'Anoncoin',
    bounty: '$10,000',
    status: 'active',
    features: ['Dark Liquidity Pools', 'Private Swaps', 'MEV Protection'],
    url: 'https://solana.com/privacyhack',
  },
  {
    name: 'PNP Exchange',
    bounty: '$2,500',
    status: 'active',
    features: ['AI Agents', 'Privacy Tokens', 'Prediction Markets'],
    url: 'https://x.com/predictandpump',
  },
];

export function getTotalBountyPotential(): string {
  const total = SPONSOR_INTEGRATIONS.reduce((sum, s) => {
    const amount = parseInt(s.bounty.replace(/[$,]/g, ''));
    return sum + amount;
  }, 0);
  return `$${total.toLocaleString()}`;
}
