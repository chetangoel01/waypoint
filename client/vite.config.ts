import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, '..'),
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            '@tanstack/react-query',
            'react',
            'react-dom',
            'react-router-dom',
          ],
          pdfjs: ['pdfjs-dist'],
        },
      },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
});
