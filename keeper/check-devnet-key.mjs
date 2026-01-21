import { Keypair } from '@solana/web3.js';
const secret = [133,174,222,79,24,243,27,248,53,130,245,127,244,253,28,103,97,205,52,227,252,223,93,2,104,95,85,91,243,3,144,42,66,58,253,239,230,224,95,47,203,146,227,47,242,104,245,219,238,216,234,249,84,174,211,201,253,166,65,200,156,115,8,30];
const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
console.log('Public Key:', keypair.publicKey.toBase58());
