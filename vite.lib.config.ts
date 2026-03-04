/**
 * @file vite.lib.config.ts
 *
 * Vite build configuration for producing the distributable package.
 *
 * Run with:  npm run build:lib
 *
 * Output (dist/):
 *   audio-visualizer.js      — ESM bundle (Lit externalized as a peer dep)
 *   audio-visualizer.d.ts    — Bundled TypeScript declarations
 *   audio-visualizer.d.ts.map
 *
 * Lit is declared as a peer dependency and left external so consumers
 * are not bundled with a second copy of Lit if they already use it.
 */

import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      // The barrel file is the single public entry point
      entry: resolve(__dirname, 'src/index.ts'),
      // Output file name (no extension — Vite appends .js / .umd.cjs etc.)
      fileName: 'audio-visualizer',
      // ESM only: modern bundlers (Vite, Rollup, webpack 5) all handle ESM.
      // Add 'umd' here if you also need a script-tag-friendly build.
      formats: ['es'],
    },
    rollupOptions: {
      // Externalize Lit and all its sub-paths so consumers share one copy
      external: ['lit', /^lit\//],
    },
    outDir: 'dist',
    // Emit source maps for easier debugging in downstream projects
    sourcemap: true,
  },
  plugins: [
    dts({
      // Generate a single bundled .d.ts rather than mirroring the src tree
      rollupTypes: true,
      include: ['src/**/*.ts'],
      outDir: 'dist',
    }),
  ],
});
