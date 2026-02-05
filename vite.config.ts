import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      'navigation-router': fileURLToPath(new URL('./src/lib/index', import.meta.url)),
    },
  },
})
