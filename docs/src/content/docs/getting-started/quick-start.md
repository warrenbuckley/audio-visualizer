---
title: Quick Start
description: Get audio-visualizer running in under two minutes.
---

## Standalone HTML page

The fastest path — no npm, no bundler. Save as an `.html` file and open in a browser over HTTPS or `localhost` (required for microphone access).

```html
<!doctype html>
<html>
  <body>
    <audio-visualizer id="viz" size="md" style="--audio-visualizer-color: #6366f1"></audio-visualizer>
    <button id="btn">Start microphone</button>

    <script type="module"
      src="https://cdn.jsdelivr.net/npm/audio-visualizer/dist/audio-visualizer.standalone.js">
    </script>

    <script type="module">
      document.getElementById('btn').addEventListener('click', async () => {
        await document.getElementById('viz').startMicrophone();
      });
    </script>
  </body>
</html>
```

## With a bundler (Vite, webpack, etc.)

After installing via npm:

```bash
npm install audio-visualizer lit
```

Import the component once (side-effect import — registers the custom element globally):

```ts
import 'audio-visualizer';
```

Then use the tag anywhere in your HTML or templates:

```html
<audio-visualizer id="viz" size="md" style="--audio-visualizer-color: #6366f1"></audio-visualizer>
<button id="btn">Start microphone</button>

<script type="module">
  document.getElementById('btn').addEventListener('click', async () => {
    await document.getElementById('viz').startMicrophone();
  });
</script>
```

## Key constraint — user gesture required

`startMicrophone()` **must be called from a user gesture** (a `click`, `keydown`, etc.) to satisfy the browser's microphone permissions policy. The element will throw a `NotAllowedError` if called outside a gesture.

```ts
// ✅ Correct — called from a click handler
button.addEventListener('click', async () => {
  await viz.startMicrophone();
});

// ❌ Wrong — will be blocked by the browser
await viz.startMicrophone(); // called on page load
```

## What to do next

- Explore all installation options → [Installation](/audio-visualizer/getting-started/installation/)
- See full attribute and method docs → [API Reference](/audio-visualizer/reference/api/)
- Try the live playground → [Playground](/audio-visualizer/playground/)
