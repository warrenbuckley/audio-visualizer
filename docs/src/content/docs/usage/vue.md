---
title: Vue
description: Using audio-visualizer in a Vue 3 application.
---

import { Aside } from '@astrojs/starlight/components';

## Setup

In your `vite.config.ts`, tell Vue's compiler to treat `audio-visualizer` as a custom element so it doesn't try to resolve it as a Vue component:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Treat any tag containing a dash as a custom element
          isCustomElement: tag => tag.includes('-'),
        },
      },
    }),
  ],
});
```

## Usage

```vue
<script setup lang="ts">
import 'audio-visualizer';
import type { AudioVisualizer } from 'audio-visualizer';
import { ref } from 'vue';

const vizRef = ref<AudioVisualizer | null>(null);
const active = ref(false);

async function startMic() {
  try {
    await vizRef.value?.startMicrophone();
    active.value = true;
  } catch (err) {
    console.error('Mic error:', err);
  }
}

function stopMic() {
  vizRef.value?.stopMicrophone();
  active.value = false;
}
</script>

<template>
  <audio-visualizer
    ref="vizRef"
    size="md"
    style="--audio-visualizer-color: #6366f1"
  />
  <button v-if="active" @click="stopMic">Stop</button>
  <button v-else @click="startMic">Start microphone</button>
</template>
```

## TypeScript type support

Add a declaration file to get prop type checking in Vue templates:

```ts
// src/custom-elements.d.ts
declare module 'vue' {
  interface GlobalComponents {
    'audio-visualizer': {
      size?: 'icon' | 'sm' | 'md' | 'lg' | 'xl';
      color?: string;
      'bar-count'?: number;
      style?: string | Record<string, string>;
      ref?: string;
    };
  }
}
export {};
```
