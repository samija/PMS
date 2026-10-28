import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Resolve react from the monorepo root to ensure a single copy across all packages
const reactDir = new URL('../node_modules/react', import.meta.url).pathname;
const reactDomDir = new URL('../node_modules/react-dom', import.meta.url).pathname;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      'react/jsx-runtime': `${reactDir}/jsx-runtime.js`,
      'react/jsx-dev-runtime': `${reactDir}/jsx-dev-runtime.js`,
      'react-dom/client': `${reactDomDir}/client.js`,
      'react-dom': reactDomDir,
      react: reactDir,
    },
    dedupe: ['react', 'react-dom'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    server: {
      deps: {
        inline: ['@testing-library/react', '@testing-library/jest-dom', '@testing-library/user-event'],
      },
    },
  },
});
