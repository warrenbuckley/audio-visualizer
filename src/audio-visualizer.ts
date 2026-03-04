/**
 * @file audio-visualizer.ts
 *
 * Defines the `<audio-visualizer>` Lit WebComponent — a framework-agnostic,
 * zero-dependency* audio waveform visualiser driven by the browser's
 * Web Audio API.
 *
 * (* Lit is the only runtime dependency.)
 *
 * ---------------------------------------------------------------------------
 * ATTRIBUTION
 *
 * Visual design and animation approach ported from the LiveKit components-js
 * project:
 * https://github.com/livekit/components-js
 *
 * Copyright 2023 LiveKit, Inc.
 * Licensed under the Apache License, Version 2.0
 * https://github.com/livekit/components-js/blob/main/LICENSE
 *
 * Derived from:
 *   packages/shadcn/components/agents-ui/agent-audio-visualizer-bar.tsx
 *   (the `AgentAudioVisualizerBar` React component)
 *
 * Changes made from the original:
 *  - Rewritten as a Lit WebComponent (LitElement) instead of a React component
 *  - Microphone source via Web Audio API directly (no LiveKit SDK)
 *  - Added size variants (icon/sm/md/lg/xl) and CSS custom properties
 *    (--audio-visualizer-color, --audio-visualizer-transition)
 *  - Device switching via startMicrophone(deviceId?) API
 *  - Animation driven by requestAnimationFrame via AudioAnalyzer.getBands()
 * ---------------------------------------------------------------------------
 *
 * @module
 */

import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { AudioAnalyzer } from './audio-analyzer.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Size variant for `<audio-visualizer>`.
 *
 * Each size scales bar width, minimum bar height, gap between bars, and
 * the container height proportionally (roughly a 2× step per size).
 *
 * | Size   | Container | Bar width | Gap  | Default bars |
 * |--------|-----------|-----------|------|--------------|
 * | `icon` | 24 px     | 4 px      | 2 px | 3            |
 * | `sm`   | 56 px     | 8 px      | 4 px | 3            |
 * | `md`   | 112 px    | 16 px     | 8 px | 5            |
 * | `lg`   | 224 px    | 32 px     | 16px | 5            |
 * | `xl`   | 448 px    | 64 px     | 32px | 5            |
 */
export type VisualizerSize = 'icon' | 'sm' | 'md' | 'lg' | 'xl';

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

/** Pixel dimensions for each size variant. */
const SIZE_CONFIG: Record<
  VisualizerSize,
  { height: string; barWidth: string; gap: string; minHeight: string }
> = {
  icon: { height: '24px',  barWidth: '4px',  gap: '2px',  minHeight: '4px'  },
  sm:   { height: '56px',  barWidth: '8px',  gap: '4px',  minHeight: '8px'  },
  md:   { height: '112px', barWidth: '16px', gap: '8px',  minHeight: '16px' },
  lg:   { height: '224px', barWidth: '32px', gap: '16px', minHeight: '32px' },
  xl:   { height: '448px', barWidth: '64px', gap: '32px', minHeight: '64px' },
};

/**
 * Returns the default bar count for a given size.
 * Smaller sizes use 3 bars to avoid overcrowding; larger sizes use 5.
 */
function defaultBarCount(size: VisualizerSize): number {
  return size === 'icon' || size === 'sm' ? 3 : 5;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `<audio-visualizer>` — a real-time microphone frequency visualiser.
 *
 * Displays N animated bars whose heights reflect the current volume in
 * corresponding frequency bands captured from the user's microphone.
 *
 * ## Quick start
 *
 * ```html
 * <!-- 1. Import (once per page) -->
 * <script type="module" src="audio-visualizer.js"></script>
 *
 * <!-- 2. Place the element -->
 * <audio-visualizer id="viz" size="md" color="#6366f1"></audio-visualizer>
 *
 * <!-- 3. Start from a user gesture -->
 * <button onclick="document.getElementById('viz').startMicrophone()">
 *   Start
 * </button>
 * ```
 *
 * ## Attributes
 *
 * | Attribute    | Type            | Default        | Description                          |
 * |--------------|-----------------|----------------|--------------------------------------|
 * | `size`       | `VisualizerSize`| `'md'`         | Visual scale of the component        |
 * | `color`      | CSS color string| `currentColor` | Bar fill colour                      |
 * | `bar-count`  | `number`        | 3 or 5         | Number of frequency bands to display |
 *
 * ## Methods
 *
 * | Method                          | Description                                       |
 * |---------------------------------|---------------------------------------------------|
 * | `startMicrophone(deviceId?)`    | Request mic access and start the animation loop   |
 * | `stopMicrophone()`              | Stop the animation loop and release the mic       |
 *
 * ## CSS custom properties
 *
 * | Property                              | Default        | Description                                                       |
 * |---------------------------------------|----------------|-------------------------------------------------------------------|
 * | `--audio-visualizer-color`            | `currentColor` | Bar colour. Overrides the `color` attribute and CSS inheritance   |
 * | `--audio-visualizer-transition`       | `100ms`        | Bar height transition duration                                    |
 *
 * @attr {VisualizerSize} size - Visual size variant (icon | sm | md | lg | xl).
 * @attr {string} color - CSS color for the bars. Falls back to `currentColor`.
 * @attr {number} bar-count - Number of frequency-band bars to render.
 *
 * @cssprop --audio-visualizer-color - Bar fill colour. Takes priority over the
 *   `color` attribute and CSS colour inheritance (`currentColor`). Set via CSS
 *   for stylesheet-based theming. Default: unset (falls back to `color` attr
 *   or the inherited `currentColor`).
 *
 * @cssprop --audio-visualizer-transition - Transition duration for bar height
 *   changes. Increase for a smoother, slower response; decrease for snappier
 *   reaction to transient sounds. Default: `100ms`.
 *
 * @example <caption>Minimal</caption>
 * ```html
 * <audio-visualizer></audio-visualizer>
 * ```
 *
 * @example <caption>Customised</caption>
 * ```html
 * <audio-visualizer
 *   size="lg"
 *   color="#ec4899"
 *   bar-count="7"
 *   style="--audio-visualizer-transition: 60ms"
 * ></audio-visualizer>
 * ```
 */
@customElement('audio-visualizer')
export class AudioVisualizer extends LitElement {

  // -------------------------------------------------------------------------
  // Public reactive properties (HTML attributes)
  // -------------------------------------------------------------------------

  /**
   * Visual size variant.
   * Controls bar width, container height, and gap between bars.
   * @attr
   */
  @property({ type: String })
  size: VisualizerSize = 'md';

  /**
   * Bar fill colour — any valid CSS color value (`#hex`, `rgb()`, named
   * colour, etc.). When omitted the bars inherit `color` from the
   * surrounding document via `currentColor`.
   *
   * Prefer the `--audio-visualizer-color` CSS custom property for
   * stylesheet-based theming — it takes priority over this attribute.
   * @attr
   */
  @property({ type: String })
  color?: string;

  /**
   * Number of frequency-band bars to display.
   * Defaults to 3 for `icon`/`sm` sizes and 5 for `md`/`lg`/`xl`.
   * @attr bar-count
   */
  @property({ type: Number, attribute: 'bar-count' })
  barCount?: number;

  // -------------------------------------------------------------------------
  // Private reactive state
  // -------------------------------------------------------------------------

  /** Normalised [0, 1] volume per band, updated every animation frame. */
  @state() private bands: number[] = [];

  /** Current lifecycle state of the microphone stream. */
  @state() private micState: 'idle' | 'requesting' | 'active' | 'error' = 'idle';

  // -------------------------------------------------------------------------
  // Private fields
  // -------------------------------------------------------------------------

  /** Multiband frequency analyzer backed by the Web Audio API. */
  private analyzer?: AudioAnalyzer;

  /** ID returned by `requestAnimationFrame`, used to cancel the loop. */
  private rafId?: number;

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * `true` while a microphone stream is active and the animation loop is
   * running. Useful for toggling button labels or disabling UI controls.
   */
  get isActive(): boolean {
    return this.micState === 'active';
  }

  /**
   * Requests microphone access and starts the bar animation loop.
   *
   * - **Must be called from a user gesture** (e.g. a button `click` handler)
   *   to satisfy the browser's permissions policy.
   * - If already active, the current stream is stopped and a new one is
   *   started with the supplied `deviceId` — safe to call on device switch.
   *
   * @param deviceId - Optional `MediaDeviceInfo.deviceId` for a specific
   *   microphone. Obtain IDs via `navigator.mediaDevices.enumerateDevices()`.
   *   Omit to use the system default input device.
   *
   * @returns Resolves when the stream is established and animation has begun.
   *
   * @throws {DOMException} If the user denies permission (`NotAllowedError`)
   *   or the requested device cannot be found (`OverconstrainedError`).
   *
   * @example
   * ```ts
   * const viz = document.querySelector('audio-visualizer');
   *
   * startBtn.addEventListener('click', async () => {
   *   await viz.startMicrophone();
   * });
   * ```
   *
   * @example <caption>Device switching</caption>
   * ```ts
   * select.addEventListener('change', () => {
   *   viz.startMicrophone(select.value || undefined);
   * });
   * ```
   */
  async startMicrophone(deviceId?: string): Promise<void> {
    // Always stop the previous stream before opening a new one so we never
    // hold two concurrent microphone tracks.
    this.stopMicrophone();
    this.micState = 'requesting';

    try {
      this.analyzer = await AudioAnalyzer.create(deviceId);
      this.micState = 'active';
      this.tick();
    } catch (err) {
      this.micState = 'error';
      // Re-throw so callers can display or log the error themselves.
      throw err instanceof Error ? err : new Error('Microphone access denied.');
    }
  }

  /**
   * Stops the animation loop and releases the microphone stream.
   *
   * Safe to call at any time, including when the mic is not yet active.
   * The component resets to its idle (dot) state.
   */
  stopMicrophone(): void {
    if (this.rafId !== undefined) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
    this.analyzer?.destroy();
    this.analyzer = undefined;
    this.bands = [];
    this.micState = 'idle';
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // Automatically release the mic when the element is removed from the DOM
    // to avoid orphaned audio contexts.
    this.stopMicrophone();
  }

  // -------------------------------------------------------------------------
  // Private — animation loop
  // -------------------------------------------------------------------------

  /**
   * `requestAnimationFrame` callback — reads the latest band volumes from
   * the analyser and triggers a Lit re-render by updating `this.bands`.
   *
   * Named `tick` rather than `animate` to avoid shadowing
   * `Element.animate()` from the Web Animations API.
   */
  private tick = (): void => {
    const count = this.barCount ?? defaultBarCount(this.size);
    this.bands = this.analyzer?.getBands(count) ?? new Array(count).fill(0);
    this.rafId = requestAnimationFrame(this.tick);
  };

  // -------------------------------------------------------------------------
  // Styles
  // -------------------------------------------------------------------------

  static override styles = css`
    :host {
      /*
       * --audio-visualizer-color
       * Bar fill colour. Takes priority over the color attribute and CSS
       * colour inheritance. Leave unset to fall back to the color attribute
       * or to inherit from the surrounding text colour (currentColor).
       * Example: audio-visualizer { --audio-visualizer-color: #6366f1; }
       */

      /*
       * --audio-visualizer-transition
       * Controls how quickly bar heights react to volume changes.
       * Decrease for a snappier feel; increase for a smoother, slower response.
       */
      --audio-visualizer-transition: 100ms;

      display: inline-block;
    }

    /* Horizontal flex container — sized by the 'size' attribute via inline styles */
    .container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Individual frequency bar — pill shape, transitions height and colour */
    .bar {
      border-radius: 9999px;
      flex-shrink: 0;
      transition:
        height           var(--audio-visualizer-transition) ease-out,
        background-color 250ms                              linear;
    }
  `;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  override render() {
    const count = this.barCount ?? defaultBarCount(this.size);
    const cfg   = SIZE_CONFIG[this.size];

    // The container's color property is the single source of truth for bar
    // colour — bars use `currentColor`, so changing `color` here propagates
    // automatically without touching each bar individually.
    //
    // Priority: --audio-visualizer-color CSS var > color attribute > currentColor
    const containerStyles = styleMap({
      height: cfg.height,
      gap:    cfg.gap,
      color:  `var(--audio-visualizer-color, ${this.color ?? 'currentColor'})`,
    });

    // If the bands array hasn't been populated yet (e.g. before mic starts),
    // pad to `count` zeros so the correct number of bars always renders.
    const activeBands: number[] =
      this.bands.length === count
        ? this.bands
        : new Array(count).fill(0).map((_, i) => this.bands[i] ?? 0);

    return html`
      <div class="container" style=${containerStyles}>
        ${activeBands.map(
          (vol) => html`
            <div
              class="bar"
              style=${styleMap({
                width:           cfg.barWidth,
                minHeight:       cfg.minHeight,
                // Height is a percentage of the container — CSS min-height
                // floors this to a pill/circle when vol is 0.
                height:          `${vol * 100}%`,
                backgroundColor: 'currentColor',
              })}
            ></div>
          `,
        )}
      </div>
    `;
  }
}

// ---------------------------------------------------------------------------
// TypeScript global element registry (enables typed querySelector results)
// ---------------------------------------------------------------------------

declare global {
  interface HTMLElementTagNameMap {
    'audio-visualizer': AudioVisualizer;
  }
}
