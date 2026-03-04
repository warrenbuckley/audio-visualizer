/**
 * @file vite.standalone.config.ts
 *
 * Vite build configuration for the self-contained, CDN-ready bundle.
 *
 * Run with:  npm run build:standalone
 *
 * Output (dist/):
 *   audio-visualizer.standalone.js  — ESM bundle with Lit bundled in
 *
 * Unlike the main library build (`vite.lib.config.ts`), this build does NOT
 * externalise Lit — it bundles everything into a single file. This means:
 *
 *  - Consumers can drop the file on a CDN or static server and import it
 *    directly with no build step and no separate Lit installation.
 *  - The file is larger (~50 kB vs ~10 kB) because it includes Lit.
 *  - Use this build when you want a single-file `<script type="module">` import
 *    or when serving from a CDN URL (jsDelivr, unpkg, etc.).
 *
 * For npm-based projects (Vite, webpack, Rollup …) prefer the main build so
 * Lit is shared with the rest of the application.
 */

import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: () => 'audio-visualizer.standalone.js',
      formats: ['es'],
    },
    rollupOptions: {
      // Intentionally empty — bundle everything, including Lit
    },
    outDir: 'dist',
    // Write alongside the existing dist/ files without clearing them
    emptyOutDir: false,
    sourcemap: true,
  },
});
