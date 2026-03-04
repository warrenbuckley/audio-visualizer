/**
 * Copies the pre-built standalone bundle from the repo root dist/ into
 * docs/public/ so the Playground page can serve it without needing npm publish.
 *
 * Run automatically via `predev` / `prebuild` in docs/package.json,
 * or manually: node docs/scripts/copy-component.mjs
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const src  = join(__dir, '../../dist/audio-visualizer.standalone.js');
const dest = join(__dir, '../public/audio-visualizer.standalone.js');

if (!existsSync(src)) {
  console.error(
    '✗ dist/audio-visualizer.standalone.js not found.\n' +
    '  Run `npm run build:standalone` from the repo root first.',
  );
  process.exit(1);
}

mkdirSync(join(__dir, '../public'), { recursive: true });
copyFileSync(src, dest);
console.log('✓ Copied audio-visualizer.standalone.js → docs/public/');
