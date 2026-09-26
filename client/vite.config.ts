import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Set only in docker-compose.dev.yml: file events from a Windows bind
    // mount don't reach the container, so the dev server has to poll.
    watch: { usePolling: process.env.VITE_USE_POLLING === 'true' },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules', 'src/test', 'src/main.tsx', 'src/router'],
    },
  },
})
