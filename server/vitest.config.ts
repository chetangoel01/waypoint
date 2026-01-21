import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['dist/**'],
    setupFiles: [resolve(__dirname, 'src/tests/setup.ts')],
  },
});
