import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// base './' keeps every asset reference relative, so the same build works at
// https://<user>.github.io/light-and-sound/ or any other static path.
export default defineConfig({
  base: './',
  plugins: [preact()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 8192,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
