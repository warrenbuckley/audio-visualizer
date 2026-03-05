# `<audio-visualizer>`

A framework-agnostic Lit WebComponent that displays real-time microphone audio as animated frequency-band bars.

Ported from LiveKit's [`AgentAudioVisualizerBar`](https://docs.livekit.io/reference/components/agents-ui/component/agent-audio-visualizer-bar/) — same dB-normalised multiband analysis, no LiveKit dependency.

---

## Install

**npm**

```bash
npm install @warrenbuckley/audio-visualizer lit
```

**CDN (no install)**

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@warrenbuckley/audio-visualizer/dist/audio-visualizer.standalone.js">
</script>
```

---

## Quick start

```html
<!doctype html>
<html>
  <body>
    <audio-visualizer id="viz" size="md" style="--audio-visualizer-color: #6366f1"></audio-visualizer>
    <button id="btn">Start microphone</button>

    <script type="module"
      src="https://cdn.jsdelivr.net/npm/@warrenbuckley/audio-visualizer/dist/audio-visualizer.standalone.js">
    </script>

    <script type="module">
      document.getElementById('btn').addEventListener('click', async () => {
        await document.getElementById('viz').startMicrophone();
      });
    </script>
  </body>
</html>
```

Save as `.html` and open in any modern browser — HTTPS or `localhost` required for microphone access.

---

## How it works

The component runs a small Web Audio API pipeline entirely in the browser — no external audio library:

```
Microphone
  └─ getUserMedia()
       └─ MediaStreamAudioSourceNode
            └─ AnalyserNode (fftSize = 2048)
                 └─ getFloatFrequencyData()  ← called every animation frame
                      └─ bins [100–199]      ← ~2–5 kHz speech presence range
                           └─ normalizeDb()  ← dB → [0, 1] with √ curve
                                └─ split into N equal bands
                                     └─ mean per band → bar heights
```

Full design notes — why those frequency bins, why the √ curve, and how the Lit component is structured — in the [Architecture docs](https://warrenbuckley.github.io/audio-visualizer/concepts/architecture/).

---

## Documentation

Full docs, playground, and API reference → **[warrenbuckley.github.io/audio-visualizer](https://warrenbuckley.github.io/audio-visualizer)**

---

## Browser support

| API | Chrome | Firefox | Safari |
|-----|--------|---------|--------|
| Custom Elements v1 | 67+ | 63+ | 10.1+ |
| Web Audio API (`AnalyserNode`) | 35+ | 25+ | 14.1+ |
| `getUserMedia` | 53+ | 36+ | 11+ |
| ES Modules | 61+ | 60+ | 10.1+ |

> **Note:** `getUserMedia` requires a **secure context** (HTTPS or `localhost`).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for dev setup, build commands, and publishing steps.

---

## Credits

- Original React component: [LiveKit `AgentAudioVisualizerBar`](https://github.com/livekit/components-js/blob/main/packages/shadcn/components/agents-ui/agent-audio-visualizer-bar.tsx)
- Frequency analysis: ported from LiveKit's [`useMultibandTrackVolume`](https://github.com/livekit/components-js/blob/main/packages/react/src/hooks/useTrackVolume.ts)
- Built with [Lit](https://lit.dev)
