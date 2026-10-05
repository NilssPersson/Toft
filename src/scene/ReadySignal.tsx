import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Calls `onFirstFrame` once, when the render loop first runs. The frame's render follows in the same task,
 * so anything that observes the effect of the callback sees the drawn frame.
 */
export function ReadySignal({ onFirstFrame }: { onFirstFrame: () => void }): null {
  const hasSignalled = useRef(false);
  useFrame(() => {
    if (hasSignalled.current) return;
    hasSignalled.current = true;
    onFirstFrame();
  });
  return null;
}
