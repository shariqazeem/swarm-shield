import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import * as dotenv from "dotenv";
import * as crypto from "crypto";

dotenv.config();

const SWARM_SHIELD_PROGRAM_ID = new PublicKey(
  "F5zRCquhMHFrGJjrgmSoMmv1Pdo6N1io4eRA5H8UcVZu"
);

function findConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    SWARM_SHIELD_PROGRAM_ID
  );
}

function getDiscriminator(name: string): Buffer {
  return Buffer.from(
    crypto.createHash("sha256").update(`global:${name}`).digest()
  ).slice(0, 8);
}

async function updateKeeper() {
  const connection = new Connection(
    process.env.RPC_URL || "https://api.devnet.solana.com",
    "confirmed"
  );

  // Load authority keypair (your main wallet)
  const authoritySecret = Uint8Array.from(
    JSON.parse(process.env.KEEPER_PRIVATE_KEY || "[]")
  );
  const authority = Keypair.fromSecretKey(authoritySecret);

  // The new keeper bot public key
  const newKeeperPubkey = authority.publicKey; // Same as authority for now

  console.log("🔧 Updating SwarmShield Keeper Configuration");
  console.log("=".repeat(60));
  console.log(`Authority: ${authority.publicKey.toBase58()}`);
  console.log(`New Keeper: ${newKeeperPubkey.toBase58()}`);
  console.log("=".repeat(60));

  const [configPDA] = findConfigPDA();
  console.log(`Config PDA: ${configPDA.toBase58()}`);

  // Check current config
  const configAccount = await connection.getAccountInfo(configPDA);
  if (!configAccount) {
    console.error("❌ Config account not found!");
    process.exit(1);
  }

  const currentKeeper = new PublicKey(configAccount.data.slice(40, 72));
  console.log(`\nCurrent Keeper: ${currentKeeper.toBase58()}`);
  console.log(`New Keeper: ${newKeeperPubkey.toBase58()}`);

  if (currentKeeper.equals(newKeeperPubkey)) {
    console.log("\n✅ Keeper already set correctly!");
    return;
  }

  // Create update_keeper instruction
  const discriminator = getDiscriminator("update_keeper");
  const data = Buffer.concat([discriminator, newKeeperPubkey.toBuffer()]);

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: configPDA, isSigner: false, isWritable: true },
      { pubkey: authority.publicKey, isSigner: true, isWritable: false },
    ],
    programId: SWARM_SHIELD_PROGRAM_ID,
    data,
  });

  const tx = new Transaction().add(instruction);
  tx.feePayer = authority.publicKey;

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  tx.sign(authority);

  console.log("\n🚀 Sending transaction...");
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  console.log(`📝 Transaction: ${signature}`);
  console.log(`🔗 https://solscan.io/tx/${signature}?cluster=devnet`);

  const confirmation = await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });

  if (confirmation.value.err) {
    console.error("❌ Transaction failed:", confirmation.value.err);
    process.exit(1);
  }

  console.log("\n✅ Keeper updated successfully!");
  console.log("🔄 Restart the keeper bot to apply changes.");
}

updateKeeper().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
