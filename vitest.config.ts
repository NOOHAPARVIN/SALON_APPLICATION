import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './vitest.setup.ts',
      include: ['__tests__/**/*.{test,spec}.?(c|m)[jt]s?(x)'], // Only run tests in __tests__
      exclude: ['e2e/**', 'node_modules/**'], // Exclude Playwright tests
      alias: {
        '@': path.resolve(__dirname, './'),
      },
      env: {
        ...env
      }
    },
  }
})
