---
layout: home

hero:
  name: SwarmShield
  text: Trade in the Dark
  tagline: End-to-end encrypted dark liquidity pool for Solana. MEV bots see only random bytes.
  image:
    src: /shield.svg
    alt: SwarmShield
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/shariqazeem/swarm-shield
    - theme: alt
      text: Launch App
      link: https://swarmshield.vercel.app

features:
  - icon: 🔐
    title: True Encryption
    details: NaCl Box cryptography (X25519 + XSalsa20-Poly1305) - the same encryption used by Signal messenger.
  - icon: 🛡️
    title: MEV Protection
    details: Trade intents are encrypted before going on-chain. MEV bots see 96 bytes of random noise.
  - icon: 🤖
    title: Agent-First Design
    details: Built for AI agents with a dedicated SDK. Integrate MEV protection into any trading bot.
  - icon: ⚡
    title: Swarm Intelligence
    details: Intents are batched together and executed as one Jupiter swap - hiding individual trade patterns.
  - icon: 🔮
    title: ZK Compression Ready
    details: Architected for Light Protocol's ZK compression - 99.5% cost reduction at scale.
  - icon: ✅
    title: Compliance Built-In
    details: Range Protocol integration screens wallets automatically on connect.
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #fff 30%, #888);
  --vp-home-hero-image-background-image: linear-gradient(-45deg, #000 50%, #222 50%);
  --vp-home-hero-image-filter: blur(44px);
}

.VPHero .VPImage {
  border-radius: 50%;
  box-shadow: 0 0 60px rgba(255,255,255,0.1);
}
</style>
