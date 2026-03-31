import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // This ensures Vite doesn't try to bundle things it can't find
    rollupOptions: {
      external: [], 
    },
    // Increasing the chunk size limit because the AI SDK and Game logic are large
    chunkSizeWarningLimit: 1000,
  },
});