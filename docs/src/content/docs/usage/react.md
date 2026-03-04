---
title: React
description: Using audio-visualizer in a React application.
---

import { Aside } from '@astrojs/starlight/components';

<Aside type="note" title="React 19+">
React 19 added native custom elements support — attribute binding and event handling work without a wrapper component. For React 18 and below, use the `useRef` approach shown below.
</Aside>

## Import

```ts
import 'audio-visualizer';
import type { AudioVisualizer } from 'audio-visualizer';
```

## React 18 — wrapper component

```tsx
import 'audio-visualizer';
import { useRef, useState } from 'react';
import type { AudioVisualizer } from 'audio-visualizer';

export function VoiceVisualizer() {
  const vizRef = useRef<AudioVisualizer>(null);
  const [active, setActive] = useState(false);

  async function handleStart() {
    try {
      await vizRef.current?.startMicrophone();
      setActive(true);
    } catch (err) {
      console.error('Mic error:', err);
    }
  }

  function handleStop() {
    vizRef.current?.stopMicrophone();
    setActive(false);
  }

  return (
    <div>
      {/* @ts-expect-error — React 18 JSX types don't include custom elements */}
      <audio-visualizer
        ref={vizRef}
        size="md"
        style={{ '--audio-visualizer-color': '#6366f1' } as React.CSSProperties}
      />
      {active
        ? <button onClick={handleStop}>Stop</button>
        : <button onClick={handleStart}>Start microphone</button>
      }
    </div>
  );
}
```

## React 19 — native support

```tsx
import 'audio-visualizer';
import { useRef, useState } from 'react';

export function VoiceVisualizer() {
  const vizRef = useRef<Element>(null);
  const [active, setActive] = useState(false);

  return (
    <div>
      <audio-visualizer
        ref={vizRef}
        size="md"
        style={{ '--audio-visualizer-color': '#6366f1' } as React.CSSProperties}
      />
      <button
        onClick={async () => {
          if (active) {
            (vizRef.current as any).stopMicrophone();
            setActive(false);
          } else {
            await (vizRef.current as any).startMicrophone();
            setActive(true);
          }
        }}
      >
        {active ? 'Stop' : 'Start microphone'}
      </button>
    </div>
  );
}
```

## TypeScript global element type

Add a declaration file to register the custom element type in JSX so TypeScript stops flagging the tag:

```ts
// src/custom-elements.d.ts
import type { AudioVisualizer } from 'audio-visualizer';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'audio-visualizer': Partial<AudioVisualizer> & {
        ref?: React.Ref<AudioVisualizer>;
        class?: string;
        style?: React.CSSProperties;
      };
    }
  }
}
```
