---
title: Device Switching
description: How to enumerate microphones and switch between them at runtime.
---

import { Aside } from '@astrojs/starlight/components';

<Aside type="caution" title="Permission required first">
Browser security prevents enumerating device labels until the user has granted microphone permission. Always start the default microphone first, then enumerate.
</Aside>

## Full example

```ts
import '@warrenbuckley/audio-visualizer';

const viz    = document.querySelector('audio-visualizer')!;
const select = document.querySelector('select')! as HTMLSelectElement;

// Step 1 — Start with the default device (triggers permission prompt)
document.getElementById('start')!.addEventListener('click', async () => {
  await viz.startMicrophone();

  // Step 2 — Labels are now available; populate the selector
  const devices = await navigator.mediaDevices.enumerateDevices();
  const mics = devices.filter(d => d.kind === 'audioinput');

  select.innerHTML = '<option value="">Default microphone</option>';
  mics.forEach(mic => {
    const opt = document.createElement('option');
    opt.value = mic.deviceId;
    opt.textContent = mic.label || 'Microphone';
    select.appendChild(opt);
  });
  select.disabled = false;
});

// Step 3 — Switch device on selection change
select.addEventListener('change', () => {
  // startMicrophone() automatically stops the current stream first
  viz.startMicrophone(select.value || undefined);
});
```

## HTML for the above

```html
<audio-visualizer id="viz" size="md" style="--audio-visualizer-color: #6366f1"></audio-visualizer>

<button id="start">Start microphone</button>
<select disabled>
  <option value="">Default microphone</option>
</select>
```

## How `startMicrophone` handles switching

Calling `startMicrophone(deviceId)` when the mic is already active **automatically stops the current stream** before opening the new one. You don't need to call `stopMicrophone()` manually:

```ts
// Switch from device A to device B — no manual stop needed
await viz.startMicrophone(deviceB);
```

## Handling device disconnection

Listen for `devicechange` events and re-enumerate if a device is unplugged:

```ts
navigator.mediaDevices.addEventListener('devicechange', async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  // Re-populate your device list here
});
```
