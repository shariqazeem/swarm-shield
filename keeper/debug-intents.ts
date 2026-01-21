import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

const SWARM_SHIELD_PROGRAM_ID = new PublicKey(
  "F5zRCquhMHFrGJjrgmSoMmv1Pdo6N1io4eRA5H8UcVZu"
);

async function debugIntents() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  console.log("🔍 Querying ALL program accounts...\n");

  // Get ALL accounts owned by the program
  const allAccounts = await connection.getProgramAccounts(
    SWARM_SHIELD_PROGRAM_ID
  );

  console.log(`Total accounts: ${allAccounts.length}\n`);

  let intentCount = 0;
  let configCount = 0;
  let batchCount = 0;
  let agentCount = 0;
  let otherCount = 0;

  for (const { pubkey, account } of allAccounts) {
    const discriminator = account.data.slice(0, 8);
    const discHex = discriminator.toString("hex");

    // Try to determine account type by size
    const dataLength = account.data.length;

    if (dataLength === 99) {
      // Config account (8 discriminator + 91 data)
      configCount++;
      console.log(`[CONFIG] ${pubkey.toBase58()}`);
    } else if (dataLength === 67) {
      // TradeIntent account (8 discriminator + 59 data)
      intentCount++;

      const data = account.data.slice(8);
      const agent = new PublicKey(data.slice(0, 32));
      const intentType = data[32];
      const amount = new BN(data.slice(33, 41), "le");
      const minOutput = new BN(data.slice(41, 49), "le");
      const expirySlot = new BN(data.slice(49, 57), "le");
      const isPending = data[57] === 1;

      console.log(`[INTENT #${intentCount}] ${pubkey.toBase58()}`);
      console.log(`  Agent: ${agent.toBase58()}`);
      console.log(`  Type: ${intentType === 0 ? "BUY_SOL" : "SELL_SOL"}`);
      console.log(`  Amount: ${amount.toNumber() / 1e9} SOL`);
      console.log(`  Min Output: ${minOutput.toNumber() / 1e9}`);
      console.log(`  Expiry Slot: ${expirySlot.toString()}`);
      console.log(`  Is Pending: ${isPending ? "✅ YES" : "❌ NO"}`);
      console.log();
    } else if (dataLength === 65) {
      // AgentAccount (8 discriminator + 57 data)
      agentCount++;
      console.log(`[AGENT] ${pubkey.toBase58()}`);
    } else if (dataLength === 49) {
      // Batch account (8 discriminator + 41 data)
      batchCount++;
      console.log(`[BATCH] ${pubkey.toBase58()}`);
    } else {
      otherCount++;
      console.log(`[UNKNOWN] ${pubkey.toBase58()} - Size: ${dataLength} bytes, Disc: ${discHex}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY:");
  console.log("=".repeat(60));
  console.log(`Config accounts: ${configCount}`);
  console.log(`Agent accounts: ${agentCount}`);
  console.log(`Intent accounts: ${intentCount}`);
  console.log(`Batch accounts: ${batchCount}`);
  console.log(`Unknown accounts: ${otherCount}`);
  console.log(`Total: ${allAccounts.length}`);
  console.log("=".repeat(60));

  // Get current slot
  const currentSlot = await connection.getSlot();
  console.log(`\nCurrent Slot: ${currentSlot}`);
}

debugIntents().catch(console.error);
