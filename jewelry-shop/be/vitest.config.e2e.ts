import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    testTimeout: 60000,
    hookTimeout: 90000,
    fileParallelism: false,
    root: './',
    include: ['**/*.e2e-spec.ts'],
  },
});
