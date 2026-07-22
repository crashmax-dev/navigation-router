import { defineConfig } from 'vitepress'

const isGitHubPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  title: 'navigation-router',
  description: 'Client-side router built on the Navigation API and URLPattern',
  base: isGitHubPages ? '/navigation-router/' : '/',
  themeConfig: {
    nav: [
      {
        text: 'Guide',
        link: '/guide/getting-started'
      },
      {
        text: 'Playground',
        link: 'https://crashmax-dev.github.io/navigation-router/playground/',
        target: '_blank',
      },
      {
        text: 'GitHub',
        link: 'https://github.com/crashmax-dev/navigation-router',
      },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Routing', link: '/guide/routing' },
          { text: 'Adapters', link: '/guide/adapters' },
          { text: 'Navigation UI', link: '/guide/navigation-ui' },
        ],
      },
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/crashmax-dev/navigation-router',
      },
    ],
    search: {
      provider: 'local',
    },
  },
})
