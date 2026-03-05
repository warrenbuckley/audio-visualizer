/**
 * @file index.ts
 *
 * Public entry point for the `audio-visualizer` package.
 *
 * Importing this module:
 *  - Registers the `<audio-visualizer>` custom element in the browser's
 *    Custom Element Registry (via the `@customElement` decorator).
 *  - Exports the `AudioVisualizer` class for TypeScript consumers who
 *    need the type (e.g. for `querySelector` return types or direct
 *    property access).
 *  - Exports `AudioAnalyzer` for advanced use cases where you want to
 *    drive the frequency analysis separately from the component.
 *  - Exports the `VisualizerSize` string union for typed attribute values.
 *
 * @example <caption>Side-effect import (HTML-only usage)</caption>
 * ```ts
 * import '@warrenbuckley/audio-visualizer';
 * // <audio-visualizer> is now a valid custom element
 * ```
 *
 * @example <caption>Named import (typed API access)</caption>
 * ```ts
 * import { AudioVisualizer, type VisualizerSize } from '@warrenbuckley/audio-visualizer';
 *
 * const viz = document.querySelector('audio-visualizer') as AudioVisualizer;
 * await viz.startMicrophone();
 *
 * const size: VisualizerSize = 'lg';
 * viz.setAttribute('size', size);
 * ```
 */

export { AudioVisualizer, type VisualizerSize } from './audio-visualizer.js';
export { AudioAnalyzer } from './audio-analyzer.js';
