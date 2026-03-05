# Contributing to `<audio-visualizer>`

Thanks for your interest in contributing! This document covers everything you need to get the project running locally and understand how it is built, tested, and published.

---

## Project structure

```
audio-visualizer/
├── src/
│   ├── index.ts                  # Package barrel — public exports
│   ├── audio-analyzer.ts         # Web Audio API: mic capture + FFT analysis
│   ├── audio-visualizer.ts       # <audio-visualizer> Lit WebComponent
│   └── main.ts                   # Dev demo entry (imports index.ts)
├── docs/                         # Astro Starlight documentation site
│   ├── src/content/docs/         # Markdown / MDX pages
│   ├── src/components/           # Astro components (Playground, ApiReference)
│   ├── public/                   # Static assets (standalone bundle copied here)
│   ├── scripts/copy-component.mjs # Copies built bundle into docs/public/
│   └── astro.config.mjs          # Starlight config — sidebar, theme, site URL
├── index.html                    # Local dev demo page
├── custom-elements.json          # Custom Elements Manifest (tooling + discovery)
├── package.json
├── tsconfig.json
├── cem.config.mjs                # @custom-elements-manifest/analyzer config
├── vite.config.ts                # Dev server config
├── vite.lib.config.ts            # Library build — Lit external
└── vite.standalone.config.ts     # Standalone build — Lit bundled in
```

---

## Dev setup

### Option A — GitHub Codespaces (recommended)

Click **Code → Codespaces → Create codespace on main** in the GitHub UI. The devcontainer will:

1. Start with the `typescript-node:22` image (pre-cached, no cold pull).
2. Run `npm install && npm install --prefix docs && npm run build:standalone` automatically.
3. Open VS Code with both dev servers started in dedicated terminal panels:
   - **Vite** at `http://localhost:5173` — component dev demo
   - **Astro** at `http://localhost:4321` — docs site

### Option B — Local

**Prerequisites:** Node.js ≥ 18, npm ≥ 9

```bash
git clone https://github.com/warrenbuckley/audio-visualizer.git
cd audio-visualizer
npm install
npm install --prefix docs
npm run build:standalone   # docs playground needs the pre-built bundle
```

Start the dev servers:

```bash
# Component dev demo (Vite, port 5173)
npm run dev

# Docs site (Astro, port 4321) — in a separate terminal
npm run dev --prefix docs
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server at `localhost:5173` with HMR |
| `npm run build:lib` | Build the npm package bundle to `dist/` (Lit external) |
| `npm run build:standalone` | Build the self-contained CDN bundle to `dist/` (Lit bundled in) |
| `npm run build:cem` | Regenerate `custom-elements.json` |
| `npm run preview` | Serve the Vite build locally |

---

## Build internals

### `npm run build:lib`

Uses `vite.lib.config.ts` with [`vite-plugin-dts`](https://github.com/qmhc/vite-plugin-dts) to produce a single bundled `.d.ts`. Lit and all `lit/*` sub-paths are marked `external` so consumers share the copy of Lit already in their project.

```
dist/audio-visualizer.js       ESM bundle, Lit external (~10 kB)
dist/audio-visualizer.d.ts     Bundled TypeScript declarations
dist/audio-visualizer.js.map
```

### `npm run build:standalone`

Uses `vite.standalone.config.ts` — does **not** externalise Lit, so the output has zero external imports and can be loaded directly in any browser via a `<script type="module">` tag.

```
dist/audio-visualizer.standalone.js       ESM, Lit bundled in (~35 kB)
dist/audio-visualizer.standalone.js.map
```

### Custom Elements Manifest

Run `npm run build:cem` after changing any public attribute, property, method, or CSS custom property. The generated `custom-elements.json` is committed to the repo and included in the npm package.

---

## Publishing

### npm

```bash
npm run build:lib
npm run build:standalone
npm run build:cem
npm publish
```

The `"files"` field in `package.json` includes `dist/` and `custom-elements.json` — both bundles and the manifest are published automatically.

### GitHub Release

Attach the standalone bundle as a release asset so users can pin to a specific version via a direct GitHub URL:

```bash
npm run build:standalone
# Then attach dist/audio-visualizer.standalone.js to the GitHub Release
```

Direct URL after release:
```
https://github.com/warrenbuckley/audio-visualizer/releases/download/v1.0.0/audio-visualizer.standalone.js
```
