import { defineConfig } from 'vitest/config';

// M-10 adds vite-plugin-pwa here. M-20 consumes `dist/` as the Capacitor web dir.
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022'
  },
  server: {
    port: 5173
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts']
  }
});
