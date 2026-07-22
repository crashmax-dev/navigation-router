import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const isGitHubPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: isGitHubPages ? '/navigation-router/playground/' : '/',
  resolve: {
    alias: {
      'navigation-router': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    },
  },
})
