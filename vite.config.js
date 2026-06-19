// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import { crx } from '@crxjs/vite-plugin'
// import manifest from './manifest.json'

// export default defineConfig({
//   plugins: [react(), crx({ manifest })],
//   build: {
//     outDir: 'dist',
//     emptyOutDir: true,
//     rollupOptions: {
//       input: {
//         index:      'index.html',
//         background: 'src/background.js',
//         content:    'src/content.js',
//       },
//       output: {
//         entryFileNames: c =>
//           ['background', 'content'].includes(c.name)
//             ? 'src/[name].js'
//             : 'assets/[name]-[hash].js',
//         manualChunks: undefined,
//       },
//     },
//   },
// }) 

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  
  // Yeh section Vite ko batayega ki .js files ke andar JSX ko bina crash hue handle kare
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/, // src folder ki saari .js files par apply hoga
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