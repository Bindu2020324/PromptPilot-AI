import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  
  // FIXED: Tells esbuild to process JSX inside both .js and .jsx files smoothly
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/, 
    exclude: [],
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index:      'index.html',
        background: 'src/background.js',
        content:    'src/content.js',
      },
      output: {
        entryFileNames: c =>
          ['background', 'content'].includes(c.name)
            ? 'src/[name].js'
            : 'assets/[name]-[hash].js',
        manualChunks: undefined,
      },
    },
  },
})