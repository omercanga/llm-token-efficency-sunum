/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/systems/**', 'src/state/**', 'src/persistence/**'],
      thresholds: {
        lines: 80,
        statements: 80,
      },
    },
  },
});
