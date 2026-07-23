import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolveUiGeneration } from './src/lib/ui-generation';

const generation = resolveUiGeneration(process.env.VITE_CONSOLE_UI_GENERATION);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@generation': fileURLToPath(new URL(generation === 'v2' ? './src/app/generation-v2.tsx' : './src/app/generation-legacy.tsx', import.meta.url)),
      '@generation-styles': fileURLToPath(new URL(generation === 'v2' ? './src/styles/index-v2.css' : './src/styles/index-legacy.css', import.meta.url)),
    },
  },
});
