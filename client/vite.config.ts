import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

// In a monorepo workspace, resolve react from the root to ensure a single copy.
// In standalone builds (e.g., Docker), react is in the local node_modules.
const rootReactPath = new URL('../node_modules/react', import.meta.url).pathname;
const useRootAlias = fs.existsSync(rootReactPath);

const reactDir = useRootAlias ? rootReactPath : undefined;
const reactDomDir = useRootAlias ? new URL('../node_modules/react-dom', import.meta.url).pathname : undefined;

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
    ...(reactDir && reactDomDir ? {
      alias: {
        'react/jsx-runtime': `${reactDir}/jsx-runtime.js`,
        'react/jsx-dev-runtime': `${reactDir}/jsx-dev-runtime.js`,
        'react-dom/client': `${reactDomDir}/client.js`,
        'react-dom': reactDomDir,
        react: reactDir,
      },
    } : {}),
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
