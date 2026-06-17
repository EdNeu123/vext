import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    testTimeout: 10000,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Foco da medição: a camada de services (regra de negócio dos requisitos).
      include: ['src/services/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'tests/**'],
    },
  },
});
