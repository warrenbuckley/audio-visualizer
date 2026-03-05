---
title: Plain HTML
description: Using audio-visualizer in plain HTML — CDN or local file.
---

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/warrenbuckley/audio-visualizer/tree/main/examples/html)

## CDN (standalone, no install)

```html
<!doctype html>
<html>
  <body>
    <!-- Default device, medium size -->
    <audio-visualizer id="viz" size="md" style="--audio-visualizer-color: #6366f1"></audio-visualizer>
    <button id="start">Start</button>
    <button id="stop" disabled>Stop</button>

    <script type="module"
      src="https://cdn.jsdelivr.net/npm/@warrenbuckley/audio-visualizer/dist/audio-visualizer.standalone.js">
    </script>

    <script type="module">
      const viz   = document.getElementById('viz');
      const start = document.getElementById('start');
      const stop  = document.getElementById('stop');

      start.addEventListener('click', async () => {
        start.disabled = true;
        await viz.startMicrophone();
        stop.disabled = false;
      });

      stop.addEventListener('click', () => {
        viz.stopMicrophone();
        start.disabled = false;
        stop.disabled  = true;
      });
    </script>
  </body>
</html>
```

## All size variants

```html
<audio-visualizer size="icon"></audio-visualizer>  <!-- 24 px tall,  4 px bars, 3 bars -->
<audio-visualizer size="sm"  ></audio-visualizer>  <!-- 56 px tall,  8 px bars, 3 bars -->
<audio-visualizer size="md"  ></audio-visualizer>  <!-- 112 px tall, 16 px bars, 5 bars -->
<audio-visualizer size="lg"  ></audio-visualizer>  <!-- 224 px tall, 32 px bars, 5 bars -->
<audio-visualizer size="xl"  ></audio-visualizer>  <!-- 448 px tall, 64 px bars, 5 bars -->
```

## Colour approaches

```html
<!-- CSS custom property (recommended) -->
<audio-visualizer style="--audio-visualizer-color: #6366f1"></audio-visualizer>

<!-- Inherited from parent color property -->
<div style="color: #ec4899">
  <audio-visualizer></audio-visualizer>
</div>

<!-- HTML attribute (quick inline convenience) -->
<audio-visualizer color="#10b981"></audio-visualizer>
```

## Transition speed

```html
<!-- Snappy response (suits fast speech) -->
<audio-visualizer style="--audio-visualizer-transition: 40ms"></audio-visualizer>

<!-- Smooth, slow response -->
<audio-visualizer style="--audio-visualizer-transition: 250ms"></audio-visualizer>
```
