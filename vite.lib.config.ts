import { copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    target: 'esnext',
  },
  plugins: [
    {
      name: 'copy-url-pattern-types',
      async closeBundle() {
        await copyFile('src/url-pattern.d.ts', 'dist/url-pattern.d.ts')
      },
    },
  ],
})
