# SwarmShield Demo Video Storyboard

**Target Duration:** 3-4 minutes
**Resolution:** 1080p or 4K
**Tools:** Screen recording (OBS/Loom) + Keynote/Figma for titles

---

## Scene 1: Problem Statement (0:00 - 0:25)

### Visual
- Dark background with dramatic text animation
- Show MEV statistics flowing across screen

### Script
> "Every second, MEV bots extract value from traders on Solana.
> $500 million stolen in 16 months.
> AI agents are their favorite targets - predictable, frequent, valuable.
> Today, I'll show you how SwarmShield stops them."

### Elements
- Text: "$500M+ Extracted"
- Text: "78,800+ Victims"
- Text: "AI Agents = Easy Targets"

---

## Scene 2: The Solution (0:25 - 0:45)

### Visual
- SwarmShield logo animation
- Show encrypted bytes flowing

### Script
> "SwarmShield is a dark liquidity pool with TRUE end-to-end encryption.
> We use NaCl box cryptography - the same encryption used by Signal.
> MEV bots see only random bytes. Zero useful information."

### Elements
- Show: `9bed43a48f60f39e2a857226...`
- Text: "96 bytes of nothing"
- Bounty badge: "$40,000 Target"

---

## Scene 3: Live Demo - MEV Attack Simulation (0:45 - 1:30)

### Visual
- Screen recording of swarmshield.vercel.app
- Click "MEV Attack Demo" button (bottom left, red)

### Script
> "Let me prove it works. Watch this MEV attack simulation.
> On the left - without SwarmShield. Your trade is visible. Sandwich attack steals 3%.
> On the right - with SwarmShield. Encrypted bytes. Attack blocked.
> [Click Run Simulation]
> Watch as we encrypt the intent... MEV bot tries to read... BLOCKED!"

### Steps to Record
1. Go to https://swarmshield.vercel.app
2. Click "MEV Attack Demo" button (bottom left)
3. Explain the side-by-side comparison
4. Click "Run MEV Attack Simulation"
5. Walk through each step as it animates
6. Highlight the "ATTACK BLOCKED" result

---

## Scene 4: Light Protocol ZK Compression (1:30 - 2:00)

### Visual
- Click "ZK Compression" button (purple, bottom left)
- Show Light Protocol SDK integration

### Script
> "For the Light Protocol $18,000 bounty, we integrated the real SDK.
> @lightprotocol/stateless.js version 0.22.
> Watch as we query the Photon indexer live...
> [Click Run Query]
> Connected! See the cost savings? 99.5% reduction with ZK compression.
> This is real infrastructure, not documentation."

### Steps to Record
1. Click "ZK Compression" button
2. Show SDK badge: "@lightprotocol/stateless.js v0.22.0"
3. Click "Run Live Compression Query"
4. Show Photon indexer connection
5. Demonstrate cost savings calculator
6. Show program IDs

---

## Scene 5: Integration Verifier (2:00 - 2:30)

### Visual
- Click "Verify Integrations" button (bottom right)
- Show all bounty integrations tested live

### Script
> "For judges, we built an integration verifier. Every sponsor integration is testable.
> [Click Run All Tests]
> Helius RPC - connected.
> Light Protocol SDK - real queries.
> QuickNode - backup ready.
> Range compliance - API working.
> NaCl encryption - live demo.
> $40,000 in bounties. All verified."

### Steps to Record
1. Click "Verify Integrations" button
2. Click "Run All Tests"
3. Show each integration passing with latency
4. Highlight the response details for each

---

## Scene 6: Submit Encrypted Intent (2:30 - 3:00)

### Visual
- Connect wallet
- Submit a trade through the interface

### Script
> "Now let's trade. Connect wallet... Range compliance check passes...
> Select SELL, enter amount, submit.
> Watch - the button says 'Encrypting'.
> Done! See this hex string? That's what's on-chain.
> Click 'View on Solscan' to verify. 96 bytes of encrypted ciphertext."

### Steps to Record
1. Connect Phantom wallet
2. Show Range compliance check
3. Navigate to trade interface
4. Submit encrypted intent
5. Show encrypted data preview
6. Click Solscan link to verify

---

## Scene 7: Agent SDK (3:00 - 3:30)

### Visual
- Show terminal with SDK demo
- Show framework integrations

### Script
> "For AI agent developers, we built a full SDK.
> Eliza framework integration. LangChain tools. AutoGPT plugin.
> Any agent framework can plug in and trade through our dark pool.
> [Run demo]
> Encrypted payload generated. MEV bots blocked."

### Steps to Record
1. Show terminal: `cd sdk && npx tsx framework-integrations.ts`
2. Show output with encryption demo
3. Highlight framework integrations list
4. Show privacy benefits

---

## Scene 8: Bounty Summary (3:30 - 3:50)

### Visual
- Grid of all bounty integrations

### Script
> "SwarmShield targets $40,000 across six bounties:
> Anoncoin $10K - TRUE encrypted dark liquidity
> Light Protocol $18K - Real SDK, real Photon queries
> Helius $5K - Primary RPC with priority fees
> QuickNode $3K - Backup infrastructure
> Range $1.5K - Compliance on every connect
> PNP Exchange $2.5K - Agent SDK with framework patterns"

### Elements
- Show each bounty with checkmark
- Total: $40,000

---

## Scene 9: Call to Action (3:50 - 4:00)

### Visual
- SwarmShield logo
- Links and QR code

### Script
> "SwarmShield: Where agents trade in the dark.
> TRUE cryptographic privacy. Real MEV protection.
> Try it now. The code is open source.
> Thank you."

### Elements
- URL: swarmshield.vercel.app
- GitHub: github.com/shariqazeem/swarm-shield
- Program: 5rLQtJrr27bt4y7ERMgnQUcALKXfy2uTgEdq7rfbQvew

---

## Recording Checklist

### Before Recording
- [ ] Phantom wallet connected with devnet SOL
- [ ] All browser extensions hidden
- [ ] Clean browser profile (incognito)
- [ ] Test all buttons work
- [ ] Test Solscan links work

### Key Moments to Highlight
- [ ] MEV Attack simulation running (most visual impact)
- [ ] Light Protocol SDK showing "$18K" connection
- [ ] Integration verifier all green
- [ ] Encrypted data appearing on submit
- [ ] Solscan showing encrypted bytes

### Technical Tips
1. **Slow mouse movements** - Let viewers follow
2. **Pause on key moments** - Especially encrypted data
3. **Use zoom** - Zoom into important elements
4. **Record audio separately** - Better quality

---

## Post-Production Checklist

- [ ] Add captions/subtitles
- [ ] Add bounty amounts as overlays
- [ ] Add transitions between scenes
- [ ] Add highlight boxes around key UI elements
- [ ] Background music (subtle, optional)
- [ ] Compress to <100MB
- [ ] Upload to YouTube (unlisted)

---

## Emergency Fallbacks

If something breaks during recording:

1. **MEV Demo broken**: Run `test-encryption.ts` in terminal instead
2. **Light Protocol query fails**: Show the installed SDK in package.json
3. **Vercel down**: Run locally with `npm run dev`
4. **Wallet issues**: Use CLI demos instead

---

*SwarmShield: TRUE Privacy for AI Agents*
*Privacy Hack 2026*
