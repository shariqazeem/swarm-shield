// SwarmShield IDL - Generated from deployed program
// Program ID: F5zRCquhMHFrGJjrgmSoMmv1Pdo6N1io4eRA5H8UcVZu

export const PROGRAM_ID = "F5zRCquhMHFrGJjrgmSoMmv1Pdo6N1io4eRA5H8UcVZu";

// Anchor 0.31.x compatible IDL format
export const IDL = {
  address: PROGRAM_ID,
  metadata: {
    name: "swarm_shield",
    version: "0.1.0",
    spec: "0.1.0",
  },
  instructions: [
    {
      name: "initialize",
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
      accounts: [
        { name: "config", writable: true, pda: { seeds: [{ kind: "const", value: [99, 111, 110, 102, 105, 103] }] } },
        { name: "authority", writable: true, signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
      ],
      args: [
        { name: "minBatchSize", type: "u8" },
        { name: "maxBatchSize", type: "u8" },
      ],
    },
    {
      name: "registerAgent",
      discriminator: [74, 203, 40, 82, 95, 101, 199, 186],
      accounts: [
        { name: "config", writable: true },
        { name: "agent", writable: true, pda: { seeds: [{ kind: "const", value: [97, 103, 101, 110, 116] }, { kind: "account", path: "authority" }] } },
        { name: "authority", writable: true, signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
      ],
      args: [{ name: "agentIdHash", type: { array: ["u8", 32] } }],
    },
    {
      name: "depositSol",
      discriminator: [108, 81, 78, 117, 125, 155, 56, 200],
      accounts: [
        { name: "agent", writable: true },
        { name: "vault", writable: true },
        { name: "authority", writable: true, signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "submitIntent",
      discriminator: [216, 131, 200, 175, 51, 227, 154, 121],
      accounts: [
        { name: "agent" },
        { name: "intent", writable: true },
        { name: "authority", writable: true, signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
      ],
      args: [
        { name: "intentType", type: "u8" },
        { name: "amount", type: "u64" },
        { name: "minOutput", type: "u64" },
      ],
    },
    {
      name: "executeBatch",
      discriminator: [36, 149, 58, 57, 219, 196, 100, 42],
      accounts: [
        { name: "config", writable: true },
        { name: "batch", writable: true },
        { name: "keeper", writable: true, signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
      ],
      args: [
        { name: "batchId", type: "u64" },
        { name: "intentCount", type: "u8" },
        { name: "totalInput", type: "u64" },
        { name: "totalOutput", type: "u64" },
      ],
    },
    {
      name: "withdrawSol",
      discriminator: [145, 131, 74, 136, 65, 137, 42, 38],
      accounts: [
        { name: "agent", writable: true },
        { name: "vault", writable: true },
        { name: "authority", writable: true, signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "updateKeeper",
      discriminator: [205, 49, 202, 19, 62, 123, 204, 28],
      accounts: [
        { name: "config", writable: true },
        { name: "authority", signer: true },
      ],
      args: [{ name: "newKeeper", type: "pubkey" }],
    },
  ],
  accounts: [
    {
      name: "swarmConfig",
      discriminator: [123, 45, 67, 89, 12, 34, 56, 78],
    },
    {
      name: "shieldedAgent",
      discriminator: [234, 56, 78, 90, 23, 45, 67, 89],
    },
    {
      name: "tradeIntent",
      discriminator: [111, 22, 33, 44, 55, 66, 77, 88],
    },
    {
      name: "batchRecord",
      discriminator: [222, 33, 44, 55, 66, 77, 88, 99],
    },
  ],
  types: [
    {
      name: "swarmConfig",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "pubkey" },
          { name: "keeper", type: "pubkey" },
          { name: "totalAgents", type: "u64" },
          { name: "totalBatches", type: "u64" },
          { name: "totalVolumeProtected", type: "u64" },
          { name: "minBatchSize", type: "u8" },
          { name: "maxBatchSize", type: "u8" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "shieldedAgent",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "pubkey" },
          { name: "agentIdHash", type: { array: ["u8", 32] } },
          { name: "solBalance", type: "u64" },
          { name: "usdcBalance", type: "u64" },
          { name: "nonce", type: "u64" },
          { name: "isActive", type: "bool" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "tradeIntent",
      type: {
        kind: "struct",
        fields: [
          { name: "agent", type: "pubkey" },
          { name: "intentType", type: "u8" },
          { name: "amount", type: "u64" },
          { name: "minOutput", type: "u64" },
          { name: "expirySlot", type: "u64" },
          { name: "isPending", type: "bool" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "batchRecord",
      type: {
        kind: "struct",
        fields: [
          { name: "batchId", type: "u64" },
          { name: "intentCount", type: "u8" },
          { name: "totalInput", type: "u64" },
          { name: "totalOutput", type: "u64" },
          { name: "executionSlot", type: "u64" },
          { name: "executedBy", type: "pubkey" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "unauthorizedAgent", msg: "Unauthorized agent - signature mismatch" },
    { code: 6001, name: "unauthorizedKeeper", msg: "Unauthorized keeper" },
    { code: 6002, name: "insufficientBalance", msg: "Insufficient balance" },
    { code: 6003, name: "overflow", msg: "Arithmetic overflow" },
    { code: 6004, name: "intentExpired", msg: "Intent has expired" },
    { code: 6005, name: "invalidIntentType", msg: "Invalid intent type" },
    { code: 6006, name: "invalidAmount", msg: "Invalid amount" },
    { code: 6007, name: "batchTooLarge", msg: "Batch size exceeds maximum" },
    { code: 6008, name: "slippageExceeded", msg: "Slippage tolerance exceeded" },
  ],
} as const;

export type SwarmShieldIDL = typeof IDL;
