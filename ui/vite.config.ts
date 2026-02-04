import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [wasm(), topLevelAwait(), react()],
  build: {
    target: 'esnext', // Ensure ESNext target for WASM support
  },
  worker: {
    format: 'es', // Use ES module format for workers (required for dynamic imports in workers)
    plugins: () => [wasm(), topLevelAwait()],
  },
  server: {
    fs: {
      allow: ['..'], // Allow serving files from one level up to the project root
    },
  },
})
