import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // FIX: Replaced `process.cwd()` with `''` to resolve a TypeScript type error on `process.cwd()`.
  // `loadEnv`'s second argument is the directory for .env files, and an empty string
  // defaults to the project root, which is the intended behavior.
  const env = loadEnv(mode, '', '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  }
})
