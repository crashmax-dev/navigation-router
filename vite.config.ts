import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/navigation-router/',
  resolve: {
    alias: {
      'navigation-router': fileURLToPath(new URL('./src/lib/index', import.meta.url)),
    },
  },
})
