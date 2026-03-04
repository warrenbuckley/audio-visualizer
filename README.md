# `<audio-visualizer>`

A framework-agnostic Lit WebComponent that displays real-time microphone audio as animated frequency-band bars. Drop it into any HTML page or modern frontend framework with a single import.

Ported from the LiveKit [`AgentAudioVisualizerBar`](https://docs.livekit.io/reference/components/agents-ui/component/agent-audio-visualizer-bar/) React component. Uses the same dB-normalised, multiband frequency analysis as LiveKit's `useMultibandTrackVolume` hook so the visual behaviour matches the original exactly — without any LiveKit dependency.

---

## Contents

- [How it looks](#how-it-looks)
- [How it works](#how-it-works)
- [Installation](#installation)
  - [npm (recommended)](#npm-recommended)
  - [JSR](#jsr--warrenbuckleyaudio-visualizer)
  - [CDN — no build step](#cdn--no-build-step)
    - [Option 1 — jsDelivr](#option-1--jsdelivr-recommended-for-static-sites)
    - [Option 2 — unpkg](#option-2--unpkg)
    - [Option 3 — esm.sh](#option-3--esmsh-resolves-lit-automatically)
    - [Option 4 — Import map](#option-4--import-map-best-when-you-have-multiple-lit-components-on-the-page)
- [Quick start](#quick-start)
- [Usage](#usage)
  - [Plain HTML](#plain-html)
  - [TypeScript / JavaScript](#typescript--javascript)
  - [React](#react)
  - [Vue](#vue)
- [API reference](#api-reference)
  - [Attributes](#attributes)
  - [Properties](#properties)
  - [Methods](#methods)
  - [CSS custom properties](#css-custom-properties)
- [Device switching](#device-switching)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Development](#development)
- [Publishing](#publishing)
- [Discovery](#discovery)
- [Browser support](#browser-support)

---

## How it looks

At rest, bars render as equal-sized pills (circles). When the microphone is active they stretch and bounce in response to the frequency content of your voice.

| Size    | Container | Bar width | Gap  | Bars (default) |
|---------|-----------|-----------|------|----------------|
| `icon`  | 24 px     | 4 px      | 2 px | 3              |
| `sm`    | 56 px     | 8 px      | 4 px | 3              |
| `md`    | 112 px    | 16 px     | 8 px | 5              |
| `lg`    | 224 px    | 32 px     | 16 px| 5              |
| `xl`    | 448 px    | 64 px     | 32 px| 5              |

---

## How it works

The component owns a small audio processing pipeline built entirely on the browser's built-in **Web Audio API** — no external audio library is needed.

```
Microphone
  └─ getUserMedia()
       └─ MediaStreamAudioSourceNode
            └─ AnalyserNode (fftSize = 2048)
                 └─ getFloatFrequencyData()  ← called every animation frame
                      └─ bins [100–199]      ← ~2–5 kHz presence range
                           └─ normalizeDb()  ← dB → [0, 1] with √ curve
                                └─ split into N equal bands
                                     └─ mean per band → bar heights
```

### Why bins 100–199?

This matches LiveKit's `loPass=100, hiPass=200` defaults. With `fftSize=2048` the bin width is roughly 23 Hz at 48 kHz, putting this range at **~2–5 kHz** — the consonant and sibilant "presence" range of speech. Using a narrow mid-high band rather than the full spectrum ensures all bars stay visually balanced at normal speaking volumes.

### Why the √ normalization?

The raw dB scale is logarithmic and heavily weighted toward loud signals. The `normalizeDb` function maps the practical speech range (−100 dB → −10 dB) to [0, 1] linearly, then applies a square root. The √ curve lifts quiet bins — without it, softer frequency bands collapse to near-zero and only the loudest bar animates.

---

## Installation

### npm (recommended)

Install the package and its peer dependency:

```bash
npm install audio-visualizer lit
```

`lit` is declared as a `peerDependency`. If your project already uses Lit you only need the first install.
The `dist/audio-visualizer.js` bundle keeps Lit **external** — it resolves bare `import … from "lit"` specifiers at build time through your bundler, so you and the rest of your app share the same copy of Lit with no duplication.

### JSR — `@warrenbuckley/audio-visualizer`

[JSR](https://jsr.io/@warrenbuckley/audio-visualizer) is a TypeScript-first registry that works with Deno, Node.js, and Bun. It publishes the raw TypeScript source — no compiled `.js` or separate `.d.ts` files needed.

```bash
# Deno
deno add jsr:@warrenbuckley/audio-visualizer

# Node.js
npx jsr add @warrenbuckley/audio-visualizer

# Bun
bunx jsr add @warrenbuckley/audio-visualizer
```

Usage is identical — just update your import path:

```ts
import { AudioVisualizer, type VisualizerSize } from '@warrenbuckley/audio-visualizer';
```

JSR also auto-generates reference documentation from the JSDoc comments in the source. View it at [jsr.io/@warrenbuckley/audio-visualizer](https://jsr.io/@warrenbuckley/audio-visualizer).

### CDN — no build step

**Does Lit need to be installed?  No — if you use the standalone build.**

The package ships a second bundle, `audio-visualizer.standalone.js`, where Lit is already bundled inside (~35 kB / ~11 kB gzip). Drop it into any HTML page with a single `<script type="module">` — no npm, no bundler, no import map required.

#### Option 1 — jsDelivr (recommended for static sites)

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/audio-visualizer/dist/audio-visualizer.standalone.js">
</script>
```

#### Option 2 — unpkg

```html
<script type="module"
  src="https://unpkg.com/audio-visualizer/dist/audio-visualizer.standalone.js">
</script>
```

#### Option 3 — esm.sh (resolves Lit automatically)

[esm.sh](https://esm.sh) is a CDN that understands npm packages and rewrites bare specifiers to CDN URLs on the fly. This means you can use the smaller **main build** (Lit external, ~10 kB) without installing anything:

```html
<script type="module">
  import 'https://esm.sh/audio-visualizer';
</script>
```

esm.sh automatically fetches and re-exports `lit` as a sibling CDN module, so neither file is duplicated and the bundle stays small.

#### Option 4 — Import map (best when you have multiple Lit components on the page)

An [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) tells the browser how to resolve bare specifiers like `"lit"` to CDN URLs. This lets you use the lighter **main build** (~10 kB) in a plain HTML page while ensuring **all Lit-based components on the page share a single copy of Lit** — no duplication.

```html
<script type="importmap">
{
  "imports": {
    "lit":  "https://esm.sh/lit@3",
    "lit/": "https://esm.sh/lit@3/",
    "audio-visualizer": "https://esm.sh/audio-visualizer"
  }
}
</script>

<script type="module">
  import 'audio-visualizer';

  document.getElementById('btn').addEventListener('click', async () => {
    await document.getElementById('viz').startMicrophone();
  });
</script>
```

The `"lit/"` entry is a **path-prefix mapping** — a single line that covers every Lit sub-path (`lit/decorators.js`, `lit/directives/style-map.js`, …) so you don't need to enumerate them individually.

**Which CDN works for the Lit entries in an import map?**

| CDN | `"lit"` / `"lit/"` entries | `"audio-visualizer"` entry | Notes |
|-----|--------------------------|--------------------------|-------|
| **esm.sh** | ✅ Yes — rewrites bare specifiers | ✅ Yes | Recommended: one CDN, no mixing needed |
| **jsDelivr / unpkg** | ❌ No — serves raw files, does not rewrite imports | ✅ Yes | Use jsDelivr/unpkg for the component URL, esm.sh for the Lit entries |
| **JSPM (ga.jspm.io)** | ✅ Yes | ✅ Yes | Purpose-built for import maps; generates the whole map automatically |

jsDelivr and unpkg are fine for hosting the `audio-visualizer` file itself, but because they serve files as-is without rewriting bare imports, they cannot satisfy the `"lit"` / `"lit/"` entries — you still need esm.sh (or JSPM) for those.

**Auto-generate the entire import map** with the JSPM web tool at [generator.jspm.io](https://generator.jspm.io/) — paste `audio-visualizer` and it outputs a complete, version-pinned map with optional SRI integrity hashes. Or use the CLI:

```bash
npx jspm install audio-visualizer -o importmap.json
```

**Import map vs standalone build — which to choose?**

| | Import map | Standalone build |
|-|------------|-----------------|
| Multiple Lit components on the page | ✅ All share one Lit copy | ❌ Each bundle includes its own Lit |
| Single component, no other Lit on the page | Works but more setup | ✅ One file, zero configuration |
| Need SRI integrity hashes | ✅ JSPM generator adds them | Manual |

#### CDN quick-start example

```html
<!doctype html>
<html>
  <body>
    <audio-visualizer id="viz" size="md" color="#6366f1"></audio-visualizer>
    <button id="btn">Start microphone</button>

    <script type="module">
      import 'https://cdn.jsdelivr.net/npm/audio-visualizer/dist/audio-visualizer.standalone.js';

      document.getElementById('btn').addEventListener('click', async () => {
        await document.getElementById('viz').startMicrophone();
      });
    </script>
  </body>
</html>
```

No server, no build tool — save as an `.html` file and open in any modern browser (served over HTTPS or `localhost` for microphone access).

---

## Quick start

### Standalone HTML page

```html
<!doctype html>
<html>
  <body>
    <audio-visualizer id="viz" size="md" color="#6366f1"></audio-visualizer>
    <button id="btn">Start</button>

    <script type="module">
      import 'audio-visualizer';

      document.getElementById('btn').addEventListener('click', async () => {
        await document.getElementById('viz').startMicrophone();
      });
    </script>
  </body>
</html>
```

---

## Usage

### Plain HTML

Import once per page (side-effect import — registers the custom element):

```html
<script type="module" src="node_modules/audio-visualizer/dist/audio-visualizer.js"></script>

<!-- or from a CDN / bundler entry point -->
<script type="module">
  import 'audio-visualizer';
</script>
```

Then place the element anywhere:

```html
<!-- Defaults: size="md", inherits currentColor, 5 bars -->
<audio-visualizer></audio-visualizer>

<!-- Fully customised -->
<audio-visualizer
  size="lg"
  color="#ec4899"
  bar-count="7"
  style="--audio-visualizer-transition: 60ms"
></audio-visualizer>
```

### TypeScript / JavaScript

```ts
import { AudioVisualizer, type VisualizerSize } from 'audio-visualizer';

const viz = document.querySelector('audio-visualizer') as AudioVisualizer;

// Start the default microphone from a button click
startButton.addEventListener('click', async () => {
  try {
    await viz.startMicrophone();
    startButton.textContent = viz.isActive ? 'Mic active' : 'Start';
  } catch (err) {
    console.error('Mic permission denied:', err);
  }
});

// Stop when done
stopButton.addEventListener('click', () => {
  viz.stopMicrophone();
});
```

### React

React ≥ 19 supports custom elements natively. For React 18 and below wrap the element in a thin component to handle the imperative `startMicrophone` call:

```tsx
import 'audio-visualizer';
import { useRef } from 'react';
import type { AudioVisualizer } from 'audio-visualizer';

export function VoiceVisualizer() {
  const vizRef = useRef<AudioVisualizer>(null);

  return (
    <>
      {/* @ts-expect-error — React 18 doesn't include custom element types */}
      <audio-visualizer ref={vizRef} size="md" color="#6366f1" />
      <button onClick={() => vizRef.current?.startMicrophone()}>
        Start microphone
      </button>
    </>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import 'audio-visualizer';
import type { AudioVisualizer } from 'audio-visualizer';
import { ref } from 'vue';

const vizRef = ref<AudioVisualizer | null>(null);
const start = () => vizRef.value?.startMicrophone();
</script>

<template>
  <audio-visualizer ref="vizRef" size="md" color="#6366f1" />
  <button @click="start">Start microphone</button>
</template>
```

---

## API reference

### Attributes

All attributes are reactive — changing them after the component mounts updates the UI immediately.

| Attribute    | Type                                    | Default        | Description                                                        |
|--------------|-----------------------------------------|----------------|--------------------------------------------------------------------|
| `size`       | `'icon' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`       | Visual scale — controls bar width, container height, and bar gap   |
| `color`      | CSS color string                        | `currentColor` | Bar fill colour. Inherits the surrounding text color when omitted  |
| `bar-count`  | `number`                                | `3` or `5`     | Number of frequency bands. Defaults to 3 for `icon`/`sm`, 5 for larger sizes |

### Properties

| Property   | Type      | Description                                                      |
|------------|-----------|------------------------------------------------------------------|
| `isActive` | `boolean` | `true` while the mic stream is running. Useful for UI state.     |

### Methods

Both methods are public and safe to call from any framework or vanilla JS.

#### `startMicrophone(deviceId?: string): Promise<void>`

Requests microphone access and starts the animation loop.

- **Must be called from a user gesture** (e.g. a button `click`) to satisfy the browser's permissions policy.
- If the mic is already active, the current stream is stopped first — safe to call repeatedly when switching devices.
- Rejects with a `DOMException` if the user denies permission (`NotAllowedError`) or the specified device doesn't exist (`OverconstrainedError`).

```ts
// Default device
await viz.startMicrophone();

// Specific device
await viz.startMicrophone(deviceId);
```

#### `stopMicrophone(): void`

Stops the animation loop and releases the microphone stream. Safe to call at any time, even before the mic has been started. Resets bars to the idle pill state.

```ts
viz.stopMicrophone();
```

### CSS custom properties

Customise via inline `style` or any CSS selector that targets the element.

| Property                        | Default        | Description                                                                          |
|---------------------------------|----------------|--------------------------------------------------------------------------------------|
| `--audio-visualizer-color`      | `currentColor` | Bar colour. Overrides the `color` attribute. Falls back to inherited `currentColor`  |
| `--audio-visualizer-transition` | `100ms`        | Duration of the bar height transition. Lower = snappier; higher = smoother response  |

```html
<!-- Colour via CSS custom property (recommended for stylesheet theming) -->
<audio-visualizer style="--audio-visualizer-color: #6366f1"></audio-visualizer>

<!-- Or in a stylesheet -->
<style>
  audio-visualizer { --audio-visualizer-color: #6366f1; }
</style>

<!-- Snappy response -->
<audio-visualizer style="--audio-visualizer-transition: 40ms"></audio-visualizer>

<!-- Slow, smooth response -->
<audio-visualizer style="--audio-visualizer-transition: 250ms"></audio-visualizer>
```

---

## Device switching

After the user has granted microphone permission, enumerate available input devices and pass a `deviceId` to `startMicrophone` to switch between them. Calling `startMicrophone` again automatically tears down the previous stream.

```ts
import 'audio-visualizer';

const viz    = document.querySelector('audio-visualizer');
const select = document.querySelector('select');

// 1. Start with the default device
startBtn.addEventListener('click', async () => {
  await viz.startMicrophone();

  // 2. Enumerate devices — labels are only available after permission is granted
  const devices = await navigator.mediaDevices.enumerateDevices();
  const mics = devices.filter(d => d.kind === 'audioinput');

  mics.forEach(mic => {
    const opt = document.createElement('option');
    opt.value = mic.deviceId;
    opt.textContent = mic.label || 'Microphone';
    select.appendChild(opt);
  });
});

// 3. Switch device on selection change
select.addEventListener('change', () => {
  viz.startMicrophone(select.value || undefined);
});
```

---

## Architecture

```
src/
├── index.ts              # Public package entry — re-exports everything
├── audio-analyzer.ts     # Web Audio API wrapper (mic capture + FFT analysis)
└── audio-visualizer.ts   # <audio-visualizer> Lit WebComponent
```

### `AudioAnalyzer` (`audio-analyzer.ts`)

A thin wrapper around three Web Audio API nodes:

```
MediaStreamAudioSourceNode  →  AnalyserNode  →  (read-only, no output node)
```

The class is intentionally not exported as a default export and its constructor is private — always create instances via the async `AudioAnalyzer.create(deviceId?)` factory which handles the `getUserMedia` permission request and `AudioContext` setup atomically.

`getBands(count)` is the only read method. It is designed to be called every animation frame without allocating — it writes into a pre-allocated `Float32Array` buffer and returns a freshly computed plain `number[]`.

### `AudioVisualizer` (`audio-visualizer.ts`)

A `LitElement` subclass decorated with `@customElement('audio-visualizer')`.

**Reactive properties** (`@property`) map directly to HTML attributes and trigger Lit re-renders when changed:

| Property    | Attribute    | Effect on render                        |
|-------------|--------------|------------------------------------------|
| `size`      | `size`       | Changes container height, bar width, gap |
| `color`     | `color`      | Sets CSS `color` on the container        |
| `barCount`  | `bar-count`  | Changes how many bars are rendered        |

**Private reactive state** (`@state`) drives the animation:

| State      | Type                                     | Set by           |
|------------|------------------------------------------|------------------|
| `bands`    | `number[]`                               | `tick()` via rAF |
| `micState` | `'idle' \| 'requesting' \| 'active' \| 'error'` | lifecycle methods |

**Animation loop** — `tick()` is a bound arrow function registered with `requestAnimationFrame`. Using an arrow function (rather than a regular method) means `this` is always correct and the same reference can be passed to both `requestAnimationFrame` and `cancelAnimationFrame`.

**Colour propagation** — all bars use `background-color: currentColor`. The container's CSS `color` property is set to the `color` attribute value (or `currentColor` to inherit). This means a single style write on the container updates every bar.

---

## Project structure

```
audio-visualizer/
├── src/
│   ├── index.ts                  # Package barrel — public exports
│   ├── audio-analyzer.ts         # Web Audio API: mic → multiband volumes
│   ├── audio-visualizer.ts       # <audio-visualizer> Lit WebComponent
│   └── main.ts                   # Demo app entry (imports index.ts)
├── index.html                    # Interactive demo / documentation page
├── custom-elements.json          # Custom Elements Manifest (tooling + discovery)
├── package.json
├── tsconfig.json
├── cem.config.mjs                # @custom-elements-manifest/analyzer config
├── jsr.json                      # JSR registry config (TypeScript-first registry)
├── vite.config.ts                # Dev server + demo app build
├── vite.lib.config.ts            # Library build — Lit external (dist/)
└── vite.standalone.config.ts     # Standalone build — Lit bundled in (dist/)
```

### `dist/` output

| File                                | Built by          | Size     | Description                                        |
|-------------------------------------|-------------------|----------|----------------------------------------------------|
| `audio-visualizer.js`               | `build:lib`       | ~10 kB   | ESM bundle — Lit is external (peer dep)            |
| `audio-visualizer.d.ts`             | `build:lib`       | ~7 kB    | Single bundled TypeScript declaration file         |
| `audio-visualizer.js.map`           | `build:lib`       | ~27 kB   | Source map for downstream debugging                |
| `audio-visualizer.standalone.js`    | `build:standalone`| ~35 kB   | ESM bundle — Lit bundled in, no peer dep needed    |
| `audio-visualizer.standalone.js.map`| `build:standalone`| ~72 kB   | Source map for standalone bundle                   |

---

## Development

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Setup

```bash
git clone <repo-url>
cd audio-visualizer
npm install
```

### Scripts

| Command                   | Description                                                        |
|---------------------------|--------------------------------------------------------------------|
| `npm run dev`             | Start Vite dev server at `http://localhost:5173` with HMR          |
| `npm run build`           | Type-check + build the demo app to `dist/`                         |
| `npm run build:lib`       | Build the npm package bundle to `dist/` (Lit external)             |
| `npm run build:standalone`| Build the self-contained CDN bundle to `dist/` (Lit bundled in)    |
| `npm run build:cem`       | Generate `custom-elements.json` (Custom Elements Manifest)         |
| `npm run preview`         | Serve the demo build locally for final review                      |
| `npm run publish:jsr`     | Publish the package to JSR (`@warrenbuckley/audio-visualizer`)     |

### Build internals

**`npm run build:lib`** — uses `vite.lib.config.ts` with [`vite-plugin-dts`](https://github.com/qmhc/vite-plugin-dts) to generate a single bundled `.d.ts`. Lit and all `lit/*` sub-paths are marked `external` so consumers share the copy of Lit already in their project.

```bash
npm run build:lib
# → dist/audio-visualizer.js      (ESM, Lit external, ~10 kB)
# → dist/audio-visualizer.d.ts    (bundled declarations)
# → dist/audio-visualizer.js.map
```

**`npm run build:standalone`** — uses `vite.standalone.config.ts` and does _not_ externalise Lit, so the output file has zero external imports and can be loaded directly in any browser.

```bash
npm run build:standalone
# → dist/audio-visualizer.standalone.js      (ESM, Lit bundled, ~35 kB)
# → dist/audio-visualizer.standalone.js.map
```

---

## Publishing

### npm

Build the library bundle, then publish:

```bash
npm run build:lib
npm publish
```

The standalone bundle is included automatically because both output to `dist/` which is listed in `"files"` in `package.json`. Once on npm, esm.sh, jsDelivr, unpkg, and JSPM will serve it automatically — no separate action needed.

### JSR

JSR publishes the TypeScript source directly — no build step required:

```bash
npm run publish:jsr
# runs: npx jsr publish --allow-slow-types
```

`--allow-slow-types` is needed because Lit's `LitElement` base class lives on npm rather than JSR. JSR's fast type-inference checker cannot fully resolve cross-registry class hierarchies, so this flag skips that check. The published TypeScript source and all types are still correct and complete for consumers.

### GitHub Releases

Attach the standalone bundle as a release asset so users can pin to a specific version via a direct URL without going through a registry:

```bash
npm run build:standalone
# Then attach dist/audio-visualizer.standalone.js to the GitHub Release
```

Direct URL after release:
```
https://github.com/warrenbuckley/audio-visualizer/releases/download/v1.0.0/audio-visualizer.standalone.js
```

---

## Discovery

The package ships a **Custom Elements Manifest** (`custom-elements.json`) generated by [`@custom-elements-manifest/analyzer`](https://custom-elements-manifest.open-wc.org/). This machine-readable file describes every element, property, attribute, method, CSS custom property, and event — consumed automatically by:

- **VS Code** ([Custom Elements Language Server](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin)) — autocomplete for attributes and CSS properties
- **webcomponents.org** — powers the API docs on the discovery catalogue
- **Storybook** ([`@storybook/web-components`](https://storybook.js.org/docs/web-components/get-started/introduction)) — auto-generates controls panel from the manifest
- **Open WC tools**, **11ty**, and other framework integrations

Regenerate it after changing the component's public API:

```bash
npm run build:cem
# → custom-elements.json
```

### Submitting to webcomponents.org

[webcomponents.org](https://www.webcomponents.org/) is the community catalogue for discovering web components. Submitting makes the component searchable alongside thousands of other elements.

**Prerequisites before submitting:**

- [ ] Package published to npm
- [ ] `custom-elements.json` included in the published package (`"customElements"` field in `package.json` ✅)
- [ ] `README.md` at the repository root
- [ ] Repository is public on GitHub, GitLab, or Bitbucket

**Steps:**

1. Go to [webcomponents.org/publish](https://www.webcomponents.org/publish)
2. Paste the GitHub repository URL
3. The site reads `package.json` → `"customElements"` to find `custom-elements.json` and generates the API reference automatically

### Other discovery platforms

| Platform | What it does |
|----------|-------------|
| [webcomponents.org](https://www.webcomponents.org/) | Community catalogue — submit via repo URL |
| [npm](https://www.npmjs.com/) | Standard registry — discoverable by keywords (`web-components`, `custom-elements`, `lit`) |
| [JSR](https://jsr.io/) | TypeScript-first registry — auto-generates API docs from JSDoc |
| [Open WC](https://open-wc.org/) | Best-practice guides and tooling; components following the guides are linked from there |
| [Lit Community](https://lit.dev/community/) | Lit's own community page lists notable components |

---

## Browser support

Requires browsers with support for:

| API                         | Chrome | Firefox | Safari |
|-----------------------------|--------|---------|--------|
| Custom Elements v1          | 67+    | 63+     | 10.1+  |
| Web Audio API (`AnalyserNode`) | 35+ | 25+     | 14.1+  |
| `getUserMedia`              | 53+    | 36+     | 11+    |
| ES Modules                  | 61+    | 60+     | 10.1+  |

All major desktop and mobile browsers released since 2020 are supported.

> **Note:** `getUserMedia` requires a **secure context** (HTTPS or `localhost`). The component will not be able to access the microphone on plain HTTP origins.

---

## Credits

- Original React component: [LiveKit `AgentAudioVisualizerBar`](https://github.com/livekit/components-js/blob/main/packages/shadcn/components/agents-ui/agent-audio-visualizer-bar.tsx)
- Frequency analysis: ported from LiveKit's [`useMultibandTrackVolume`](https://github.com/livekit/components-js/blob/main/packages/react/src/hooks/useTrackVolume.ts)
- Built with [Lit](https://lit.dev)
