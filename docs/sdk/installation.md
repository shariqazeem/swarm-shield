# Installation

Complete setup guide for the SwarmShield Agent SDK.

## Requirements

- Node.js 18+ or Bun 1.0+
- npm, yarn, or pnpm
- A Solana wallet keypair

## Package Installation

### Using npm

```bash
npm install @solana/web3.js tweetnacl bn.js @coral-xyz/anchor
```

### Using yarn

```bash
yarn add @solana/web3.js tweetnacl bn.js @coral-xyz/anchor
```

### Using pnpm

```bash
pnpm add @solana/web3.js tweetnacl bn.js @coral-xyz/anchor
```

## TypeScript Configuration

Add these types for full TypeScript support:

```bash
npm install -D @types/node
```

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true
  }
}
```

## Environment Setup

### 1. RPC Endpoint

SwarmShield works best with premium RPC providers:

```typescript
// Helius (Recommended)
const RPC_URL = "https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY";

// QuickNode
const RPC_URL = "https://your-endpoint.solana-devnet.quiknode.pro/YOUR_TOKEN/";

// Public (rate limited)
const RPC_URL = "https://api.devnet.solana.com";
```

### 2. Wallet Keypair

For agents, you'll need a keypair:

```typescript
import { Keypair } from "@solana/web3.js";
import fs from "fs";

// Option 1: Generate new keypair
const keypair = Keypair.generate();
console.log("Public key:", keypair.publicKey.toBase58());

// Option 2: Load from file
const secretKey = JSON.parse(fs.readFileSync("./keypair.json", "utf-8"));
const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));

// Option 3: From environment variable
const secretKey = JSON.parse(process.env.SOLANA_PRIVATE_KEY!);
const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
```

### 3. Configuration File

Create a `swarmshield.config.ts`:

```typescript
export const config = {
  // Program addresses
  programId: "5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew",
  usdcMint: "8ypRqPnaiegfw9if3R2JZpqLsfr4YHjfPtxUz8YgdkuJ",

  // Keeper's public key for encryption
  keeperPublicKey: "HVCMy6JvMAsk0CnDRLaahk7o/ShOgaoWuwCrs9E1PlE=",

  // RPC configuration
  rpcUrl: process.env.RPC_URL || "https://api.devnet.solana.com",

  // Default settings
  defaultSlippageBps: 100,  // 1%
  confirmationCommitment: "confirmed" as const,
};
```

## Verification

Test your setup with this script:

```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";

async function verifySetup() {
  console.log("Verifying SwarmShield SDK setup...\n");

  // 1. Check connection
  const connection = new Connection("https://api.devnet.solana.com");
  const version = await connection.getVersion();
  console.log("✅ Solana connection:", version["solana-core"]);

  // 2. Check program exists
  const programId = new PublicKey("5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew");
  const programInfo = await connection.getAccountInfo(programId);
  console.log("✅ Program found:", programInfo?.executable ? "Yes" : "No");

  // 3. Check NaCl encryption
  const testKeypair = nacl.box.keyPair();
  console.log("✅ NaCl working:", testKeypair.publicKey.length === 32);

  // 4. Test encryption
  const message = new Uint8Array([1, 2, 3, 4, 5]);
  const nonce = nacl.randomBytes(24);
  const ciphertext = nacl.box(
    message,
    nonce,
    testKeypair.publicKey,
    testKeypair.secretKey
  );
  console.log("✅ Encryption working:", ciphertext.length > 0);

  console.log("\n🎉 Setup verified successfully!");
}

verifySetup().catch(console.error);
```

Run with:

```bash
npx ts-node verify-setup.ts
# or
bun verify-setup.ts
```

Expected output:

```
Verifying SwarmShield SDK setup...

✅ Solana connection: 1.18.x
✅ Program found: Yes
✅ NaCl working: true
✅ Encryption working: true

🎉 Setup verified successfully!
```

## Project Structure

Recommended structure for agent projects:

```
my-trading-agent/
├── src/
│   ├── index.ts           # Main entry point
│   ├── swarmshield.ts     # SwarmShield integration
│   ├── encryption.ts      # Encryption utilities
│   └── config.ts          # Configuration
├── package.json
├── tsconfig.json
└── .env                   # Environment variables
```

## Environment Variables

Create a `.env` file:

```bash
# RPC Configuration
RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Wallet (use with caution)
SOLANA_PRIVATE_KEY=[1,2,3,...,64]

# Optional: Custom endpoints
QUICKNODE_ENDPOINT=https://...
HELIUS_API_KEY=your_api_key
```

::: warning Security
Never commit `.env` files or private keys to version control. Add `.env` to your `.gitignore`.
:::

## Troubleshooting

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Update TypeScript
npm install -D typescript@latest

# Regenerate types
npx tsc --init
```

### Connection Issues

- Verify RPC URL is correct
- Check network (devnet vs mainnet)
- Try a different RPC provider

## Next Steps

- [Quick Start](/sdk/quickstart) - Basic usage example
- [API Reference](/sdk/api-reference) - Full API documentation
- [Frameworks](/sdk/frameworks) - Framework integrations
