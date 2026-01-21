import { Keypair } from '@solana/web3.js';
const secret = [136,20,189,178,161,20,2,14,140,92,137,179,71,152,246,115,46,28,177,45,211,126,254,237,188,135,126,58,42,249,133,194,218,59,105,210,168,58,147,136,190,63,253,134,22,231,222,187,197,230,135,110,132,33,139,13,55,195,148,12,102,5,180,220];
const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
console.log('Public Key:', keypair.publicKey.toBase58());
