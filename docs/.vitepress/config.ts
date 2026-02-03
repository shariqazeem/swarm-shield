import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'SwarmShield',
  description: 'MEV Protection Dark Pool for Solana',
  ignoreDeadLinks: true,
  appearance: 'dark',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#000000' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'SDK', link: '/sdk/quickstart' },
      { text: 'Integrations', link: '/integrations/overview' },
      { text: 'Architecture', link: '/architecture/overview' },
      { text: 'Launch App', link: 'https://swarmshield.vercel.app', target: '_blank' },
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
      '/sdk/': [
        {
          text: 'Agent SDK',
          items: [
            { text: 'Quick Start', link: '/sdk/quickstart' },
            { text: 'Installation', link: '/sdk/installation' },
            { text: 'API Reference', link: '/sdk/api-reference' },
            { text: 'Framework Integrations', link: '/sdk/frameworks' },
          ]
        }
      ],
      '/integrations/': [
        {
          text: 'Integrations',
          items: [
            { text: 'Overview', link: '/integrations/overview' },
            { text: 'Light Protocol', link: '/integrations/light-protocol' },
            { text: 'Helius RPC', link: '/integrations/helius' },
            { text: 'Range Protocol', link: '/integrations/range' },
          ]
        }
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/overview' },
            { text: 'Encryption', link: '/architecture/encryption' },
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
