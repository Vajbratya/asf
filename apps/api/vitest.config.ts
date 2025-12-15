import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.spec.ts', '**/types/'],
      lines: 95,
      functions: 95,
      branches: 95,
      statements: 95,
    },
    mockReset: true,
    restoreMocks: true,
  },
});
