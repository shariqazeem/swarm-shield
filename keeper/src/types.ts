import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export interface TradeIntent {
  pubkey: PublicKey;
  agent: PublicKey;
  intentType: number; // 0 = BUY, 1 = SELL
  amount: BN;
  minOutput: BN;
  expirySlot: BN;
  isPending: boolean;
}

export interface BatchCandidate {
  intents: TradeIntent[];
  totalBuyVolume: BN;
  totalSellVolume: BN;
  canExecute: boolean;
}

export interface ExecutionResult {
  batchId: number;
  intentCount: number;
  totalInput: BN;
  totalOutput: BN;
  mevSaved: BN;
  signature: string;
}
