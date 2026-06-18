import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts', 'src/runtime/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  clean: true,
  dts: true,
  sourcemap: true,
  outDir: 'dist'
});
