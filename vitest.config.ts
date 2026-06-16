import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      // server-only throws when resolved outside an RSC graph; use its empty build in tests
      'server-only': fileURLToPath(new URL('node_modules/server-only/empty.js', import.meta.url)),
    },
  },
});
