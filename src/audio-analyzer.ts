/**
 * @file audio-analyzer.ts
 *
 * Wraps the Web Audio API to deliver normalized, multiband frequency
 * volumes from a live microphone stream.
 *
 * ---------------------------------------------------------------------------
 * ATTRIBUTION
 *
 * Portions of this file are derived from the LiveKit components-js project:
 * https://github.com/livekit/components-js
 *
 * Copyright 2023 LiveKit, Inc.
 * Licensed under the Apache License, Version 2.0
 * https://github.com/livekit/components-js/blob/main/LICENSE
 *
 * Derived from:
 *   packages/react/src/hooks/useTrackVolume.ts
 *   (the `useMultibandTrackVolume` hook and `normalizeDb` helper)
 *
 * Changes made from the original:
 *  - Ported from a React hook to a standalone TypeScript class (AudioAnalyzer)
 *  - Adapted for direct browser getUserMedia capture (no LiveKit SDK)
 *  - AudioContext, AnalyserNode, and MediaStreamAudioSourceNode setup
 *    encapsulated in the AudioAnalyzer.create() async factory
 *  - The normalizeDb() algorithm, bin range (100–199), and sqrt curve
 *    are unchanged from the original to preserve identical visual behaviour
 * ---------------------------------------------------------------------------
 *
 * The analysis pipeline matches LiveKit's `useMultibandTrackVolume` so that
 * `<audio-visualizer>` produces the same visual result as the original React
 * `AgentAudioVisualizerBar` component:
 *
 *  1. `AnalyserNode.getFloatFrequencyData()` — raw dB values per FFT bin
 *  2. `normalizeDb()` — maps dB → [0, 1] via a sqrt curve that lifts
 *     quiet speech so every bar stays visually active
 *  3. Bin slice [100, 200) — targets the ~2–5 kHz presence range where
 *     consonants and sibilants live (matches LiveKit's loPass=100, hiPass=200)
 *  4. Equal-width bands — the 100 normalised bins are split into `count`
 *     chunks and each chunk is averaged to produce one bar value
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Maps a raw dB value (as returned by `getFloatFrequencyData`) to a
 * normalised [0, 1] range using a sqrt curve.
 *
 * This function is ported unchanged from LiveKit's `normalizeDb` helper
 * (Copyright 2023 LiveKit, Inc., Apache-2.0):
 * https://github.com/livekit/components-js/blob/main/packages/react/src/hooks/useTrackVolume.ts
 *
 * The curve is identical to LiveKit's `normalizeDb` helper:
 *
 * ```
 *   clamp(value, -100 dB, -10 dB)
 *   → linear 0–1  (0 = silence, 1 = near-clip)
 *   → sqrt         (compresses loud bins, lifts quiet bins)
 * ```
 *
 * The sqrt step is what makes every frequency band visually active even
 * at normal speaking volumes — without it, quieter bands collapse to zero.
 *
 * @param value - Raw dB amplitude from the AnalyserNode (typically −∞ to 0).
 * @returns Normalised amplitude in [0, 1].
 */
function normalizeDb(value: number): number {
  if (value === -Infinity) return 0;

  const minDb = -100;
  const maxDb = -10;

  // Clamp, invert sign, scale to [0, 1]
  let normalized = 1 - (Math.max(minDb, Math.min(maxDb, value)) * -1) / 100;

  // Apply sqrt curve to boost quiet signals
  normalized = Math.sqrt(normalized);

  return normalized;
}

// ---------------------------------------------------------------------------
// AudioAnalyzer
// ---------------------------------------------------------------------------

/**
 * Captures audio from the user's microphone and exposes normalised
 * per-band volume levels for driving a visualiser.
 *
 * Use the static {@link AudioAnalyzer.create} factory — the constructor
 * is intentionally private because setup is async (mic permission + Web
 * Audio API initialisation).
 *
 * @example
 * ```ts
 * const analyzer = await AudioAnalyzer.create();
 *
 * function loop() {
 *   const bands = analyzer.getBands(5); // e.g. [0.3, 0.7, 0.5, 0.4, 0.2]
 *   requestAnimationFrame(loop);
 * }
 * loop();
 *
 * // Release the mic when done
 * analyzer.destroy();
 * ```
 */
export class AudioAnalyzer {
  private readonly stream: MediaStream;
  private readonly context: AudioContext;
  private readonly analyser: AnalyserNode;
  private readonly source: MediaStreamAudioSourceNode;

  /**
   * Pre-allocated buffer reused on every {@link getBands} call to avoid
   * per-frame allocations.
   */
  private readonly dataArray: Float32Array<ArrayBuffer>;

  private constructor(
    stream: MediaStream,
    context: AudioContext,
    analyser: AnalyserNode,
    source: MediaStreamAudioSourceNode,
  ) {
    this.stream = stream;
    this.context = context;
    this.analyser = analyser;
    this.source = source;
    this.dataArray = new Float32Array(analyser.frequencyBinCount);
  }

  // -------------------------------------------------------------------------
  // Factory
  // -------------------------------------------------------------------------

  /**
   * Requests microphone access and creates a fully initialised `AudioAnalyzer`.
   *
   * Must be called from a user-gesture handler (e.g. a button click) to
   * satisfy the browser's autoplay / permissions policy.
   *
   * @param deviceId - Optional `MediaDeviceInfo.deviceId` to use a specific
   *   microphone. Omit (or pass `undefined`) to use the system default.
   *   Obtain device IDs with `navigator.mediaDevices.enumerateDevices()`.
   *
   * @returns A ready-to-use `AudioAnalyzer` instance.
   *
   * @throws {DOMException} If the user denies microphone permission, or if
   *   the requested `deviceId` cannot be found (`OverconstrainedError`).
   *
   * @example
   * ```ts
   * // Default microphone
   * const analyzer = await AudioAnalyzer.create();
   *
   * // Specific microphone
   * const devices = await navigator.mediaDevices.enumerateDevices();
   * const mic = devices.find(d => d.kind === 'audioinput' && d.label.includes('Blue'));
   * const analyzer = await AudioAnalyzer.create(mic?.deviceId);
   * ```
   */
  static async create(deviceId?: string): Promise<AudioAnalyzer> {
    // When a deviceId is supplied, request that exact device; otherwise let
    // the browser pick the default input.
    const audio = deviceId ? { deviceId: { exact: deviceId } } : true;
    const stream = await navigator.mediaDevices.getUserMedia({ audio, video: false });

    const context = new AudioContext();
    const analyser = context.createAnalyser();

    // fftSize=2048 → frequencyBinCount=1024 bins, matching LiveKit's defaults.
    // smoothingTimeConstant defaults to 0.8 — enough to smooth jitter without
    // introducing too much lag.
    analyser.fftSize = 2048;

    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);

    return new AudioAnalyzer(stream, context, analyser, source);
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Reads the current frequency spectrum and returns `count` normalised
   * band volumes, each in the range [0, 1].
   *
   * Call this inside a `requestAnimationFrame` loop for smooth animation.
   * The underlying `Float32Array` buffer is reused between calls — do not
   * hold a reference to the returned array across frames; copy if needed.
   *
   * **Band selection:** only FFT bins 100–199 are used (the ~2–5 kHz
   * "presence" range). This matches LiveKit's `loPass=100, hiPass=200`
   * defaults and gives the most perceptually balanced response to speech.
   *
   * @param count - Number of frequency bands to return. Should match the
   *   `bar-count` attribute on `<audio-visualizer>` (typically 3 or 5).
   *
   * @returns Array of `count` numbers in [0, 1], one per frequency band,
   *   ordered from low to high frequency.
   */
  getBands(count: number): number[] {
    this.analyser.getFloatFrequencyData(this.dataArray);

    // Slice the relevant bin range — bins 100–199 map to roughly 2–5 kHz at
    // a 48 kHz sample rate (bin width ≈ 23 Hz), or ~2–4 kHz at 44.1 kHz.
    const LO_BIN = 100;
    const HI_BIN = 200;
    const slice = this.dataArray.slice(LO_BIN, HI_BIN);

    // Normalise every bin: dB → [0, 1] with sqrt boost for quiet signals
    const normalized = new Float32Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      normalized[i] = normalizeDb(slice[i]);
    }

    // Split the 100 normalised bins into `count` equal-width bands and
    // compute the arithmetic mean of each band.
    const totalBins = normalized.length;
    const bands: number[] = [];

    for (let i = 0; i < count; i++) {
      const start = Math.floor((i * totalBins) / count);
      const end   = Math.floor(((i + 1) * totalBins) / count);
      const chunk = normalized.slice(start, end);

      if (chunk.length === 0) {
        bands.push(0);
      } else {
        let sum = 0;
        for (const v of chunk) sum += v;
        bands.push(sum / chunk.length);
      }
    }

    return bands;
  }

  /**
   * Disconnects the microphone stream and closes the `AudioContext`,
   * releasing all associated resources.
   *
   * After calling `destroy()` the instance must not be used again.
   * Create a new `AudioAnalyzer` via {@link AudioAnalyzer.create} if
   * you need to restart.
   */
  destroy(): void {
    this.source.disconnect();
    for (const track of this.stream.getTracks()) {
      track.stop();
    }
    void this.context.close();
  }
}
