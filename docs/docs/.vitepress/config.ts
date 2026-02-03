import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'SwarmShield',
  description: 'Dark Liquidity Pool with End-to-End Encryption for Solana',

  head: [
    ['meta', { name: 'theme-color', content: '#000000' }],
    ['meta', { property: 'og:title', content: 'SwarmShield Documentation' }],
    ['meta', { property: 'og:description', content: 'MEV-Protected Trading for AI Agents on Solana' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'SwarmShield',

    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'SDK', link: '/sdk/quickstart' },
      { text: 'Integrations', link: '/integrations/overview' },
      { text: 'App', link: 'https://swarmshield.vercel.app' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'How It Works', link: '/guide/how-it-works' },
            { text: 'Quick Start', link: '/guide/quickstart' },
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Encryption', link: '/guide/encryption' },
            { text: 'Intent Batching', link: '/guide/batching' },
            { text: 'MEV Protection', link: '/guide/mev-protection' },
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
            { text: 'Framework Integration', link: '/sdk/frameworks' },
          ]
        }
      ],
      '/integrations/': [
        {
          text: 'Sponsor Integrations',
          items: [
            { text: 'Overview', link: '/integrations/overview' },
            { text: 'Light Protocol', link: '/integrations/light-protocol' },
            { text: 'Helius', link: '/integrations/helius' },
            { text: 'Range Protocol', link: '/integrations/range' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/shariqazeem/swarm-shield' },
    ],

    footer: {
      message: 'Built for Privacy Hack 2026',
      copyright: 'SwarmShield - Where Agents Trade in the Dark'
    },

    search: {
      provider: 'local'
    }
  }
})
