import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'SwarmShield',
  description: 'MEV Protection Dark Pool for Solana',
  ignoreDeadLinks: true,  // Allow missing pages during development

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Architecture', link: '/architecture/overview' },
      { text: 'Demo', link: 'https://swarmshield.vercel.app', target: '_blank' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Why SwarmShield?', link: '/guide/why-swarmshield' },
            { text: 'Quick Start', link: '/guide/quick-start' },
          ]
        },
        {
          text: 'Using SwarmShield',
          items: [
            { text: 'Connect Wallet', link: '/guide/connect-wallet' },
            { text: 'Deposit SOL', link: '/guide/deposit' },
            { text: 'Submit Intents', link: '/guide/submit-intent' },
            { text: 'Withdraw Tokens', link: '/guide/withdraw' },
          ]
        }
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/overview' },
            { text: 'Smart Contract', link: '/architecture/smart-contract' },
            { text: 'Keeper Service', link: '/architecture/keeper' },
            { text: 'MEV Protection', link: '/architecture/mev-protection' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/swarmshield/swarm-shield' }
    ],

    footer: {
      message: 'Built for Solana Privacy Hackathon 2026',
      copyright: 'SwarmShield - Trade Together. Defeat MEV.'
    }
  }
})
