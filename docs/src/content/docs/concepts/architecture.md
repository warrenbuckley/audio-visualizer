---
title: Architecture
description: How the audio-visualizer component captures microphone audio, analyses it as frequency bands, and drives the Lit animation loop.
---

`<audio-visualizer>` is split into two source files with a clean boundary between audio logic and rendering:

```
src/
├── audio-analyzer.ts     # Web Audio API wrapper — mic capture + FFT analysis
└── audio-visualizer.ts   # <audio-visualizer> Lit WebComponent — rendering + state
```

---

## Audio pipeline

The entire pipeline runs inside the browser using the built-in **Web Audio API** — no external audio library is needed.

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

### Why bins 100–199?

This matches LiveKit's `loPass=100, hiPass=200` defaults. With `fftSize=2048` the bin width is roughly 23 Hz at 48 kHz, putting this range at **~2–5 kHz** — the consonant and sibilant "presence" range of speech. Using a narrow mid-high band rather than the full spectrum ensures all bars stay visually balanced at normal speaking volumes and avoids low-frequency rumble dominating the display.

### Why the √ normalization?

The raw dB scale is logarithmic and heavily weighted toward loud signals. The `normalizeDb` function maps the practical speech range (−100 dB → −10 dB) to [0, 1] linearly, then applies a square root:

```
normalised = √( clamp(db, −100, −10) remapped to [0, 1] )
```

The √ curve lifts quiet bins — without it, softer frequency bands collapse to near-zero and only the loudest bar animates. With it, quiet speech still produces visible movement across all bars.

---

## `AudioAnalyzer` class

`AudioAnalyzer` (`src/audio-analyzer.ts`) is a thin wrapper around three Web Audio API nodes:

```
MediaStreamAudioSourceNode  →  AnalyserNode  →  (read-only, no output node)
```

**Key design decisions:**

- **Private constructor + async factory** — `AudioAnalyzer.create(deviceId?)` handles `getUserMedia` and `AudioContext` setup atomically. There is no way to construct a half-initialised instance.
- **Pre-allocated buffer** — `getBands(count)` writes into a reusable `Float32Array` on every call, avoiding per-frame allocations. It returns a plain `number[]` of band averages.
- **Not exported as a default** — the class is exported as a named export; the component is the intended public API. Direct use of `AudioAnalyzer` is supported but considered advanced.

---

## `AudioVisualizer` Lit component

`AudioVisualizer` (`src/audio-visualizer.ts`) is a `LitElement` subclass decorated with `@customElement('audio-visualizer')`.

### Reactive properties → HTML attributes

`@property` decorators map directly to HTML attributes and trigger Lit re-renders when changed:

| Property   | Attribute   | Effect |
|------------|-------------|--------|
| `size`     | `size`      | Changes container height, bar width, and bar gap |
| `color`    | `color`     | Sets CSS `color` on the container element |
| `barCount` | `bar-count` | Changes how many frequency bands are rendered |

### Private reactive state

`@state` properties drive the animation without being reflected to attributes:

| State      | Type | Set by |
|------------|------|--------|
| `bands`    | `number[]` | `tick()` on every `requestAnimationFrame` |
| `micState` | `'idle' \| 'requesting' \| 'active' \| 'error'` | lifecycle methods |

### Animation loop

`tick()` is a bound arrow function registered with `requestAnimationFrame`. Using an arrow function (rather than a regular method) means `this` is always the component instance, and the same reference can be passed to both `requestAnimationFrame` and `cancelAnimationFrame` without wrapping.

### Colour propagation

All bars use `background-color: currentColor`. The container's CSS `color` property is set to the `color` attribute value (or left as `currentColor` to inherit from the page). This means a single style write on the container updates every bar simultaneously — no per-bar style updates needed.
