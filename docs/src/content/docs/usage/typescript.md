---
title: TypeScript / JavaScript
description: Using audio-visualizer with TypeScript or plain JavaScript in a bundled project.
---

## Setup

After installing (`npm install audio-visualizer lit`), import once to register the element globally:

```ts
import 'audio-visualizer';
```

To get the typed class for casting and autocompletion, import `AudioVisualizer`:

```ts
import { AudioVisualizer, type VisualizerSize } from 'audio-visualizer';
```

## Full example

```ts
import 'audio-visualizer';
import type { AudioVisualizer } from 'audio-visualizer';

const viz        = document.querySelector('audio-visualizer') as AudioVisualizer;
const startBtn   = document.getElementById('start')  as HTMLButtonElement;
const stopBtn    = document.getElementById('stop')   as HTMLButtonElement;
const deviceSel  = document.getElementById('devices') as HTMLSelectElement;

// Start with the default microphone
startBtn.addEventListener('click', async () => {
  try {
    startBtn.disabled = true;
    await viz.startMicrophone();
    startBtn.textContent = 'Mic active';

    // Labels only available after permission is granted
    const devices = await navigator.mediaDevices.enumerateDevices();
    devices
      .filter(d => d.kind === 'audioinput')
      .forEach(mic => {
        const opt = document.createElement('option');
        opt.value = mic.deviceId;
        opt.textContent = mic.label || 'Microphone';
        deviceSel.appendChild(opt);
      });
    deviceSel.disabled = false;
  } catch (err) {
    startBtn.disabled = false;
    console.error('Microphone error:', err);
  }
});

// Switch device
deviceSel.addEventListener('change', () => {
  viz.startMicrophone(deviceSel.value || undefined);
});

// Stop
stopBtn.addEventListener('click', () => {
  viz.stopMicrophone();
  startBtn.disabled   = false;
  startBtn.textContent = 'Start microphone';
});
```

## Checking active state

```ts
if (viz.isActive) {
  console.log('Microphone is running');
}
```

## Changing attributes programmatically

Attributes and their corresponding JS properties are reactive — changing either immediately updates the rendered output:

```ts
// Via attribute
viz.setAttribute('size', 'lg');
viz.setAttribute('bar-count', '7');

// Via property
viz.size     = 'lg';
viz.barCount = 7;

// Via CSS custom property
viz.style.setProperty('--audio-visualizer-color', '#ec4899');
viz.style.setProperty('--audio-visualizer-transition', '60ms');
```
