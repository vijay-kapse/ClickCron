import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'html'],
      include: ['src/core/**', 'src/runtime/**'],
      exclude: ['src/tests/**', 'src/types/**', '**/*.d.ts'],
      reportsDirectory: './coverage'
    }
  }
});
